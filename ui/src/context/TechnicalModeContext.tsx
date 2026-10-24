import React, { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'kinhdich_technical_mode'

interface TechnicalModeContextType {
  isTechnicalMode: boolean
  toggleTechnicalMode: () => void
  setTechnicalMode: (val: boolean) => void
}

const TechnicalModeContext = createContext<TechnicalModeContextType>({
  isTechnicalMode: false,
  toggleTechnicalMode: () => {},
  setTechnicalMode: () => {},
})

export const TechnicalModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTechnicalMode, setIsTechnicalModeState] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY) === 'true'
      }
    } catch {
      // Ignored
    }
    return false
  })

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(isTechnicalMode))
      }
    } catch {
      // Ignored
    }
  }, [isTechnicalMode])

  const toggleTechnicalMode = () => {
    setIsTechnicalModeState(prev => !prev)
  }

  const setTechnicalMode = (val: boolean) => {
    setIsTechnicalModeState(val)
  }

  return (
    <TechnicalModeContext.Provider
      value={{
        isTechnicalMode,
        toggleTechnicalMode,
        setTechnicalMode,
      }}
    >
      {children}
    </TechnicalModeContext.Provider>
  )
}

export const useTechnicalMode = (): TechnicalModeContextType => {
  return useContext(TechnicalModeContext)
}

/**
 * Hiển thị mã kỹ thuật (BCR, ADR, RBAC, W=0.xx) khi bật chế độ kỹ thuật;
 * Khi tắt chế độ kỹ thuật, hiển thị nhãn thân thiện hoặc ẩn vào tooltip.
 */
interface TechnicalBadgeProps {
  code: string
  labelVi?: string
  tooltip?: string
  className?: string
}

export const TechnicalBadge: React.FC<TechnicalBadgeProps> = ({
  code,
  labelVi,
  tooltip,
  className = '',
}) => {
  const { isTechnicalMode } = useTechnicalMode()

  if (isTechnicalMode) {
    return (
      <span
        title={tooltip || labelVi || code}
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 ${className}`}
      >
        {code}
      </span>
    )
  }

  // Khi ở chế độ thường: nếu có labelVi thì hiển thị kèm tooltip, nếu không thì ẩn thị giác nhưng giữ trong DOM cho a11y & test
  if (labelVi) {
    return (
      <span
        title={`${code}: ${tooltip || labelVi}`}
        className={`text-xs text-stone-600 cursor-help ${className}`}
      >
        {labelVi}
        <span className="sr-only"> ({code})</span>
      </span>
    )
  }

  return <span className="sr-only">{code}</span>
}
