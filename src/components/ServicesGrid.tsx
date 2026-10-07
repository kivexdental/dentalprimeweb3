import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SERVICES_DATA } from '../data/clinicData';
import { ServiceItem } from '../types';

interface ServicesGridProps {
  onSelectService: (service: ServiceItem) => void;
  onOpenBookingWithService: (serviceId: string) => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({
  onSelectService,
  onOpenBookingWithService
}) => {
  return (
    <section id="services" className="py-20 md:py-28 bg-[#F4F1EB] relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Asymmetrical Editorial Header / Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Heading & Copy (lg:col-span-4) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                OUR SERVICES
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-normal text-[#171717] leading-[1.1] tracking-tight mb-6">
              Complete <br />
              Dental Care <br />
              <span className="italic font-light">Under One Roof</span>
            </h2>

            <p className="font-sans text-base text-[#6F6B65] leading-relaxed mb-8">
              From routine check-ups to advanced treatments, we offer a wide range of dental solutions designed for your smile, health, and confidence.
            </p>

            <button
              onClick={() => onOpenBookingWithService('general')}
              className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group"
            >
              <span>View All Services</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Right Column: 3x3 Luxury Service Grid (lg:col-span-8) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
              {SERVICES_DATA.map((service) => (
                <div
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className="group relative h-48 sm:h-56 md:h-60 rounded-2xl overflow-hidden cursor-pointer bg-[#252525] border border-[#D7D2C9]/60 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between p-5"
                >
                  {/* Background Image with Dark Vignette */}
                  <img
                    src={service.image}
                    alt={service.title.replace('\n', ' ')}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 group-hover:from-black/90 group-hover:via-black/55 transition-colors duration-500"></div>

                  {/* Card Header: Number */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="font-serif text-sm font-medium text-white/70 tracking-widest">
                      {service.number}
                    </span>
                  </div>

                  {/* Card Bottom: Title & Arrow */}
                  <div className="relative z-10 flex items-end justify-between gap-2">
                    <h3 className="font-sans text-sm md:text-[15px] font-semibold text-white leading-snug whitespace-pre-line group-hover:translate-x-1 transition-transform duration-300">
                      {service.title}
                    </h3>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBookingWithService(service.id);
                      }}
                      aria-label={`Book ${service.title.replace('\n', ' ')}`}
                      className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white text-white group-hover:text-[#171717] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                    >
                      <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
