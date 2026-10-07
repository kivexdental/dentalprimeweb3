import React from 'react';
import { ArrowRight, Phone, Mail, MapPin, Instagram, Facebook, Linkedin, Youtube, ShieldCheck } from 'lucide-react';
import { LegalPolicyType } from './LegalModal';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenLegal: (policy: LegalPolicyType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBooking, onOpenLegal }) => {
  return (
    <footer className="bg-[#151515] text-[#F4F1EB] pt-20 pb-12 border-t border-[#252525]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          
          {/* Brand Info (lg:col-span-4) */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-serif italic font-bold text-4xl text-[#F4F1EB]">
                D/
              </span>
              <div className="flex flex-col">
                <span className="font-sans font-semibold text-sm tracking-[0.2em] text-[#F4F1EB] uppercase leading-none">
                  DENTAL PRIME
                </span>
                <span className="font-sans text-[9px] tracking-widest text-[#B9B1A5] uppercase mt-0.5">
                  STUDIO & CLINIC
                </span>
              </div>
            </div>

            <p className="font-sans text-sm text-[#B9B1A5] leading-relaxed max-w-sm mb-6">
              Confident smiles for a healthier, happier tomorrow. World-class dental artistry and patient-centric care at Science City, Ahmedabad.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#B9B1A5] mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Certified Dental Specialists & Sterilization</span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, href: 'https://instagram.com', label: 'Dental Prime Instagram' },
                { icon: Facebook, href: 'https://facebook.com', label: 'Dental Prime Facebook' },
                { icon: Linkedin, href: 'https://linkedin.com', label: 'Dental Prime LinkedIn' },
                { icon: Youtube, href: 'https://youtube.com', label: 'Dental Prime YouTube' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <a
                    key={i}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="w-9 h-9 rounded-full border border-white/20 hover:border-white flex items-center justify-center text-white/70 hover:text-white transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <h4 className="font-sans text-xs uppercase tracking-widest text-white font-semibold mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3 font-sans text-xs text-[#B9B1A5]">
              <li><a href="#hero" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#doctors" className="hover:text-white transition-colors">Doctors</a></li>
              <li><a href="#results" className="hover:text-white transition-colors">Gallery</a></li>
              <li><a href="#location" className="hover:text-white transition-colors">Location & FAQ</a></li>
              <li className="pt-2 border-t border-white/10"><a href="/login" className="text-white hover:text-[#C2644F] font-semibold transition-colors flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#C2644F]" /> Staff CRM Portal</a></li>
              <li><a href="/walkin" className="hover:text-white transition-colors">Walk-In Patient Kiosk</a></li>
              <li><button type="button" onClick={onOpenBooking} className="hover:text-white transition-colors text-left font-sans text-xs">Online Booking Portal</button></li>
            </ul>
          </div>

          {/* Our Services (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="font-sans text-xs uppercase tracking-widest text-white font-semibold mb-6">
              Our Services
            </h4>
            <ul className="space-y-3 font-sans text-xs text-[#B9B1A5]">
              <li><a href="#services" className="hover:text-white transition-colors">General Dentistry</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Cosmetic Dentistry</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Orthodontics & Aligners</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Dental Implants</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Root Canal Treatment</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Pediatric Dentistry</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Periodontics & Cleaning</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Emergency Consultation</a></li>
            </ul>
          </div>

          {/* Contact (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="font-sans text-xs uppercase tracking-widest text-white font-semibold mb-6">
              Contact Us
            </h4>
            <ul className="space-y-4 font-sans text-xs text-[#B9B1A5] mb-6">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#B9B1A5] shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#B9B1A5] shrink-0" />
                <a href="mailto:hello@dentalprime.in" className="hover:text-white transition-colors">
                  hello@dentalprime.in
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#B9B1A5] shrink-0 mt-0.5" />
                <span>
                  123 Smile Street, Science City, Ahmedabad 380060
                </span>
              </li>
            </ul>

            <button
              onClick={onOpenBooking}
              className="w-full inline-flex items-center justify-center gap-2.5 bg-white text-[#171717] hover:bg-[#F4F1EB] py-3 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-300 group shadow-md"
            >
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* Bottom Bar with Compliance Links */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#6F6B65] font-sans gap-4">
          <p>© 2026 Dental Prime Studio & Clinic. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-[#B9B1A5] transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onOpenLegal('terms')}
              className="hover:text-[#B9B1A5] transition-colors underline-offset-4 hover:underline"
            >
              Terms of Service
            </button>
            <button
              onClick={() => onOpenLegal('disclaimer')}
              className="hover:text-[#B9B1A5] transition-colors underline-offset-4 hover:underline"
            >
              Medical Disclaimer
            </button>
            <button
              onClick={() => onOpenLegal('cookies')}
              className="hover:text-[#B9B1A5] transition-colors underline-offset-4 hover:underline"
            >
              Cookie Policy
            </button>
            <button
              onClick={() => onOpenLegal('appointment')}
              className="hover:text-[#B9B1A5] transition-colors underline-offset-4 hover:underline"
            >
              Appointment Terms
            </button>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#B9B1A5] transition-colors"
            >
              Sitemap
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
