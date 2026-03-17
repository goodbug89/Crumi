'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

function GuideImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center justify-center h-36 bg-slate-100 text-slate-400 text-xs font-medium">
        이미지를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Guide Visual"
      className="w-full object-cover"
      style={{ maxHeight: '240px' }}
      onError={() => setFailed(true)}
    />
  );
}

function getImageUrl(type: string) {
  const images: Record<string, string> = {
    dashboard: 'dashboard.png',
    pipeline: 'pipeline.png',
    aiCoach: 'aicoach.png',
    customers: 'dashboard.png',
    projects: 'dashboard.png',
    requests: 'aicoach.png',
  };

  return `/help/${images[type] || images.dashboard}`;
}

export default function HelpGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('help');

  // 경로에 따른 가이드 데이터 매핑
  const getGuideData = () => {
    if (pathname.includes('/dashboard')) return 'dashboard';
    if (pathname.includes('/customers')) return 'customers';
    if (pathname.includes('/projects')) return 'projects';
    if (pathname.includes('/pipeline')) return 'pipeline';
    if (pathname.includes('/ai-coach')) return 'aiCoach';
    if (pathname.includes('/requests')) return 'requests';
    return 'general';
  };

  const currentType = getGuideData();

  if (currentType === 'general' && !pathname.includes('/ws/')) return null;

  return (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95 border border-slate-200 shadow-sm"
        title={t('buttonTitle')}
      >
        <span className="text-xs font-bold leading-none">?</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 border border-slate-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Guide & Tips
                </span>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  {t(`${currentType}.title`)}
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {t(`${currentType}.intro`)}
                </p>
              </div>

              {/* 이미지/비주얼 영역 */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden shadow-inner">
                <GuideImage src={getImageUrl(currentType)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['section1', 'section2'].map((sectionKey) => (
                  <div
                    key={sectionKey}
                    className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-50/30 border border-emerald-100/50"
                  >
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        !
                      </span>
                      {t(`${currentType}.${sectionKey}.title`)}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {t(`${currentType}.${sectionKey}.description`)}
                    </p>
                  </div>
                ))}
              </div>

              {/* 워크플로우 시각화 영역 */}
              <div className="flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                  {t('workflow')}
                </h4>
                <div className="flex items-center justify-between gap-2 p-2 px-4 rounded-xl bg-slate-50 border border-slate-100 overflow-x-auto scrollbar-hide">
                  {['step1', 'step2', 'step3'].map((step, idx) => (
                    <div key={step} className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-emerald-600 font-bold text-sm shadow-sm shadow-emerald-500/10">
                          {idx + 1}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                          {t(`${currentType}.${step}`)}
                        </span>
                      </div>
                      {idx < 2 && <div className="w-8 h-[2px] bg-slate-200 mb-4" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 h-11 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
