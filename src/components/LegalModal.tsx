import React, { useEffect, useState } from 'react';
import { X, Shield, FileText, AlertCircle, Cookie, CalendarClock } from 'lucide-react';

export type LegalPolicyType = 'privacy' | 'terms' | 'disclaimer' | 'cookies' | 'appointment';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPolicy?: LegalPolicyType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialPolicy = 'privacy',
}) => {
  const [activePolicy, setActivePolicy] = useState<LegalPolicyType>(initialPolicy);

  useEffect(() => {
    if (initialPolicy) {
      setActivePolicy(initialPolicy);
    }
  }, [initialPolicy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const policyTabs: { id: LegalPolicyType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'terms', label: 'Terms of Service', icon: FileText },
    { id: 'disclaimer', label: 'Medical Disclaimer', icon: AlertCircle },
    { id: 'cookies', label: 'Cookie Policy', icon: Cookie },
    { id: 'appointment', label: 'Appointment Policy', icon: CalendarClock },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#F4F1EB] rounded-3xl border border-[#D7D2C9] shadow-modal overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D7D2C9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-2xl text-[#171717]">D/</span>
            <span id="legal-modal-title" className="font-sans text-xs uppercase tracking-widest text-[#6F6B65] font-semibold">
              Compliance & Legal Information
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full border border-[#D7D2C9] hover:bg-[#F4F1EB] flex items-center justify-center text-[#171717] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Policy Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-[#E9E4DC]/60 border-b border-[#D7D2C9] overflow-x-auto scrollbar-none">
          {policyTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePolicy === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePolicy(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-sans whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#171717] text-white font-medium shadow-sm'
                    : 'text-[#6F6B65] hover:text-[#171717] hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-[#383531] font-sans leading-relaxed">
          {activePolicy === 'privacy' && (
            <article className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#171717]">Privacy Policy</h2>
              <p className="text-xs text-[#6F6B65]">Last updated: September 2026</p>
              <p>
                At <strong>Dental Prime Studio & Clinic</strong>, we treat your privacy and personal data with the same uncompromising precision as your dental care. This Privacy Policy details how we collect, store, and protect patient inquiry and appointment data.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">1. Information We Collect</h3>
              <p>
                When submitting booking requests or inquiries via our website, we may collect your name, phone number, email address, preferred appointment timings, and general consultation notes.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">2. How Your Data Is Protected</h3>
              <p>
                We do not sell, rent, or trade your personal or health contact information to third parties. All communications are securely encrypted via SSL/TLS.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">3. Patient Confidentiality</h3>
              <p>
                Clinical treatment records and diagnostic imagery are stored on HIPAA-compliant, encrypted healthcare management systems disconnected from public-facing web analytics.
              </p>
            </article>
          )}

          {activePolicy === 'terms' && (
            <article className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#171717]">Terms of Service</h2>
              <p className="text-xs text-[#6F6B65]">Effective Date: September 2026</p>
              <p>
                Welcome to the website of Dental Prime Studio & Clinic. By accessing this platform, you agree to comply with and be bound by the following terms of use.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">1. Informational Purpose</h3>
              <p>
                All website media, treatment overviews, before-and-after galleries, and diagnostic guides are provided for educational and appointment reservation convenience only.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">2. Clinical Consultations</h3>
              <p>
                Formal treatment estimates and diagnostic confirmations require an in-person clinical examination and radiography by a licensed dental professional at our Science City studio.
              </p>
            </article>
          )}

          {activePolicy === 'disclaimer' && (
            <article className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#171717]">Medical & Educational Disclaimer</h2>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[#171717]">
                <p className="font-semibold text-xs uppercase tracking-wider text-amber-900 mb-1">
                  Important Notice
                </p>
                <p className="text-xs leading-normal">
                  The information provided on this website does not constitute formal medical or dental advice, diagnosis, or treatment. Always consult a qualified dental practitioner in person for oral health concerns.
                </p>
              </div>
              <p>
                Before-and-after cases displayed on our website illustrate real outcomes achieved by our clinical team. Individual biological responses, anatomical baselines, and aesthetic outcomes naturally vary from patient to patient.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">Emergency Care</h3>
              <p>
                If you are experiencing severe oral bleeding, maxillofacial trauma, or acute swelling impairing breathing or swallowing, visit the nearest emergency medical hospital immediately.
              </p>
            </article>
          )}

          {activePolicy === 'cookies' && (
            <article className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#171717]">Cookie Policy</h2>
              <p className="text-xs text-[#6F6B65]">Last updated: September 2026</p>
              <p>
                Our website utilizes minimal, essential first-party cookies to remember your device preferences, optimize interactive elements (such as the comparison slider), and maintain security.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">Cookie Categories</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6F6B65]">
                <li><strong>Essential Cookies:</strong> Necessary for core site navigation, accessibility preferences, and modal state persistence.</li>
                <li><strong>Performance Cookies:</strong> Anonymous telemetry to help us measure site responsiveness and page loading speeds.</li>
              </ul>
            </article>
          )}

          {activePolicy === 'appointment' && (
            <article className="space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#171717]">Appointment & Cancellation Policy</h2>
              <p className="text-xs text-[#6F6B65]">Studio Protocol</p>
              <p>
                To provide undivided attention in our boutique suites, appointments are spaced generously to prevent waiting times and rush.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">1. Advance Notice for Rescheduling</h3>
              <p>
                We kindly request a minimum of <strong>24 hours notice</strong> if you need to reschedule or cancel your visit. This courtesy allows us to accommodate patients requiring urgent dental care.
              </p>
              <h3 className="font-serif text-lg text-[#171717] font-semibold pt-2">2. Punctuality</h3>
              <p>
                We recommend arriving 10 minutes prior to your designated time to enjoy our relaxation lounge and complete any preliminary digital health verifications.
              </p>
            </article>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#D7D2C9] bg-white flex items-center justify-between">
          <p className="font-sans text-[11px] text-[#6F6B65]">
            Questions? Contact our team at <a href="mailto:compliance@dentalprime.in" className="underline hover:text-[#171717]">compliance@dentalprime.in</a>
          </p>
          <button
            onClick={onClose}
            className="bg-[#171717] hover:bg-[#252525] text-white px-5 py-2 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
