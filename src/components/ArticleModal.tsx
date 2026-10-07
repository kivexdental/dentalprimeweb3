import React from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { BlogPostItem } from '../types';

interface ArticleModalProps {
  article: BlogPostItem | null;
  onClose: () => void;
  onOpenBooking: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  onOpenBooking
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && article) {
        onClose();
      }
    };
    if (article) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#F4F1EB] rounded-3xl border border-[#D7D2C9] shadow-modal overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="relative h-60 bg-[#252525] overflow-hidden shrink-0">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#171717] flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full font-sans text-[10px] font-semibold uppercase tracking-wider text-[#171717] border border-[#D7D2C9] inline-block mb-2">
              {article.category}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
              {article.title}
            </h3>
          </div>
        </div>

        {/* Article Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          <div className="flex items-center gap-4 text-xs text-[#6F6B65] pb-4 mb-6 border-b border-[#D7D2C9]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#B9B1A5]" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#B9B1A5]" />
              <span>{article.readTime}</span>
            </div>
          </div>

          <div className="prose prose-sm text-[#252525] font-sans space-y-4">
            <p className="font-serif italic text-lg text-[#171717] leading-relaxed">
              {article.summary}
            </p>
            <p className="text-xs sm:text-sm text-[#6F6B65] leading-relaxed">
              At Dental Prime, we believe that an informed patient is an empowered patient. Whether considering aesthetic smile design or restorative rehabilitation, understanding the clinical science and biocompatible materials behind each procedure guarantees exceptional long-term health and aesthetics.
            </p>
            <p className="text-xs sm:text-sm text-[#6F6B65] leading-relaxed">
              Modern digital orthodontics and microscopic restorative protocols enable us to preserve maximum healthy enamel while achieving surgical precision and comfort previously impossible with conventional techniques.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#D7D2C9] flex justify-between items-center">
            <span className="text-xs text-[#6F6B65]">Have questions about this topic?</span>
            <button
              onClick={() => {
                onClose();
                onOpenBooking();
              }}
              className="bg-[#171717] text-white px-5 py-2 rounded-full font-sans text-xs font-semibold uppercase tracking-wider hover:bg-[#252525] transition-colors"
            >
              Ask Our Specialists
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
