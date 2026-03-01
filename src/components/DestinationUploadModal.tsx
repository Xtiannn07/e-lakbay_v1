import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import LocationPickerMap from './LocationPickerMap';
import type { LocationData } from '../lib/locationTypes';
import { toast } from 'sonner';

interface DestinationUploadModalProps {
  open: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  destinationId?: string;
  initialData?: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    location?: LocationData;
  } | null;
  onSuccess?: (updated?: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    imageUrls?: string[];
    location?: LocationData;
  }) => void;
}

const MAX_IMAGES = 20;
const STORAGE_BUCKET = 'uploads';

const uploadImages = async (files: File[], folder: string) => {
  const urls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${folder}/${crypto.randomUUID()}-${index}.${extension}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    urls.push(data.publicUrl);
  }

  return urls;
};

export const DestinationUploadModal: React.FC<DestinationUploadModalProps> = ({
  open,
  onClose,
  mode = 'create',
  destinationId,
  initialData,
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [destinationName, setDestinationName] = useState('');
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDestinationName('');
      setLocationData(null);
      setDescription('');
      setFiles([]);
      setExistingImageUrls([]);
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      setError(null);
      setIsSubmitting(false);
      return;
    }

    if (mode === 'edit' && initialData) {
      setDestinationName(initialData.name ?? '');
      setDescription(initialData.description ?? '');
      setLocationData(initialData.location ?? null);
      setFiles([]);
      setExistingImageUrls(initialData.imageUrls ?? (initialData.imageUrl ? [initialData.imageUrl] : []));
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      setError(null);
      setIsSubmitting(false);
    }
  }, [initialData, mode, open]);

  useEffect(() => {
    return () => {
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return prev;
      });
    };
  }, []);

  const previewCountLabel = useMemo(() => {
    if (previews.length === 0) return 'Upload up to 20 images.';
    return `${previews.length} of ${MAX_IMAGES} selected.`;
  }, [previews.length]);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;

    setFiles((prevFiles) => {
      const remainingSlots = Math.max(MAX_IMAGES - prevFiles.length, 0);
      const nextFiles = [...prevFiles, ...selected.slice(0, remainingSlots)];
      return nextFiles;
    });

    setPreviews((prevPreviews) => {
      const remainingSlots = Math.max(MAX_IMAGES - prevPreviews.length, 0);
      const nextPreviews = [
        ...prevPreviews,
        ...selected.slice(0, remainingSlots).map((file) => URL.createObjectURL(file)),
      ];
      return nextPreviews;
    });

    event.currentTarget.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!destinationName.trim()) {
      setError('Destination name is required.');
      return;
    }

    if (!locationData?.municipality || !locationData?.barangay) {
      setError('Please select a municipality and barangay.');
      return;
    }

    if (mode === 'create' && files.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    if (mode === 'edit' && existingImageUrls.length === 0 && files.length === 0) {
      setError('Please keep at least one image.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const fallbackImageUrls = existingImageUrls;
      const imageUrls = files.length > 0
        ? [...fallbackImageUrls, ...(await uploadImages(files, `destinations/${destinationName.trim()}`))]
        : fallbackImageUrls;
      const basePayload = {
        destination_name: destinationName.trim(),
        description: description.trim() || null,
        image_url: imageUrls[0] ?? null,
        user_id: user?.id ?? null,
        municipality: locationData.municipality,
        barangay: locationData.barangay,
        latitude: locationData.lat,
        longitude: locationData.lng,
        address: locationData.address,
      };

      const payloadWithArray = {
        ...basePayload,
        image_urls: imageUrls,
      } as typeof basePayload & { image_urls?: string[] };

      if (mode === 'edit') {
        let { error: updateError } = await supabase
          .from('destinations')
          .update(payloadWithArray)
          .eq('id', destinationId ?? '')
          .eq('user_id', user?.id ?? '');

        if (updateError && updateError.message.includes('image_urls')) {
          const retry = await supabase
            .from('destinations')
            .update(basePayload)
            .eq('id', destinationId ?? '')
            .eq('user_id', user?.id ?? '');
          updateError = retry.error ?? null;
        }

        if (updateError) {
          throw updateError;
        }

        const updated = {
          name: basePayload.destination_name,
          description: basePayload.description,
          imageUrl: basePayload.image_url,
          imageUrls,
          location: {
            municipality: basePayload.municipality,
            barangay: basePayload.barangay,
            lat: basePayload.latitude,
            lng: basePayload.longitude,
            address: basePayload.address,
          } as LocationData,
        };

        toast.success('Destination updated successfully.');
        await queryClient.invalidateQueries({ queryKey: ['destinations'] });
        onSuccess?.(updated);
        onClose();
        return;
      }

      let { error: insertError } = await supabase.from('destinations').insert(payloadWithArray);

      if (insertError && insertError.message.includes('image_urls')) {
        const retry = await supabase.from('destinations').insert(basePayload);
        insertError = retry.error ?? null;
      }

      if (insertError) {
        throw insertError;
      }

      toast.success('Destination uploaded successfully.');
      await queryClient.invalidateQueries({ queryKey: ['destinations'] });
      onSuccess?.();
      onClose();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="glass-secondary modal-stone-text border border-white/20 rounded-2xl p-3 md:p-6 w-full max-w-4xl h-[85vh] md:h-[80vh] max-h-[85vh] md:max-h-[80vh] overflow-y-auto hide-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="destination-upload-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold" id="destination-upload-title">Destination Upload</h2>
            <p className="text-sm modal-stone-muted">{mode === 'edit' ? 'Update your uploaded destination.' : 'Add new destinations with visuals.'}</p>
          </div>
          <button
            type="button"
            className="modal-stone-muted hover:opacity-80 text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm modal-stone-muted">Destination name</label>
              <span className={`text-xs ${destinationName.length > 64 ? 'text-red-400' : 'modal-stone-soft'}`}>
                {destinationName.length}/64
              </span>
            </div>
            <input
              type="text"
              value={destinationName}
              onChange={(event) => setDestinationName(event.target.value.slice(0, 64))}
              maxLength={64}
              placeholder="San Vicente Cove"
              className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm modal-stone-text placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="text-sm modal-stone-muted">Location</label>
            <LocationPickerMap onLocationConfirmed={setLocationData} initialLocation={locationData} hideIntro defaultPinMapOpen={false} />
            {locationData && (
              <p className="text-xs modal-stone-muted">
                Location: {locationData.barangay ?? 'Unknown'}, {locationData.municipality ?? 'Unknown'}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm modal-stone-muted">Description</label>
              <span className={`text-xs ${description.length > 2200 ? 'text-red-400' : 'modal-stone-soft'}`}>
                {description.length}/2,200
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value.slice(0, 2200))}
              maxLength={2200}
              placeholder="Describe the destination..."
              className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm modal-stone-text placeholder:text-primary focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="destination-upload-images" className="text-sm modal-stone-muted">Image upload</label>
            <input
              id="destination-upload-images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesChange}
              className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm modal-stone-text file:mr-3 file:rounded-full file:border-0 file:bg-white/20 file:px-3 file:py-1 file:text-xs file:text-white"
            />
            <p className="text-xs modal-stone-soft">{previewCountLabel}</p>
          </div>
          {(existingImageUrls.length > 0 || previews.length > 0) && (
            <div className="sm:col-span-2">
              <p className="text-xs modal-stone-muted mb-2">Preview</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {existingImageUrls.map((src, index) => (
                  <div key={`existing-${src}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/10">
                    <img src={src} alt="Existing destination" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {previews.map((src, index) => (
                  <div key={`new-${src}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/10">
                    <img src={src} alt="Selected destination" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFiles((prev) => prev.filter((_, i) => i !== index));
                        setPreviews((prev) => {
                          const target = prev[index];
                          if (target) URL.revokeObjectURL(target);
                          return prev.filter((_, i) => i !== index);
                        });
                      }}
                      className="absolute top-1 right-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && (
            <div className="sm:col-span-2 text-sm text-red-200 bg-red-500/20 border border-red-200/30 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              className="text-sm modal-stone-muted hover:opacity-80"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Uploading...') : (mode === 'edit' ? 'Update destination' : 'Upload destination')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
