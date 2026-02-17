import React from 'react';
import { Skeleton } from './skeleton';

interface SkeletonListProps {
  count: number;
  render: (index: number) => React.ReactNode;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ count, render }) => (
  <>
    {Array.from({ length: count }).map((_, index) => render(index))}
  </>
);

export const ProductTileSkeleton: React.FC = () => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-3 sm:p-4">
    <div className="relative aspect-square rounded-2xl overflow-hidden">
      <Skeleton className="h-full w-full rounded-2xl" />
      <Skeleton className="absolute top-2 right-2 h-9 w-9 rounded-full" />
      <Skeleton className="absolute bottom-3 left-3 h-4 w-2/3 rounded-full" />
    </div>
    <div className="mt-3 flex gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={`star-skeleton-${index}`} className="h-3 w-3 rounded-full" />
      ))}
    </div>
  </div>
);

export const DestinationTileSkeleton: React.FC = () => (
  <article className="rounded-2xl p-4 flex flex-col h-full">
    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
    <div className="flex flex-1 flex-col gap-2 pt-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-1/2 rounded-full" />
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-5/6 rounded-full" />
    </div>
  </article>
);

export const DestinationModalCardSkeleton: React.FC = () => (
  <article className="rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
    <Skeleton className="h-56 sm:h-72 lg:h-80 w-full rounded-2xl" />
    <div className="rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      <Skeleton className="h-4 w-2/3 rounded-full" />
      <Skeleton className="h-6 w-1/2 rounded-full" />
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-5/6 rounded-full" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-40 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  </article>
);

export const ProductCardSkeleton: React.FC = () => (
  <article className="rounded-2xl p-4 sm:p-5 flex flex-col h-[420px] overflow-hidden">
    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
    <div className="flex flex-1 flex-col gap-3 pt-4">
      <Skeleton className="h-5 w-2/3 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-3 w-5/6 rounded-full" />
      <Skeleton className="h-4 w-24 rounded-full" />
    </div>
  </article>
);

interface TopDestinationSkeletonProps {
  className?: string;
}

export const TopDestinationSkeleton: React.FC<TopDestinationSkeletonProps> = ({ className }) => (
  <div className={`relative min-w-[60%] sm:min-w-[40%] lg:min-w-[35%] aspect-square ${className ?? ''}`}>
    <Skeleton className="h-full w-full rounded-none" />
  </div>
);

export const ProfileHeaderSkeleton: React.FC = () => (
  <div className="flex items-center gap-4">
    <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
    <div>
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="h-3 w-56 mt-2 rounded-full" />
    </div>
  </div>
);

export const ProfileChipSkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-1 text-center min-w-[72px]">
    <Skeleton className="h-14 w-14 rounded-full" />
    <Skeleton className="h-3 w-12 rounded-full" />
  </div>
);
