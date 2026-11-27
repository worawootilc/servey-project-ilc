import { useMemo, useState } from 'react';
import { Check, ClipboardCheck, Copy, Edit3, Plus, Sparkles, Users } from 'lucide-react';
import type { MenuComboSelection, SurveyResponseRecord, SurveySchema } from '../types/survey.ts';
import { ResponsesTableView } from './ResponsesTableView.tsx';

interface AnalyticsViewProps {
  survey: SurveySchema;
  responses: SurveyResponseRecord[];
  isAdmin: boolean;
  onStartSurvey: () => void;
  onEditMemberSelection: (memberId: string) => void;
  onSeedSample: () => Promise<void>;
  onDeleteResponse: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
}

function isComboSelection(val: unknown): val is MenuComboSelection {
  return typeof val === 'object' && val !== null && 'totalPrice' in val;
}

export function AnalyticsView({
  survey,
  responses,
  isAdmin,
  onStartSurvey,
  onEditMemberSelection,
  onSeedSample,
  onDeleteResponse,
  onClearAll,
}: AnalyticsViewProps) {
  const [subTab, setSubTab] = useState<'summary' | 'table'>('summary');
  const [copiedLineOrder, setCopiedLineOrder] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const responseByMemberId = useMemo(() => {
    const map = new Map<string, SurveyResponseRecord>();
    for (const r of responses) {
      if (r.respondentId) {
        map.set(r.respondentId, r);
      } else {
        const matched = survey.roster.find((m) => m.fullName === r.respondentName);
        if (matched) map.set(matched.id, r);
      }
    }
    return map;
  }, [responses, survey.roster]);

  const metrics = useMemo(() => {
    let totalSpent = 0;
    let comboCount = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    const foodCounts = new Map<string, { name: string; unitPrice: number; count: number }>();
    const drinkCounts = new Map<string, { name: string; unitPrice: number; count: number }>();
    const sweetnessCounts = new Map<string, number>();
    const dietaryCounts = new Map<string, number>();

    for (const r of responses) {
      const combo = isComboSelection(r.answers['q2_menu_combo']) ? r.answers['q2_menu_combo'] : null;
      if (combo) {
        totalSpent += combo.totalPrice;
        comboCount += 1;

        if (combo.foodName) {
          const existingFood = foodCounts.get(combo.foodName);
          if (existingFood) {
            existingFood.count += 1;
          } else {
            foodCounts.set(combo.foodName, {
              name: combo.foodName,
              unitPrice: combo.foodPrice,
              count: 1,
            });
          }
        }

        if (combo.drinkName) {
          const sweetness =
            typeof r.answers['q3_sweetness'] === 'string' ? r.answers['q3_sweetness'] : '';
          const addonsStr =
            combo.drinkAddons.length > 0 ? ` + ${combo.drinkAddons.join(', ')}` : '';
          const key = `${combo.drinkName} (${combo.drinkTemp || 'ICE'})${addonsStr}${
            sweetness ? ` · ${sweetness}` : ''
          }`;
          const unitPrice = combo.drinkBasePrice + combo.drinkAddonsPrice;
          const existingDrink = drinkCounts.get(key);
          if (existingDrink) {
            existingDrink.count += 1;
          } else {
            drinkCounts.set(key, { name: key, unitPrice, count: 1 });
          }
        }
      }

      const sw = r.answers['q3_sweetness'];
      if (typeof sw === 'string' && sw) {
        sweetnessCounts.set(sw, (sweetnessCounts.get(sw) ?? 0) + 1);
      }

      const diet = r.answers['q5_dietary'];
      if (Array.isArray(diet)) {
        for (const item of diet) {
          dietaryCounts.set(item, (dietaryCounts.get(item) ?? 0) + 1);
        }
      }

      const sat = r.answers['q6_menu_satisfaction'];
      if (typeof sat === 'number') {
        ratingSum += sat;
        ratingCount += 1;
      }
    }

    const avgSpent = comboCount > 0 ? Math.round(totalSpent / comboCount) : 0;
    const avgSatisfaction = ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : '—';

    return {
      totalSpent,
      avgSpent,
      avgSatisfaction,
      foods: Array.from(foodCounts.values()).sort((a, b) => b.count - a.count),
      drinks: Array.from(drinkCounts.values()).sort((a, b) => b.count - a.count),
      sweetness: Array.from(sweetnessCounts.entries()).sort((a, b) => b[1] - a[1]),
      dietary: Array.from(dietaryCounts.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [responses]);

  function buildLineOrderText(): string {
    const lines: string[] = [
      'สวัสดีครับ/ค่ะ ขอสั่งจองเมนูอาหารและเครื่องดื่ม COFFEE SMITR (ล่วงหน้า 2 วัน)',
      `จำนวนผู้รับสิทธิ์ที่ส่งรายการแล้ว: ${responses.length} ท่าน (งบไม่เกิน ${survey.budgetLimitBaht} บาท/ท่าน)`,
      '',
      '【 รายการอาหาร 】',
      ...(metrics.foods.length > 0
        ? metrics.foods.map(
            (f, i) => `${i + 1}. ${f.name} × ${f.count} ที่ (${f.unitPrice * f.count} บาท)`
          )
        : ['- ยังไม่มีรายการอาหาร -']),
      '',
      '【 รายการเครื่องดื่ม 】',
      ...(metrics.drinks.length > 0
        ? metrics.drinks.map(
            (d, i) => `${i + 1}. ${d.name} × ${d.count} แก้ว (${d.unitPrice * d.count} บาท)`
          )
        : ['- ยังไม่มีรายการเครื่องดื่ม -']),
      '',
      `ยอดรวมสุทธิ (รวม VAT แล้ว): ${metrics.totalSpent.toLocaleString('th-TH')} บาท`,
      'หมายเหตุ: ขอออกใบกำกับภาษีด้วยครับ/ค่ะ',
    ];
    return lines.join('\n');
  }

  async function handleCopyLineOrder() {
    try {
      await navigator.clipboard.writeText(buildLineOrderText());
      setCopiedLineOrder(true);
      setTimeout(() => setCopiedLineOrder(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  }

  async function handleSeedClick() {
    setSeeding(true);
    try {
      await onSeedSample();
    } finally {
      setSeeding(false);
    }
  }

  if (responses.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-[#E2E6E3] rounded-2xl p-8 sm:p-12 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-[#F0F2F0] text-[#1B5E3F] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-serif text-2xl font-semibold text-[#161B18]">
              ยังไม่มีผู้ส่งแบบสำรวจเมนูอาหารและเครื่องดื่ม
            </h2>
            <p className="text-sm text-[#57605B]">
              เมื่อคณาจารย์และวิทยากรทั้ง {survey.roster.length} ท่านเลือกเมนูอาหารและเครื่องดื่มไม่เกิน{' '}
              {survey.budgetLimitBaht} บาทแล้ว หน้านี้จะสรุปว่าใครรับประทานอะไร และรวมรายการสำหรับนำไปส่งร้าน COFFEE SMITR (LINE OA @coffeesmitr) ด้วยตนเอง (ไม่มีการส่ง LINE อัตโนมัติ)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartSurvey}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>เริ่มเลือกเมนูในแบบสำรวจ</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                disabled={seeding}
                onClick={handleSeedClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#161B18] bg-white border border-[#DCE2DD] rounded-lg hover:border-[#BFC7C1] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#1B5E3F]" />
                <span>{seeding ? 'กำลังสร้างตัวอย่าง...' : 'โหลดข้อมูลตัวอย่าง (5 ท่าน)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Still show the 12-person roster status even at 0 responses */}
        <div className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[#161B18]">
              รายชื่อผู้มีสิทธิ์เลือกเมนู (0 / {survey.roster.length} ท่าน)
            </h3>
            <span className="text-xs text-[#57605B]">คลิกเพื่อเลือกเมนูแทนรายชื่อ</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {survey.roster.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onEditMemberSelection(m.id)}
                className="text-left p-3 rounded-lg border border-[#E6EAE7] hover:border-[#1B5E3F] transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#161B18] truncate">
                    <span className="font-mono tabular-nums text-xs text-[#57605B] mr-2">
                      {String(m.order).padStart(2, '0')}
                    </span>
                    {m.fullName}
                  </div>
                  <div className="text-xs text-[#57605B] mt-0.5">รอเลือกเมนู</div>
                </div>
                <span className="text-xs font-medium text-[#1B5E3F] shrink-0">เลือก →</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & LINE OA Copy CTA */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E2E6E3] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#57605B]">
            <span>สรุปยอดสั่งซื้อ COFFEE SMITR</span>
            <span aria-hidden="true">·</span>
            <span>LINE OA: @coffeesmitr</span>
            <span aria-hidden="true">·</span>
            <span>สั่งจองล่วงหน้า 2 วัน</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#161B18]">
            สรุปผลแบบสำรวจและใบสรุปยอดสั่งอาหาร–เครื่องดื่ม
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          <div className="flex items-center gap-1 p-1 bg-[#EAECEB] rounded-lg">
            <button
              type="button"
              onClick={() => setSubTab('summary')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'summary' ? 'bg-white text-[#161B18] shadow-xs' : 'text-[#57605B]'
              }`}
            >
              สรุปยอด &amp; 12 ท่าน
            </button>
            <button
              type="button"
              onClick={() => setSubTab('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'table' ? 'bg-white text-[#161B18] shadow-xs' : 'text-[#57605B]'
              }`}
            >
              รายการคำตอบ ({responses.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLineOrder}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors whitespace-nowrap shrink-0"
          >
            {copiedLineOrder ? (
              <>
                <ClipboardCheck className="w-4 h-4" />
                <span>คัดลอกรายการแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกรายการส่ง LINE (@coffeesmitr)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {subTab === 'table' ? (
        <ResponsesTableView
          survey={survey}
          responses={responses}
          isAdmin={isAdmin}
          onDeleteResponse={onDeleteResponse}
          onClearAll={onClearAll}
        />
      ) : (
        <>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E6E3] rounded-xl p-5">
          <div className="text-xs text-[#57605B]">ส่งแบบสำรวจแล้ว</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#161B18] mt-1">
            {responseByMemberId.size} / {survey.roster.length}
            <span className="text-sm font-normal text-[#57605B] ml-1">ท่าน</span>
          </div>
          <div className="text-xs text-[#1B5E3F] mt-1">
            ทั้งหมด {responses.length} รายการ
          </div>
        </div>

        <div className="bg-white border border-[#E2E6E3] rounded-xl p-5">
          <div className="text-xs text-[#57605B]">ยอดสั่งรวมสุทธิ (รวม VAT)</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#161B18] mt-1">
            {metrics.totalSpent.toLocaleString('th-TH')}
            <span className="text-sm font-normal text-[#57605B] ml-1">บาท</span>
          </div>
          <div className="text-xs text-[#57605B] mt-1">ออกใบกำกับภาษีได้</div>
        </div>

        <div className="bg-white border border-[#E2E6E3] rounded-xl p-5">
          <div className="text-xs text-[#57605B]">ค่าใช้จ่ายเฉลี่ยต่อท่าน</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#161B18] mt-1">
            {metrics.avgSpent}
            <span className="text-sm font-normal text-[#57605B] ml-1">/ {survey.budgetLimitBaht}฿</span>
          </div>
          <div className="text-xs text-[#1B5E3F] mt-1">คุมงบไม่เกิน {survey.budgetLimitBaht} บาท</div>
        </div>

        <div className="bg-white border border-[#E2E6E3] rounded-xl p-5">
          <div className="text-xs text-[#57605B]">ความหวานยอดนิยม</div>
          <div className="text-lg font-semibold text-[#161B18] mt-1.5 truncate">
            {metrics.sweetness[0]?.[0] ?? '—'}
          </div>
          <div className="text-xs text-[#57605B] mt-1 font-mono tabular-nums">
            {metrics.sweetness[0] ? `${metrics.sweetness[0][1]} ท่านเลือก` : 'รอข้อมูล'}
          </div>
        </div>
      </div>

      {/* 12-Person Roster Status Table */}
      <section className="bg-white border border-[#E2E6E3] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E6E3] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-[#161B18]">
              สรุปว่าใครรับประทานอะไร (รายบุคคล {survey.roster.length} ท่าน)
            </h3>
            <p className="text-xs text-[#57605B]">
              แสดงเมนูอาหาร เครื่องดื่ม ระดับความหวาน และยอดรวมของแต่ละท่าน
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#57605B]">
            เลือกแล้ว {responseByMemberId.size} · รอเลือก{' '}
            {Math.max(0, survey.roster.length - responseByMemberId.size)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8F7] border-b border-[#E2E6E3] text-xs font-medium text-[#57605B]">
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">รายชื่อ</th>
                <th className="py-2.5 px-4">สถานะ</th>
                <th className="py-2.5 px-4">อาหารที่เลือก</th>
                <th className="py-2.5 px-4">เครื่องดื่ม &amp; ความหวาน</th>
                <th className="py-2.5 px-4 text-right">รวม (บาท)</th>
                <th className="py-2.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF1EE] text-sm">
              {survey.roster.map((member) => {
                const record = responseByMemberId.get(member.id);
                const combo =
                  record && isComboSelection(record.answers['q2_menu_combo'])
                    ? record.answers['q2_menu_combo']
                    : null;
                const sweetness =
                  record && typeof record.answers['q3_sweetness'] === 'string'
                    ? record.answers['q3_sweetness']
                    : '';

                return (
                  <tr key={member.id} className="hover:bg-[#F7F8F7]/60 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#57605B]">
                      {String(member.order).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#161B18] whitespace-nowrap">
                      {member.fullName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {record ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1B5E3F]">
                          <Check className="w-3.5 h-3.5" /> เลือกแล้ว
                        </span>
                      ) : (
                        <span className="text-xs text-[#57605B]">รอเลือกเมนู</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#161B18]">
                      {combo?.foodName || <span className="text-[#9CA39E]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#161B18]">
                      {combo?.drinkName ? (
                        <div>
                          <span>
                            {combo.drinkName} ({combo.drinkTemp})
                          </span>
                          {sweetness && (
                            <span className="text-[#57605B]"> · {sweetness}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#9CA39E]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#161B18]">
                      {combo ? `${combo.totalPrice}฿` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditMemberSelection(member.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#1B5E3F] hover:underline"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{record ? 'แก้ไข' : 'เลือกเมนู'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Consolidated Order Counts: Food & Drink */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF1EE] pb-3">
            <h3 className="text-base font-semibold text-[#161B18]">สรุปยอดสั่งอาหารแยกตามเมนู</h3>
            <span className="font-mono tabular-nums text-xs text-[#57605B]">
              รวม {metrics.foods.reduce((acc, f) => acc + f.count, 0)} ที่
            </span>
          </div>
          {metrics.foods.length === 0 ? (
            <p className="text-sm text-[#57605B]">ยังไม่มีรายการอาหาร</p>
          ) : (
            <div className="space-y-3">
              {metrics.foods.map((item) => {
                const maxCount = metrics.foods[0]?.count || 1;
                const widthPct = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-[#161B18] font-medium truncate">{item.name}</span>
                      <span className="font-mono tabular-nums text-xs text-[#161B18] shrink-0">
                        × {item.count} ({item.unitPrice * item.count}฿)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0F2F0] overflow-hidden">
                      <div
                        className="h-full bg-[#1B5E3F] rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EEF1EE] pb-3">
            <h3 className="text-base font-semibold text-[#161B18]">สรุปยอดสั่งเครื่องดื่มแยกตามเมนู</h3>
            <span className="font-mono tabular-nums text-xs text-[#57605B]">
              รวม {metrics.drinks.reduce((acc, d) => acc + d.count, 0)} แก้ว
            </span>
          </div>
          {metrics.drinks.length === 0 ? (
            <p className="text-sm text-[#57605B]">ยังไม่มีรายการเครื่องดื่ม</p>
          ) : (
            <div className="space-y-3">
              {metrics.drinks.map((item) => {
                const maxCount = metrics.drinks[0]?.count || 1;
                const widthPct = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-[#161B18] font-medium truncate">{item.name}</span>
                      <span className="font-mono tabular-nums text-xs text-[#161B18] shrink-0">
                        × {item.count} ({item.unitPrice * item.count}฿)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F0F2F0] overflow-hidden">
                      <div
                        className="h-full bg-[#1B5E3F] rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sweetness & Dietary Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#161B18]">สัดส่วนระดับความหวาน</h3>
          <div className="space-y-2.5">
            {metrics.sweetness.map(([label, count]) => {
              const pct = Math.round((count / responses.length) * 100);
              return (
                <div key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#161B18]">{label}</span>
                  <span className="font-mono tabular-nums text-xs text-[#57605B]">
                    {count} ท่าน ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-[#161B18]">ข้อจำกัดด้านอาหาร / แพ้อาหาร</h3>
          {metrics.dietary.length === 0 ? (
            <p className="text-sm text-[#57605B]">ไม่มีข้อจำกัดเพิ่มเติม</p>
          ) : (
            <div className="space-y-2.5">
              {metrics.dietary.map(([label, count]) => (
                <div key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#161B18]">{label}</span>
                  <span className="font-mono tabular-nums text-xs text-[#57605B]">{count} ท่าน</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Manual LINE OA @coffeesmitr Order Summary Box */}
      <section className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF1EE] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#161B18]">
              สรุปรายการสำหรับส่งให้ร้าน COFFEE SMITR (LINE OA @coffeesmitr)
            </h3>
            <p className="text-xs text-[#57605B] mt-0.5">
              ระบบไม่ได้ส่ง LINE ให้อัตโนมัติ ท่านสามารถตรวจสอบและคัดลอกข้อความด้านล่างไปส่งที่ LINE OA @coffeesmitr ได้ด้วยตนเอง
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyLineOrder}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            {copiedLineOrder ? (
              <>
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>คัดลอกข้อความแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกข้อความนี้</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 bg-[#F7F8F7] border border-[#E2E6E3] rounded-xl text-xs sm:text-sm text-[#161B18] font-sans whitespace-pre-wrap leading-relaxed">
          {buildLineOrderText()}
        </pre>
      </section>
        </>
      )}
    </div>
  );
}
