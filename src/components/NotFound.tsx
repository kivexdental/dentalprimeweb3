import React from 'react';
import { ArrowLeft, Home, Calendar, Phone } from 'lucide-react';

interface NotFoundProps {
  onReturnHome: () => void;
  onOpenBooking: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onReturnHome, onOpenBooking }) => {
  return (
    <div className="min-h-screen bg-[#F4F1EB] text-[#171717] flex flex-col justify-between p-6 sm:p-12">
      {/* Brand Header */}
      <div className="flex items-center gap-2">
        <span className="font-serif italic font-bold text-3xl text-[#171717]">D/</span>
        <div className="flex flex-col">
          <span className="font-sans font-semibold text-xs tracking-[0.2em] text-[#171717] uppercase">
            DENTAL PRIME
          </span>
          <span className="font-sans text-[9px] tracking-widest text-[#6F6B65] uppercase">
            STUDIO & CLINIC
          </span>
        </div>
      </div>

      {/* Main 404 Content */}
      <div className="max-w-xl mx-auto text-center py-16">
        <span className="inline-block bg-[#E9E4DC] text-[#171717] px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-widest mb-6">
          Error 404 • Page Not Found
        </span>
        <h1 className="font-serif text-5xl sm:text-6xl text-[#171717] font-normal tracking-tight mb-4">
          A Flawless Smile, <br />
          <span className="italic font-light">An Untracked Path</span>
        </h1>
        <p className="font-sans text-sm sm:text-base text-[#6F6B65] leading-relaxed mb-8">
          The dental suite or resource you are looking for has been relocated or does not exist. Let us guide you back to our studio services.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onReturnHome}
            className="inline-flex items-center gap-2 bg-[#171717] hover:bg-[#252525] text-white px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all shadow"
          >
            <Home className="w-4 h-4" />
            <span>Return to Studio</span>
          </button>
          <button
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2 border border-[#D7D2C9] bg-white hover:bg-[#E9E4DC] text-[#171717] px-6 py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Reserve Appointment</span>
          </button>
        </div>
      </div>

      {/* Contact Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#6F6B65] border-t border-[#D7D2C9] pt-6 gap-4">
        <span>123 Smile Street, Science City, Ahmedabad 380060</span>
        <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-[#171717] transition-colors">
          <Phone className="w-3.5 h-3.5" />
          <span>Concierge: +91 98765 43210</span>
        </a>
      </div>
    </div>
  );
};
