import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Tablet as TabletIcon, Smartphone, Maximize2, X, SlidersHorizontal } from 'lucide-react';

export type DeviceMode = 'pc' | 'tablet' | 'phone' | 'fullscreen';

interface DeviceConfig {
  id: DeviceMode;
  name: string;
  width: string;
  height: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  description: string;
}

const DEVICES: DeviceConfig[] = [
  {
    id: 'pc',
    name: 'PC',
    width: '1280px',
    height: '100%',
    icon: Monitor,
    shortcut: '1',
    description: '1280px Viewport',
  },
  {
    id: 'tablet',
    name: 'Tablet',
    width: '768px',
    height: '1000px',
    icon: TabletIcon,
    shortcut: '2',
    description: '768px Viewport',
  },
  {
    id: 'phone',
    name: 'Phone',
    width: '390px',
    height: '844px',
    icon: Smartphone,
    shortcut: '3',
    description: '390px Viewport',
  },
  {
    id: 'fullscreen',
    name: 'Fullscreen',
    width: '100%',
    height: '100%',
    icon: Maximize2,
    shortcut: '4',
    description: '100% Fluid Canvas',
  },
];

/**
 * FIXED KIVEX TECHNOLOGY BRAND IDENTITY
 * Specifications:
 * 1. Single horizontal line (white-space: nowrap).
 * 2. NO separate background (sits directly on toolbar #F5EFE5 background).
 * 3. Rendered as crisp text (NOT an image).
 * 4. KIVEX: #2D5FC7 (uppercase, bold/heavy).
 * 5. Technology: #E8B62A (warm KIVEX gold/yellow).
 * 6. Permanent: Never derived from or replaced by the website's logo or title.
 */
export const KivexBrand: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`inline-flex items-baseline select-none whitespace-nowrap gap-1.5 font-sans ${className}`}
      style={{ whiteSpace: 'nowrap' }}
    >
      <span
        style={{ color: '#2D5FC7' }}
        className="font-black tracking-tight uppercase text-lg sm:text-xl leading-none"
      >
        KIVEX
      </span>
      <span
        style={{ color: '#E8B62A' }}
        className="font-bold tracking-normal text-xs sm:text-sm leading-none"
      >
        Technology
      </span>
    </div>
  );
};

export const KivexToolbar: React.FC = () => {
  const [mode, setMode] = useState<DeviceMode>('pc');
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<'website' | 'crm'>('website');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Keyboard navigation shortcuts: 1 (PC), 2 (Tablet), 3 (Phone), 4 (Fullscreen), Esc (Close toolbar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form controls
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) {
        return;
      }

      if (e.key === '1') {
        setMode('pc');
      } else if (e.key === '2') {
        setMode('tablet');
      } else if (e.key === '3') {
        setMode('phone');
      } else if (e.key === '4') {
        setMode('fullscreen');
      } else if (e.key === 'Escape') {
        setIsToolbarVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden text-[#171717] font-sans select-none">
      {/* 1. KIVEX LIGHT TOOLBAR (#F5EFE5 Background, Cross Button, Device Controls) */}
      {isToolbarVisible && (
        <header
          role="toolbar"
          aria-label="KIVEX Technology Responsive Device Preview Toolbar"
          style={{ backgroundColor: '#F5EFE5' }}
          className="h-14 border-b border-[#E6DEC8] px-4 sm:px-6 flex items-center justify-between z-50 shrink-0 shadow-sm text-xs select-none"
        >
          {/* Left: Permanent Single-Line KIVEX Technology Brand + Target Preview Switcher */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <KivexBrand />
            <div className="hidden sm:flex items-center p-0.5 bg-[#EBE3D5] rounded-full border border-[#DDD3BF]">
              <button
                type="button"
                onClick={() => setPreviewTarget('website')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  previewTarget === 'website'
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'text-[#5C564E] hover:text-[#171717]'
                }`}
              >
                Website
              </button>
              <button
                type="button"
                onClick={() => setPreviewTarget('crm')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  previewTarget === 'crm'
                    ? 'bg-[#C2644F] text-white shadow-sm'
                    : 'text-[#5C564E] hover:text-[#171717]'
                }`}
              >
                CRM Portal
              </button>
            </div>
          </div>

          {/* Right: Device Controls & Cross Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Desktop / Tablet Device View Pill Group */}
            <div
              role="radiogroup"
              aria-label="Select Device Mode"
              className="hidden sm:flex items-center p-1 bg-[#EBE3D5] rounded-full border border-[#DDD3BF]"
            >
              {DEVICES.map((dev) => {
                const Icon = dev.icon;
                const isActive = mode === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => setMode(dev.id)}
                    role="radio"
                    aria-checked={isActive}
                    aria-label={`${dev.name} Mode (${dev.shortcut})`}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#2D5FC7] text-white shadow-sm'
                        : 'text-[#5C564E] hover:text-[#171717] hover:bg-[#F5EFE5]/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{dev.name}</span>
                    <span
                      className={`text-[9px] px-1 rounded ${
                        isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#736B61]'
                      }`}
                    >
                      {dev.shortcut}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Device Selector Trigger */}
            <button
              onClick={() => setIsPanelOpen((prev) => !prev)}
              aria-label="Open Device View Panel"
              className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#EBE3D5] rounded-full border border-[#DDD3BF] text-xs font-semibold text-[#5C564E]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="capitalize">{mode}</span>
            </button>

            {/* Separator */}
            <span className="h-5 w-[1px] bg-[#DDD3BF]" />

            {/* Cross / Close Button (×) */}
            <button
              onClick={() => setIsToolbarVisible(false)}
              title="Close Preview Toolbar (Esc)"
              aria-label="Close Preview Toolbar"
              className="p-1.5 rounded-full text-[#5C564E] hover:text-[#171717] hover:bg-[#EBE3D5] transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {/* 2. DEVICE VIEW EXPANDED MODAL / PANEL (For compact screens or mobile drawer) */}
      {isToolbarVisible && isPanelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Device Views Panel"
          className="fixed inset-x-4 top-16 z-50 sm:hidden bg-[#F5EFE5] border border-[#DDD3BF] rounded-2xl shadow-2xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#DDD3BF]">
            <KivexBrand />
            <button
              onClick={() => setIsPanelOpen(false)}
              aria-label="Close Device Panel"
              className="p-1 rounded-full text-[#5C564E] hover:text-[#171717]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {DEVICES.map((dev) => {
              const Icon = dev.icon;
              const isActive = mode === dev.id;
              return (
                <button
                  key={dev.id}
                  onClick={() => {
                    setMode(dev.id);
                    setIsPanelOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#2D5FC7] text-white shadow-sm'
                      : 'bg-[#EBE3D5] text-[#5C564E] hover:bg-[#DDD3BF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{dev.name} Mode</span>
                  </div>
                  <span className="text-[10px] opacity-75">{dev.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PREVIEW WORKSPACE AREA (Single Persistent Iframe Architecture) */}
      <main
        className={`flex-1 relative flex items-center justify-center overflow-auto ${
          mode === 'fullscreen' || !isToolbarVisible
            ? 'p-0 bg-transparent'
            : 'p-4 md:p-6 bg-[#EBE4D8]'
        }`}
      >
        <div
          className={`transition-all duration-300 ease-out flex flex-col shrink-0 ${
            !isToolbarVisible || mode === 'fullscreen'
              ? 'w-full h-full rounded-none border-0 shadow-none bg-transparent'
              : mode === 'phone'
              ? 'w-[390px] h-[844px] max-h-[92vh] my-auto rounded-[44px] border-[10px] border-[#1e1e24] shadow-[0_25px_70px_rgba(0,0,0,0.3)] bg-[#1e1e24] relative overflow-hidden'
              : mode === 'tablet'
              ? 'w-[768px] max-w-[98%] h-[1000px] max-h-[92vh] my-auto rounded-[32px] border-[10px] border-[#1e1e24] shadow-[0_25px_70px_rgba(0,0,0,0.25)] bg-[#1e1e24] overflow-hidden'
              : 'w-[1280px] max-w-[98%] h-[90vh] my-auto rounded-2xl border border-[#D5CBB8] shadow-[0_25px_70px_rgba(0,0,0,0.2)] bg-[#1e1e24] overflow-hidden'
          }`}
        >
          {/* PC Browser Chrome Header */}
          {isToolbarVisible && mode === 'pc' && (
            <div className="h-10 bg-[#252528] border-b border-white/10 px-4 flex items-center gap-3 shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-black/40 rounded-lg px-3 py-1 text-[11px] text-slate-300 font-mono text-center flex items-center justify-center gap-2 border border-white/5">
                <span className="text-emerald-400">🔒</span>
                <span>https://dentalprime.clinic</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">1280px</span>
            </div>
          )}

          {/* Tablet Top Camera Bezel */}
          {isToolbarVisible && mode === 'tablet' && (
            <div className="h-5 bg-[#1e1e24] flex items-center justify-center shrink-0 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-black/80 border border-white/10" />
            </div>
          )}

          {/* Phone Dynamic Island Notch */}
          {isToolbarVisible && mode === 'phone' && (
            <div className="absolute top-2 inset-x-0 flex justify-center z-30 pointer-events-none select-none">
              <div className="w-24 h-5 rounded-full bg-black flex items-center justify-end px-2 gap-1.5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-blue-500/80" />
                <span className="w-1.5 h-1.5 rounded-full bg-black/60" />
              </div>
            </div>
          )}

          {/* Iframe Viewport Container — Reused single persistent iframe across all device modes */}
          <div
            className={`flex-1 w-full bg-[#F4F1EB] overflow-hidden ${
              isToolbarVisible && mode === 'tablet'
                ? 'rounded-b-[22px]'
                : isToolbarVisible && mode === 'phone'
                ? 'rounded-[34px] pt-3'
                : ''
            }`}
          >
            <iframe
              ref={iframeRef}
              src={previewTarget === 'crm' ? '/dashboard.html' : '/?embed=true'}
              title={previewTarget === 'crm' ? 'Dental Clinic CRM System' : 'KIVEX Technology Responsive Viewport Preview'}
              className="w-full h-full border-0 bg-[#F4F1EB]"
            />
          </div>

          {/* Phone Bottom Home Indicator Bar */}
          {isToolbarVisible && mode === 'phone' && (
            <div className="h-4 bg-[#1e1e24] flex items-center justify-center shrink-0 select-none">
              <div className="w-28 h-1 rounded-full bg-white/40" />
            </div>
          )}
        </div>
      </main>

      {/* 4. REOPEN TOOLBAR FLOATING BUTTON (Visible when toolbar is closed via ×) */}
      {!isToolbarVisible && (
        <div className="fixed bottom-5 left-5 z-50">
          <button
            onClick={() => setIsToolbarVisible(true)}
            aria-label="Restore KIVEX Technology Preview Toolbar"
            style={{ backgroundColor: '#F5EFE5' }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl border border-[#DDD3BF] hover:shadow-2xl transition-all hover:scale-105 active:scale-95 group"
          >
            <KivexBrand />
            <span className="h-4 w-[1px] bg-[#DDD3BF]" />
            <span className="text-[11px] font-semibold text-[#2D5FC7] flex items-center gap-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D5FC7] animate-pulse" />
              <span>Preview</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default KivexToolbar;
