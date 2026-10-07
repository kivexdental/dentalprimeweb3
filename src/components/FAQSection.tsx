import React, { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { FAQ_DATA } from '../data/clinicData';

interface FAQSectionProps {
  onOpenBooking: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenBooking }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
          <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
            FAQ
          </span>
        </div>

        <h2 className="font-serif text-4xl sm:text-5xl lg:text-[50px] font-normal text-[#171717] leading-[1.1] tracking-tight mb-8">
          Got Questions?
        </h2>

        {/* Accordion list */}
        <div className="divide-y divide-[#D7D2C9]">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  onClick={() => toggleItem(idx)}
                  className="w-full flex items-center justify-between text-left group gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-sm sm:text-base font-semibold text-[#171717] group-hover:text-[#6F6B65] transition-colors">
                    {item.question}
                  </span>
                  <div className={`w-7 h-7 rounded-full border border-[#D7D2C9] flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45 bg-[#171717] text-white border-[#171717]' : 'text-[#171717] group-hover:border-[#171717]'}`}>
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-3 text-xs sm:text-sm text-[#6F6B65] font-sans leading-relaxed pr-6 animate-fadeIn">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-8">
        <button
          onClick={onOpenBooking}
          className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group"
        >
          <span>View All FAQs</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};
