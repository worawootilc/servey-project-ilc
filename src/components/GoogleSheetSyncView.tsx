import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
  Sheet,
} from 'lucide-react';
import { extractSpreadsheetId, generateAppsScriptCode } from '../data/defaultSurvey.ts';
import {
  buildAppsScriptRowPayload,
  isValidAppsScriptUrl,
  postToAppsScriptDirect,
} from '../services/surveyStorage.ts';
import type { SurveyResponseRecord, SurveySchema } from '../types/survey.ts';

interface GoogleSheetSyncViewProps {
  survey: SurveySchema;
  responses: SurveyResponseRecord[];
  onSaveSurvey: (updated: SurveySchema) => Promise<void>;
}

export function GoogleSheetSyncView({
  survey,
  responses,
  onSaveSurvey,
}: GoogleSheetSyncViewProps) {
  const [sheetUrl, setSheetUrl] = useState(survey.googleSheetUrl || '');
  const [appsScriptUrl, setAppsScriptUrl] = useState(survey.appsScriptUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const spreadsheetId = useMemo(() => extractSpreadsheetId(sheetUrl), [sheetUrl]);
  const appsScriptCode = useMemo(() => generateAppsScriptCode(spreadsheetId), [spreadsheetId]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(appsScriptCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // ignore clipboard error
    }
  }

  async function handleTestAndSave() {
    const trimmedUrl = appsScriptUrl.trim();
    if (!isValidAppsScriptUrl(trimmedUrl)) {
      setStatusMessage({
        type: 'error',
        text: 'Apps Script Web App URL ต้องขึ้นต้นด้วย https://script.google.com/macros/s/',
      });
      return;
    }

    setTesting(true);
    setStatusMessage(null);
    try {
      const result = await postToAppsScriptDirect(trimmedUrl, { action: 'ping' });
      if (!result.synced) {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
        return;
      }

      await onSaveSurvey({
        ...survey,
        googleSheetUrl: sheetUrl.trim(),
        appsScriptUrl: trimmedUrl,
      });

      setStatusMessage({
        type: 'success',
        text: result.message,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อไปยัง Apps Script',
      });
    } finally {
      setTesting(false);
    }
  }

  async function handleSyncAll() {
    const trimmedUrl = appsScriptUrl.trim();
    if (!isValidAppsScriptUrl(trimmedUrl)) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาระบุ Apps Script Web App URL ที่ถูกต้องก่อนส่งข้อมูล',
      });
      return;
    }

    setSyncingAll(true);
    setStatusMessage(null);
    try {
      const result = await postToAppsScriptDirect(trimmedUrl, {
        action: 'sync_all',
        records: responses.map(buildAppsScriptRowPayload),
      });
      if (!result.synced) {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
        return;
      }
      setStatusMessage({
        type: 'success',
        text: `ส่งข้อมูลคำตอบจำนวน ${responses.length} รายการเข้า Google Sheet เรียบร้อยแล้ว`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Google Sheet',
      });
    } finally {
      setSyncingAll(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E2E6E3] pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-[#57605B]">
            <span>Direct Browser-to-Apps-Script Sync</span>
            <span aria-hidden="true">·</span>
            <span>Spreadsheet ID: <span className="font-mono">{spreadsheetId}</span></span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#161B18]">
            เชื่อมต่อ Google Sheet ผ่าน Apps Script โดยตรง
          </h2>
          <p className="text-sm text-[#57605B]">
            หน้าเว็บจะส่งข้อมูลคำตอบจากเบราว์เซอร์ตรงไปยัง Apps Script ของ Google Sheet ทันที โดยไม่ต้องใช้เซิร์ฟเวอร์กลาง (รองรับ GitHub Pages / Vercel / Netlify ฟรี)
          </p>
        </div>

        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#161B18] bg-white border border-[#DCE2DD] rounded-lg hover:border-[#1B5E3F] transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
          >
            <Sheet className="w-3.5 h-3.5 text-[#1B5E3F]" />
            <span>เปิด Google Sheet ปลายทาง</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#57605B]" />
          </a>
        )}
      </div>

      {/* Step 1 & 2: Setup Instructions + Ready-to-Copy Code.gs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-[#161B18]">ขั้นตอนการติดตั้งบน Google Sheet</h3>
            <p className="text-xs text-[#57605B] mt-0.5">ตั้งค่าเพียงครั้งเดียว ใช้งานได้ฟรีทันที</p>
          </div>

          <ol className="space-y-3.5 text-sm text-[#161B18]">
            <li className="flex gap-3">
              <span className="font-mono tabular-nums text-xs font-semibold w-6 h-6 rounded-md bg-[#1B5E3F]/10 text-[#1B5E3F] flex items-center justify-center shrink-0 mt-0.5">
                01
              </span>
              <span>
                เปิด Google Sheet ปลายทาง แล้วคลิกเมนู <strong>Extensions (ส่วนขยาย) &gt; Apps Script</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono tabular-nums text-xs font-semibold w-6 h-6 rounded-md bg-[#1B5E3F]/10 text-[#1B5E3F] flex items-center justify-center shrink-0 mt-0.5">
                02
              </span>
              <span>
                วางโค้ด <code className="font-mono text-xs bg-[#F2F4F2] px-1.5 py-0.5 rounded">Code.gs</code> ด้านขวาลงไปแทนที่โค้ดเดิม แล้วกด <strong>Save</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono tabular-nums text-xs font-semibold w-6 h-6 rounded-md bg-[#1B5E3F]/10 text-[#1B5E3F] flex items-center justify-center shrink-0 mt-0.5">
                03
              </span>
              <span>
                กด <strong>Deploy &gt; New deployment</strong> → เลือก <strong>Web app</strong> → ตั้ง <strong>Execute as: Me</strong> และ <strong>Who has access: Anyone</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono tabular-nums text-xs font-semibold w-6 h-6 rounded-md bg-[#1B5E3F]/10 text-[#1B5E3F] flex items-center justify-center shrink-0 mt-0.5">
                04
              </span>
              <span>
                นำ <strong>Web app URL</strong> มาวางในช่องด้านล่างแล้วกดทดสอบเชื่อมต่อ
              </span>
            </li>
          </ol>

          <div className="pt-3 border-t border-[#EEF1EE] text-xs text-[#57605B] leading-relaxed">
            <strong>หมายเหตุ:</strong> URL ปัจจุบันของคุณถูกตั้งเป็นค่าเริ่มต้นในระบบแล้ว ผู้ตอบแบบสำรวจทุกคนสามารถกดส่งข้อมูลลง Sheet ได้ทันทีครับ
          </div>
        </div>

        {/* Code Box */}
        <div className="lg:col-span-7 bg-[#161B18] text-[#F7F8F7] rounded-2xl overflow-hidden border border-[#2A312D]">
          <div className="px-5 py-3.5 border-b border-[#2A312D] flex items-center justify-between gap-4">
            <div className="text-xs font-mono text-[#B8C2BB]">Code.gs · Google Apps Script</div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1B5E3F] text-white rounded-md hover:bg-[#237550] transition-colors whitespace-nowrap shrink-0"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ดแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด Apps Script</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-5 text-xs font-mono leading-relaxed overflow-x-auto max-h-[420px] text-[#E4EAE5]">
            <code>{appsScriptCode}</code>
          </pre>
        </div>
      </div>

      {/* Step 3: Webhook URL Configuration & Test */}
      <section className="bg-white border border-[#E2E6E3] rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-[#161B18]">เชื่อมต่อ Web App URL ของ Apps Script</h3>
          <p className="text-xs text-[#57605B] mt-0.5">
            ส่งข้อมูลตรงจากเบราว์เซอร์ไปยัง Apps Script Web App โดยอัตโนมัติทุกครั้งที่กดส่งแบบสำรวจ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#57605B] mb-1.5">
              ลิงก์ Google Sheet ปลายทาง
            </label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#57605B] mb-1.5">
              Apps Script Web App URL (จากการ Deploy)
            </label>
            <input
              type="url"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
            />
          </div>
        </div>

        {statusMessage && (
          <div
            role="status"
            className={`flex items-start gap-2.5 p-4 rounded-xl border text-sm ${
              statusMessage.type === 'success'
                ? 'bg-[#1B5E3F]/5 border-[#1B5E3F]/30 text-[#1B5E3F]'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={testing || !appsScriptUrl.trim()}
            onClick={handleTestAndSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testing ? 'กำลังทดสอบการเชื่อมต่อ...' : 'ทดสอบและบันทึกการเชื่อมต่อ'}</span>
          </button>

          <button
            type="button"
            disabled={syncingAll || !appsScriptUrl.trim() || responses.length === 0}
            onClick={handleSyncAll}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-[#161B18] bg-white border border-[#DCE2DD] rounded-lg hover:border-[#1B5E3F] disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>
              {syncingAll
                ? 'กำลังส่งข้อมูลเข้า Sheet...'
                : `ส่งข้อมูลที่มีอยู่ทั้งหมดเข้า Sheet (${responses.length} รายการ)`}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
