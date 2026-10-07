const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db/dbQuery');

// Patient-Centric Agent & MCP Context Endpoint (Scoped Exclusively to Patients Section)
router.get('/context', authenticateToken, async (req, res, next) => {
  try {
    const isD1 = !!process.env.CLOUDFLARE_API_TOKEN;
    const nowMs = Date.now();
    const todayStr = new Date(nowMs).toISOString().split('T')[0];
    const tomorrowStr = new Date(nowMs + 86400000).toISOString().split('T')[0];

    // 1. Fetch Patients
    let patients = [];
    try {
      const pRes = await db.query('SELECT * FROM patients ORDER BY id DESC');
      patients = pRes.rows || [];
    } catch (e) {
      patients = db.memoryDb.patients || [];
    }

    const activePatients = patients.filter(p => !p.is_deleted || p.is_deleted === 0);
    const deletedPatients = patients.filter(p => p.is_deleted === 1 || p.is_deleted === true);

    // 2. Fetch History to enrich visit cohorts
    let historyRows = [];
    try {
      const hRes = await db.query('SELECT patient_name, phone, appointment_date, completion_date, next_appointment_date, doctor_name, treatment_performed FROM history WHERE (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC');
      historyRows = hRes.rows || [];
    } catch (err) {
      historyRows = (db.memoryDb.history || []).filter(h => !h.is_deleted || h.is_deleted === 0);
    }

    // 3. Enrich patients with visit calculations
    const enrichedPatients = activePatients.map(p => {
      const cleanPhone = String(p.phone || '').replace(/\D/g, '').slice(-10);
      const hist = historyRows.find(h =>
        (h.patient_name && p.name && h.patient_name.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
        (h.phone && cleanPhone && String(h.phone).replace(/\D/g, '').slice(-10) === cleanPhone)
      );
      const lastVisit = hist ? (hist.appointment_date || (hist.completion_date ? String(hist.completion_date).split('T')[0] : '')) : '';
      let daysDiff = null;
      if (lastVisit) {
        const lvMs = new Date(lastVisit).getTime();
        if (!isNaN(lvMs)) {
          daysDiff = Math.max(0, Math.floor((nowMs - lvMs) / (1000 * 60 * 60 * 24)));
        }
      }
      return {
        id: p.id,
        patient_code: p.patient_code,
        name: p.name,
        phone: p.phone,
        email: p.email || '',
        gender: p.gender || 'Other',
        blood_group: p.blood_group || 'O+',
        relation: p.emergency_contact || 'Self',
        medical_history: p.medical_history || 'None',
        allergy: p.allergy || 'None',
        outstanding_balance: parseFloat(p.outstanding_balance || 0),
        last_visit_date: lastVisit,
        days_since_visit: daysDiff,
        next_appointment_date: hist ? hist.next_appointment_date : '',
        doctor_name: hist ? hist.doctor_name : ''
      };
    });

    // 4. Calculate Cohort Bifurcations
    const cohortBifurcations = {
      all: enrichedPatients.length,
      tomorrow: enrichedPatients.filter(p => p.next_appointment_date === tomorrowStr).length,
      visited_30d: enrichedPatients.filter(p => p.days_since_visit !== null && p.days_since_visit <= 30).length,
      not_visited_30_90d: enrichedPatients.filter(p => p.days_since_visit !== null && p.days_since_visit > 30 && p.days_since_visit <= 90).length,
      not_visited_90d: enrichedPatients.filter(p => p.days_since_visit !== null && p.days_since_visit > 90).length,
      not_visited_180d: enrichedPatients.filter(p => p.days_since_visit !== null && p.days_since_visit > 180).length,
      not_visited_365d: enrichedPatients.filter(p => p.days_since_visit !== null && p.days_since_visit > 365).length,
      never_visited: enrichedPatients.filter(p => !p.last_visit_date).length,
      payment_pending: enrichedPatients.filter(p => p.outstanding_balance > 0).length
    };

    const totalOutstandingBalance = enrichedPatients.reduce((sum, p) => sum + p.outstanding_balance, 0);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      agent_instructions: "This Web MCP context endpoint exposes exclusively the Patient Section details and cohort bifurcations for the Dental Clinic CRM.",
      database_mode: isD1 ? 'cloudflare_d1_remote' : 'local_json',
      patient_section_overview: {
        total_active_patients: activePatients.length,
        total_deleted_patients: deletedPatients.length,
        total_outstanding_balance_inr: totalOutstandingBalance.toFixed(2),
        cohort_bifurcations: cohortBifurcations
      },
      available_filters: [
        'all',
        'tomorrow',
        'visited_30d',
        'not_visited_30_90d',
        'not_visited_90d',
        'not_visited_180d',
        'not_visited_365d',
        'never_visited',
        'payment_pending'
      ],
      recent_patients_sample: enrichedPatients.slice(0, 15)
    });
  } catch (error) {
    next(error);
  }
});

// MCP Tool Manifest for HTTP Clients (Exclusively Scoped to Patients Section)
router.get('/mcp-tools', (req, res) => {
  res.json({
    name: "dental-crm-patient-mcp",
    version: "1.0.0",
    description: "Antigravity & Model Context Protocol server scoped exclusively to the Dental Clinic CRM Patients Section",
    tools: [
      {
        name: "dental_list_patients",
        description: "Query and filter dental patients with family relations, unique patient codes, phone numbers, balances, and cohort bifurcations.",
        parameters: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search by patient name, phone number, patient code, or email" },
            filter: {
              type: "string",
              enum: [
                "all",
                "tomorrow",
                "visited_30d",
                "not_visited_30_90d",
                "not_visited_90d",
                "not_visited_180d",
                "not_visited_365d",
                "never_visited",
                "payment_pending"
              ],
              description: "Cohort bifurcation filter"
            },
            status: { type: "string", enum: ["active", "deleted", "all"], description: "Directory status filter" }
          }
        }
      },
      {
        name: "dental_get_patient_details",
        description: "Fetch complete clinical profile, credentials, contact info, medical history, allergies, balance, and full visit history of a specific patient by ID, patient code, or phone.",
        parameters: {
          type: "object",
          properties: {
            patient_id: { type: "number", description: "Numeric ID of the patient" },
            patient_code: { type: "string", description: "Unique patient code (e.g. P1001)" },
            phone: { type: "string", description: "Patient 10-digit phone number" }
          }
        }
      },
      {
        name: "dental_get_patient_bifurcations",
        description: "Retrieve comprehensive patient cohort bifurcation metrics, counts, and financial balance totals across all patient segments.",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    ]
  });
});

module.exports = router;
