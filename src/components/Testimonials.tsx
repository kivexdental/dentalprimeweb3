import React, { useState } from 'react';
import { ArrowRight, Star, ChevronRight } from 'lucide-react';
import { TESTIMONIALS_DATA } from '../data/clinicData';

interface TestimonialsProps {
  onOpenBooking: () => void;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ onOpenBooking }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };

  const currentTestimonial = TESTIMONIALS_DATA[currentIndex];

  const communityAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading & CTA (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                WHAT OUR PATIENTS SAY
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#171717] leading-[1.1] tracking-tight mb-6">
              Smiles That <br />
              <span className="italic font-light">Speak for Us</span>
            </h2>

            <button
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group"
            >
              <span>View All Reviews</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Center Column: White Testimonial Card (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#D7D2C9] shadow-elevated relative flex flex-col justify-between min-h-[280px]">
              <div>
                <p className="font-serif italic text-lg sm:text-xl text-[#171717] leading-relaxed mb-6">
                  {currentTestimonial.quote}
                </p>

                <div className="flex items-center gap-1 mb-6 text-[#B9B1A5]">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F4F1EB]">
                <div className="flex items-center gap-3">
                  <img
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#D7D2C9]"
                  />
                  <div>
                    <h4 className="font-sans text-sm font-bold text-[#171717]">
                      {currentTestimonial.name}
                    </h4>
                    <p className="font-sans text-xs text-[#6F6B65]">
                      {currentTestimonial.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  aria-label="Next review"
                  className="w-10 h-10 rounded-full border border-[#D7D2C9] hover:border-[#171717] bg-[#F4F1EB] hover:bg-[#171717] text-[#171717] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dark Stat Card (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <div className="bg-[#171717] text-white rounded-3xl p-8 border border-[#252525] shadow-elevated flex flex-col justify-between min-h-[280px]">
              <div>
                <p className="font-serif text-5xl font-normal tracking-tight text-white mb-2">
                  5K+
                </p>
                <p className="font-sans text-sm uppercase tracking-widest text-[#B9B1A5] font-semibold">
                  Happy Patients
                </p>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex -space-x-3 mb-4">
                  {communityAvatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Happy patient avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#171717]"
                    />
                  ))}
                </div>
                <p className="font-sans text-xs text-[#E9E4DC]/80 leading-relaxed">
                  Trusted by families across Ahmedabad and beyond.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
