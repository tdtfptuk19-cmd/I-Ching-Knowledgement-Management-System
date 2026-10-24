import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getHealth } from '@/api/health.api'
import { queryKeys } from '@/api/query-keys'
import { AlertTriangle, Database, CheckCircle2 } from 'lucide-react'

export const HealthIndicator: React.FC = () => {
  const { data, isError, isLoading } = useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    refetchInterval: 30000, // Kiểm tra định kỳ 30s
    retry: 1,
  })

  const isProduction = data?.database?.trim().toLowerCase() === 'kinhdich_kb'

  return (
    <>
      {/* CẢNH BÁO NGUY CẤP NẾU TRỎ VÀO CSDL PRODUCTION (Ràng buộc bất biến 2) */}
      {isProduction && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse shadow-md z-50">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>
            BÁO ĐỘNG ĐỎ: HỆ THỐNG ĐANG KẾT NỐI VÀO CSDL PRODUCTION &apos;KinhDich_KB&apos;! MỌI THAO TÁC GHI PHẢI DỪNG LẠI NGAY LẬP TỨC!
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700">
          <Database className="w-3.5 h-3.5 text-stone-500" />
          {isLoading ? (
            <span className="text-stone-400">Đang kiểm tra DB...</span>
          ) : isError ? (
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Mất kết nối API
            </span>
          ) : isProduction ? (
            <span className="flex items-center gap-1 text-red-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              PROD: {data.database}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{data?.database || (import.meta.env.DEV ? 'KinhDich_KB_Development' : 'Mock_DB')}</span>
            </span>
          )}
        </div>
      </div>
    </>
  )
}
