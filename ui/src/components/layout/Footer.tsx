import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 mt-16 py-8 text-stone-700 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="font-serif font-bold text-stone-900 text-sm mb-2">
              Hệ Thống Quản Trị Tri Thức Kinh Dịch (`KinhDich_KB`)
            </h4>
            <p className="text-stone-700 text-xs leading-relaxed">
              Dự án thực hành môn học <strong>KMS301</strong> — Kiến trúc 3 tầng chuẩn mực (Data · Process · UI).
              Nhóm 5, Lớp IS1906.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-stone-800 text-xs uppercase tracking-wider mb-2">
              Nền Tảng Lý Thuyết KMS
            </h4>
            <ul className="space-y-1 text-stone-700">
              <li>• Phân cấp tiếp nhận tri thức 3 mức (Wiig, 1993)</li>
              <li>• Cổng kiểm duyệt tri thức Validation Gate (McElroy, 1999)</li>
              <li>• Vòng lặp học tập đôi Double-Loop Learning (Argyris & Schön, 1978)</li>
              <li>• Tổng hợp tri thức 3 trụ cột (Three-Pillar Synthesis & XAI)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-stone-800 text-xs uppercase tracking-wider mb-2">
              Nguyên Tắc An Toàn & Bảo Mật
            </h4>
            {import.meta.env.DEV ? (
              <p className="text-stone-700 text-xs leading-relaxed">
                Môi trường phát triển trỏ tới CSDL <code className="bg-stone-200 px-1 py-0.5 rounded font-mono">KinhDich_KB (Development)</code>.
                Toàn bộ dữ liệu danh tính người dùng được băm bảo mật HMAC-SHA256 theo chuẩn ADR-005.
              </p>
            ) : (
              <p className="text-stone-700 text-xs leading-relaxed">
                Môi trường trình diễn: <strong>Dữ liệu mô phỏng (Mock Service Worker)</strong>.
                Toàn bộ dữ liệu danh tính người dùng được băm bảo mật HMAC-SHA256 theo chuẩn ADR-005.
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-600">
          <span>© 2026 Nhóm 5 — KMS301. Mọi quyền được bảo lưu.</span>
          <span>Phiên bản Tầng 3 v1.0.0 (Gate 8 Verified)</span>
        </div>
      </div>
    </footer>
  )
}
