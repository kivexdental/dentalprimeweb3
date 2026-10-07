import React from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, Heart } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const safetyFeatures = [
    {
      icon: ShieldCheck,
      title: 'Sterilized Instruments',
      desc: 'World-class autoclave & sterilization protocols.'
    },
    {
      icon: Sparkles,
      title: 'Hygienic Environment',
      desc: 'Continuous multi-stage air filtration & sanitation.'
    },
    {
      icon: CheckCircle2,
      title: 'Safe Materials',
      desc: 'Strictly biocompatible & certified dental materials.'
    },
    {
      icon: Heart,
      title: 'Patient Safety',
      desc: 'Your health, comfort, and peace of mind come first.'
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F4F1EB] border-t border-[#D7D2C9]/60">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-[1px] w-6 bg-[#6F6B65]"></span>
            <span className="font-sans text-xs tracking-[0.2em] uppercase font-semibold text-[#6F6B65]">
              WHY CHOOSE US
            </span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#171717] leading-[1.1] tracking-tight">
            Safe, Hygienic <br />
            <span className="italic font-light">& Comfortable Care</span>
          </h2>
        </div>

        {/* 4 Feature Badges + Right Photographic Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: 4 Features in 2x2 Grid or 4 inline (lg:col-span-7) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {safetyFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-[#D7D2C9] shadow-sm hover:shadow-md hover:bg-white transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-full border border-[#D7D2C9] bg-[#F4F1EB] group-hover:bg-[#171717] group-hover:text-white flex items-center justify-center text-[#171717] mb-4 transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-sans text-base font-semibold text-[#171717] mb-1.5">
                    {feat.title}
                  </h3>
                  <p className="font-sans text-xs text-[#6F6B65] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: "Your Safety Our Priority" Card (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[4/3] bg-[#252525] border border-[#D7D2C9] shadow-elevated group">
              <img
                src="/assets/Explore/e2.jpg"
                alt="Safe dental treatment at Dental Prime"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

              <div className="absolute inset-0 flex flex-col justify-center p-8 sm:p-10 z-10">
                <span className="font-serif italic text-2xl sm:text-3xl text-[#E9E4DC] leading-snug">
                  Your Safety
                </span>
                <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-white tracking-tight mt-1">
                  Our Priority
                </span>
                <p className="font-sans text-xs sm:text-sm text-white/80 max-w-xs mt-3 leading-relaxed">
                  Hospital-grade sterilization with zero compromise on gentle patient hospitality.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
