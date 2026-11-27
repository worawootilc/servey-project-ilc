import { useMemo, useState } from 'react';
import { Eye, Search, Trash2, X } from 'lucide-react';
import { formatComboSummary } from '../data/defaultSurvey.ts';
import type { AnswerValue, MenuComboSelection, SurveyResponseRecord, SurveySchema } from '../types/survey.ts';

interface ResponsesTableViewProps {
  survey: SurveySchema;
  responses: SurveyResponseRecord[];
  onDeleteResponse: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

function isComboSelection(val: unknown): val is MenuComboSelection {
  return typeof val === 'object' && val !== null && 'totalPrice' in val;
}

function formatAnswerDisplay(val: AnswerValue | undefined): string {
  if (val === undefined || val === null) return '—';
  if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '—';
  if (isComboSelection(val)) return formatComboSummary(val);
  const str = String(val).trim();
  return str || '—';
}

export function ResponsesTableView({
  survey,
  responses,
  onDeleteResponse,
  onClearAll,
}: ResponsesTableViewProps) {
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SurveyResponseRecord | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return responses;
    return responses.filter((r) => {
      if (r.respondentName.toLowerCase().includes(q)) return true;
      if (r.id.toLowerCase().includes(q)) return true;
      const combo = isComboSelection(r.answers['q2_menu_combo']) ? r.answers['q2_menu_combo'] : null;
      if (combo?.foodName?.toLowerCase().includes(q)) return true;
      if (combo?.drinkName?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [responses, search]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDeleteResponse(id);
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E6E3] pb-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#161B18]">
            รายการคำตอบทั้งหมด ({responses.length})
          </h2>
          <p className="text-sm text-[#57605B] mt-0.5">
            ตรวจสอบรายละเอียดคำตอบรายบุคคล ค้นหาตามชื่อผู้รับสิทธิ์ หรือลบรายการที่ไม่ถูกต้อง
          </p>
        </div>

        {responses.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {confirmClearAll ? (
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-red-800 font-medium">ยืนยันล้างคำตอบทั้งหมด?</span>
                <button
                  type="button"
                  onClick={async () => {
                    await onClearAll();
                    setConfirmClearAll(false);
                  }}
                  className="px-2.5 py-1 bg-red-700 text-white rounded font-medium hover:bg-red-800"
                >
                  ลบทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 text-[#57605B] hover:text-[#161B18]"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างข้อมูลทั้งหมด</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#57605B] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อผู้ตอบ เมนูอาหาร หรือเครื่องดื่ม..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
        />
      </div>

      {/* Responses Table */}
      <div className="bg-white border border-[#E2E6E3] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8F7] border-b border-[#E2E6E3] text-xs font-medium text-[#57605B]">
                <th className="py-2.5 px-4">รหัส</th>
                <th className="py-2.5 px-4">ชื่อผู้เลือก</th>
                <th className="py-2.5 px-4">อาหาร</th>
                <th className="py-2.5 px-4">เครื่องดื่ม</th>
                <th className="py-2.5 px-4">ความหวาน</th>
                <th className="py-2.5 px-4 text-right">รวม (฿)</th>
                <th className="py-2.5 px-4">เวลาส่ง</th>
                <th className="py-2.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1EE] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#57605B]">
                    {responses.length === 0
                      ? 'ยังไม่มีข้อมูลคำตอบในระบบ'
                      : 'ไม่พบรายการที่ตรงกับคำค้นหา'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const combo = isComboSelection(r.answers['q2_menu_combo'])
                    ? r.answers['q2_menu_combo']
                    : null;
                  const sweetness =
                    typeof r.answers['q3_sweetness'] === 'string'
                      ? r.answers['q3_sweetness']
                      : '—';
                  return (
                    <tr key={r.id} className="hover:bg-[#F7F8F7]/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-[#57605B] whitespace-nowrap">
                        {r.id}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#161B18] whitespace-nowrap">
                        {r.respondentName}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#161B18] max-w-[200px] truncate">
                        {combo?.foodName || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#161B18] max-w-[220px] truncate">
                        {combo?.drinkName
                          ? `${combo.drinkName} (${combo.drinkTemp})`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#57605B] whitespace-nowrap">
                        {sweetness}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-[#161B18] whitespace-nowrap">
                        {combo ? `${combo.totalPrice}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-xs text-[#57605B] whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="p-1.5 text-[#57605B] hover:text-[#1B5E3F] rounded"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === r.id}
                            onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-[#57605B] hover:text-red-700 rounded disabled:opacity-40"
                            title="ลบรายการ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E6E3] rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF1EE] pb-4">
              <div>
                <div className="font-mono tabular-nums text-xs text-[#57605B]">
                  {selectedRecord.id} ·{' '}
                  {new Date(selectedRecord.submittedAt).toLocaleString('th-TH')}
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#161B18] mt-1">
                  {selectedRecord.respondentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-[#57605B] hover:text-[#161B18] rounded-lg"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {survey.questions.map((q) => (
                <div key={q.id} className="space-y-1 border-b border-[#F5F7F5] pb-3 last:border-b-0">
                  <div className="text-xs font-medium text-[#57605B]">{q.title}</div>
                  <div className="text-sm text-[#161B18] font-medium">
                    {formatAnswerDisplay(selectedRecord.answers[q.id])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
