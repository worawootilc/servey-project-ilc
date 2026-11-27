import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Download, Lock, ShieldCheck, X } from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { BuilderView } from './components/BuilderView.tsx';
import { MenuCatalogView } from './components/MenuCatalogView.tsx';
import { SurveyView } from './components/SurveyView.tsx';
import { createSampleResponses } from './data/defaultSurvey.ts';
import {
  isAdminSessionActive,
  lockAdminSession,
  verifyAndUnlockAdmin,
} from './services/adminAuth.ts';
import {
  clearRespondentEmail,
  exportResponsesCsvDirect,
  fetchResponsesFromGoogleSheet,
  loadLocalResponses,
  loadRespondentEmail,
  loadSurveySchema,
  resetSurveySchema,
  saveLocalResponses,
  saveRespondentEmail,
  saveSurveySchema,
} from './services/surveyStorage.ts';
import type { MenuComboSelection, SurveyResponseRecord, SurveySchema } from './types/survey.ts';

type ActiveView = 'survey' | 'menu' | 'analytics' | 'builder';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('survey');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminSessionActive());
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminChecking, setAdminChecking] = useState(false);

  const [survey, setSurvey] = useState<SurveySchema>(() => loadSurveySchema());
  const [responses, setResponses] = useState<SurveyResponseRecord[]>(() => loadLocalResponses());
  const [respondentEmail, setRespondentEmail] = useState<string>(() => loadRespondentEmail());
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [preselectedMemberId, setPreselectedMemberId] = useState<string | null>(null);
  const [preselectedComboPatch, setPreselectedComboPatch] =
    useState<Partial<MenuComboSelection> | null>(null);

  const syncFromSheet = useCallback(async () => {
    setSyncingSheet(true);
    try {
      const sheetRows = await fetchResponsesFromGoogleSheet(survey);
      if (sheetRows) {
        setResponses((prev) => {
          const now = Date.now();
          const byKey = new Map<string, SurveyResponseRecord>();
          for (const row of sheetRows) {
            const key = row.respondentId || row.respondentName.trim();
            const existing = prev.find(
              (p) => (p.respondentId || p.respondentName.trim()) === key
            );
            const merged: SurveyResponseRecord = existing
              ? {
                  ...row,
                  respondentEmail: row.respondentEmail ?? existing.respondentEmail,
                  answers:
                    existing.answers['q6_menu_satisfaction'] !== undefined
                      ? {
                          ...row.answers,
                          q6_menu_satisfaction: existing.answers['q6_menu_satisfaction'],
                        }
                      : row.answers,
                }
              : row;
            byKey.set(key, merged);
          }
          // Preserve freshly submitted local rows (< 20s old) in case Google Sheet query lags briefly
          for (const localRow of prev) {
            const ageMs = now - new Date(localRow.submittedAt).getTime();
            const key = localRow.respondentId || localRow.respondentName.trim();
            if (ageMs >= 0 && ageMs < 20000) {
              const sheetRow = byKey.get(key);
              if (!sheetRow || new Date(localRow.submittedAt).getTime() > new Date(sheetRow.submittedAt).getTime()) {
                byKey.set(key, localRow);
              }
            }
          }
          return saveLocalResponses(Array.from(byKey.values()));
        });
      }
    } finally {
      setSyncingSheet(false);
    }
  }, [survey]);

  useEffect(() => {
    if (activeView === 'analytics' || activeView === 'survey') {
      void syncFromSheet();
    }
  }, [activeView, syncFromSheet]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === '1' || window.location.hash === '#admin') {
      if (isAdmin) {
        setActiveView('builder');
      } else {
        setShowAdminModal(true);
      }
    }
  }, [isAdmin]);

  function handleSubmitted(record: SurveyResponseRecord) {
    setResponses((prev) => {
      const normalizedName = record.respondentName.trim();
      const filtered = prev.filter((r) => {
        if (r.id === record.id) return false;
        if (record.respondentId && r.respondentId === record.respondentId) return false;
        if (r.respondentName.trim() === normalizedName) return false;
        return true;
      });
      return saveLocalResponses([record, ...filtered]);
    });
  }

  function handleVerifyRespondentEmail(email: string) {
    setRespondentEmail(saveRespondentEmail(email));
  }

  function handleClearRespondentEmail() {
    clearRespondentEmail();
    setRespondentEmail('');
  }

  async function handleSeedSample() {
    if (!isAdmin) return;
    const seeded = saveLocalResponses(createSampleResponses());
    setResponses(seeded);
  }

  async function handleDeleteResponse(id: string) {
    if (!isAdmin) return;
    setResponses((prev) => saveLocalResponses(prev.filter((r) => r.id !== id)));
  }

  async function handleClearAll() {
    if (!isAdmin) return;
    setResponses(saveLocalResponses([]));
  }

  async function handleSaveSurvey(updated: SurveySchema) {
    if (!isAdmin) return;
    setSurvey(saveSurveySchema(updated));
  }

  async function handleResetSurvey() {
    if (!isAdmin) return;
    setSurvey(resetSurveySchema());
  }

  function handleLockAdmin() {
    lockAdminSession();
    setIsAdmin(false);
    if (activeView === 'builder') {
      setActiveView('survey');
    }
  }

  async function handleAdminUnlockSubmit(e: FormEvent) {
    e.preventDefault();
    setAdminChecking(true);
    setAdminError(null);
    try {
      const ok = await verifyAndUnlockAdmin(adminPasscode);
      if (!ok) {
        setAdminError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        return;
      }
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPasscode('');
      setActiveView('builder');
    } finally {
      setAdminChecking(false);
    }
  }

  const handleConsumePreselect = useCallback(() => {
    setPreselectedMemberId(null);
    setPreselectedComboPatch(null);
  }, []);

  function handleExportCsv() {
    exportResponsesCsvDirect(survey, responses);
  }

  const navItems: Array<{ id: ActiveView; label: string }> = isAdmin
    ? [
        { id: 'survey', label: 'แบบสำรวจ' },
        { id: 'menu', label: 'เมนู ≤ 150฿' },
        { id: 'analytics', label: 'สรุปผล' },
        { id: 'builder', label: 'ตั้งค่าคำถาม' },
      ]
    : [
        { id: 'survey', label: 'แบบสำรวจ' },
        { id: 'menu', label: 'เมนู ≤ 150฿' },
        { id: 'analytics', label: 'สรุปผล' },
      ];

  const effectiveView: ActiveView = activeView === 'builder' && !isAdmin ? 'survey' : activeView;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F7] text-[#161B18]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-[#164A32] text-white border-b border-[#0F3523] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('survey')}
            className="font-serif text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            แบบสำรวจอาหารและเครื่องดื่ม
          </button>

          {/* Zone 2: Concise single-line nav links (Admin-only tabs hidden for regular participants) */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = effectiveView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`py-1.5 text-sm transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                    isActive
                      ? 'text-white border-white font-semibold'
                      : 'text-white/75 border-transparent font-medium hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#164A32] bg-white rounded-lg hover:bg-[#EDF3EF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="md:hidden border-t border-white/15 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = effectiveView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-[#164A32] font-semibold'
                    : 'text-white/90 bg-white/10 font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {effectiveView === 'survey' && (
          <SurveyView
            survey={survey}
            responses={responses}
            respondentEmail={respondentEmail}
            onVerifyRespondentEmail={handleVerifyRespondentEmail}
            onClearRespondentEmail={handleClearRespondentEmail}
            preselectedMemberId={preselectedMemberId}
            preselectedComboPatch={preselectedComboPatch}
            onConsumePreselect={handleConsumePreselect}
            onSubmitted={handleSubmitted}
            onNavigateAnalytics={() => setActiveView('analytics')}
            onNavigateMenu={() => setActiveView('menu')}
          />
        )}

        {effectiveView === 'menu' && (
          <MenuCatalogView
            onApplyToSurvey={(patch) => {
              setPreselectedComboPatch(patch);
              setActiveView('survey');
            }}
          />
        )}

        {effectiveView === 'analytics' && (
          <AnalyticsView
            survey={survey}
            responses={responses}
            isAdmin={isAdmin}
            syncingSheet={syncingSheet}
            onRefreshFromSheet={syncFromSheet}
            onStartSurvey={() => setActiveView('survey')}
            onEditMemberSelection={(memberId) => {
              setPreselectedMemberId(memberId);
              setActiveView('survey');
            }}
            onSeedSample={handleSeedSample}
            onDeleteResponse={handleDeleteResponse}
            onClearAll={handleClearAll}
          />
        )}

        {effectiveView === 'builder' && isAdmin && (
          <BuilderView
            survey={survey}
            onSaveSurvey={handleSaveSurvey}
            onResetSurvey={handleResetSurvey}
            onLockAdmin={handleLockAdmin}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-[#E2E6E3] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#57605B]">
          <div>
            แบบสำรวจอาหารและเครื่องดื่ม COFFEE SMITR · งบประมาณไม่เกิน {survey.budgetLimitBaht} บาท/ท่าน · สั่งจองล่วงหน้า 2 วันผ่าน LINE OA @coffeesmitr
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('builder')}
                  className="inline-flex items-center gap-1 text-[#164A32] font-medium hover:underline cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>โหมดผู้ดูแลระบบ (ตั้งค่าคำถาม)</span>
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleLockAdmin}
                  className="text-[#57605B] hover:text-[#161B18] cursor-pointer"
                >
                  ล็อกออก
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAdminError(null);
                  setAdminPasscode('');
                  setShowAdminModal(true);
                }}
                className="inline-flex items-center gap-1 text-[#57605B] hover:text-[#161B18] transition-colors cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>สำหรับผู้ดูแลระบบ (Admin)</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Admin Passcode Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E6E3] rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B5E3F]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>เฉพาะผู้ดูแลระบบ (Admin)</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#161B18]">
                  เข้าสู่โหมดจัดการแบบสำรวจ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1 text-[#57605B] hover:text-[#161B18] rounded-lg"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#57605B] mb-1.5">
                  รหัสผ่านผู้ดูแลระบบ (Admin Passcode)
                </label>
                <input
                  type="password"
                  autoFocus
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setAdminError(null);
                  }}
                  placeholder="ระบุรหัสผ่านผู้ดูแลระบบ..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F7F8F7] border border-[#DCE2DD] rounded-lg focus:outline-none focus:border-[#1B5E3F]"
                />
              </div>

              {adminError && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {adminError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#57605B] hover:text-[#161B18]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={adminChecking || !adminPasscode.trim()}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] disabled:opacity-40 transition-colors"
                >
                  {adminChecking ? 'กำลังตรวจสอบ...' : 'ยืนยันเข้าสู่ระบบ Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
