import React from 'react';
import { ArrowRight, Play, Cpu, Users, HeartHandshake, Smile } from 'lucide-react';

interface AboutSectionProps {
  onOpenVideoTour: () => void;
  onOpenBooking: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onOpenVideoTour, onOpenBooking }) => {
  const highlights = [
    {
      icon: Cpu,
      title: 'Modern Technology',
      desc: '3D CBCT imaging, guided implants, and digital smile design.'
    },
    {
      icon: Users,
      title: 'Experienced Team',
      desc: 'Master specialists dedicated to gentle, predictable outcomes.'
    },
    {
      icon: HeartHandshake,
      title: 'Personalized Care',
      desc: 'Tailored care plans focused on long-term dental vitality.'
    },
    {
      icon: Smile,
      title: 'Comfortable Environment',
      desc: 'Serene, anxiety-free clinic atmosphere for total peace of mind.'
    }
  ];

  return (
    <section id="about" className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading & Copy (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
              <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
                ABOUT US
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#171717] leading-[1.1] tracking-tight mb-6">
              Excellence <br />
              <span className="italic font-light">in Every Smile</span>
            </h2>

            <p className="font-sans text-base text-[#6F6B65] leading-relaxed mb-8">
              We combine advanced technology, expert care, and a personalized approach to create healthy, beautiful smiles that last a lifetime.
            </p>

            <button
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2.5 bg-transparent hover:bg-[#171717] hover:text-[#F4F1EB] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider border border-[#D7D2C9] hover:border-[#171717] transition-all duration-300 group"
            >
              <span>Our Story</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Center Column: Video / Clinic Tour Card (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden bg-[#252525] border border-[#D7D2C9] shadow-elevated group aspect-[4/3]">
              <img
                src="/assets/Explore/e4.jpg"
                alt="Dental Prime State-of-the-Art Clinic Operatory"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>

              {/* Play Button Trigger */}
              <button
                onClick={onOpenVideoTour}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-[#171717] shadow-xl group-hover:scale-110 group-hover:bg-white transition-all duration-300 border border-white"
                aria-label="Play clinic tour video"
              >
                <Play className="w-6 h-6 fill-[#171717] text-[#171717] ml-1" />
                <span className="text-[10px] font-sans font-bold tracking-wider uppercase mt-1">
                  Take a Tour
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Features & Stats (lg:col-span-3) */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-8">
            {/* 4 Feature Items */}
            <div className="space-y-4">
              {highlights.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3.5 group">
                    <div className="w-10 h-10 rounded-xl bg-[#E9E4DC] border border-[#D7D2C9] flex items-center justify-center text-[#171717] shrink-0 group-hover:bg-[#171717] group-hover:text-white transition-colors duration-300">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-sans text-sm font-semibold text-[#171717]">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vertical Stats Spread */}
            <div className="pt-6 border-t border-[#D7D2C9] space-y-4">
              <div>
                <p className="font-serif text-3xl font-semibold text-[#171717] leading-none mb-1">
                  5+
                </p>
                <p className="font-sans text-xs text-[#6F6B65] tracking-wider uppercase">
                  Years of Experience
                </p>
              </div>

              <div>
                <p className="font-serif text-3xl font-semibold text-[#171717] leading-none mb-1">
                  5K+
                </p>
                <p className="font-sans text-xs text-[#6F6B65] tracking-wider uppercase">
                  Happy Patients
                </p>
              </div>

              <div>
                <p className="font-serif text-3xl font-semibold text-[#171717] leading-none mb-1">
                  98%
                </p>
                <p className="font-sans text-xs text-[#6F6B65] tracking-wider uppercase">
                  Success Rate
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
