import { useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { BuilderView } from './components/BuilderView.tsx';
import { GoogleSheetSyncView } from './components/GoogleSheetSyncView.tsx';
import { MenuCatalogView } from './components/MenuCatalogView.tsx';
import { SurveyView } from './components/SurveyView.tsx';
import { createSampleResponses } from './data/defaultSurvey.ts';
import {
  exportResponsesCsvDirect,
  loadLocalResponses,
  loadSurveySchema,
  resetSurveySchema,
  saveLocalResponses,
  saveSurveySchema,
} from './services/surveyStorage.ts';
import type { MenuComboSelection, SurveyResponseRecord, SurveySchema } from './types/survey.ts';

type ActiveView = 'survey' | 'menu' | 'analytics' | 'sheets' | 'builder';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('survey');
  const [survey, setSurvey] = useState<SurveySchema>(() => loadSurveySchema());
  const [responses, setResponses] = useState<SurveyResponseRecord[]>(() => loadLocalResponses());
  const [preselectedMemberId, setPreselectedMemberId] = useState<string | null>(null);
  const [preselectedComboPatch, setPreselectedComboPatch] =
    useState<Partial<MenuComboSelection> | null>(null);

  function handleSubmitted(record: SurveyResponseRecord) {
    setResponses((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      const next =
        idx >= 0
          ? prev.map((r, i) => (i === idx ? record : r))
          : [record, ...prev];
      return saveLocalResponses(next);
    });
  }

  async function handleSeedSample() {
    const seeded = saveLocalResponses(createSampleResponses());
    setResponses(seeded);
  }

  async function handleDeleteResponse(id: string) {
    setResponses((prev) => saveLocalResponses(prev.filter((r) => r.id !== id)));
  }

  async function handleClearAll() {
    setResponses(saveLocalResponses([]));
  }

  async function handleSaveSurvey(updated: SurveySchema) {
    setSurvey(saveSurveySchema(updated));
  }

  async function handleResetSurvey() {
    setSurvey(resetSurveySchema());
  }

  const handleConsumePreselect = useCallback(() => {
    setPreselectedMemberId(null);
    setPreselectedComboPatch(null);
  }, []);

  function handleExportCsv() {
    exportResponsesCsvDirect(survey, responses);
  }

  const navItems: Array<{ id: ActiveView; label: string }> = [
    { id: 'survey', label: 'แบบสำรวจ' },
    { id: 'menu', label: 'เมนู ≤ 150฿' },
    { id: 'analytics', label: 'สรุปผล' },
    { id: 'sheets', label: 'Google Sheet' },
    { id: 'builder', label: 'ตั้งค่าคำถาม' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F7] text-[#161B18]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-[#E2E6E3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('survey')}
            className="font-serif text-xl font-bold tracking-tight text-[#161B18] whitespace-nowrap shrink-0 cursor-pointer"
          >
            ลิ้มรส
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-[#1B5E3F] border-[#1B5E3F]'
                      : 'text-[#57605B] border-transparent hover:text-[#161B18]'
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1B5E3F] rounded-lg hover:bg-[#144730] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="md:hidden border-t border-[#EEF1EE] px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#1B5E3F] text-white'
                    : 'text-[#57605B] bg-[#F7F8F7]'
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
        {activeView === 'survey' && (
          <SurveyView
            survey={survey}
            responses={responses}
            preselectedMemberId={preselectedMemberId}
            preselectedComboPatch={preselectedComboPatch}
            onConsumePreselect={handleConsumePreselect}
            onSubmitted={handleSubmitted}
            onNavigateAnalytics={() => setActiveView('analytics')}
            onNavigateMenu={() => setActiveView('menu')}
          />
        )}

        {activeView === 'menu' && (
          <MenuCatalogView
            onApplyToSurvey={(patch) => {
              setPreselectedComboPatch(patch);
              setActiveView('survey');
            }}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            survey={survey}
            responses={responses}
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

        {activeView === 'sheets' && (
          <GoogleSheetSyncView
            survey={survey}
            responses={responses}
            onSaveSurvey={handleSaveSurvey}
          />
        )}

        {activeView === 'builder' && (
          <BuilderView
            survey={survey}
            onSaveSurvey={handleSaveSurvey}
            onResetSurvey={handleResetSurvey}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-[#E2E6E3] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#57605B]">
          <div>แบบสำรวจอาหารและเครื่องดื่ม COFFEE SMITR · งบประมาณไม่เกิน {survey.budgetLimitBaht} บาท/ท่าน</div>
          <div>สั่งจองล่วงหน้า 2 วันผ่าน LINE OA @coffeesmitr · ออกใบกำกับภาษีได้ · ราคารวม VAT แล้ว</div>
        </div>
      </footer>
    </div>
  );
}
