import React from 'react';
import { ClinicLocation } from './ClinicLocation';
import { FAQSection } from './FAQSection';
import { ArrowUpRight } from 'lucide-react';

interface LocationAndFAQProps {
  onOpenBooking: () => void;
}

export const LocationAndFAQ: React.FC<LocationAndFAQProps> = ({ onOpenBooking }) => {
  return (
    <section id="location" className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          
          {/* Left Column: Clinic Contact & Hours (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <ClinicLocation />
          </div>

          {/* Center Column: Map & Clinic Lounge Photos (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Custom Map Graphic */}
            <div className="relative rounded-2xl overflow-hidden bg-[#E9E4DC] border border-[#D7D2C9] h-48 shadow-sm flex items-center justify-center p-4 group">
              {/* Stylized Minimal Map Background */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#6F6B65_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              {/* Road lines simulation */}
              <svg className="absolute inset-0 w-full h-full stroke-[#D7D2C9] fill-none" strokeWidth="2.5">
                <path d="M-20,60 C100,50 150,140 280,110 S400,180 500,160" />
                <path d="M80,-20 C90,80 120,130 140,240" strokeWidth="3" stroke="#B9B1A5" />
                <path d="M220,-20 C230,100 260,160 300,240" />
              </svg>

              {/* Pin Badge */}
              <div className="relative z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full border border-[#D7D2C9] shadow-elevated flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#171717] text-white flex items-center justify-center text-xs">
                  ★
                </div>
                <div>
                  <p className="font-sans text-xs font-bold text-[#171717] leading-tight">
                    Dental Prime
                  </p>
                  <p className="font-sans text-[10px] text-[#6F6B65]">
                    Science City, Ahmedabad
                  </p>
                </div>
              </div>

              {/* External Link Pill */}
              <a
                href="https://maps.google.com/?q=Science+City+Ahmedabad"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center shadow hover:scale-110 transition-transform"
                aria-label="Open in Google Maps"
              >
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            {/* Clinic Reception Lounge Photo (e1.jpg) */}
            <div className="relative rounded-2xl overflow-hidden bg-[#252525] border border-[#D7D2C9] h-52 shadow-sm group">
              <img
                src="/assets/Explore/e1.jpg"
                alt="Dental Prime Reception and VIP Patient Lounge"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-3 left-4 z-10">
                <span className="font-serif italic text-white/90 text-sm">
                  Executive Patient Sanctuary
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <FAQSection onOpenBooking={onOpenBooking} />
          </div>

        </div>
      </div>
    </section>
  );
};
