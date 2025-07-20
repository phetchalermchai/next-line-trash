"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { GalleryVerticalEnd } from "lucide-react";

export default function SkeletonLoginPage() {
  return (
    <div className="bg-muted min-h-svh flex flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        {/* Branding / Title */}
        <div className="flex flex-col items-center gap-2 self-center font-medium text-primary text-lg">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
              <GalleryVerticalEnd className="size-5 opacity-60" />
            </div>
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-52 mt-1" />
        </div>

        {/* Card Skeleton */}
        <div className="bg-white dark:bg-zinc-900 shadow-md rounded-xl p-6 w-full space-y-4">
          {/* Title */}
          <Skeleton className="h-6 w-1/2 mx-auto" />
          {/* Google/Facebook/LINE Button Skeletons */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
