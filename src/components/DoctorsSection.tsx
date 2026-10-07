import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { DOCTORS_DATA } from '../data/clinicData';
import { DoctorItem } from '../types';

interface DoctorsSectionProps {
  onSelectDoctor: (doctor: DoctorItem) => void;
  onOpenBookingWithDoctor: (doctorId: string) => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({
  onSelectDoctor,
  onOpenBookingWithDoctor
}) => {
  return (
    <section id="doctors" className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                OUR DOCTORS
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#171717] leading-[1.1] tracking-tight">
              Expert Team, <br />
              <span className="italic font-light">Compassionate Care</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <p className="font-sans text-sm md:text-base text-[#6F6B65] max-w-md">
              Meet our qualified and experienced dental specialists who are dedicated to your smile and oral health.
            </p>
            <button
              onClick={() => onOpenBookingWithDoctor('dr-aditi')}
              className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group shrink-0"
            >
              <span>View All Doctors</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* 4 Doctor Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DOCTORS_DATA.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDoctor(doc)}
              className="group bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#D7D2C9] shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"
            >
              {/* Doctor Portrait */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#E9E4DC]">
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Doctor Info */}
              <div className="p-5 flex items-end justify-between gap-3 bg-white">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#171717] group-hover:text-[#6F6B65] transition-colors leading-tight mb-1">
                    {doc.name}
                  </h3>
                  <p className="font-sans text-xs text-[#6F6B65] font-medium leading-relaxed">
                    {doc.specialty}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBookingWithDoctor(doc.id);
                  }}
                  aria-label={`Book consultation with ${doc.name}`}
                  className="w-8 h-8 rounded-full border border-[#D7D2C9] group-hover:border-[#171717] bg-[#F4F1EB] group-hover:bg-[#171717] text-[#171717] group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-300"
                >
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
