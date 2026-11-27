import { DRINK_ADDONS, DRINK_MENU_ITEMS, FOOD_MENU_ITEMS } from '../data/coffeeSmitrMenu.ts';
import { DEFAULT_SURVEY, extractSpreadsheetId } from '../data/defaultSurvey.ts';
import type {
  AnswerValue,
  MenuComboSelection,
  SheetSyncResult,
  SurveyResponseRecord,
  SurveySchema,
} from '../types/survey.ts';

const SCHEMA_STORAGE_KEY = 'coffeesmitr_survey_schema_v4';
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

interface GvizCell {
  v?: string | number | boolean | null;
  f?: string;
}

interface GvizResponse {
  status?: string;
  table?: {
    rows?: Array<{ c?: Array<GvizCell | null> }>;
  };
}

function getCellString(row: Array<GvizCell | null>, idx: number): string {
  const cell = row[idx];
  if (!cell || cell.v === null || cell.v === undefined) return '';
  if (typeof cell.v === 'string') return cell.v.trim();
  return (cell.f ?? String(cell.v)).trim();
}

function getCellNumber(row: Array<GvizCell | null>, idx: number): number {
  const cell = row[idx];
  if (!cell || cell.v === null || cell.v === undefined) return 0;
  if (typeof cell.v === 'number') return Number.isFinite(cell.v) ? cell.v : 0;
  const parsed = Number(String(cell.v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSheetTimestamp(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return new Date().toISOString();

  // Handle Google Visualization Date(y,m,d,h,min,s)
  const gvizDate = /^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/.exec(trimmed);
  if (gvizDate) {
    const [, y, m, d, hh = '0', mm = '0', ss = '0'] = gvizDate;
    return new Date(Number(y), Number(m), Number(d), Number(hh), Number(mm), Number(ss)).toISOString();
  }

  // Handle DD/MM/YYYY HH:mm:ss (including Thai Buddhist year >= 2400)
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    let year = Number(dmy[3]);
    if (year >= 2400) year -= 543;
    const hh = Number(dmy[4] ?? 0);
    const mm = Number(dmy[5] ?? 0);
    const ss = Number(dmy[6] ?? 0);
    const dt = new Date(year, month, day, hh, mm, ss);
    if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

async function queryGvizJson(sheetId: string, sheetName?: string): Promise<GvizResponse | null> {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  url.searchParams.set('tqx', 'out:json');
  if (sheetName) url.searchParams.set('sheet', sheetName);
  url.searchParams.set('_', String(Date.now()));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return null;
  const text = await res.text();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const parsed = JSON.parse(text.slice(start, end + 1)) as GvizResponse;
  return parsed.status === 'ok' ? parsed : null;
}

export async function fetchResponsesFromGoogleSheet(
  survey: SurveySchema
): Promise<SurveyResponseRecord[] | null> {
  const sheetId = extractSpreadsheetId(survey.googleSheetUrl || '');
  if (!sheetId) return null;

  try {
    let gviz = await queryGvizJson(sheetId, 'รายการสั่งอาหารและเครื่องดื่ม');
    if (!gviz) {
      gviz = await queryGvizJson(sheetId);
    }
    if (!gviz?.table?.rows) return null;

    const byPersonKey = new Map<string, SurveyResponseRecord>();

    for (const rowObj of gviz.table.rows) {
      const cells = rowObj.c ?? [];
      const id = getCellString(cells, 0);
      const rawDate = getCellString(cells, 1);
      const respondentName = getCellString(cells, 2);
      if (!respondentName || respondentName === 'ชื่อผู้รับสิทธิ์') continue;

      const style = getCellString(cells, 3);
      const foodLabel = getCellString(cells, 4);
      const foodPrice = getCellNumber(cells, 5);
      const drinkLabel = getCellString(cells, 6);
      const drinkTempRaw = getCellString(cells, 7);
      const addonsRaw = getCellString(cells, 8);
      const drinkTotalPrice = getCellNumber(cells, 9);
      const totalPrice = getCellNumber(cells, 10) || foodPrice + drinkTotalPrice;
      const sweetness = getCellString(cells, 11);
      const dietaryRaw = getCellString(cells, 12);
      const notes = getCellString(cells, 13);

      const matchedMember = survey.roster.find(
        (m) => m.fullName.trim() === respondentName.trim()
      );

      const hasFood = Boolean(foodLabel && foodLabel !== '-');
      const matchedFood = hasFood
        ? FOOD_MENU_ITEMS.find(
            (f) =>
              `${f.nameEn} (${f.nameTh})` === foodLabel ||
              foodLabel.includes(f.nameEn) ||
              foodLabel.includes(f.nameTh)
          )
        : undefined;

      const hasDrink = Boolean(drinkLabel && drinkLabel !== '-');
      const matchedDrink = hasDrink
        ? DRINK_MENU_ITEMS.find(
            (d) =>
              `${d.name} (${d.nameTh})` === drinkLabel ||
              drinkLabel.includes(d.name) ||
              drinkLabel.includes(d.nameTh)
          )
        : undefined;

      const drinkAddons =
        addonsRaw && addonsRaw !== '-'
          ? addonsRaw
              .split(',')
              .map((s) => s.trim())
              .filter((s) => Boolean(s) && s !== '-')
          : [];
      const drinkAddonsPrice = drinkAddons.reduce((sum, label) => {
        const found = DRINK_ADDONS.find((a) => label.includes(a.label));
        if (found) return sum + found.price;
        const m = /\+(\d+)/.exec(label);
        return sum + (m ? Number(m[1]) : 0);
      }, 0);
      const drinkBasePrice = Math.max(0, drinkTotalPrice - drinkAddonsPrice);
      const drinkTemp: 'ICE' | 'HOT' | null = hasDrink
        ? drinkTempRaw === 'HOT'
          ? 'HOT'
          : 'ICE'
        : null;

      const combo: MenuComboSelection = {
        foodId: matchedFood?.id ?? (hasFood ? `sheet-food-${id || respondentName}` : null),
        foodName: hasFood ? foodLabel : null,
        foodPrice: hasFood ? foodPrice : 0,
        drinkId: matchedDrink?.id ?? (hasDrink ? `sheet-drink-${id || respondentName}` : null),
        drinkName: hasDrink ? drinkLabel : null,
        drinkTemp,
        drinkBasePrice: hasDrink ? drinkBasePrice : 0,
        drinkAddons,
        drinkAddonsPrice,
        totalPrice,
      };

      const dietary =
        dietaryRaw && dietaryRaw !== '-'
          ? dietaryRaw
              .split(',')
              .map((s) => s.trim())
              .filter((s) => Boolean(s) && s !== '-')
          : [];

      const answers: Record<string, AnswerValue> = {
        q2_menu_combo: combo,
      };
      if (style) answers['q1_category'] = style;
      if (sweetness && sweetness !== '-') answers['q3_sweetness'] = sweetness;
      if (dietary.length > 0) answers['q5_dietary'] = dietary;
      if (notes) answers['q7_notes'] = notes;

      const submittedAt = parseSheetTimestamp(rawDate);
      const record: SurveyResponseRecord = {
        id: id || `SHEET-${matchedMember?.id ?? respondentName}`,
        submittedAt,
        respondentId: matchedMember?.id,
        respondentName,
        answers,
        sheetSync: {
          attempted: true,
          synced: true,
          message: 'ข้อมูลจาก Google Sheet',
        },
      };

      const personKey = matchedMember?.id ?? respondentName.trim();
      byPersonKey.set(personKey, record);
    }

    return saveLocalResponses(Array.from(byPersonKey.values()));
  } catch {
    return null;
  }
}
