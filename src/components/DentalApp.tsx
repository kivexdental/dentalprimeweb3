import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { ServicesGrid } from './ServicesGrid';
import { BeforeAfter } from './BeforeAfter';
import { AboutSection } from './AboutSection';
import { DoctorsSection } from './DoctorsSection';
import { WhyChooseUs } from './WhyChooseUs';
import { TreatmentProcess } from './TreatmentProcess';
import { Testimonials } from './Testimonials';
import { InsightsBlog } from './InsightsBlog';
import { LocationAndFAQ } from './LocationAndFAQ';
import { Footer } from './Footer';
import { BookingModal } from './BookingModal';
import { VideoModal } from './VideoModal';
import { ServiceDetailModal } from './ServiceDetailModal';
import { DoctorDetailModal } from './DoctorDetailModal';
import { ArticleModal } from './ArticleModal';
import { LegalModal, LegalPolicyType } from './LegalModal';
import { ServiceItem, DoctorItem, BlogPostItem } from '../types';

export function DentalApp() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState('general');
  const [bookingDoctorId, setBookingDoctorId] = useState('dr-aditi');
  const [isVideoTourOpen, setIsVideoTourOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<BlogPostItem | null>(null);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalPolicy, setLegalPolicy] = useState<LegalPolicyType>('privacy');

  useEffect(() => {
    const handleHash = () => {
      const params = new URLSearchParams(window.location.search);
      if (window.location.hash === '#book' || params.get('book') === 'true') {
        setIsBookingOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenBooking = (serviceId = 'general', doctorId = 'dr-aditi') => {
    setBookingServiceId(serviceId);
    setBookingDoctorId(doctorId);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    if (window.location.hash === '#book') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleOpenLegal = (policy: LegalPolicyType) => {
    setLegalPolicy(policy);
    setIsLegalOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F4F1EB] text-[#171717] selection:bg-[#171717] selection:text-[#F4F1EB]">
      {/* Fixed Luxury Navigation */}
      <Navbar onOpenBooking={() => handleOpenBooking()} />

      {/* Main Page Flow Matching Reference */}
      <main id="main-content">
        {/* 1. Hero Section */}
        <Hero
          onOpenBooking={() => handleOpenBooking()}
          onOpenVideoTour={() => setIsVideoTourOpen(true)}
        />

        {/* 2. Services Section (3x3 Grid) */}
        <ServicesGrid
          onSelectService={(service) => setSelectedService(service)}
          onOpenBookingWithService={(serviceId) => handleOpenBooking(serviceId)}
        />

        {/* 3. Real Results (Before & After) */}
        <BeforeAfter onOpenBooking={() => handleOpenBooking()} />

        {/* 4. About Us & Clinic Tour */}
        <AboutSection
          onOpenVideoTour={() => setIsVideoTourOpen(true)}
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* 5. Our Doctors */}
        <DoctorsSection
          onSelectDoctor={(doctor) => setSelectedDoctor(doctor)}
          onOpenBookingWithDoctor={(doctorId) => handleOpenBooking('general', doctorId)}
        />

        {/* 6. Why Choose Us */}
        <WhyChooseUs />

        {/* 7. Treatment Process (5 Steps) */}
        <TreatmentProcess onOpenBooking={() => handleOpenBooking()} />

        {/* 8. Patient Testimonials */}
        <Testimonials onOpenBooking={() => handleOpenBooking()} />

        {/* 9. Latest Insights / Blog */}
        <InsightsBlog onSelectArticle={(post) => setSelectedArticle(post)} />

        {/* 10. Visit Our Clinic & FAQ */}
        <LocationAndFAQ onOpenBooking={() => handleOpenBooking()} />
      </main>

      {/* 11. Dark Editorial Footer */}
      <Footer
        onOpenBooking={() => handleOpenBooking()}
        onOpenLegal={handleOpenLegal}
      />

      {/* Modals & Overlays */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        initialServiceId={bookingServiceId}
        initialDoctorId={bookingDoctorId}
      />

      <VideoModal
        isOpen={isVideoTourOpen}
        onClose={() => setIsVideoTourOpen(false)}
      />

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBookService={(serviceId) => handleOpenBooking(serviceId)}
      />

      <DoctorDetailModal
        doctor={selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        onBookDoctor={(doctorId) => handleOpenBooking('general', doctorId)}
      />

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onOpenBooking={() => handleOpenBooking()}
      />

      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialPolicy={legalPolicy}
      />
    </div>
  );
}

export default DentalApp;
