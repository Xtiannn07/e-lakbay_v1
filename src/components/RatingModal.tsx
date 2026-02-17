import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface RatingModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: (rating: number, comment: string) => void | Promise<void>;
}

export const RatingModal: React.FC<RatingModalProps> = ({ open, title, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setComment('');
      setIsSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="glass-secondary border border-white/20 rounded-2xl shadow-2xl p-6 w-full max-w-lg text-white max-h-[85vh] md:max-h-none overflow-y-auto hide-scrollbar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold" id="rating-modal-title">{title}</h2>
            <p className="text-sm text-white/60">Share your experience with a quick rating.</p>
          </div>
          <button
            type="button"
            className="text-white/70 hover:text-white text-2xl"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`transition-colors ${rating >= star ? 'text-yellow-300' : 'text-white/30'}`}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className="h-6 w-6"
                fill={rating >= star ? 'currentColor' : 'none'}
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/70">Comment</label>
          <textarea
            rows={4}
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="rounded-lg bg-white/10 border border-white/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="text-sm text-white/70 hover:text-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-white/10 border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
            onClick={async () => {
              if (rating === 0) {
                toast.error('Please select a rating first.');
                return;
              }
              if (isSubmitting) return;
              setIsSubmitting(true);
              try {
                await onSubmit?.(rating, comment);
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};
