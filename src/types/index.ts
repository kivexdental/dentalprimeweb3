export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  image: string;
  description: string;
  features: string[];
}

export interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  image: string;
  experience: string;
  education: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
  treatment: string;
}

export interface BlogPostItem {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  readTime: string;
  summary: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
