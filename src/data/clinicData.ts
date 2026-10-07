import { ServiceItem, DoctorItem, TestimonialItem, BlogPostItem, ProcessStep, FAQItem } from '../types';

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'general',
    number: '01',
    title: 'General\nDentistry',
    image: '/assets/service section/01_dental_checkup_tools.png',
    description: 'Comprehensive examinations, ultrasonic cleanings, preventive sealant applications, and personalized oral health maintenance plans.',
    features: ['Ultrasonic scaling', 'Oral cancer screenings', 'Digital x-rays & scans']
  },
  {
    id: 'cosmetic',
    number: '02',
    title: 'Cosmetic\nDentistry',
    image: '/assets/service section/02_teeth_whitening.png',
    description: 'Transformative porcelain veneers, composite bonding, and in-office LED laser teeth whitening for a luminous, camera-ready smile.',
    features: ['Custom porcelain veneers', 'Enamel micro-abrasion', 'Laser teeth brightening']
  },
  {
    id: 'orthodontics',
    number: '03',
    title: 'Orthodontics',
    image: '/assets/service section/03_clear_aligners.png',
    description: 'Custom transparent aligners and precision biomechanics designed to gently guide your teeth into harmonious alignment discreetly.',
    features: ['Bespoke 3D clear aligners', 'Digital bite analysis', 'Minimal treatment durations']
  },
  {
    id: 'implants',
    number: '04',
    title: 'Dental Implants\n& Prosthetics',
    image: '/assets/service section/04_dental_implant.png',
    description: 'Permanent titanium and zirconia root replacements that restore natural bite strength, jawbone health, and timeless aesthetics.',
    features: ['Guided robotic surgery', 'Full-arch restorations', 'Premium bio-zirconia crowns']
  },
  {
    id: 'root-canal',
    number: '05',
    title: 'Root Canal &\nRestorative',
    image: '/assets/service section/05_root_canal_treatment.png',
    description: 'Painless microscopic endodontic therapy preserving natural dentition and restoring tooth integrity with micro-precision ceramic inlays.',
    features: ['Microscope-assisted therapy', 'Single-visit protocols', 'Biocompatible obturation']
  },
  {
    id: 'pediatric',
    number: '06',
    title: 'Pediatric\nDentistry',
    image: '/assets/service section/06_pediatric_dentistry.png',
    description: 'Gentle, fear-free dentistry crafted especially for children, instilling lifelong confidence and healthy oral hygiene routines.',
    features: ['Fluoride remineralization', 'Child-friendly operatory', 'Preventive space maintainers']
  },
  {
    id: 'periodontics',
    number: '07',
    title: 'Periodontics\n/ Gum Care',
    image: '/assets/service section/07_teeth_scaling_cleaning.png',
    description: 'Deep therapeutic root planing, laser-assisted periodontal treatments, and aesthetic gingival contouring for vibrant gums.',
    features: ['Soft tissue laser therapy', 'Deep subgingival scaling', 'Gingival aesthetic shaping']
  },
  {
    id: 'oral-surgery',
    number: '08',
    title: 'Oral Surgery',
    image: '/assets/service section/08_impacted_wisdom_tooth.png',
    description: 'Minimally invasive extractions of impacted wisdom teeth, surgical crown lengthening, and regenerative bone graft procedures.',
    features: ['Impacted 3rd molar removal', 'Ridge preservation', 'Conscious sedation options']
  },
  {
    id: 'emergency',
    number: '09',
    title: 'Emergency\nDental Care',
    image: '/assets/service section/09_toothache_emergency.png',
    description: 'Same-day rapid response for acute dental trauma, severe toothaches, chipped crowns, or sudden oral injuries.',
    features: ['Priority same-day slots', 'Immediate pain management', 'On-call emergency specialists']
  }
];

export const DOCTORS_DATA: DoctorItem[] = [
  {
    id: 'dr-aditi',
    name: 'Dr. Aditi Mehta',
    specialty: 'Orthodontist & Clear Aligner Specialist',
    image: '/assets/doc/dr_neha_sharma_studio.jpg',
    experience: '12+ Years Experience',
    education: 'MDS Orthodontics, Certified Diamond Aligner Provider'
  },
  {
    id: 'dr-rohan',
    name: 'Dr. Rohan Shah',
    specialty: 'Implant & Restorative Specialist',
    image: '/assets/doc/dr_amit_verma_studio.jpg',
    experience: '14+ Years Experience',
    education: 'MDS Prosthodontics & Implantology, Fellow ICOI'
  },
  {
    id: 'dr-neha',
    name: 'Dr. Neha Patel',
    specialty: 'Pediatric Dentist',
    image: '/assets/doc/dr_pooja_mehta_studio.jpg',
    experience: '9+ Years Experience',
    education: 'MDS Pedodontics & Preventive Dentistry'
  },
  {
    id: 'dr-karan',
    name: 'Dr. Karan Desai',
    specialty: 'Oral Surgeon',
    image: '/assets/doc/dr_rajat_malhotra_studio.jpg',
    experience: '11+ Years Experience',
    education: 'MDS Oral & Maxillofacial Surgery'
  }
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'Consultation',
    description: 'Understand your needs'
  },
  {
    number: '02',
    title: 'Diagnosis',
    description: 'Detailed scan & analysis'
  },
  {
    number: '03',
    title: 'Treatment Plan',
    description: 'Personalized solution'
  },
  {
    number: '04',
    title: 'Treatment',
    description: 'Expert care & precision'
  },
  {
    number: '05',
    title: 'Follow Up',
    description: 'Long-lasting results'
  }
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: '1',
    name: 'Krishna Patel',
    role: 'Verified Patient',
    quote: '"The best dental experience I\'ve ever had. The team is professional, caring, and the results are amazing!"',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    treatment: 'Full Smile Transformation'
  },
  {
    id: '2',
    name: 'Aarav Singhania',
    role: 'Verified Patient',
    quote: '"Getting my clear aligners here was completely painless. Dr. Aditi\'s attention to every micro-detail is exceptional."',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    treatment: 'Clear Aligners'
  },
  {
    id: '3',
    name: 'Sunita Joshi',
    role: 'Verified Patient',
    quote: '"The clinic feels like a boutique sanctuary rather than a hospital. My dental implant procedure was completely comfortable."',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    treatment: 'Dental Implant Restoration'
  }
];

export const BLOG_POSTS: BlogPostItem[] = [
  {
    id: '1',
    title: '5 Benefits of Clear Aligners over Traditional Braces',
    category: 'Orthodontics',
    date: 'Sep 12, 2024',
    image: '/assets/Explore/e3.jpg',
    readTime: '4 min read',
    summary: 'Discover how invisible aligners deliver discreet orthodontic corrections without dietary restrictions or wire adjustments.'
  },
  {
    id: '2',
    title: 'How to Care for Your Teeth After a Root Canal',
    category: 'Restorative',
    date: 'Aug 28, 2024',
    image: '/assets/Explore/e2.jpg',
    readTime: '5 min read',
    summary: 'Essential aftercare guidelines to protect your treated tooth and ensure lifelong structural longevity.'
  },
  {
    id: '3',
    title: 'Common Dental Problems in Children and How to Prevent Them',
    category: 'Pediatric',
    date: 'Aug 15, 2024',
    image: '/assets/service section/06_pediatric_dentistry.png',
    readTime: '3 min read',
    summary: 'A parents guide to early cavity prevention, dietary habits, and instilling joyful dental visits from age one.'
  }
];

export const FAQ_DATA: FAQItem[] = [
  {
    question: 'How often should I visit a dentist?',
    answer: 'We recommend scheduling a routine comprehensive examination and professional ultrasonic cleaning every six months. Regular visits allow us to intercept micro-calcifications, enamel wear, and gingival changes well before they develop into complex conditions.'
  },
  {
    question: 'Are clear aligners worth it?',
    answer: 'Yes. Beyond their nearly invisible appearance, clear aligners offer removable convenience, ease of oral hygiene, customized digital staging, and significantly fewer clinic emergencies compared to traditional wire brackets.'
  },
  {
    question: 'Is teeth whitening safe?',
    answer: 'Absolutely. Our in-office treatments use clinically tested, enamel-safe LED brightening gels with specialized desensitizing agents that protect your enamel rods while lifting deep intrinsic coffee, tea, and aging stains.'
  },
  {
    question: 'Do you treat children?',
    answer: 'Yes! Our pediatric specialist, Dr. Neha Patel, specializes in gentle, child-centric dental care in a welcoming, stress-free environment designed to make young patients feel completely safe and confident.'
  },
  {
    question: 'Are dental implants painful?',
    answer: 'The procedure is performed under gentle local anesthesia and advanced 3D surgical guides, making it virtually painless. Most patients report significantly less discomfort than a routine tooth extraction and resume normal activities within 24 to 48 hours.'
  }
];
