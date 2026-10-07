import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenVideoTour: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenVideoTour }) => {
  return (
    <section id="hero" className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Editorial Content (lg:col-span-6) */}
          <div className="lg:col-span-6 flex flex-col justify-center z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                MODERN DENTAL CARE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-normal text-[#171717] leading-[1.05] tracking-tight mb-6">
              Confident <br />
              <span className="italic font-light">Smiles for a</span> <br />
              Brighter You
            </h1>

            {/* Supporting Copy */}
            <p className="font-sans text-base md:text-lg text-[#6F6B65] leading-relaxed max-w-xl mb-8">
              Advanced dental treatments with cutting-edge technology, personalized care, and a focus on your comfort and long-term oral health.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-3 bg-[#171717] hover:bg-[#252525] text-[#F4F1EB] px-8 py-3.5 rounded-full font-sans text-sm font-medium tracking-wide transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] group"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              <a
                href="#services"
                className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#E9E4DC] text-[#171717] px-7 py-3.5 rounded-full font-sans text-sm font-medium border border-[#D7D2C9] transition-all duration-300"
              >
                <span>Explore Services</span>
              </a>
            </div>

            {/* Stats Row */}
            <div className="pt-6 border-t border-[#D7D2C9]/80 flex items-center gap-8 sm:gap-12">
              <div>
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-[#171717] leading-none mb-1">
                  5K+
                </p>
                <p className="font-sans text-xs text-[#6F6B65] tracking-wider uppercase">
                  Happy Patients
                </p>
              </div>

              <div className="w-[1px] h-10 bg-[#D7D2C9]"></div>

              <div>
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-[#171717] leading-none mb-1">
                  9+
                </p>
                <p className="font-sans text-xs text-[#6F6B65] tracking-wider uppercase">
                  Specialized Services
                </p>
              </div>

              <div className="w-[1px] h-10 bg-[#D7D2C9]"></div>

              <div>
                <p className="font-serif text-3xl sm:text-4xl font-semibold text-[#171717] leading-none mb-1">
                  98%
                </p>
                <p className="font-sans text-xs text-[#6F6B65] tracking-wider uppercase">
                  Patient Satisfaction
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Composition (lg:col-span-6) */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[540px]">
              
              {/* Main Portrait Frame with Organic Mask & Soft Shadow */}
              <div className="relative rounded-[2.5rem] overflow-hidden bg-[#E9E4DC] aspect-[4/5] shadow-[0_20px_60px_-15px_rgba(23,23,23,0.12)] border border-[#D7D2C9]/60 group">
                <img
                  src="/assets/hero_patient.jpg"
                  alt="Radiant patient smile at Dental Prime"
                  loading="eager"
                  width={540}
                  height={675}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>

                {/* Handwritten Script Overlay */}
                <div className="absolute bottom-6 left-8 z-10 pointer-events-none">
                  <p className="font-script text-white text-3xl sm:text-4xl md:text-5xl font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transform -rotate-3 tracking-wide">
                    A Healthier <br />
                    <span className="ml-6">Happier You</span>
                  </p>
                </div>
              </div>

              {/* Floating Top Right Card: Modern Dentistry */}
              <div className="hidden sm:block absolute -top-6 -right-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#D7D2C9] shadow-elevated max-w-[190px]">
                <p className="font-sans text-xs font-semibold text-[#171717] leading-snug">
                  Modern Dentistry <br />
                  <span className="text-[#6F6B65] font-normal">for a Healthier Tomorrow</span>
                </p>
                <div className="w-full h-[1px] bg-[#D7D2C9] my-2.5"></div>
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/Explore/e3.jpg"
                    alt="Patient smile thumbnail"
                    loading="lazy"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-xl object-cover border border-[#D7D2C9]"
                  />
                  <img
                    src="/assets/service-section/04_dental_implant.png"
                    alt="Tooth model thumbnail"
                    loading="lazy"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-xl object-cover border border-[#D7D2C9] bg-[#F4F1EB]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/Explore/e2.jpg';
                    }}
                  />
                </div>
              </div>

              {/* Floating Circular Video Tour Button */}
              <button
                onClick={onOpenVideoTour}
                aria-label="Play clinic video tour"
                className="absolute -bottom-6 -right-4 sm:bottom-8 sm:-right-8 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 pr-5 rounded-full border border-[#D7D2C9] shadow-elevated hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#D7D2C9] flex items-center justify-center bg-[#171717]">
                  <img
                    src="/assets/Explore/e4.jpg"
                    alt="Clinic preview"
                    loading="lazy"
                    width={48}
                    height={48}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                  />
                  <Play className="w-5 h-5 text-white fill-white relative z-10 ml-0.5" />
                </div>
                <div className="text-left">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-[#6F6B65] font-semibold">
                    Interactive
                  </p>
                  <p className="font-sans text-xs font-bold text-[#171717] tracking-tight">
                    WATCH CLINIC TOUR
                  </p>
                </div>
              </button>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
