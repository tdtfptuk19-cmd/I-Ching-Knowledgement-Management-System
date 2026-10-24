import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RoleGuard } from '@/auth/RoleGuard'
import { useAuth } from '@/auth/AuthContext'
import { useTechnicalMode } from '@/context/TechnicalModeContext'
import { getGovernanceStats } from '@/api/governance.api'
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Award,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { canReview } = useAuth()
  const { isTechnicalMode } = useTechnicalMode()

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['governanceStats'],
    queryFn: getGovernanceStats,
    refetchInterval: 30000, // Tự động làm mới mỗi 30s
  })

  return (
    <RoleGuard requiredPermission="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        {/* Header & KMS Theoretical Foundations */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
              <BarChart3 className="w-4 h-4 text-amber-700" />
              <span>Bảng Điều Khiển Quản Trị Tri Thức (KMS Governance Dashboard)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Chỉ Số Vận Hành & Học Tập Tri Thức
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-3xl">
              Hệ thống hóa toàn bộ chu trình tri thức: từ <strong>Kho Tri thức Cổ điển</strong> (Wiig 1993),{' '}
              <strong>Cổng Kiểm định Thẩm quyền</strong> (McElroy 1999) đến{' '}
              <strong>Vòng lặp Học tập Đôi</strong> (Argyris &amp; Schön 1978).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg shadow-sm transition disabled:opacity-50"
              title="Làm mới chỉ số"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />
              <span>{isFetching ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
            {canReview && (
              <Link
                to="/review"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Hàng Đợi Kiểm Duyệt</span>
              </Link>
            )}
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="p-12 text-center bg-white border border-stone-200 rounded-xl space-y-3">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full" />
            <p className="text-stone-600 text-sm">Đang tổng hợp các chỉ số quản trị từ Tầng 2...</p>
          </div>
        )}

        {isError && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
            <h3 className="font-bold text-red-900">Không thể tải số liệu thống kê</h3>
            <p className="text-xs text-red-700">{(error as Error)?.message || 'Lỗi kết nối API'}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs bg-red-800 text-white px-3 py-1.5 rounded hover:bg-red-900"
            >
              Thử lại
            </button>
          </div>
        )}

        {stats && (
          <>
            {/* 4 KHỐI THỐNG KÊ TRUNG TÂM THEO LÝ THUYẾT KMS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* KHỐI 1: Độ phủ kinh văn cổ điển (Wiig 1993) */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span className="flex items-center gap-1.5 text-amber-900 font-semibold uppercase tracking-wider text-xs">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    1. Kinh Văn Cổ Điển
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    isTechnicalMode ? 'bg-amber-100 text-amber-950 border border-amber-300' : 'bg-stone-100 text-stone-700'
                  }`} title="Phân cấp tiếp nhận tri thức Wiig (1993)">
                    Wiig 1993
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
                    {stats.classic_texts_coverage.total_rows_db.toLocaleString()}{' '}
                    <span className="text-xs font-sans text-stone-600 font-normal">mục</span>
                  </div>
                  <div className="text-xs text-stone-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Mục tiêu chuẩn: {stats.classic_texts_coverage.benchmark_target} (64 quẻ × 15)</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 text-xs text-stone-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Hào đặc biệt (Dụng Cửu/Lục):</span>
                    <strong className="text-stone-900 font-mono">+{stats.classic_texts_coverage.special_lines_extra}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Chữ Hán thiếu (NULL):</span>
                    <strong className="text-emerald-700 font-mono">{stats.classic_texts_coverage.null_han_count}</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span>Trạng thái Tầng 1:</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold text-xs">
                      100% Đã Phê Duyệt
                    </span>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: Hàng đợi thẩm định (McElroy 1999) */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                  <span className="flex items-center gap-1.5 text-purple-900 font-semibold uppercase tracking-wider text-xs">
                    <Clock className="w-4 h-4 text-purple-700" />
                    2. Hàng Đợi Thẩm Định
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    isTechnicalMode ? 'bg-purple-100 text-purple-950 border border-purple-300' : 'bg-stone-100 text-stone-700'
                  }`} title="Cổng thẩm định tri thức Validation Gate McElroy (1999)">
                    McElroy 1999
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-serif font-bold text-stone-900 tracking-tight flex items-baseline gap-2">
                    <span className="text-amber-800 font-bold">{stats.review_queue.pending_count}</span>
                    <span className="text-xs font-sans text-stone-600 font-normal">chờ duyệt</span>
                  </div>
                  <div className="text-xs text-stone-700 mt-1 flex items-center gap-2">
                    <span className="text-emerald-700 font-semibold">✓ {stats.review_queue.approved_count} Đạt</span>
                    <span>·</span>
                    <span className="text-rose-700 font-semibold">✕ {stats.review_queue.rejected_count} Bác</span>
                  </div>
                </div>
                {/* Visual Ratio Bar */}
                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-full"
                      style={{
                        width: `${
                          (stats.review_queue.approved_count /
                            Math.max(stats.review_queue.approved_count + stats.review_queue.rejected_count, 1)) *
                          100
                        }%`,
                      }}
                      title="Tỉ lệ phê duyệt"
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{
                        width: `${
                          (stats.review_queue.rejected_count /
                            Math.max(stats.review_queue.approved_count + stats.review_queue.rejected_count, 1)) *
                          100
                        }%`,
                      }}
                      title="Tỉ lệ từ chối"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>Cổng kiểm định:</span>
                    <span className="font-semibold text-stone-800">Validation Gate</span>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: Phân bổ nguồn tri thức */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span className="flex items-center gap-1.5 text-blue-800 font-semibold uppercase tracking-wider text-[11px]">
                    <Database className="w-4 h-4 text-blue-700" />
                    3. Phân Bổ Nguồn
                  </span>
                  <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                    Provenance
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
                    {stats.sources_breakdown.total_sources}{' '}
                    <span className="text-xs font-sans text-stone-500 font-normal">nguồn chuẩn</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1">
                    Đa dạng hóa kinh điển &amp; thực nghiệm
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-amber-700" /> Sách Cổ Điển (BOOK):
                    </span>
                    <strong className="text-stone-900 font-mono">{stats.sources_breakdown.by_kind.BOOK || 0}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" /> Mô hình AI (AI_MODEL):
                    </span>
                    <strong className="text-blue-900 font-mono">{stats.sources_breakdown.by_kind.AI_MODEL || 0}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-stone-500" /> Chuyên Gia (PERSON):
                    </span>
                    <span className="text-stone-600 font-mono" title="Mã quy tắc BCR-005: nguồn chuyên gia chưa nạp">
                      0 {isTechnicalMode ? '(BCR-005)' : '(Chưa nạp)'}
                      <span className="sr-only">BCR-005</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* KHỐI 4: Vòng lặp học tập đôi (Argyris & Schön 1978) */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-800 font-semibold uppercase tracking-wider text-xs">
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    4. Vòng Lặp Học Tập Đôi
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-xs font-mono font-bold">
                    Argyris 1978
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-serif font-bold text-stone-900 tracking-tight flex items-baseline gap-2">
                    <span className="text-emerald-800">{stats.double_loop_learning.best_practice_cases}</span>
                    <span className="text-xs font-sans text-stone-600 font-normal">ca mẫu mực</span>
                  </div>
                  <div className="text-xs text-stone-600 mt-1 flex items-center gap-1.5">
                    <span>{stats.double_loop_learning.cases_with_feedback} / {stats.double_loop_learning.total_cases} ca có phản hồi</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                  <div className="flex justify-between items-center">
                    <span>Tỉ lệ phản hồi thực chứng:</span>
                    <strong className="text-emerald-800 font-mono">
                      {stats.double_loop_learning.total_cases > 0
                        ? Math.round(
                            (stats.double_loop_learning.cases_with_feedback /
                              stats.double_loop_learning.total_cases) *
                              100
                          )
                        : 0}
                      %
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Quy tắc cần rà soát:</span>
                    <strong
                      className={`font-mono ${
                        stats.double_loop_learning.review_needed_rules.length > 0
                          ? 'text-rose-600 font-bold'
                          : 'text-stone-700'
                      }`}
                    >
                      {stats.double_loop_learning.review_needed_rules.length} quy tắc
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span>Cơ chế học tập:</span>
                    <span className="text-emerald-900 font-medium">Double-Loop Feedback</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CHI TIẾT VÒNG LẶP HỌC TẬP ĐÔI & DANH SÁCH QUY TẮC CẦN ĐIỀU CHỈNH GIẢ ĐỊNH (ARGYRIS & SCHÖN 1978) */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-amber-700" />
                    <span>Giám Sát Vòng Lặp Học Tập Đôi (Double-Loop Learning Supervision)</span>
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Theo Argyris &amp; Schön (1978): Khi thực tiễn sai lệch lặp lại, hệ thống không chỉ sửa hành động
                    đơn lẻ mà kích hoạt rà soát các giả định cốt lõi và quy tắc suy luận (Inference Rules).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1" title="Best Practices (Thực hành mẫu mực theo Argyris & Schön 1978)">
                    <Award className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {stats.double_loop_learning.best_practice_cases} {isTechnicalMode ? 'Best Practices' : 'Ca Thực Hành Mẫu Mực'}{' '}
                      Được Thừa Nhận
                      <span className="sr-only">Best Practices</span>
                    </span>
                  </span>
                </div>
              </div>

              {/* Bảng quy tắc cần rà soát */}
              {stats.double_loop_learning.review_needed_rules.length === 0 ? (
                <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-700 space-y-1">
                    <strong className="text-emerald-950 font-semibold text-sm">
                      Mô hình suy luận ổn định — Chưa ghi nhận quy tắc nào vượt ngưỡng sai lệch
                    </strong>
                    <p className="text-stone-600 leading-relaxed">
                      Hiện tại chưa có quy tắc nào có tỉ lệ phản hồi bất lợi/sai lệch vượt quá ngưỡng cho phép (failure_rate).
                      Tất cả các ca gieo quẻ có phản hồi đều được đối soát nhất quán với tri thức suy luận từ Bát quái và Hào vị.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Cảnh báo học tập đôi (Double-Loop Trigger): </strong>
                      Phát hiện {stats.double_loop_learning.review_needed_rules.length} quy tắc suy luận có tỉ lệ phản hồi
                      không tương thích cao. Hội đồng chuyên gia cần xem xét lại định nghĩa logic hoặc điều chỉnh trọng số.
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-stone-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold">
                        <tr>
                          <th scope="col" className="p-3">Mã Quy Tắc (Rule Code)</th>
                          <th scope="col" className="p-3">Rule ID</th>
                          <th scope="col" className="p-3">Tỉ lệ Thất Bại / Không Khớp</th>
                          <th scope="col" className="p-3">Khuyến Nghị Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {stats.double_loop_learning.review_needed_rules.map((r) => (
                          <tr key={r.rule_id} className="hover:bg-stone-50/80 transition">
                            <td className="p-3 font-mono font-bold text-amber-900">{r.rule_code}</td>
                            <td className="p-3 font-mono text-stone-600">#{r.rule_id}</td>
                            <td className="p-3 font-mono font-bold text-rose-700">
                              {(r.failure_rate * 100).toFixed(1)}%
                            </td>
                            <td className="p-3 text-stone-700">
                              Yêu cầu Hội đồng Chuyên gia họp rà soát giả định nền tảng
                              {isTechnicalMode ? ' (ADR-005)' : ''}.
                              <span className="sr-only">ADR-005</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* THÔNG TIN HỆ THỐNG & ĐỐI CHIẾU TIÊU CHUẨN KIỂM ĐỊNH (VALIDATION AUDIT TRAIL) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box A: Ma trận phân quyền RBAC & Giới hạn hiển thị */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>
                    Phân Quyền Theo Dõi Dashboard {isTechnicalMode ? '(RBAC Policy)' : ''}
                    <span className="sr-only">RBAC Policy</span>
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Trang Dashboard này được phân quyền nghiêm ngặt theo mô hình Quản trị Tri thức (Wiig 1993):
                </p>
                <ul className="text-xs space-y-2 text-stone-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>
                      <strong className="text-stone-900">ADMIN / REVIEWER:</strong> Xem toàn vẹn 4 khối số liệu, chi tiết kiểm toán nguồn và quy tắc cảnh báo.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>
                      <strong className="text-stone-900">EXPERT:</strong> Xem tổng quan thống kê và học tập đôi để nghiên cứu học thuật.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-stone-300 flex-shrink-0" />
                    <span>
                      <strong className="text-stone-500">NOVICE / PRACTITIONER:</strong> Chặn truy cập (403) nhằm phân định rõ giữa người dùng tra cứu và người giám sát tri thức.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Box B: Đường dẫn thao tác nhanh */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Điều Hướng Nhanh Đến Các Cổng Nghiệp Vụ</span>
                </div>
                <p className="text-xs text-stone-600">
                  Thực hiện các thao tác vận hành tri thức tương ứng với vai trò của bạn:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <Link
                    to="/divination"
                    className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 text-xs flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-semibold text-stone-800">Cổng Gieo Quẻ</div>
                      <div className="text-xs text-stone-600">Gieo quẻ &amp; Nạp feedback</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
                  </Link>

                  <Link
                    to="/hexagrams"
                    className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 text-xs flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-semibold text-stone-800">Cổng Tra Cứu 64 Quẻ</div>
                      <div className="text-xs text-stone-600">Tra cứu theo cấp độ</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
                  </Link>

                  <Link
                    to="/contribute"
                    className="p-3 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 text-xs flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="font-semibold text-stone-800">Cổng Đóng Góp</div>
                      <div className="text-xs text-stone-600">Nạp diễn giải PENDING</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition" />
                  </Link>

                  {canReview && (
                    <Link
                      to="/review"
                      className="p-3 bg-purple-50/70 hover:bg-purple-100/70 rounded-lg border border-purple-200 text-xs flex items-center justify-between transition group"
                    >
                      <div>
                        <div className="font-semibold text-purple-900">Cổng Kiểm Duyệt</div>
                        <div className="text-xs text-purple-700">Duyệt &amp; Từ chối bài</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-purple-500 group-hover:text-purple-800 transition" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  )
}
