import React, { useEffect, useRef } from 'react';
import { MessageCircle, Star, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from './Avatar';
import { supabase } from '../lib/supabaseClient';

interface Comment {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    img_url: string | null;
  } | null;
}

interface CommentsSliderProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'destination' | 'product';
  itemName: string;
  onProfileClick?: (profileId: string) => void;
}

export const CommentsSlider: React.FC<CommentsSliderProps> = ({
  open,
  onClose,
  itemId,
  itemType,
  itemName,
  onProfileClick,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const tableName = itemType === 'destination' ? 'destination_ratings' : 'product_ratings';
  const foreignKey = itemType === 'destination' ? 'destination_id' : 'product_id';

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', itemType, itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id
        `)
        .eq(foreignKey, itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set((data ?? []).map((d) => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, img_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p])
      );

      return (data ?? []).map((item) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment,
        created_at: item.created_at,
        user: profileMap.get(item.user_id) ?? null,
      })) as Comment[];
    },
    enabled: open && Boolean(itemId),
    staleTime: 30_000,
  });

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sliderRef.current && !sliderRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close on the click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3 w-3 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`}
        />
      ))}
    </div>
  );

  if (!open) return null;

  return (
    <div
      ref={sliderRef}
      className="absolute inset-y-0 right-0 w-full sm:w-80 z-40 flex flex-col bg-black/90 backdrop-blur-xl border-l border-white/10 rounded-r-2xl animate-in slide-in-from-right duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="h-5 w-5 text-white/70 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">Reviews</h3>
            <p className="text-xs text-white/50 truncate">{itemName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          aria-label="Close comments"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-white/10" />
                  <div className="h-4 w-24 rounded bg-white/10" />
                </div>
                <div className="h-3 w-full rounded bg-white/10" />
                <div className="h-3 w-2/3 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageCircle className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-white/50 text-sm">No reviews yet</p>
            <p className="text-white/30 text-xs mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2"
            >
              {/* User info */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    name={comment.user?.full_name ?? 'User'}
                    imageUrl={comment.user?.img_url}
                    sizeClassName="h-8 w-8"
                    onClick={
                      comment.user?.id && onProfileClick
                        ? () => onProfileClick(comment.user!.id)
                        : undefined
                    }
                  />
                  <div className="min-w-0">
                    {comment.user?.id && onProfileClick ? (
                      <button
                        type="button"
                        onClick={() => onProfileClick(comment.user!.id)}
                        className="text-sm text-white font-medium hover:underline truncate block"
                      >
                        {comment.user?.full_name ?? 'Anonymous'}
                      </button>
                    ) : (
                      <span className="text-sm text-white font-medium truncate block">
                        {comment.user?.full_name ?? 'Anonymous'}
                      </span>
                    )}
                    <span className="text-xs text-white/40">{formatDate(comment.created_at)}</span>
                  </div>
                </div>
                {renderStars(comment.rating)}
              </div>

              {/* Comment text */}
              {comment.comment && (
                <p className="text-sm text-white/80 leading-relaxed">{comment.comment}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer with count */}
      {!isLoading && comments.length > 0 && (
        <div className="p-4 border-t border-white/10 text-center shrink-0">
          <span className="text-xs text-white/40">
            {comments.length} review{comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

// Toggle Button Component for the right edge - sits inside the modal at the right edge
interface CommentsToggleButtonProps {
  onClick: () => void;
  commentCount?: number;
}

export const CommentsToggleButton: React.FC<CommentsToggleButtonProps> = ({
  onClick,
  commentCount,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center gap-1 px-1.5 py-3 rounded-l-xl bg-white/10 backdrop-blur-md border border-white/20 border-r-0 hover:bg-white/20 transition-colors group"
      aria-label="View comments"
    >
      <MessageCircle className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
      {typeof commentCount === 'number' && commentCount > 0 && (
        <span className="text-[10px] text-white/70 group-hover:text-white font-medium">
          {commentCount}
        </span>
      )}
    </button>
  );
};
