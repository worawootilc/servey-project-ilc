import { useState } from 'react';
import { Check, Plus, RotateCcw, Save, Trash2, Users } from 'lucide-react';
import type { QuestionType, RosterMember, SurveyQuestion, SurveySchema } from '../types/survey.ts';

interface BuilderViewProps {
  survey: SurveySchema;
  onSaveSurvey: (updated: SurveySchema) => Promise<void>;
  onResetSurvey: () => Promise<void>;
}

export function BuilderView({ survey, onSaveSurvey, onResetSurvey }: BuilderViewProps) {
  const [draft, setDraft] = useState<SurveySchema>(() => structuredClone(survey));
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'คณาจารย์ / บุคลากร' | 'วิทยากร'>(
    'คณาจารย์ / บุคลากร'
  );
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('single-choice');
  const [newQuestionOptions, setNewQuestionOptions] = useState('ตัวเลือกที่ 1, ตัวเลือกที่ 2');

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveSurvey(draft);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      await onResetSurvey();
    } finally {
      setSaving(false);
    }
  }

  function handleAddMember() {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    const nextMember: RosterMember = {
      id: `member-${Date.now().toString(36)}`,
      order: draft.roster.length + 1,
      fullName: trimmed,
      role: newMemberRole,
    };
    setDraft((prev) => ({
      ...prev,
      roster: [...prev.roster, nextMember],
    }));
    setNewMemberName('');
  }

  function handleRemoveMember(id: string) {
    setDraft((prev) => ({
      ...prev,
      roster: prev.roster
        .filter((m) => m.id !== id)
        .map((m, idx) => ({ ...m, order: idx + 1 })),
    }));
  }

  function toggleQuestionField(id: string, field: 'active' | 'required') {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: !q[field] } : q
      ),
    }));
  }

  function removeQuestion(id: string) {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  }

  function handleAddQuestion() {
    const title = newQuestionTitle.trim();
    if (!title) return;
    const options =
      newQuestionType === 'single-choice' || newQuestionType === 'multi-choice'
        ? newQuestionOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((label, idx) => ({ id: `opt-${Date.now()}-${idx}`, label }))
        : undefined;

    const nextQ: SurveyQuestion = {
      id: `q_custom_${Date.now().toString(36)}`,
      sectionId: draft.sections[draft.sections.length - 1]?.id ?? 'sec-preferences',
      type: newQuestionType,
      title,
      required: false,
      active: true,
      options,
    };

    setDraft((prev) => ({
      ...prev,
      questions: [...prev.questions, nextQ],
    }));
    setNewQuestionTitle('');
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E6E3] pb-5">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#161B18]">
            ตั้งค่าแบบสำรวจ รายชื่อ และคำถาม
          </h2>
          <p className="text-sm text-[#57605B] mt-0.5">
            ปรับงบประมาณต่อท่าน เพิ่มหรือแก้ไขรายชื่อผู้รับสิทธิ์ และจัดการคำถามในแบบสำรวจ
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#57605B] bg-white border border-[#DCE2DD] rounded-lg hover:text-[#161B18] transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors whitespace-nowrap"
          >
            {savedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>บันทึกการตั้งค่าแล้ว</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* General Settings */}
      <section className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-[#161B18]">ข้อมูลทั่วไปและงบประมาณ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#57605B] mb-1">ชื่อแบบสำรวจ</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#57605B] mb-1">
              งบประมาณสูงสุด (บาท/ท่าน)
            </label>
            <input
              type="number"
              min={50}
              max={1000}
              value={draft.budgetLimitBaht}
              onChange={(e) =>
                setDraft({ ...draft, budgetLimitBaht: Math.max(50, Number(e.target.value) || 150) })
              }
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#57605B] mb-1">คำอธิบายแบบสำรวจ</label>
          <textarea
            rows={2}
            value={draft.subtitle}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
            className="w-full px-3.5 py-2 text-sm bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
          />
        </div>
      </section>

      {/* Roster Manager */}
      <section className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#161B18] inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1B5E3F]" />
            <span>รายชื่อผู้มีสิทธิ์เลือกเมนู ({draft.roster.length} ท่าน)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {draft.roster.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#F7F8F7] border border-[#E2E6E3] rounded-lg"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#161B18] truncate">
                  <span className="font-mono tabular-nums text-xs text-[#57605B] mr-2">
                    {String(m.order).padStart(2, '0')}
                  </span>
                  {m.fullName}
                </div>
                <div className="text-[11px] text-[#57605B]">{m.role}</div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveMember(m.id)}
                className="p-1.5 text-[#57605B] hover:text-red-700 rounded"
                title="ลบรายชื่อ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#EEF1EE]">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="เพิ่มรายชื่อใหม่ เช่น อาจารย์..."
            className="flex-1 px-3.5 py-2 text-sm bg-white border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
          />
          <select
            value={newMemberRole}
            onChange={(e) =>
              setNewMemberRole(e.target.value as 'คณาจารย์ / บุคลากร' | 'วิทยากร')
            }
            className="px-3 py-2 text-sm bg-white border border-[#DCE2DD] rounded-lg"
          >
            <option value="คณาจารย์ / บุคลากร">คณาจารย์ / บุคลากร</option>
            <option value="วิทยากร">วิทยากร</option>
          </select>
          <button
            type="button"
            onClick={handleAddMember}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มรายชื่อ</span>
          </button>
        </div>
      </section>

      {/* Questions Manager */}
      <section className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-5">
        <h3 className="text-base font-semibold text-[#161B18]">
          รายการคำถามในแบบสำรวจ ({draft.questions.length} ข้อ)
        </h3>

        <div className="space-y-2.5">
          {draft.questions.map((q, idx) => (
            <div
              key={q.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E2E6E3] bg-[#FAFBFA]"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs text-[#57605B] font-mono tabular-nums">
                  ข้อ {idx + 1} · {q.type}
                </div>
                <div className="text-sm font-medium text-[#161B18]">{q.title}</div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.active}
                    onChange={() => toggleQuestionField(q.id, 'active')}
                    className="accent-[#1B5E3F]"
                  />
                  <span>แสดงผล</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={() => toggleQuestionField(q.id, 'required')}
                    className="accent-[#1B5E3F]"
                  />
                  <span>จำเป็น</span>
                </label>
                {q.type !== 'menu-combo' && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-1.5 text-[#57605B] hover:text-red-700"
                    title="ลบคำถาม"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Question */}
        <div className="pt-4 border-t border-[#EEF1EE] space-y-3">
          <div className="text-xs font-semibold text-[#161B18]">เพิ่มคำถามใหม่</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newQuestionTitle}
              onChange={(e) => setNewQuestionTitle(e.target.value)}
              placeholder="หัวข้อคำถาม..."
              className="md:col-span-2 px-3.5 py-2 text-sm bg-white border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
            />
            <select
              value={newQuestionType}
              onChange={(e) => setNewQuestionType(e.target.value as QuestionType)}
              className="px-3 py-2 text-sm bg-white border border-[#DCE2DD] rounded-lg"
            >
              <option value="single-choice">เลือกตอบ 1 ข้อ</option>
              <option value="multi-choice">เลือกตอบหลายข้อ</option>
              <option value="rating">ให้คะแนน 1–5</option>
              <option value="short-text">ข้อความสั้น</option>
            </select>
          </div>
          {(newQuestionType === 'single-choice' || newQuestionType === 'multi-choice') && (
            <input
              type="text"
              value={newQuestionOptions}
              onChange={(e) => setNewQuestionOptions(e.target.value)}
              placeholder="ระบุตัวเลือกคั่นด้วยเครื่องหมายจุลภาค (,)"
              className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
            />
          )}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#1B5E3F] bg-[#1B5E3F]/10 rounded-lg hover:bg-[#1B5E3F]/15 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มคำถามลงในแบบสำรวจ</span>
          </button>
        </div>
      </section>
    </div>
  );
}
