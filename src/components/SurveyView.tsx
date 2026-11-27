import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Star,
  UserCheck,
  Users,
} from 'lucide-react';
import { formatComboSummary, HERO_CULINARY_IMAGE } from '../data/defaultSurvey.ts';
import { submitSurveyResponseDirect } from '../services/surveyStorage.ts';
import type {
  AnswerValue,
  MenuComboSelection,
  RosterMember,
  SurveyQuestion,
  SurveyResponseRecord,
  SurveySchema,
} from '../types/survey.ts';
import { MenuComboPicker } from './MenuComboPicker.tsx';
import { ResilientImage } from './ResilientImage.tsx';

interface SurveyViewProps {
  survey: SurveySchema;
  responses: SurveyResponseRecord[];
  preselectedMemberId: string | null;
  preselectedComboPatch: Partial<MenuComboSelection> | null;
  onConsumePreselect: () => void;
  onSubmitted: (record: SurveyResponseRecord) => void;
  onNavigateAnalytics: () => void;
  onNavigateMenu: () => void;
}

const DRAFT_STORAGE_KEY = 'coffeesmitr_survey_draft_v2';

const DEFAULT_COMBO: MenuComboSelection = {
  foodId: null,
  foodName: null,
  foodPrice: 0,
  drinkId: null,
  drinkName: null,
  drinkTemp: null,
  drinkBasePrice: 0,
  drinkAddons: [],
  drinkAddonsPrice: 0,
  totalPrice: 0,
};

function isComboValue(val: unknown): val is MenuComboSelection {
  return typeof val === 'object' && val !== null && 'totalPrice' in val;
}

export function SurveyView({
  survey,
  responses,
  preselectedMemberId,
  preselectedComboPatch,
  onConsumePreselect,
  onSubmitted,
  onNavigateAnalytics,
  onNavigateMenu,
}: SurveyViewProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [useCustomName, setUseCustomName] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { answers?: Record<string, AnswerValue> };
        return parsed.answers ?? {};
      }
    } catch {
      // ignore storage errors
    }
    return {};
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<SurveyResponseRecord | null>(null);

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

  const activeSections = useMemo(() => {
    return survey.sections.filter((sec) =>
      survey.questions.some((q) => q.active && q.sectionId === sec.id)
    );
  }, [survey]);

  const currentSection = activeSections[stepIndex] ?? activeSections[0];
  const currentQuestions = useMemo(
    () =>
      survey.questions.filter(
        (q) => q.active && currentSection && q.sectionId === currentSection.id
      ),
    [survey.questions, currentSection]
  );

  // Save draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ answers }));
    } catch {
      // ignore storage errors
    }
  }, [answers]);

  // Handle preselection from Analytics ("เลือกแทน / แก้ไข") or Menu Catalog ("เลือกเมนูนี้")
  useEffect(() => {
    if (!preselectedMemberId && !preselectedComboPatch) return;

    if (preselectedMemberId) {
      setSubmittedReceipt(null);
      setUseCustomName(false);
      setSelectedMemberId(preselectedMemberId);
      const existing = responseByMemberId.get(preselectedMemberId);
      if (existing) {
        setAnswers(existing.answers);
      }
      setStepIndex(0);
    }

    if (preselectedComboPatch) {
      setSubmittedReceipt(null);
      setAnswers((prev) => {
        const existingCombo = isComboValue(prev['q2_menu_combo'])
          ? prev['q2_menu_combo']
          : DEFAULT_COMBO;
        const merged: MenuComboSelection = {
          ...existingCombo,
          ...preselectedComboPatch,
        };
        merged.totalPrice =
          merged.foodPrice + merged.drinkBasePrice + merged.drinkAddonsPrice;
        return {
          ...prev,
          q2_menu_combo: merged,
        };
      });
      const comboStepIdx = activeSections.findIndex((s) => s.id === 'sec-combo');
      if (comboStepIdx >= 0) setStepIndex(comboStepIdx);
    }

    onConsumePreselect();
  }, [preselectedMemberId, preselectedComboPatch, responseByMemberId, activeSections, onConsumePreselect]);

  const selectedMember: RosterMember | undefined = survey.roster.find(
    (m) => m.id === selectedMemberId
  );

  const activeRespondentName = useCustomName
    ? customName.trim()
    : selectedMember?.fullName ?? '';

  function handleSelectRosterMember(member: RosterMember) {
    setUseCustomName(false);
    setSelectedMemberId(member.id);
    setValidationError(null);
    const existing = responseByMemberId.get(member.id);
    if (existing) {
      setAnswers(existing.answers);
    }
  }

  function updateAnswer(questionId: string, val: AnswerValue) {
    setValidationError(null);
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  }

  function toggleMultiOption(questionId: string, label: string) {
    setValidationError(null);
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const exists = current.includes(label);
      const next = exists ? current.filter((item) => item !== label) : [...current, label];
      return { ...prev, [questionId]: next };
    });
  }

  function validateStep(idx: number): string | null {
    const sec = activeSections[idx];
    if (!sec) return null;

    if (idx === 0 && !activeRespondentName) {
      return 'กรุณาเลือกรายชื่อของท่านจากรายการ 12 ท่าน (หรือระบุชื่อผู้รับสิทธิ์) ก่อนดำเนินการต่อ';
    }

    const qs = survey.questions.filter((q) => q.active && q.sectionId === sec.id);
    for (const q of qs) {
      const val = answers[q.id];
      if (q.type === 'menu-combo') {
        const combo = isComboValue(val) ? val : null;
        if (q.required && (!combo || (!combo.foodId && !combo.drinkId))) {
          return 'กรุณาเลือกเมนูอาหารหรือเครื่องดื่มอย่างน้อย 1 รายการ';
        }
        if (combo && combo.totalPrice > survey.budgetLimitBaht) {
          return `ยอดรวมเมนูที่เลือก (${combo.totalPrice} บาท) เกินงบประมาณ ${survey.budgetLimitBaht} บาท กรุณาปรับเมนูให้อยู่ในงบ`;
        }
      } else if (q.required) {
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && val.trim() === '') ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          return `กรุณาตอบคำถาม: ${q.title}`;
        }
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(stepIndex);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setStepIndex((prev) => Math.min(activeSections.length - 1, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePrev() {
    setValidationError(null);
    setStepIndex((prev) => Math.max(0, prev - 1));
  }

  async function handleSubmit() {
    for (let i = 0; i < activeSections.length; i++) {
      const err = validateStep(i);
      if (err) {
        setStepIndex(i);
        setValidationError(err);
        return;
      }
    }

    setSubmitting(true);
    setValidationError(null);
    try {
      const { record } = await submitSurveyResponseDirect(survey, responses, {
        respondentId: useCustomName ? undefined : selectedMemberId || undefined,
        respondentName: activeRespondentName,
        answers,
      });

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
      setSubmittedReceipt(record);
      onSubmitted(record);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setValidationError('ไม่สามารถบันทึกคำตอบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  }

  function handleResetForm() {
    setAnswers({});
    setSelectedMemberId('');
    setCustomName('');
    setUseCustomName(false);
    setStepIndex(0);
    setValidationError(null);
    setSubmittedReceipt(null);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function renderQuestionInput(q: SurveyQuestion) {
    const val = answers[q.id];

    if (q.type === 'image-choice') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(q.options ?? []).map((opt) => {
            const isSelected = val === opt.label;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateAnswer(q.id, opt.label)}
                className={`group text-left rounded-xl border overflow-hidden transition-all flex flex-col ${
                  isSelected
                    ? 'border-[#1B5E3F] ring-2 ring-[#1B5E3F]/20 bg-white'
                    : 'border-[#E2E6E3] bg-white hover:border-[#B8C2BB]'
                }`}
              >
                <div className="aspect-square w-full overflow-hidden bg-[#F7F8F7]">
                  <ResilientImage
                    src={opt.imageUrl}
                    alt={opt.label}
                    fallbackLabel={opt.label}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-base font-semibold text-[#161B18] leading-snug">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#1B5E3F] shrink-0 mt-1" strokeWidth={2.5} />
                      )}
                    </div>
                    {opt.description && (
                      <p className="text-xs sm:text-sm text-[#57605B] mt-1.5 leading-relaxed">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'menu-combo') {
      const comboVal = isComboValue(val) ? val : DEFAULT_COMBO;
      return (
        <MenuComboPicker
          budgetLimit={survey.budgetLimitBaht}
          value={comboVal}
          onChange={(next) => updateAnswer(q.id, next)}
        />
      );
    }

    if (q.type === 'single-choice') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(q.options ?? []).map((opt) => {
            const isSelected = val === opt.label;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateAnswer(q.id, opt.label)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[#1B5E3F] bg-[#1B5E3F]/5 text-[#161B18] font-medium'
                    : 'border-[#E2E6E3] bg-white text-[#161B18] hover:border-[#BFC7C1]'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#1B5E3F] bg-[#1B5E3F]' : 'border-[#BFC7C1]'
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'multi-choice') {
      const selectedArr = Array.isArray(val) ? (val as string[]) : [];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(q.options ?? []).map((opt) => {
            const checked = selectedArr.includes(opt.label);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleMultiOption(q.id, opt.label)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 ${
                  checked
                    ? 'border-[#1B5E3F] bg-[#1B5E3F]/5 text-[#161B18] font-medium'
                    : 'border-[#E2E6E3] bg-white text-[#161B18] hover:border-[#BFC7C1]'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    checked ? 'border-[#1B5E3F] bg-[#1B5E3F] text-white' : 'border-[#BFC7C1]'
                  }`}
                >
                  {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'rating') {
      const max = q.maxRating ?? 5;
      const numericVal = typeof val === 'number' ? val : 0;
      return (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: max }, (_, idx) => idx + 1).map((score) => {
            const active = numericVal >= score;
            return (
              <button
                key={score}
                type="button"
                onClick={() => updateAnswer(q.id, score)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-mono tabular-nums transition-colors ${
                  numericVal === score
                    ? 'border-[#1B5E3F] bg-[#1B5E3F] text-white'
                    : active
                      ? 'border-[#1B5E3F]/40 bg-[#1B5E3F]/10 text-[#1B5E3F]'
                      : 'border-[#E2E6E3] bg-white text-[#57605B] hover:border-[#BFC7C1]'
                }`}
              >
                <Star className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
                <span>{score}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (q.type === 'scale-10') {
      const numericVal = typeof val === 'number' ? val : -1;
      return (
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, n) => n).map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => updateAnswer(q.id, score)}
              className={`py-2.5 rounded-lg border text-sm font-mono tabular-nums transition-colors ${
                numericVal === score
                  ? 'border-[#1B5E3F] bg-[#1B5E3F] text-white font-semibold'
                  : 'border-[#E2E6E3] bg-white text-[#161B18] hover:border-[#BFC7C1]'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'short-text') {
      return (
        <input
          type="text"
          value={typeof val === 'string' ? val : ''}
          onChange={(e) => updateAnswer(q.id, e.target.value)}
          placeholder={q.placeholder || 'พิมพ์คำตอบของท่าน...'}
          className="w-full px-4 py-2.5 text-sm bg-white border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
        />
      );
    }

    return (
      <textarea
        rows={3}
        value={typeof val === 'string' ? val : ''}
        onChange={(e) => updateAnswer(q.id, e.target.value)}
        placeholder={q.placeholder || 'พิมพ์ข้อความเพิ่มเติม...'}
        className="w-full px-4 py-3 text-sm bg-white border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
      />
    );
  }

  // Receipt Confirmation View
  if (submittedReceipt) {
    const combo = isComboValue(submittedReceipt.answers['q2_menu_combo'])
      ? submittedReceipt.answers['q2_menu_combo']
      : undefined;
    const sweetness = submittedReceipt.answers['q3_sweetness'];
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#DCE2DD] rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#1B5E3F]/10 text-[#1B5E3F] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-[#57605B] font-mono tabular-nums">
              รหัสอ้างอิง {submittedReceipt.id} ·{' '}
              {new Date(submittedReceipt.submittedAt).toLocaleString('th-TH')}
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#161B18]">
              บันทึกการเลือกเมนูเรียบร้อยแล้ว
            </h2>
            <p className="text-sm text-[#57605B]">
              ขอบคุณ{' '}
              <strong className="text-[#161B18]">{submittedReceipt.respondentName}</strong>{' '}
              ระบบได้บันทึกรายการอาหารและเครื่องดื่มของท่านเข้าสู่รายการสั่งรวมแล้ว
            </p>
          </div>
        </div>

        <div className="bg-[#F7F8F7] border border-[#E2E6E3] rounded-xl p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#E2E6E3] pb-3">
            <span className="text-[#57605B]">ชุดเมนูที่เลือก</span>
            <span className="font-mono tabular-nums font-semibold text-[#1B5E3F]">
              {combo ? `${combo.totalPrice} / ${survey.budgetLimitBaht} บาท` : '-'}
            </span>
          </div>
          <div className="space-y-1.5 text-[#161B18]">
            <div>
              <span className="text-[#57605B]">อาหาร: </span>
              <strong className="font-medium">{combo?.foodName || 'ไม่รับอาหาร'}</strong>
            </div>
            <div>
              <span className="text-[#57605B]">เครื่องดื่ม: </span>
              <strong className="font-medium">
                {combo?.drinkName
                  ? `${combo.drinkName} (${combo.drinkTemp})${
                      combo.drinkAddons.length ? ` + ${combo.drinkAddons.join(', ')}` : ''
                    }`
                  : 'ไม่รับเครื่องดื่ม'}
              </strong>
            </div>
            {typeof sweetness === 'string' && (
              <div>
                <span className="text-[#57605B]">ระดับความหวาน: </span>
                <strong className="font-medium">{sweetness}</strong>
              </div>
            )}
            {submittedReceipt.sheetSync?.attempted && (
              <div className="pt-2 border-t border-[#E2E6E3] text-xs">
                <span className="text-[#57605B]">สถานะ Google Sheet: </span>
                <strong
                  className={
                    submittedReceipt.sheetSync.synced ? 'text-[#1B5E3F]' : 'text-red-700'
                  }
                >
                  {submittedReceipt.sheetSync.message}
                </strong>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateAnalytics}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors whitespace-nowrap"
          >
            ดูสรุปรายชื่อทั้งหมด ({responses.length} / {survey.roster.length} ท่าน)
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="px-5 py-2.5 text-sm font-medium text-[#161B18] bg-white border border-[#DCE2DD] rounded-lg hover:border-[#BFC7C1] transition-colors whitespace-nowrap"
          >
            เลือกเมนูให้ท่านถัดไป
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Editorial Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch bg-white border border-[#E2E6E3] rounded-2xl overflow-hidden">
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#57605B]">
              <span>COFFEE SMITR · LINE OA @coffeesmitr</span>
              <span aria-hidden="true">·</span>
              <span>งบประมาณไม่เกิน {survey.budgetLimitBaht} บาท/ท่าน</span>
              <span aria-hidden="true">·</span>
              <span>ราคารวม VAT แล้ว</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#161B18] leading-tight [text-wrap:balance]">
              {survey.title}
            </h1>
            <p className="text-sm sm:text-base text-[#57605B] leading-relaxed max-w-2xl">
              {survey.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#EEF1EE]">
            <div className="flex items-center gap-6 text-xs text-[#57605B]">
              <div>
                <div className="text-[#57605B]">ความคืบหน้ารายชื่อ</div>
                <div className="font-mono tabular-nums text-base font-semibold text-[#161B18] mt-0.5">
                  {responseByMemberId.size} / {survey.roster.length} ท่าน
                </div>
              </div>
              <div className="h-8 w-px bg-[#E2E6E3]" />
              <div>
                <div className="text-[#57605B]">เงื่อนไขการสั่งจอง</div>
                <div className="text-sm font-medium text-[#161B18] mt-0.5">
                  สั่งล่วงหน้า 2 วัน · ออกใบกำกับภาษีได้
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateMenu}
              className="text-xs font-medium text-[#1B5E3F] hover:underline whitespace-nowrap shrink-0"
            >
              ดูเมนูทั้งหมดและเซตแนะนำ ≤ 150฿ →
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 relative h-60 sm:h-64 lg:h-auto lg:min-h-[280px] bg-[#EEF1EE] overflow-hidden">
          <ResilientImage
            src={HERO_CULINARY_IMAGE}
            alt="ชุดอาหารและเครื่องดื่มสำหรับแบบสำรวจ COFFEE SMITR"
            className="w-full h-full lg:absolute lg:inset-0 object-cover object-[50%_15%]"
          />
        </div>
      </section>

      {/* Stepper Bar */}
      <div className="bg-white border border-[#E2E6E3] rounded-xl p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {activeSections.map((sec, idx) => {
            const isCurrent = idx === stepIndex;
            const isPast = idx < stepIndex;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setStepIndex(idx);
                }}
                className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors flex items-center gap-3 ${
                  isCurrent
                    ? 'border-[#1B5E3F] bg-[#1B5E3F]/5'
                    : isPast
                      ? 'border-[#DCE2DD] bg-[#F7F8F7]'
                      : 'border-transparent hover:bg-[#F7F8F7]'
                }`}
              >
                <span
                  className={`font-mono tabular-nums text-xs font-semibold w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-[#1B5E3F] text-white'
                      : isPast
                        ? 'bg-[#1B5E3F]/15 text-[#1B5E3F]'
                        : 'bg-[#EAECEB] text-[#57605B]'
                  }`}
                >
                  {sec.numberLabel}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#161B18] truncate">{sec.title}</div>
                  <div className="text-[11px] text-[#57605B] truncate">{sec.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Section Card */}
      <section className="bg-white border border-[#E2E6E3] rounded-2xl p-6 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF1EE] pb-5">
          <div>
            <div className="text-xs font-mono tabular-nums text-[#1B5E3F] font-medium">
              ขั้นตอนที่ {currentSection?.numberLabel} จาก 0{activeSections.length}
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#161B18] mt-1">
              {currentSection?.title}
            </h2>
            <p className="text-sm text-[#57605B] mt-0.5">{currentSection?.subtitle}</p>
          </div>

          {activeRespondentName && (
            <div className="inline-flex items-center gap-2 text-xs text-[#161B18] bg-[#F7F8F7] border border-[#DCE2DD] px-3 py-2 rounded-lg self-start shrink-0">
              <UserCheck className="w-4 h-4 text-[#1B5E3F]" />
              <span>
                ผู้เลือก: <strong className="font-semibold">{activeRespondentName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Step 0 includes the 12-Person Roster Selector */}
        {stepIndex === 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-[#161B18] inline-flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1B5E3F]" />
                  <span>รายชื่อผู้รับสิทธิ์อาหารและเครื่องดื่ม (12 ท่าน)</span>
                  <span className="text-red-700 text-xs font-normal">* จำเป็น</span>
                </h3>
                <p className="text-xs text-[#57605B] mt-0.5">
                  คลิกเลือกรายชื่อของท่าน (หากเลือกแล้วสามารถคลิกเพื่อแก้ไขรายการได้)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseCustomName((prev) => !prev);
                  setSelectedMemberId('');
                  setValidationError(null);
                }}
                className="text-xs font-medium text-[#1B5E3F] hover:underline self-start sm:self-auto whitespace-nowrap shrink-0"
              >
                {useCustomName ? 'กลับไปเลือกรายชื่อ 12 ท่าน' : '+ ระบุชื่อเพิ่มเติม (นอกรายชื่อ)'}
              </button>
            </div>

            {!useCustomName ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {survey.roster.map((member) => {
                  const isSelected = selectedMemberId === member.id;
                  const existing = responseByMemberId.get(member.id);
                  const existingCombo =
                    existing && isComboValue(existing.answers['q2_menu_combo'])
                      ? existing.answers['q2_menu_combo']
                      : undefined;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectRosterMember(member)}
                      className={`text-left p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#1B5E3F] bg-[#1B5E3F]/5 ring-1 ring-[#1B5E3F]/20'
                          : existing
                            ? 'border-[#DCE2DD] bg-[#F7F8F7] hover:border-[#BFC7C1]'
                            : 'border-[#E6EAE7] bg-white hover:border-[#1B5E3F]/60'
                      }`}
                    >
                      <span
                        className={`font-mono tabular-nums text-xs font-semibold w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#1B5E3F] text-white'
                            : existing
                              ? 'bg-[#1B5E3F]/15 text-[#1B5E3F]'
                              : 'bg-[#F0F2F0] text-[#57605B]'
                        }`}
                      >
                        {String(member.order).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#161B18] leading-snug">
                          {member.fullName}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs">
                          {existing ? (
                            <span className="text-[#1B5E3F] font-medium inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              เลือกแล้ว
                              {existingCombo ? ` (${existingCombo.totalPrice}฿)` : ''}
                            </span>
                          ) : (
                            <span className="text-[#57605B]">รอเลือกเมนู</span>
                          )}
                          {member.role === 'วิทยากร' && (
                            <>
                              <span aria-hidden="true" className="text-[#BFC7C1]">·</span>
                              <span className="text-[#57605B]">วิทยากร</span>
                            </>
                          )}
                        </div>
                        {existingCombo && (
                          <div className="text-[11px] text-[#57605B] mt-1 truncate">
                            {formatComboSummary(existingCombo)}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="max-w-md">
                <label className="block text-xs font-medium text-[#57605B] mb-1.5">
                  ระบุชื่อ-นามสกุลผู้รับสิทธิ์
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    setValidationError(null);
                    setCustomName(e.target.value);
                  }}
                  placeholder="เช่น อาจารย์... / คุณ..."
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
                />
              </div>
            )}
          </div>
        )}

        {/* Questions in this Section */}
        <div className="space-y-8">
          {currentQuestions.map((q, qIdx) => (
            <div key={q.id} className="space-y-3 pt-6 border-t border-[#F0F2F0] first:border-t-0 first:pt-0">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-[#161B18] leading-snug">
                    <span className="font-mono tabular-nums text-[#57605B] mr-2">
                      {currentSection?.numberLabel}.{qIdx + 1}
                    </span>
                    {q.title}
                    {q.required && <span className="text-red-700 text-xs font-normal ml-2">* จำเป็น</span>}
                  </h3>
                </div>
                {q.helperText && <p className="text-xs text-[#57605B]">{q.helperText}</p>}
              </div>

              {renderQuestionInput(q)}
            </div>
          ))}
        </div>

        {/* Inline Validation Alert */}
        {validationError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
          >
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#E2E6E3]">
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#161B18] bg-white border border-[#DCE2DD] rounded-lg hover:border-[#BFC7C1] transition-colors whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" />
                ย้อนกลับ
              </button>
            )}
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[#57605B] hover:text-[#161B18] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างแบบฟอร์ม
            </button>
          </div>

          {stepIndex < activeSections.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors whitespace-nowrap"
            >
              <span>ถัดไป</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'กำลังบันทึก...' : 'ส่งรายการเมนูที่เลือก'}</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
