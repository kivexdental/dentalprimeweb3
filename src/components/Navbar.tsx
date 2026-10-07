import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, Menu, X, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll and listen for Escape when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Doctors', href: '#doctors' },
    { label: 'Gallery', href: '#results' },
    { label: 'Location', href: '#location' },
  ];

  return (
    <>
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-5 focus:py-2.5 focus:bg-[#171717] focus:text-white focus:rounded-full focus:shadow-lg focus:outline-none text-xs uppercase font-sans font-semibold tracking-wider"
      >
        Skip to main content
      </a>

      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[#F4F1EB]/90 backdrop-blur-md border-b border-[#D7D2C9]/70 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#hero" className="flex items-center gap-2 group" aria-label="Dental Prime Homepage">
            <span className="font-serif italic font-bold text-3xl md:text-4xl text-[#171717] tracking-tight group-hover:opacity-80 transition-opacity">
              D/
            </span>
            <div className="flex flex-col">
              <span className="font-sans font-semibold text-xs md:text-sm tracking-[0.2em] text-[#171717] uppercase leading-none">
                DENTAL PRIME
              </span>
              <span className="font-sans text-[9px] tracking-widest text-[#6F6B65] uppercase mt-0.5">
                STUDIO & CLINIC
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-sans text-sm font-medium text-[#252525] hover:text-[#171717] transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#171717] hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 border border-[#D7D2C9] hover:border-[#C2644F] bg-white/80 hover:bg-white text-[#171717] px-4 py-2.5 rounded-full font-sans text-xs md:text-sm font-medium tracking-wide transition-all duration-300 shadow-sm hover:shadow"
              title="Access Clinic CRM Dashboard"
            >
              <ShieldCheck className="w-4 h-4 text-[#C2644F]" />
              <span>CRM Portal</span>
            </a>

            <button
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2.5 bg-[#171717] hover:bg-[#252525] text-[#F4F1EB] px-5 py-2.5 rounded-full font-sans text-xs md:text-sm font-medium tracking-wide transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98] group"
            >
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            <a
              href="tel:+919876543210"
              aria-label="Call Dental Prime clinic at +91 98765 43210"
              className="w-10 h-10 rounded-full border border-[#D7D2C9] bg-[#FFFFFF]/70 hover:bg-[#FFFFFF] flex items-center justify-center text-[#171717] hover:border-[#171717] transition-all duration-300 shadow-sm"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <a
              href="/login"
              className="border border-[#D7D2C9] bg-white/90 text-[#171717] px-2.5 py-1.5 rounded-full font-sans text-xs font-medium flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-[#C2644F]" />
              <span>CRM</span>
            </a>
            <button
              onClick={onOpenBooking}
              className="bg-[#171717] text-[#F4F1EB] px-3.5 py-1.5 rounded-full font-sans text-xs font-medium"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#171717] rounded-lg hover:bg-[#E9E4DC] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="fixed inset-0 z-30 bg-[#F4F1EB]/95 backdrop-blur-lg pt-24 px-8 flex flex-col justify-between pb-12 sm:hidden transition-all duration-300"
        >
          <nav className="flex flex-col gap-6" aria-label="Mobile Links">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-[#171717] hover:italic transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3 pt-6 border-t border-[#D7D2C9]">
            <a
              href="/login"
              className="w-full border border-[#D7D2C9] bg-white text-[#171717] py-3 rounded-full font-sans text-sm font-medium flex items-center justify-center gap-2 min-h-[44px] shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-[#C2644F]" />
              <span>Staff CRM Portal</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full bg-[#171717] text-[#F4F1EB] py-3.5 rounded-full font-sans text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>Book Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="tel:+919876543210"
              className="w-full border border-[#D7D2C9] bg-white/80 py-3 rounded-full font-sans text-sm font-medium flex items-center justify-center gap-2 text-[#171717] min-h-[44px]"
            >
              <Phone className="w-4 h-4" />
              <span>+91 98765 43210</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
};
