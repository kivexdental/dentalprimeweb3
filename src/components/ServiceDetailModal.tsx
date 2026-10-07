import React from 'react';
import { X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ServiceItem } from '../types';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onBookService: (serviceId: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookService
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && service) {
        onClose();
      }
    };
    if (service) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [service, onClose]);

  if (!service) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#F4F1EB] rounded-3xl border border-[#D7D2C9] shadow-modal overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="relative h-48 sm:h-56 bg-[#252525] overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#171717] flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <span className="font-serif text-white/70 text-sm font-semibold tracking-widest block mb-1">
              SERVICE {service.number}
            </span>
            <h3 className="font-serif text-3xl font-normal text-white whitespace-pre-line leading-tight">
              {service.title.replace('\n', ' ')}
            </h3>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8">
          <p className="font-sans text-sm text-[#6F6B65] leading-relaxed mb-6">
            {service.description}
          </p>

          <h4 className="font-sans text-xs uppercase tracking-widest text-[#171717] font-bold mb-3">
            Treatment Features & Standards
          </h4>

          <div className="space-y-2.5 mb-8">
            {service.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#D7D2C9]">
                <CheckCircle2 className="w-4 h-4 text-[#171717] shrink-0" />
                <span className="font-sans text-xs font-semibold text-[#171717]">{feat}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              onClose();
              onBookService(service.id);
            }}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-[#171717] hover:bg-[#252525] text-[#F4F1EB] py-3.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all shadow"
          >
            <span>Reserve Consultation for This Service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
