-- Seed Data for Dental Clinic CRM

-- Default Accounts (Admin & Staff)
-- Admin: username = admin, password = admin123, role = admin
-- Staff: username = staff, password = staff123, role = staff
INSERT INTO admins (username, password_hash, name, email, role) VALUES
('admin', '$2a$10$e8w.xL2S.nZq6R2G7dY8e.5eG/vH3sYn/5qM8N3W5g5d5c5b5a5a5', 'Dr. Sarah Jenkins', 'admin@smilecare.com', 'admin'),
('staff', '$2a$10$e8w.xL2S.nZq6R2G7dY8e.5eG/vH3sYn/5qM8N3W5g5d5c5b5a5a5', 'Clinic Staff / Receptionist', 'staff@smilecare.com', 'staff')
ON CONFLICT (username) DO NOTHING;

-- Default Settings
INSERT INTO settings (key, value) VALUES
('clinic_name', 'Smile Care Dental Clinic & Implant Center'),
('clinic_logo', 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&auto=format&fit=crop&q=80'),
('clinic_address', '104 Healthcare Boulevard, Suite 300, Medical District'),
('phone', '+1 (555) 234-5678'),
('email', 'contact@smilecaredental.com'),
('gst', '29ABCDE1234F1Z5'),
('opening_hours', '09:00 AM - 08:00 PM'),
('working_days', 'Monday - Saturday'),
('token_prefix', 'A'),
('theme', 'light')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed Services
INSERT INTO services (name, duration_mins, price, description, status) VALUES
('General Checkup', 30, 50.00, 'Comprehensive oral examination and consultation', 'Active'),
('Teeth Cleaning & Scaling', 45, 80.00, 'Professional ultrasonic cleaning, stain removal, and polishing', 'Active'),
('Root Canal Therapy', 60, 250.00, 'Painless root canal treatment with digital X-ray', 'Active'),
('Dental Implant', 90, 850.00, 'Titanium dental implant fixture with porcelain crown', 'Active'),
('Braces & Orthodontics', 60, 1500.00, 'Metal or clear ceramic aligners treatment setup', 'Active'),
('Teeth Whitening', 45, 200.00, 'Laser teeth whitening for instant brighter smile', 'Active'),
('Tooth Extraction', 30, 90.00, 'Simple or surgical extraction under local anesthesia', 'Active'),
('Crown & Bridge', 60, 350.00, 'Zirconia / Ceramic protective crown or bridge fitting', 'Active'),
('Denture Fitting', 60, 450.00, 'Custom complete or partial removable dentures', 'Active'),
('Smile Design', 60, 600.00, 'Digital aesthetic cosmetic smile makeover', 'Active'),
('Emergency Dental Care', 30, 120.00, 'Immediate relief for severe toothache, injury, or broken tooth', 'Active');

-- Seed Doctors
INSERT INTO doctors (name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url) VALUES
('Dr. Alexander Wright', 'BDS, MDS (Orthodontics)', 'Orthodontist & Smile Specialist', '12 Years', '+1 (555) 987-6543', 'alexander.wright@smilecare.com', 'Mon, Wed, Fri', '09:00 AM - 05:00 PM', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80'),
('Dr. Elena Rostova', 'BDS, MDS (Endodontics)', 'Root Canal & Restorative Specialist', '9 Years', '+1 (555) 876-5432', 'elena.rostova@smilecare.com', 'Tue, Thu, Sat', '10:00 AM - 06:00 PM', 'https://images.unsplash.com/photo-1594824813566-8185b378c7c9?w=200&auto=format&fit=crop&q=80'),
('Dr. Michael Vance', 'BDS, FICOI (Implants)', 'Implantologist & Periodontist', '15 Years', '+1 (555) 765-4321', 'michael.vance@smilecare.com', 'Mon, Tue, Thu', '09:00 AM - 04:00 PM', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=80');

-- Seed Initial Patients
INSERT INTO patients (patient_code, name, phone, email, dob, gender, blood_group, address, medical_history, allergy, current_medication, emergency_contact, outstanding_balance) VALUES
('P10001', 'Robert Chen', '+15551112233', 'robert.chen@example.com', '1988-04-12', 'Male', 'O+', '742 Evergreen Terrace, NY', 'Hypertension', 'Penicillin', 'Lisinopril 10mg', 'Lisa Chen (+15551112244)', 0.00),
('P10002', 'Sarah Connor', '+15554445566', 'sarah.c@example.com', '1992-09-25', 'Female', 'A+', '100 Cyberdyne Way, NY', 'None', 'Latex', 'Multivitamins', 'John Connor (+15554445577)', 50.00),
('P10003', 'James Wilson', '+15557778899', 'jwilson@example.com', '1980-11-30', 'Male', 'B+', '404 Baker Street, NY', 'Diabetes Type 2', 'None', 'Metformin 500mg', 'Mary Wilson (+15557778800)', 0.00);

-- Seed Bookings
INSERT INTO bookings (booking_code, visual_token, token_sequence, patient_name, phone, email, service_name, booking_for, relation, person_name, booking_type, booking_date, booking_time, status) VALUES
('DB000001', 'A001', 1, 'Robert Chen', '+15551112233', 'robert.chen@example.com', 'General Checkup', 'Self', 'Self', '', 'Walk-In', CURRENT_DATE, '09:30:00', 'Pending'),
('DB000002', 'A002', 2, 'Sarah Connor', '+15554445566', 'sarah.c@example.com', 'Teeth Whitening', 'Self', 'Self', '', 'Online', CURRENT_DATE, '10:15:00', 'Pending'),
('DB000003', 'A003', 3, 'James Wilson', '+15557778899', 'jwilson@example.com', 'Root Canal Therapy', 'Self', 'Self', '', 'Walk-In', CURRENT_DATE, '11:00:00', 'Pending');
