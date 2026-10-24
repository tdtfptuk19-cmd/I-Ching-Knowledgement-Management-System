import React, { useState, useEffect } from 'react'
import { ReviewQueueItem, ReviewRequest } from '@/types/governance.types'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { CheckCircle2, XCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react'

interface ReviewConfirmModalProps {
  item: ReviewQueueItem
  newStatus: 'APPROVED' | 'REJECTED'
  defaultReviewer: string
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (payload: ReviewRequest) => Promise<void>
}

export const ReviewConfirmModal: React.FC<ReviewConfirmModalProps> = ({
  item,
  newStatus,
  defaultReviewer,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const { isTechnicalMode } = useTechnicalMode()
  const [reviewer, setReviewer] = useState<string>(defaultReviewer || '')
  const [comment, setComment] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (defaultReviewer) {
      setReviewer(defaultReviewer)
    }
  }, [defaultReviewer])

  if (!isOpen) return null

  const isApproved = newStatus === 'APPROVED'
  const trimmedReviewer = reviewer.trim()
  const isGenericRoleName = ['NOVICE', 'PRACTITIONER', 'EXPERT', 'REVIEWER', 'ADMIN'].includes(
    trimmedReviewer.toUpperCase()
  )
  const isValidReviewer = trimmedReviewer.length >= 2 && !isGenericRoleName

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (trimmedReviewer.length < 2) {
      setErrorMsg('Chặn duyệt: Định danh người kiểm duyệt phải có ít nhất 2 ký tự (không được để trống).')
      return
    }

    if (isGenericRoleName) {
      setErrorMsg(
        `Chặn duyệt: Không dùng tên vai trò chung ("${trimmedReviewer}"). Vui lòng nhập định danh người dùng thực tế (VD: ChuyenGia_TranVanA).`
      )
      return
    }

    try {
      await onConfirm({
        reviewer: trimmedReviewer,
        new_status: newStatus,
        comment: comment.trim() || undefined,
      })
    } catch (err: unknown) {
      const error = err as { message?: string }
      setErrorMsg(error?.message || 'Có lỗi khi xử lý bài kiểm duyệt.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div
          className={`px-6 py-4 flex items-center gap-3 border-b ${
            isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              {isApproved ? 'Xác nhận Phê Duyệt Diễn Giải' : 'Xác nhận Từ Chối Diễn Giải'}
            </h3>
            <p className="text-xs text-stone-600">
              Mã bài: #{item.interpretation_id} · Quẻ #{item.hexagram_id} ({item.hexagram_name}) · {item.topic}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reviewer Name */}
          <div>
            <label htmlFor="reviewer-name" className="block text-xs font-semibold text-stone-700 mb-1">
              Định danh Người Kiểm Duyệt (reviewer) <span className="text-red-500">*</span>
            </label>
            <input
              id="reviewer-name"
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="VD: ChuyenGia_TranVanA"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                !isValidReviewer
                  ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                  : 'border-stone-300 focus:ring-amber-500'
              }`}
              required
            />
            {!isValidReviewer ? (
              <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                {trimmedReviewer.length < 2
                  ? 'Định danh phải có tối thiểu 2 ký tự (không được để trống hoặc chỉ có khoảng trắng).'
                  : `Không dùng tên vai trò chung ("${trimmedReviewer}"). Vui lòng nhập định danh cá nhân.`}
              </p>
            ) : (
              <p className="text-xs text-stone-600 mt-1">
                Hệ thống dùng định danh này để ghi nhận trách nhiệm thẩm định vào lịch sử kiểm toán.
              </p>
            )}
          </div>

          {/* Expert Comment with BCR-002 Tooltip */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="reviewer-comment" className="block text-xs font-semibold text-stone-700">
                Nhận xét của Chuyên gia (tùy chọn)
              </label>
              <div
                className="flex items-center gap-1 text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 cursor-help"
                title="BCR-002: Backend tiếp nhận comment qua DTO ReviewRequest nhưng Stored Procedure sp_review_interpretation hiện thời chưa có tham số lưu trường này vào CSDL."
              >
                <HelpCircle className="w-3 h-3 text-amber-600" />
                <span>
                  {isTechnicalMode ? 'BCR-002: Backend chưa lưu comment' : 'Lưu ý: Nhận xét chưa lưu CSDL'}
                  <span className="sr-only">BCR-002</span>
                </span>
              </div>
            </div>
            <textarea
              id="reviewer-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Nhập lý do phê duyệt hoặc nguyên nhân từ chối để đối chiếu sau này..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* KMS Notice */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isApproved
                ? 'Khi được phê duyệt (APPROVED), diễn giải này sẽ lập tức hiển thị cho người dùng và tham gia vào trọng số tổng hợp tri thức (Mô-đun 3).'
                : 'Khi bị từ chối (REJECTED), bài diễn giải sẽ bị loại khỏi kho ứng dụng công khai.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidReviewer}
              className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                isApproved
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>{isApproved ? 'Xác nhận Duyệt' : 'Xác nhận Từ Chối'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
