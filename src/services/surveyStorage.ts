import { DEFAULT_SURVEY } from '../data/defaultSurvey.ts';
import type {
  AnswerValue,
  MenuComboSelection,
  SheetSyncResult,
  SurveyResponseRecord,
  SurveySchema,
} from '../types/survey.ts';

const SCHEMA_STORAGE_KEY = 'coffeesmitr_survey_schema_v3';
const RESPONSES_STORAGE_KEY = 'coffeesmitr_survey_responses_v1';

function isMenuComboSelection(val: unknown): val is MenuComboSelection {
  return typeof val === 'object' && val !== null && 'totalPrice' in val;
}

export function isValidAppsScriptUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'script.google.com' &&
      parsed.pathname.startsWith('/macros/s/')
    );
  } catch {
    return false;
  }
}

export function loadSurveySchema(): SurveySchema {
  try {
    const raw = localStorage.getItem(SCHEMA_STORAGE_KEY);
    if (!raw) return DEFAULT_SURVEY;
    const parsed = JSON.parse(raw) as Partial<SurveySchema>;
    return {
      ...DEFAULT_SURVEY,
      ...parsed,
      roster:
        Array.isArray(parsed.roster) && parsed.roster.length > 0
          ? parsed.roster
          : DEFAULT_SURVEY.roster,
      sections:
        Array.isArray(parsed.sections) && parsed.sections.length > 0
          ? parsed.sections
          : DEFAULT_SURVEY.sections,
      questions:
        Array.isArray(parsed.questions) && parsed.questions.length > 0
          ? parsed.questions
          : DEFAULT_SURVEY.questions,
      googleSheetUrl: parsed.googleSheetUrl || DEFAULT_SURVEY.googleSheetUrl,
      appsScriptUrl: parsed.appsScriptUrl || DEFAULT_SURVEY.appsScriptUrl,
    };
  } catch {
    return DEFAULT_SURVEY;
  }
}

export function saveSurveySchema(schema: SurveySchema): SurveySchema {
  const next: SurveySchema = {
    ...schema,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function resetSurveySchema(): SurveySchema {
  const next: SurveySchema = {
    ...DEFAULT_SURVEY,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function loadLocalResponses(): SurveyResponseRecord[] {
  try {
    const raw = localStorage.getItem(RESPONSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SurveyResponseRecord[];
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveLocalResponses(records: SurveyResponseRecord[]): SurveyResponseRecord[] {
  const sorted = [...records].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  try {
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // ignore storage quota errors
  }
  return sorted;
}

export function buildAppsScriptRowPayload(record: SurveyResponseRecord) {
  const combo = isMenuComboSelection(record.answers['q2_menu_combo'])
    ? record.answers['q2_menu_combo']
    : null;
  return {
    id: record.id,
    submittedAt: record.submittedAt,
    respondentName: record.respondentName,
    categoryStyle:
      typeof record.answers['q1_category'] === 'string' ? record.answers['q1_category'] : '',
    foodName: combo?.foodName || '-',
    foodPrice: combo?.foodPrice ?? 0,
    drinkName: combo?.drinkName || '-',
    drinkTemp: combo?.drinkTemp || '-',
    drinkAddons: combo?.drinkAddons ?? [],
    drinkPrice: combo ? combo.drinkBasePrice + combo.drinkAddonsPrice : 0,
    totalPrice: combo?.totalPrice ?? 0,
    sweetness:
      typeof record.answers['q3_sweetness'] === 'string' ? record.answers['q3_sweetness'] : '-',
    dietary: Array.isArray(record.answers['q5_dietary']) ? record.answers['q5_dietary'] : [],
    notes: typeof record.answers['q7_notes'] === 'string' ? record.answers['q7_notes'] : '',
  };
}

export async function postToAppsScriptDirect(
  appsScriptUrl: string | undefined,
  bodyObj: Record<string, unknown>
): Promise<SheetSyncResult> {
  const trimmed = appsScriptUrl?.trim() ?? '';
  if (!trimmed) {
    return {
      attempted: false,
      synced: false,
      message: 'ยังไม่ได้ตั้งค่า Apps Script Web App URL',
    };
  }
  if (!isValidAppsScriptUrl(trimmed)) {
    return {
      attempted: true,
      synced: false,
      message: 'URL ของ Apps Script ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://script.google.com/macros/s/)',
    };
  }

  try {
    // Use text/plain simple request so browser does not trigger CORS preflight OPTIONS
    const response = await fetch(trimmed, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(bodyObj),
      redirect: 'follow',
    });

    const text = await response.text();
    let parsed: { ok?: boolean; error?: string; message?: string } | null = null;
    try {
      parsed = JSON.parse(text) as { ok?: boolean; error?: string; message?: string };
    } catch {
      parsed = null;
    }

    if (!response.ok || (parsed && parsed.ok === false)) {
      return {
        attempted: true,
        synced: false,
        message: parsed?.error || `ส่งข้อมูลไปยัง Apps Script ไม่สำเร็จ (HTTP ${response.status})`,
      };
    }

    return {
      attempted: true,
      synced: true,
      message: parsed?.message || 'บันทึกลง Google Sheet ผ่าน Apps Script เรียบร้อยแล้ว',
    };
  } catch (err) {
    // Fallback for restrictive environments where redirect response blocks CORS read
    try {
      await fetch(trimmed, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyObj),
      });
      return {
        attempted: true,
        synced: true,
        message: 'ส่งคำขอไปยัง Google Sheet ผ่าน Apps Script แล้ว',
      };
    } catch {
      const msg = err instanceof Error ? err.message : 'เชื่อมต่อ Apps Script ไม่สำเร็จ';
      return {
        attempted: true,
        synced: false,
        message: msg,
      };
    }
  }
}

export async function submitSurveyResponseDirect(
  survey: SurveySchema,
  existingResponses: SurveyResponseRecord[],
  payload: {
    respondentId?: string;
    respondentName: string;
    answers: Record<string, AnswerValue>;
  }
): Promise<{ record: SurveyResponseRecord; allResponses: SurveyResponseRecord[] }> {
  const existingIndex = payload.respondentId
    ? existingResponses.findIndex((r) => r.respondentId === payload.respondentId)
    : existingResponses.findIndex((r) => r.respondentName === payload.respondentName);

  const nextList = [...existingResponses];
  let savedRecord: SurveyResponseRecord;

  if (existingIndex >= 0) {
    savedRecord = {
      ...nextList[existingIndex],
      submittedAt: new Date().toISOString(),
      respondentId: payload.respondentId,
      respondentName: payload.respondentName,
      answers: payload.answers,
    };
    nextList[existingIndex] = savedRecord;
  } else {
    const nextSeq = 1001 + existingResponses.length;
    savedRecord = {
      id: `RSP-${nextSeq}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      submittedAt: new Date().toISOString(),
      respondentId: payload.respondentId,
      respondentName: payload.respondentName,
      answers: payload.answers,
    };
    nextList.unshift(savedRecord);
  }

  const sheetSync = await postToAppsScriptDirect(
    survey.appsScriptUrl,
    buildAppsScriptRowPayload(savedRecord)
  );
  savedRecord = {
    ...savedRecord,
    sheetSync,
  };

  const finalIndex = nextList.findIndex((r) => r.id === savedRecord.id);
  if (finalIndex >= 0) {
    nextList[finalIndex] = savedRecord;
  }

  const savedAll = saveLocalResponses(nextList);
  return { record: savedRecord, allResponses: savedAll };
}

function escapeCsvField(value: string): string {
  const normalized = value.replace(/\r?\n/g, ' ');
  if (normalized.includes(',') || normalized.includes('"')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function formatAnswerForCsv(val: AnswerValue | undefined): string {
  if (val === undefined || val === null) return '';
  if (Array.isArray(val)) return val.join(' | ');
  if (isMenuComboSelection(val)) {
    const parts: string[] = [];
    if (val.foodName) parts.push(`${val.foodName} (${val.foodPrice}฿)`);
    if (val.drinkName) {
      const t = val.drinkTemp ? ` ${val.drinkTemp}` : '';
      const a = val.drinkAddons.length ? ` + ${val.drinkAddons.join(', ')}` : '';
      parts.push(`${val.drinkName}${t}${a} (${val.drinkBasePrice + val.drinkAddonsPrice}฿)`);
    }
    return parts.length ? `${parts.join(' + ')} = ${val.totalPrice} บาท` : '-';
  }
  return String(val);
}

export function exportResponsesCsvDirect(
  survey: SurveySchema,
  responses: SurveyResponseRecord[]
): void {
  const questions = survey.questions;
  const headers = [
    'รหัสคำตอบ',
    'เวลาที่ส่ง',
    'ชื่อผู้เลือก',
    'อาหารที่เลือก',
    'เครื่องดื่มที่เลือก',
    'ยอดรวม (บาท)',
    ...questions.map((q) => q.title),
  ];

  const rows = responses.map((r) => {
    const combo = isMenuComboSelection(r.answers['q2_menu_combo'])
      ? r.answers['q2_menu_combo']
      : null;
    return [
      r.id,
      new Date(r.submittedAt).toLocaleString('th-TH'),
      r.respondentName,
      combo?.foodName || '-',
      combo?.drinkName
        ? `${combo.drinkName}${combo.drinkTemp ? ` (${combo.drinkTemp})` : ''}${
            combo.drinkAddons.length ? ` + ${combo.drinkAddons.join(', ')}` : ''
          }`
        : '-',
      combo ? String(combo.totalPrice) : '-',
      ...questions.map((q) => formatAnswerForCsv(r.answers[q.id])),
    ];
  });

  const csvLines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCsvField(String(cell))).join(',')
  );
  const csvWithBom = '\uFEFF' + csvLines.join('\r\n');

  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'coffeesmitr-survey-150thb.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
