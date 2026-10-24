/**
 * Query Key Factory cho TanStack React Query v5
 * Tập trung hóa định danh cache keys giúp tránh nhầm lẫn chuỗi ký tự,
 * hỗ trợ refactoring và bảo đảm tính nhất quán khi invalidate cache.
 */

export interface SearchQueryKeyParams {
  q?: string
  topic?: string
  upperTrigram?: string
  lowerTrigram?: string
  userLevel?: string
  page?: number
}

export const queryKeys = {
  health: ['health'] as const,
  governance: {
    all: ['governance'] as const,
    stats: ['governanceStats'] as const,
    queue: ['reviewQueue'] as const,
  },
  hexagrams: {
    all: ['hexagrams'] as const,
    detail: (id: number | string, level?: string) => ['hexagram', id, level] as const,
  },
  search: {
    all: ['search'] as const,
    list: (params: SearchQueryKeyParams) =>
      [
        'search',
        params.q,
        params.topic,
        params.upperTrigram,
        params.lowerTrigram,
        params.userLevel,
        params.page,
      ] as const,
  },
} as const
