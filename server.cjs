const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const historyRoutes = require('./routes/historyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const financeRoutes = require('./routes/financeRoutes');
const agentRoutes = require('./routes/agentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow loading CDN assets like Bootstrap, FontAwesome, Chart.js
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Static Files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const d1Token = process.env.CLOUDFLARE_API_TOKEN;
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database_mode: d1Token ? 'cloudflare_d1_remote' : 'local_persistent_json',
    environment: process.env.NODE_ENV || 'development'
  });
});

// HTML page shortcuts
app.get(['/', '/index.html', '/index'], (req, res) => {
  res.redirect('/dashboard');
});

app.get('/walkin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'walkin.html'));
});

app.get('/online', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'online.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Central Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  const d1Token = process.env.CLOUDFLARE_API_TOKEN;
  const dbMode = d1Token ? '☁️ Cloudflare D1 Remote Database (Live Sync)' : '💾 Persistent Local Storage (data/crm_store.json - Permanent)';

  console.log(`=======================================================`);
  console.log(`🦷 Dental Clinic CRM Server running on port ${PORT}`);
  console.log(`🗄️ Database Mode: ${dbMode}`);
  console.log(`📍 CRM Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📍 Staff Login:  http://localhost:${PORT}/login`);
  console.log(`📍 Walk-In Kiosk: http://localhost:${PORT}/walkin`);
  console.log(`📍 Online Booking: http://localhost:${PORT}/online`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use by another process.`);
    console.error(`💡 If another instance is running, close it or run with a different port (e.g., $env:PORT=5001; npm run dev).\n`);
    process.exit(1);
  } else {
    console.error('Server startup error:', err);
  }
});
