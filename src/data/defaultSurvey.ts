import heroCulinaryImg from '../assets/images/hero_culinary_table_1795771824477.jpg';
import categorySavoryImg from '../assets/images/category_savory_food_1795771823921.jpg';
import categoryBeverageImg from '../assets/images/category_craft_beverage_1795771824425.jpg';
import categoryBakeryImg from '../assets/images/category_bakery_dessert_1795771825086.jpg';
import type { MenuComboSelection, RosterMember, SurveyResponseRecord, SurveySchema } from '../types/survey.ts';

export const HERO_CULINARY_IMAGE = heroCulinaryImg;

export const DEFAULT_GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1PAXhY9wxyjh5aFrMLhtfPo_GZhRHK9Rl_iOxRryroVc/edit?usp=sharing';

export const DEFAULT_GOOGLE_SHEET_ID = '1PAXhY9wxyjh5aFrMLhtfPo_GZhRHK9Rl_iOxRryroVc';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwdTLP2xGXNjHHNOYk6Z_WKzQfG9SzGz6rV-Ij0mnpSPWlbTTIQ4a5zIQDImez6JV5rvw/exec';

export const PARTICIPANT_ROSTER: RosterMember[] = [
  { id: 'member-01', order: 1, fullName: 'รองศาสตราจารย์ ดร.ชนัตถ์ พูนเดช', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-02', order: 2, fullName: 'ผู้ช่วยศาสตราจารย์ ดร.จิตสุภา กิติผดุง', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-03', order: 3, fullName: 'อาจารย์ ดร.รณยุทธ เอื้อไตรรัตน์', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-04', order: 4, fullName: 'อาจารย์ ดร.อรรคพล วณิกสัมบัน', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-05', order: 5, fullName: 'ผู้ช่วยศาสตราจารย์ ดร.สุนทรี สกุลพราหมณ์', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-06', order: 6, fullName: 'นางสาวประพาฬรัตน์ ยงมานิตชัย', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-07', order: 7, fullName: 'นางสาวจาริณี มาเวหา', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-08', order: 8, fullName: 'นางสาวเกษรา กิจจาชาญชัยกุล', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-09', order: 9, fullName: 'นายเอกมงคล แก้วกล่ำ', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-10', order: 10, fullName: 'นายวรวุฒิ สหะชัย', role: 'คณาจารย์ / บุคลากร' },
  { id: 'member-11', order: 11, fullName: 'อาจารย์พรหมมินทร์ ประไพพงษ์ (วิทยากร)', role: 'วิทยากร' },
  { id: 'member-12', order: 12, fullName: 'อาจารย์ ดร.พรรณธร ครุธเนตร (วิทยากร)', role: 'วิทยากร' },
];

export const DEFAULT_SURVEY: SurveySchema = {
  id: 'coffeesmitr-150-survey',
  title: 'แบบสำรวจเมนูอาหารและเครื่องดื่ม (งบไม่เกิน 150 บาท/ท่าน)',
  subtitle:
    'กรุณาเลือกรายชื่อของท่านและจับคู่เมนูอาหารกับเครื่องดื่มจากร้าน COFFEE SMITR ภายใต้งบประมาณไม่เกิน 150 บาท (ราคารวม VAT แล้ว)',
  budgetLimitBaht: 150,
  estimatedMinutes: 2,
  updatedAt: '2026-11-27T08:00:00.000Z',
  googleSheetUrl: DEFAULT_GOOGLE_SHEET_URL,
  appsScriptUrl: DEFAULT_APPS_SCRIPT_URL,
  roster: PARTICIPANT_ROSTER,
  sections: [
    {
      id: 'sec-style',
      numberLabel: '01',
      title: 'รายชื่อผู้รับสิทธิ์และสไตล์เมนู',
      subtitle: 'เลือกรายชื่อของท่านจากทั้งหมด 12 ท่าน และเลือกหมวดหมู่เมนูที่สนใจ',
    },
    {
      id: 'sec-combo',
      numberLabel: '02',
      title: 'จับคู่เมนูไม่เกิน 150 บาท',
      subtitle: 'เลือกอาหาร 1 รายการ และเครื่องดื่ม 1 รายการ โดยระบบจะคำนวณงบไม่เกิน 150 บาทให้อัตโนมัติ',
    },
    {
      id: 'sec-preferences',
      numberLabel: '03',
      title: 'ความหวานและข้อจำกัดด้านอาหาร',
      subtitle: 'ระบุระดับความหวานของเครื่องดื่ม ข้อจำกัดด้านอาหาร และหมายเหตุถึงร้าน',
    },
  ],
  questions: [
    {
      id: 'q1_category',
      sectionId: 'sec-style',
      type: 'image-choice',
      title: 'สไตล์เมนูหลักที่ท่านต้องการรับประทาน',
      helperText: 'เลือก 1 หมวดหมู่ที่ตรงกับความต้องการของท่าน',
      required: true,
      active: true,
      options: [
        {
          id: 'opt-panini',
          label: 'Panini & Bun หนีบร้อน (60–75 บาท)',
          description: 'พานีนีปิ้งลายหนีบร้อนและบันอบใหม่ เหลืองบเครื่องดื่มสูงสุด 90 บาท',
          imageUrl: categorySavoryImg,
        },
        {
          id: 'opt-beverage',
          label: 'ชุดเครื่องดื่มร้อน–เย็น & อาหาร (50–90 บาท)',
          description: 'กาแฟลาเต้อาร์ต มัทฉะอูจิ หรือโซดาผลไม้ จับคู่พานีนีหรือบันในงบ 150 บาท',
          imageUrl: categoryBeverageImg,
        },
        {
          id: 'opt-wrap',
          label: 'Wrap ตอติญ่าย่าง (78–88 บาท)',
          description: 'แร็ปตอติญ่าย่างไส้แน่นอิ่มท้อง คู่กาแฟเย็นหรือชาไทยภายในงบ 150 บาท',
          imageUrl: categoryBakeryImg,
        },
      ],
    },
    {
      id: 'q2_menu_combo',
      sectionId: 'sec-combo',
      type: 'menu-combo',
      title: 'เลือกจับคู่อาหารและเครื่องดื่ม COFFEE SMITR (ยอดรวมต้องไม่เกิน 150 บาท)',
      helperText:
        'เลือกอาหาร 1 เมนู และเครื่องดื่ม 1 เมนู (หรือเลือกเฉพาะอย่างใดอย่างหนึ่ง) ระบบจะกรองรายการที่อยู่ในงบคงเหลือให้อัตโนมัติ',
      required: true,
      active: true,
    },
    {
      id: 'q3_sweetness',
      sectionId: 'sec-preferences',
      type: 'single-choice',
      title: 'ระดับความหวานของเครื่องดื่มที่ต้องการ',
      required: true,
      active: true,
      options: [
        { id: 'sweet-0', label: 'ไม่หวานเลย (0%)' },
        { id: 'sweet-25', label: 'หวานน้อย (25%)' },
        { id: 'sweet-50', label: 'หวานปานกลาง (50%)' },
        { id: 'sweet-100', label: 'หวานปกติ (100%)' },
      ],
    },
    {
      id: 'q5_dietary',
      sectionId: 'sec-preferences',
      type: 'multi-choice',
      title: 'ข้อจำกัดด้านอาหารหรือความต้องการพิเศษ (ถ้ามี)',
      helperText: 'สามารถเลือกได้มากกว่า 1 ข้อ หากไม่มีให้เลือก "ไม่มีข้อจำกัดด้านอาหาร"',
      required: false,
      active: true,
      options: [
        { id: 'diet-none', label: 'ไม่มีข้อจำกัดด้านอาหาร' },
        { id: 'diet-nobeef', label: 'ไม่รับประทานเนื้อวัว' },
        { id: 'diet-nopork', label: 'ไม่รับประทานหมู' },
        { id: 'diet-lactose', label: 'แพ้นมวัว / ต้องการนมโอ๊ต' },
        { id: 'diet-veg', label: 'มังสวิรัติ (ไม่ทานเนื้อสัตว์)' },
      ],
    },
    {
      id: 'q7_notes',
      sectionId: 'sec-preferences',
      type: 'long-text',
      title: 'หมายเหตุเพิ่มเติม (เช่น ไม่ใส่ต้นหอม / แยกน้ำแข็ง / เมนูสำรอง)',
      placeholder: 'ระบุรายละเอียดเพิ่มเติมหรือเมนูสำรองหากสินค้าหมด...',
      required: false,
      active: true,
    },
  ],
};

export function extractSpreadsheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] || DEFAULT_GOOGLE_SHEET_ID;
}

export function generateAppsScriptCode(sheetId: string): string {
  const safeId = sheetId.trim() || DEFAULT_GOOGLE_SHEET_ID;
  return `// ============================================================================
// Google Apps Script สำหรับรับข้อมูลแบบสำรวจอาหารและเครื่องดื่ม (งบไม่เกิน 150 บาท)
// นำโค้ดนี้ไปวางใน Extensions > Apps Script ของ Google Sheet แล้ว Deploy เป็น Web App
// ============================================================================

const SPREADSHEET_ID = '${safeId}';
const SHEET_NAME = 'รายการสั่งอาหารและเครื่องดื่ม';

const HEADERS = [
  'รหัสอ้างอิง',
  'เวลาที่ส่ง',
  'ชื่อผู้รับสิทธิ์',
  'สไตล์เมนู',
  'เมนูอาหาร',
  'ราคาอาหาร (บาท)',
  'เมนูเครื่องดื่ม',
  'ร้อน/เย็น',
  'ตัวเลือกเพิ่มเติม',
  'ราคาเครื่องดื่ม (บาท)',
  'ยอดรวมสุทธิ (บาท)',
  'ระดับความหวาน',
  'ข้อจำกัดด้านอาหาร',
  'หมายเหตุเพิ่มเติม',
  'อีเมลผู้ตอบ (@g.swu.ac.th)'
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1B5E3F')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function buildRowFromPayload(data) {
  const submittedAt = data.submittedAt
    ? Utilities.formatDate(new Date(data.submittedAt), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss')
    : Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy HH:mm:ss');

  return [
    data.id || '',
    submittedAt,
    data.respondentName || '',
    data.categoryStyle || '',
    data.foodName || '-',
    Number(data.foodPrice || 0),
    data.drinkName || '-',
    data.drinkTemp || '-',
    Array.isArray(data.drinkAddons) ? data.drinkAddons.join(', ') : (data.drinkAddons || '-'),
    Number(data.drinkPrice || 0),
    Number(data.totalPrice || 0),
    data.sweetness || '-',
    Array.isArray(data.dietary) ? data.dietary.join(', ') : (data.dietary || '-'),
    data.notes || '',
    data.respondentEmail || ''
  ];
}

function upsertRow(sheet, rowValues) {
  const respondentName = String(rowValues[2] || '').trim();
  const lastRow = sheet.getLastRow();

  // หากรายชื่อนี้เคยส่งข้อมูลแล้ว ให้อัปเดตแถวเดิมแทนการเพิ่มแถวซ้ำ
  if (respondentName && lastRow > 1) {
    const existingNames = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
    for (let i = 0; i < existingNames.length; i++) {
      if (String(existingNames[i][0]).trim() === respondentName) {
        sheet.getRange(i + 2, 1, 1, rowValues.length).setValues([rowValues]);
        return 'updated';
      }
    }
  }

  sheet.appendRow(rowValues);
  return 'appended';
}

function doGet(e) {
  const sheet = getOrCreateSheet();
  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      message: 'Apps Script Web App เชื่อมต่อกับ Google Sheet พร้อมใช้งานแล้ว',
      sheetName: sheet.getName(),
      rowCount: Math.max(0, sheet.getLastRow() - 1)
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);
    const sheet = getOrCreateSheet();

    if (payload.action === 'ping') {
      return ContentService.createTextOutput(
        JSON.stringify({
          ok: true,
          message: 'เชื่อมต่อและเขียนสิทธิ์ลง Google Sheet สำเร็จ',
          sheetName: sheet.getName()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'sync_all' && Array.isArray(payload.records)) {
      let count = 0;
      payload.records.forEach(function (item) {
        upsertRow(sheet, buildRowFromPayload(item));
        count++;
      });
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, action: 'sync_all', count: count })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const mode = upsertRow(sheet, buildRowFromPayload(payload));
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, mode: mode, respondentName: payload.respondentName || '' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err && err.message ? err.message : String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
}

export function formatComboSummary(combo: MenuComboSelection | undefined): string {
  if (!combo) return '-';
  const parts: string[] = [];
  if (combo.foodName) {
    parts.push(`${combo.foodName} (${combo.foodPrice}฿)`);
  }
  if (combo.drinkName) {
    const tempLabel = combo.drinkTemp ? ` ${combo.drinkTemp}` : '';
    const addonsLabel = combo.drinkAddons.length > 0 ? ` + ${combo.drinkAddons.join(', ')}` : '';
    parts.push(
      `${combo.drinkName}${tempLabel}${addonsLabel} (${combo.drinkBasePrice + combo.drinkAddonsPrice}฿)`
    );
  }
  if (parts.length === 0) return '-';
  return `${parts.join(' + ')} = ${combo.totalPrice} บาท`;
}

export function createSampleResponses(): SurveyResponseRecord[] {
  const now = Date.now();
  const samples: Omit<SurveyResponseRecord, 'id'>[] = [
    {
      submittedAt: new Date(now - 1000 * 60 * 180).toISOString(),
      respondentId: 'member-01',
      respondentName: 'รองศาสตราจารย์ ดร.ชนัตถ์ พูนเดช',
      answers: {
        q1_category: 'Panini & Bun หนีบร้อน (60–75 บาท)',
        q2_menu_combo: {
          foodId: 'food-truffle-ham-cheese-panini',
          foodName: 'TRUFFLE HAM CHEESE PANINI (พานีนี ทรัฟเฟิล แฮมชีส)',
          foodPrice: 70,
          drinkId: 'drink-americano-orange',
          drinkName: 'Americano x Orange Juice (อเมริกาโน่ น้ำส้ม)',
          drinkTemp: 'ICE',
          drinkBasePrice: 75,
          drinkAddons: [],
          drinkAddonsPrice: 0,
          totalPrice: 145,
        },
        q3_sweetness: 'ไม่หวานเลย (0%)',
        q5_dietary: ['ไม่มีข้อจำกัดด้านอาหาร'],
        q7_notes: '',
      },
    },
    {
      submittedAt: new Date(now - 1000 * 60 * 140).toISOString(),
      respondentId: 'member-02',
      respondentName: 'ผู้ช่วยศาสตราจารย์ ดร.จิตสุภา กิติผดุง',
      answers: {
        q1_category: 'ชุดเครื่องดื่มร้อน–เย็น & อาหาร (50–90 บาท)',
        q2_menu_combo: {
          foodId: 'food-spinach-cheesy-bun',
          foodName: 'SPINACH CHEESY BUN (บันผักโขมอบชีส)',
          foodPrice: 65,
          drinkId: 'drink-matcha-uji',
          drinkName: 'Matcha Latte (UJI) (มัทฉะ ลาเต้ (อูจิ))',
          drinkTemp: 'ICE',
          drinkBasePrice: 75,
          drinkAddons: [],
          drinkAddonsPrice: 0,
          totalPrice: 140,
        },
        q3_sweetness: 'หวานน้อย (25%)',
        q5_dietary: ['ไม่มีข้อจำกัดด้านอาหาร'],
        q7_notes: 'แยกน้ำแข็งให้ด้วยค่ะ',
      },
    },
    {
      submittedAt: new Date(now - 1000 * 60 * 110).toISOString(),
      respondentId: 'member-06',
      respondentName: 'นางสาวประพาฬรัตน์ ยงมานิตชัย',
      answers: {
        q1_category: 'Wrap ตอติญ่าย่าง (78–88 บาท)',
        q2_menu_combo: {
          foodId: 'food-caesar-chicken-wrap',
          foodName: 'CAESAR CHICKEN WRAP (แร็ปซีซาร์สลัดไก่)',
          foodPrice: 88,
          drinkId: 'drink-latte',
          drinkName: 'Latte (ลาเต้)',
          drinkTemp: 'ICE',
          drinkBasePrice: 60,
          drinkAddons: [],
          drinkAddonsPrice: 0,
          totalPrice: 148,
        },
        q3_sweetness: 'หวานน้อย (25%)',
        q5_dietary: ['ไม่รับประทานเนื้อวัว'],
        q7_notes: '',
      },
    },
    {
      submittedAt: new Date(now - 1000 * 60 * 75).toISOString(),
      respondentId: 'member-11',
      respondentName: 'อาจารย์พรหมมินทร์ ประไพพงษ์ (วิทยากร)',
      answers: {
        q1_category: 'Panini & Bun หนีบร้อน (60–75 บาท)',
        q2_menu_combo: {
          foodId: 'food-salmon-creamcheese-panini',
          foodName: 'SALMON CREAMCHEESE PANINI (พานีนี แซลมอน ครีมชีส)',
          foodPrice: 70,
          drinkId: 'drink-americano',
          drinkName: 'Americano (อเมริกาโน่)',
          drinkTemp: 'HOT',
          drinkBasePrice: 50,
          drinkAddons: [],
          drinkAddonsPrice: 0,
          totalPrice: 120,
        },
        q3_sweetness: 'ไม่หวานเลย (0%)',
        q5_dietary: ['ไม่มีข้อจำกัดด้านอาหาร'],
        q7_notes: '',
      },
    },
    {
      submittedAt: new Date(now - 1000 * 60 * 35).toISOString(),
      respondentId: 'member-12',
      respondentName: 'อาจารย์ ดร.พรรณธร ครุธเนตร (วิทยากร)',
      answers: {
        q1_category: 'Wrap ตอติญ่าย่าง (78–88 บาท)',
        q2_menu_combo: {
          foodId: 'food-banana-almond-butter-wrap',
          foodName: 'BANANA & ALMOND BUTTER (แร็ปกล้วยเนยอัลมอนด์)',
          foodPrice: 78,
          drinkId: 'drink-oat-milk-latte',
          drinkName: 'Oat Milk Latte (โอ๊ตมิลค์ ลาเต้)',
          drinkTemp: 'ICE',
          drinkBasePrice: 70,
          drinkAddons: [],
          drinkAddonsPrice: 0,
          totalPrice: 148,
        },
        q3_sweetness: 'หวานน้อย (25%)',
        q5_dietary: ['แพ้นมวัว / ต้องการนมโอ๊ต'],
        q7_notes: '',
      },
    },
  ];

  return samples.map((item, idx) => ({
    id: `RSP-${String(1001 + idx)}`,
    ...item,
  }));
}
