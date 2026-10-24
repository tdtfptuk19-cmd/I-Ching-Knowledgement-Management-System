import { useState, useEffect } from 'react'

/**
 * Hook làm trễ giá trị nhập (Debounce) để giảm tải tần suất gọi API
 * @param value Giá trị đầu vào
 * @param delay Thời gian trễ (ms), mặc định 300ms
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
