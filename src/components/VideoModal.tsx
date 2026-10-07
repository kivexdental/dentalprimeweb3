import React, { useRef, useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#171717] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
        
        {/* Top Bar */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-5 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-white text-xl">D/</span>
            <span className="font-sans text-xs uppercase tracking-widest text-[#B9B1A5] font-semibold">
              Dental Prime Studio Tour & Technology
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close video tour"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#171717] flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Element */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src="/assets/video.mp4"
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Floating Controls Overlay */}
          <div className="absolute bottom-5 inset-x-6 z-20 flex items-center justify-between bg-black/50 backdrop-blur-md px-5 py-3 rounded-full border border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-[#B9B1A5] transition-colors"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-[#B9B1A5] transition-colors"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="font-sans text-xs text-[#B9B1A5] hidden sm:inline">
                Guided Robotic Implantology & 3D Scanning
              </span>
            </div>

            <button
              onClick={onClose}
              className="font-sans text-xs uppercase tracking-wider text-white hover:text-[#B9B1A5] font-semibold"
            >
              Exit Tour
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
