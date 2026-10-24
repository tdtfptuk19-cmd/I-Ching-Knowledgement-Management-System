import React from 'react'

export const PageSkeleton: React.FC = () => {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse min-h-[85vh]"
      aria-busy="true"
      aria-label="Đang tải dữ liệu trang..."
    >
      {/* Title & subtitle skeleton */}
      <div className="space-y-2.5 border-b border-stone-200/80 pb-4">
        <div className="h-7 bg-stone-200 rounded-lg w-64 max-w-[80%]" />
        <div className="h-4 bg-stone-200/60 rounded w-96 max-w-full" />
      </div>

      {/* Main card skeleton */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-stone-200 rounded w-48" />
          <div className="h-8 bg-stone-100 rounded-lg w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <div className="h-28 bg-stone-100 rounded-lg border border-stone-200/60" />
          <div className="h-28 bg-stone-100 rounded-lg border border-stone-200/60" />
          <div className="h-28 bg-stone-100 rounded-lg border border-stone-200/60" />
        </div>
      </div>
    </div>
  )
}
