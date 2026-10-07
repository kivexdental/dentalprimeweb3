import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PROCESS_STEPS } from '../data/clinicData';

interface TreatmentProcessProps {
  onOpenBooking: () => void;
}

export const TreatmentProcess: React.FC<TreatmentProcessProps> = ({ onOpenBooking }) => {
  return (
    <section className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header with CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                OUR PROCESS
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#171717] leading-[1.1] tracking-tight">
              A Simple Journey <br />
              <span className="italic font-light">to a Better Smile</span>
            </h2>
          </div>

          <button
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group shrink-0 self-start md:self-auto"
          >
            <span>Book Your Consultation</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* 5-Step Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {PROCESS_STEPS.map((step, idx) => (
            <div key={step.number} className="relative flex flex-col group">
              {/* Step Card */}
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-[#D7D2C9] hover:border-[#171717] shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
                <div>
                  {/* Top: Number and Arrow */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-serif text-2xl font-bold text-[#171717] group-hover:text-[#6F6B65] transition-colors">
                      {step.number}
                    </span>
                    {idx < PROCESS_STEPS.length - 1 ? (
                      <span className="text-[#6F6B65] group-hover:text-[#171717] group-hover:translate-x-1 transition-all duration-300 font-sans text-xs">
                        ➔
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#171717]"></span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-sans text-base font-semibold text-[#171717] mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="font-sans text-xs text-[#6F6B65] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#D7D2C9]/60">
                  <span className="text-[10px] uppercase font-sans tracking-widest text-[#B9B1A5] font-semibold">
                    Step {idx + 1} of 5
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
