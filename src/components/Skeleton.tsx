import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function PlaceCardSkeleton() {
  return (
    <div className="flex gap-4 p-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <Skeleton className="w-24 h-24 flex-shrink-0" />
      <div className="flex-grow flex flex-col justify-center gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="w-3 h-3 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeaturedCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[75vw] sm:w-[320px] h-48 rounded-[2rem] overflow-hidden relative">
      <Skeleton className="w-full h-full" />
      <div className="absolute bottom-4 left-4 right-4">
        <Skeleton className="h-6 w-2/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1">
      <Skeleton className="w-14 h-14 rounded-full" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}
