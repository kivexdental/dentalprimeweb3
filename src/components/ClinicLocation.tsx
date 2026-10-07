import React from 'react';
import { MapPin, Clock, ArrowRight, ArrowUpRight } from 'lucide-react';

export const ClinicLocation: React.FC = () => {
  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
          <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
            VISIT OUR CLINIC
          </span>
        </div>

        <h2 className="font-serif text-4xl sm:text-5xl lg:text-[50px] font-normal text-[#171717] leading-[1.1] tracking-tight mb-8">
          Conveniently <br />
          <span className="italic font-light">Located for You</span>
        </h2>

        {/* Address and Hours */}
        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full border border-[#D7D2C9] bg-white flex items-center justify-center shrink-0 text-[#171717]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-[#171717]">
                Science City Studio
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#6F6B65] leading-relaxed mt-0.5">
                123 Smile Street, Science City, Ahmedabad, Gujarat 380060, India
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full border border-[#D7D2C9] bg-white flex items-center justify-center shrink-0 text-[#171717]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans text-sm font-bold text-[#171717]">
                Studio Hours
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#6F6B65] leading-relaxed mt-0.5">
                Mon – Sat: 10:00 AM – 8:00 PM <br />
                Sunday: 10:00 AM – 2:00 PM
              </p>
            </div>
          </div>
        </div>

        <a
          href="https://maps.google.com/?q=Science+City+Ahmedabad"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group"
        >
          <span>Get Directions</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </a>
      </div>
    </div>
  );
};
