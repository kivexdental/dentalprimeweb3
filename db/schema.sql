-- Production-Ready Dental Clinic CRM Database Schema for PostgreSQL / Neon DB

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_mins INT DEFAULT 30,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    is_deleted INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    qualification VARCHAR(100),
    specialization VARCHAR(100),
    experience VARCHAR(50),
    contact VARCHAR(20),
    email VARCHAR(100),
    available_days VARCHAR(100),
    available_time VARCHAR(100),
    photo_url VARCHAR(255),
    is_deleted INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    dob VARCHAR(50),
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    medical_history TEXT,
    allergy TEXT,
    current_medication TEXT,
    emergency_contact VARCHAR(100),
    photo_url VARCHAR(255),
    outstanding_balance NUMERIC(10, 2) DEFAULT 0.00,
    is_deleted INT DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    visual_token VARCHAR(20) NOT NULL,
    token_sequence INT NOT NULL DEFAULT 1,
    patient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    service_name VARCHAR(100) NOT NULL,
    booking_for VARCHAR(50) NOT NULL,
    relation VARCHAR(100),
    person_name VARCHAR(100),
    booking_type VARCHAR(20) DEFAULT 'Walk-In',
    booking_date VARCHAR(50) NOT NULL,
    booking_time VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    doctor_id INT,
    doctor_name VARCHAR(100),
    treatment_performed TEXT,
    notes TEXT,
    clinical_notes TEXT,
    teeth_treatments TEXT,
    prescription TEXT,
    prescription_medicines TEXT,
    handwritten_rx TEXT,
    next_appointment_date VARCHAR(50),
    next_appointment_time VARCHAR(50),
    next_appointment_dates TEXT,
    amount NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    discount_reason VARCHAR(255),
    final_amount NUMERIC(10, 2) DEFAULT 0.00,
    is_deleted INT DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    booking_id INT,
    booking_code VARCHAR(20),
    visual_token VARCHAR(20),
    booking_type VARCHAR(20) DEFAULT 'Walk-In',
    patient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    service_name VARCHAR(100) NOT NULL,
    doctor_name VARCHAR(100),
    appointment_date VARCHAR(50) NOT NULL,
    appointment_time VARCHAR(50) NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Completed',
    treatment_description TEXT,
    treatment_performed TEXT,
    prescription TEXT,
    notes TEXT,
    amount NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    final_amount NUMERIC(10, 2) DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    due_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'Paid',
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    next_appointment_date VARCHAR(50),
    next_appointment_time VARCHAR(50),
    is_deleted INT DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_history_date ON history(appointment_date);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
