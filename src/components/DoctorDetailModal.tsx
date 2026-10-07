import React from 'react';
import { X, ArrowRight, Award, GraduationCap } from 'lucide-react';
import { DoctorItem } from '../types';

interface DoctorDetailModalProps {
  doctor: DoctorItem | null;
  onClose: () => void;
  onBookDoctor: (doctorId: string) => void;
}

export const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  doctor,
  onClose,
  onBookDoctor
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && doctor) {
        onClose();
      }
    };
    if (doctor) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [doctor, onClose]);

  if (!doctor) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#F4F1EB] rounded-3xl border border-[#D7D2C9] shadow-modal overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Doctor Image */}
        <div className="relative h-64 bg-[#252525] overflow-hidden">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#171717] flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <h3 className="font-serif text-3xl font-bold text-white leading-tight">
              {doctor.name}
            </h3>
            <p className="font-sans text-xs text-[#B9B1A5] font-semibold uppercase tracking-wider mt-1">
              {doctor.specialty}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-[#D7D2C9]">
              <Award className="w-5 h-5 text-[#171717] shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-[11px] uppercase tracking-wider text-[#6F6B65] font-bold">
                  Clinical Experience
                </p>
                <p className="font-sans text-xs font-semibold text-[#171717]">
                  {doctor.experience}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-[#D7D2C9]">
              <GraduationCap className="w-5 h-5 text-[#171717] shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-[11px] uppercase tracking-wider text-[#6F6B65] font-bold">
                  Qualifications & Fellowship
                </p>
                <p className="font-sans text-xs font-semibold text-[#171717]">
                  {doctor.education}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onBookDoctor(doctor.id);
            }}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-[#171717] hover:bg-[#252525] text-[#F4F1EB] py-3.5 rounded-full font-sans text-xs font-semibold uppercase tracking-wider transition-all shadow"
          >
            <span>Book Consultation with {doctor.name.split(' ')[1]}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
