import React, { useState, useRef, useCallback } from 'react';
import { ArrowRight, MoveHorizontal, Sparkles } from 'lucide-react';

interface BeforeAfterProps {
  onOpenBooking: () => void;
}

export const BeforeAfter: React.FC<BeforeAfterProps> = ({ onOpenBooking }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState<'slider' | 'side-by-side'>('side-by-side');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <section id="results" className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading & Description (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                REAL RESULTS
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#171717] leading-[1.1] tracking-tight mb-6">
              Transforming <br />
              <span className="italic font-light">Smiles,</span> <br />
              Changing Lives
            </h2>

            <p className="font-sans text-base text-[#6F6B65] leading-relaxed mb-8">
              See the difference advanced dental care can make. From stained and uneven teeth to brighter, healthier, and more confident smiles.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group"
              >
                <span>Book Consultation</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* View Mode Toggle Pill */}
              <div
                role="group"
                aria-label="Before and after display mode"
                className="inline-flex items-center p-1 bg-[#E9E4DC] rounded-full border border-[#D7D2C9] text-xs font-sans"
              >
                <button
                  type="button"
                  onClick={() => setActiveView('side-by-side')}
                  aria-pressed={activeView === 'side-by-side'}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeView === 'side-by-side'
                      ? 'bg-white text-[#171717] font-semibold shadow-sm'
                      : 'text-[#6F6B65] hover:text-[#171717]'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('slider')}
                  aria-pressed={activeView === 'slider'}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    activeView === 'slider'
                      ? 'bg-white text-[#171717] font-semibold shadow-sm'
                      : 'text-[#6F6B65] hover:text-[#171717]'
                  }`}
                >
                  Interactive Slider
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Comparison Presentation (lg:col-span-8) */}
          <div className="lg:col-span-8">
            {activeView === 'side-by-side' ? (
              /* Reference Layout: Two Large Panels */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* Before Panel */}
                <div className="relative rounded-3xl overflow-hidden bg-[#E9E4DC] border border-[#D7D2C9] shadow-sm group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src="/assets/befor and after/dirty.png"
                      alt="Clinical case before teeth scaling and whitening"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 z-10">
                    <span className="inline-block bg-white/90 backdrop-blur-md px-5 py-1.5 rounded-full font-sans text-xs font-semibold text-[#171717] tracking-wider uppercase border border-[#D7D2C9] shadow-sm">
                      Before
                    </span>
                  </div>
                </div>

                {/* After Panel */}
                <div className="relative rounded-3xl overflow-hidden bg-[#E9E4DC] border border-[#D7D2C9] shadow-sm group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src="/assets/befor and after/clean.png"
                      alt="Clinical case after teeth scaling and whitening transformation"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-[#171717] text-white px-5 py-1.5 rounded-full font-sans text-xs font-semibold tracking-wider uppercase shadow-md">
                      <Sparkles className="w-3 h-3 text-[#B9B1A5]" />
                      After
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Interactive Split Slider */
              <div
                ref={containerRef}
                role="slider"
                tabIndex={0}
                aria-label="Before and after dental smile comparison slider"
                aria-valuenow={Math.round(sliderPosition)}
                aria-valuemin={0}
                aria-valuemax={100}
                onKeyDown={handleKeyDown}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setIsDragging(false)}
                className="relative aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden cursor-ew-resize select-none border border-[#D7D2C9] shadow-elevated bg-[#E9E4DC] touch-pan-y focus:outline-none focus:ring-2 focus:ring-[#171717]"
              >
                {/* Background Image: Clean (After) */}
                <img
                  src="/assets/befor and after/clean.png"
                  alt="Smile After"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Clipped Foreground Image: Dirty (Before) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src="/assets/befor and after/dirty.png"
                    alt="Smile Before"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{
                      width: containerRef.current
                        ? `${containerRef.current.clientWidth}px`
                        : '100%',
                    }}
                  />
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-[#D7D2C9] flex items-center justify-center text-[#171717]">
                    <MoveHorizontal className="w-4 h-4" />
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute bottom-4 left-4 pointer-events-none">
                  <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full font-sans text-xs font-semibold text-[#171717] uppercase tracking-wider border border-[#D7D2C9]">
                    Before
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 pointer-events-none">
                  <span className="bg-[#171717] text-white px-4 py-1.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider shadow">
                    After
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
