import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function crmPlugin(): Plugin {
  return {
    name: 'crm-backend-plugin',
    configureServer(server) {
      // 1. URL rewrite middleware for clean routes (/dashboard, /login, /walkin, /online, /crm)
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const [url, search] = rawUrl.split('?');
        const query = search ? `?${search}` : '';

        if (url === '/login' || url === '/login/') {
          req.url = `/login.html${query}`;
        } else if (url === '/dashboard' || url === '/dashboard/' || url === '/crm' || url === '/crm/') {
          req.url = `/dashboard.html${query}`;
        } else if (url === '/walkin' || url === '/walkin/') {
          req.url = `/walkin.html${query}`;
        } else if (url === '/online' || url === '/online/') {
          req.url = `/online.html${query}`;
        } else if (url === '/architecture') {
          req.url = `/architecture-graph.html${query}`;
        }
        next();
      });

      // 2. Direct API handler middleware using Express routes
      try {
        const express = require('express');
        const apiApp = express();
        apiApp.use(express.json());
        apiApp.use(express.urlencoded({ extended: true }));

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

        apiApp.use('/api/auth', authRoutes);
        apiApp.use('/api/bookings', bookingRoutes);
        apiApp.use('/api/patients', patientRoutes);
        apiApp.use('/api/doctors', doctorRoutes);
        apiApp.use('/api/history', historyRoutes);
        apiApp.use('/api/reports', reportRoutes);
        apiApp.use('/api/settings', settingRoutes);
        apiApp.use('/api/services', serviceRoutes);
        apiApp.use('/api/finance', financeRoutes);
        apiApp.use('/api/agent', agentRoutes);
        apiApp.use('/api/notifications', notificationRoutes);

        apiApp.get('/api/health', (req: any, res: any) => {
          res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            mode: 'integrated_vite_crm',
          });
        });

        // Only route /api requests to apiApp so website files and HMR are never blocked
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            return apiApp(req, res, next);
          }
          next();
        });
      } catch (err) {
        console.error('Failed to initialize CRM in Vite server:', err);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), crmPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
