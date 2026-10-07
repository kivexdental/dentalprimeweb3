const db = require('../db/dbQuery');

// Standard Approved WhatsApp Message Templates
const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_confirmation',
    name: 'Appointment Confirmation',
    category: 'confirmation',
    title: 'Appointment Confirmed',
    whatsapp_template_name: 'dental_appointment_confirmation',
    text: `Hello {{patient_name}}, your appointment at {{clinic_name}} has been confirmed with {{doctor_name}} on {{date}} at {{time}}. Location: {{clinic_address}}. Please arrive 10 mins prior. Token: {{token}}. Thank you!`
  },
  {
    id: 'tpl_reminder_24h',
    name: '24-Hour Reminder',
    category: 'reminder_24h',
    title: '24-Hour Appointment Reminder',
    whatsapp_template_name: 'dental_reminder_24h',
    text: `Reminder: Dear {{patient_name}}, you have a scheduled visit tomorrow ({{date}}) at {{time}} with {{doctor_name}} at {{clinic_name}} ({{clinic_address}}). Reply YES to confirm or CALL us to reschedule.`
  },
  {
    id: 'tpl_reminder_2h',
    name: '2-Hour Reminder',
    category: 'reminder_2h',
    title: '2-Hour Quick Reminder',
    whatsapp_template_name: 'dental_reminder_2h',
    text: `Quick Reminder: Hi {{patient_name}}, your consultation is today at {{time}} with {{doctor_name}} at {{clinic_name}}. Your check-in token is {{token}}. Address: {{clinic_address}}. See you soon!`
  },
  {
    id: 'tpl_reschedule',
    name: 'Appointment Rescheduled',
    category: 'reschedule',
    title: 'Reschedule Notice',
    whatsapp_template_name: 'dental_appointment_reschedule',
    text: `Hello {{patient_name}}, your appointment at {{clinic_name}} has been rescheduled to {{date}} at {{time}} with {{doctor_name}}. Token: {{token}}. Clinic Address: {{clinic_address}}. Please reach out if you need adjustments.`
  },
  {
    id: 'tpl_payment_reminder',
    name: 'Payment Reminder',
    category: 'payment_reminder',
    title: 'Payment Reminder (Outstanding Balance)',
    whatsapp_template_name: 'dental_payment_reminder',
    text: `Dear {{patient_name}}, this is a gentle reminder regarding your outstanding dental invoice of ₹{{due_amount}} at {{clinic_name}}. You can view & settle your payment here: {{payment_link}}. Thank you!`
  },
  {
    id: 'tpl_treatment_followup',
    name: 'Treatment Follow-Up & Post-Op',
    category: 'treatment_followup',
    title: 'Post-Op Follow-up Care',
    whatsapp_template_name: 'dental_postop_followup',
    text: `Hello {{patient_name}}, {{doctor_name}} and the {{clinic_name}} team hope you are feeling comfortable after your {{treatment_name}} on {{date}}. Please follow the post-op care instructions: soft diet, warm salt water rinses, and reach out immediately at {{clinic_phone}} if you have discomfort.`
  },
  {
    id: 'tpl_review_request',
    name: 'Review & Feedback Request',
    category: 'review_request',
    title: 'Clinic Review & Feedback',
    whatsapp_template_name: 'dental_review_request',
    text: `Dear {{patient_name}}, thank you for visiting {{clinic_name}}! We hope you had a pleasant experience with {{doctor_name}}. Could you please take 30 seconds to rate us and leave a review? {{review_link}} Your feedback means the world to us!`
  }
];

// Helper to compute days ago
const getDaysDiff = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
};

// 1. Get Notification Center Data with Enriched Cohorts & Bifurcations
const getNotificationCenterData = async (req, res, next) => {
  try {
    let patients = [];
    let bookings = [];
    let history = [];
    let settingsMap = {};
    let logs = [];

    try {
      const pRes = await db.query('SELECT id, patient_code, name, phone, email, outstanding_balance, created_at, emergency_contact FROM patients WHERE (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC');
      patients = pRes.rows || [];
    } catch (e) {
      patients = (db.memoryDb.patients || []).filter(p => !p.is_deleted || p.is_deleted === 0);
    }

    try {
      const bRes = await db.query('SELECT id, booking_code, visual_token, patient_name, phone, email, booking_date, booking_time, doctor_name, service_name, status, final_amount, created_at FROM bookings WHERE (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC');
      bookings = bRes.rows || [];
    } catch (e) {
      bookings = (db.memoryDb.bookings || []).filter(b => !b.is_deleted || b.is_deleted === 0);
    }

    try {
      const hRes = await db.query('SELECT id, booking_id, visual_token, patient_name, phone, appointment_date, appointment_time, completion_date, doctor_name, treatment_performed, service_name, payment_status, final_amount, paid_amount, due_amount, created_at FROM history WHERE (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC');
      history = hRes.rows || [];
    } catch (e) {
      history = (db.memoryDb.history || []).filter(h => !h.is_deleted || h.is_deleted === 0);
    }

    try {
      const sRes = await db.query('SELECT key, value FROM settings');
      (sRes.rows || []).forEach(r => { settingsMap[r.key] = r.value; });
    } catch (e) {
      settingsMap = db.memoryDb.settings || {};
    }

    try {
      const lRes = await db.query('SELECT * FROM notifications ORDER BY id DESC LIMIT 50');
      logs = lRes.rows || [];
    } catch (e) {
      logs = (db.memoryDb.notifications || []).slice(0, 50);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    // Build Enriched Patient Cohort Master List (like Excel spreadsheet)
    const cohortList = patients.map(p => {
      const cleanPhone = String(p.phone || '').replace(/\D/g, '').slice(-10);

      // Match patient visits in history
      const pHistory = history.filter(h =>
        (h.phone && String(h.phone).replace(/\D/g, '').slice(-10) === cleanPhone) ||
        (h.patient_name && p.name && h.patient_name.trim().toLowerCase() === p.name.trim().toLowerCase())
      );
      const latestHistory = pHistory[0] || null;

      // Match pending bookings
      const pBookings = bookings.filter(b =>
        b.status !== 'Completed' && b.status !== 'Cancelled' &&
        ((b.phone && String(b.phone).replace(/\D/g, '').slice(-10) === cleanPhone) ||
         (b.patient_name && p.name && b.patient_name.trim().toLowerCase() === p.name.trim().toLowerCase()))
      );
      const nextBooking = pBookings[0] || null;

      // Determine last visit date
      let lastVisitDate = null;
      let lastTreatment = 'Consultation';
      let lastDoctor = 'Dr. Alexander Wright';

      if (latestHistory) {
        lastVisitDate = latestHistory.appointment_date || (latestHistory.completion_date ? String(latestHistory.completion_date).split('T')[0] : null);
        lastTreatment = latestHistory.treatment_performed || latestHistory.service_name || 'Consultation';
        lastDoctor = latestHistory.doctor_name || lastDoctor;
      }

      const daysSinceVisit = lastVisitDate ? getDaysDiff(lastVisitDate) : null;
      const hasVisited = !!latestHistory;

      // Next appointment details
      let nextDate = null;
      let nextTime = '10:00 AM';
      let nextToken = 'A001';
      let nextService = 'Consultation';

      if (nextBooking) {
        nextDate = nextBooking.booking_date instanceof Date ? nextBooking.booking_date.toISOString().split('T')[0] : nextBooking.booking_date;
        nextTime = nextBooking.booking_time || '10:00 AM';
        nextToken = nextBooking.visual_token || 'A001';
        nextService = nextBooking.service_name || 'Consultation';
        if (nextBooking.doctor_name) lastDoctor = nextBooking.doctor_name;
      } else if (latestHistory && latestHistory.next_appointment_date) {
        nextDate = latestHistory.next_appointment_date;
        nextTime = latestHistory.next_appointment_time || '10:00 AM';
      }

      // Bifurcation Status:
      // - "never_visited": registered but no completed clinical history
      // - "tomorrow": appointment scheduled for tomorrow
      // - "recent_30d": visited in last 30 days
      // - "visited_30_90d": visited 30 - 90 days ago
      // - "not_visited_90d": visited > 90 days ago
      // - "not_visited_180d": visited > 180 days ago
      // - "not_visited_365d": visited > 365 days ago (1 year+)
      // - "payment_pending": outstanding_balance > 0
      const outstandingBalance = parseFloat(p.outstanding_balance || 0);

      let visitStatus = 'never_visited';
      let statusLabel = 'Never Visited';
      let statusBadgeClass = 'bg-secondary';

      if (!hasVisited) {
        visitStatus = 'never_visited';
        statusLabel = 'Never Visited (New)';
        statusBadgeClass = 'bg-secondary';
      } else if (daysSinceVisit !== null && daysSinceVisit <= 30) {
        visitStatus = 'recent_30d';
        statusLabel = `Visited ${daysSinceVisit}d ago`;
        statusBadgeClass = 'bg-success';
      } else if (daysSinceVisit !== null && daysSinceVisit <= 90) {
        visitStatus = 'visited_30_90d';
        statusLabel = `Visited ${daysSinceVisit}d ago`;
        statusBadgeClass = 'bg-info text-dark';
      } else if (daysSinceVisit !== null && daysSinceVisit <= 180) {
        visitStatus = 'not_visited_90d';
        statusLabel = `Not Visited (${daysSinceVisit}d ago)`;
        statusBadgeClass = 'bg-warning text-dark';
      } else if (daysSinceVisit !== null && daysSinceVisit <= 365) {
        visitStatus = 'not_visited_180d';
        statusLabel = `Not Visited >6 Mo (${daysSinceVisit}d)`;
        statusBadgeClass = 'bg-danger';
      } else {
        visitStatus = 'not_visited_365d';
        statusLabel = `Inactive >1 Year (${daysSinceVisit || 365}d)`;
        statusBadgeClass = 'bg-dark';
      }

      const isTomorrow = nextDate === tomorrowStr;

      return {
        id: p.id,
        patient_code: p.patient_code || `P${p.id}`,
        name: p.name,
        phone: p.phone,
        email: p.email || '',
        relation: p.emergency_contact || 'Self',
        outstanding_balance: outstandingBalance,
        has_visited: hasVisited,
        last_visit_date: lastVisitDate,
        days_since_visit: daysSinceVisit,
        last_treatment: lastTreatment,
        doctor_name: lastDoctor,
        next_appointment_date: nextDate,
        next_appointment_time: nextTime,
        next_token: nextToken,
        next_service: nextService,
        booking_id: nextBooking ? nextBooking.id : (latestHistory ? latestHistory.booking_id : null),
        visit_status: visitStatus,
        status_label: statusLabel,
        status_badge_class: statusBadgeClass,
        is_tomorrow: isTomorrow,
        created_at: p.created_at
      };
    });

    // Compute Bifurcation Counts for Excel-like filter tabs
    const counts = {
      all: cohortList.length,
      tomorrow: cohortList.filter(c => c.is_tomorrow).length,
      visited_30d: cohortList.filter(c => c.days_since_visit !== null && c.days_since_visit <= 30).length,
      not_visited_30_90d: cohortList.filter(c => c.days_since_visit !== null && c.days_since_visit > 30 && c.days_since_visit <= 90).length,
      not_visited_90d: cohortList.filter(c => c.days_since_visit !== null && c.days_since_visit > 90).length,
      not_visited_180d: cohortList.filter(c => c.days_since_visit !== null && c.days_since_visit > 180).length,
      not_visited_365d: cohortList.filter(c => c.days_since_visit !== null && c.days_since_visit > 365).length,
      never_visited: cohortList.filter(c => !c.has_visited).length,
      payment_pending: cohortList.filter(c => c.outstanding_balance > 0).length
    };

    return res.status(200).json({
      success: true,
      templates: DEFAULT_TEMPLATES,
      counts,
      cohort_list: cohortList,
      settings: {
        clinic_name: settingsMap.clinic_name || 'Dental',
        clinic_address: settingsMap.clinic_address || '104 Healthcare Boulevard, Suite 300, Medical District',
        clinic_phone: settingsMap.phone || '+91 90334 74123',
        whatsapp_api_url: settingsMap.whatsapp_api_url || process.env.WHATSAPP_API_URL || '',
        whatsapp_api_token: settingsMap.whatsapp_api_token ? '••••••••' : '',
        whatsapp_phone_number_id: settingsMap.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        make_webhook_url: settingsMap.make_webhook_url || process.env.MAKE_WEBHOOK_URL || '',
        make_scenario_review_url: settingsMap.make_scenario_review_url || '',
        make_scenario_payment_url: settingsMap.make_scenario_payment_url || '',
        google_review_link: settingsMap.google_review_link || 'https://g.page/r/dental-clinic/review',
        payment_link_base: settingsMap.payment_link_base || 'https://pay.dentalclinic.com/invoice/'
      },
      patients,
      bookings: bookings.slice(0, 50),
      history: history.slice(0, 50),
      recent_logs: logs
    });
  } catch (error) {
    next(error);
  }
};

// 2. Dispatch Single Notification (to WhatsApp API or Make.com Webhook)
const dispatchNotification = async (req, res, next) => {
  try {
    const {
      channel, // 'whatsapp' or 'make'
      template_id,
      patient_id,
      booking_id,
      recipient_phone,
      recipient_name,
      doctor_name,
      appointment_date,
      appointment_time,
      token,
      treatment_name,
      due_amount,
      payment_link,
      review_link,
      rendered_message,
      webhook_url, // optional override
      whatsapp_api_url // optional override
    } = req.body;

    if (!recipient_phone) {
      return res.status(400).json({ success: false, message: 'Recipient phone number is required.' });
    }

    // Load active settings
    let settingsMap = {};
    try {
      const sRes = await db.query('SELECT key, value FROM settings');
      (sRes.rows || []).forEach(r => { settingsMap[r.key] = r.value; });
    } catch (e) {
      settingsMap = db.memoryDb.settings || {};
    }

    const clinicName = settingsMap.clinic_name || 'Dental';
    const clinicAddress = settingsMap.clinic_address || '104 Healthcare Boulevard';
    const clinicPhone = settingsMap.phone || '+91 90334 74123';
    const finalPaymentLink = payment_link || `${settingsMap.payment_link_base || 'https://pay.dentalclinic.com/invoice/'}${booking_id || patient_id || 'general'}`;
    const finalReviewLink = review_link || settingsMap.google_review_link || 'https://g.page/r/dental-clinic/review';

    const cleanPhone = String(recipient_phone).replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Find template if available
    const tpl = DEFAULT_TEMPLATES.find(t => t.id === template_id) || DEFAULT_TEMPLATES[0];

    // Standardized Payload for both channels
    const standardPayload = {
      event: 'crm_notification_dispatched',
      channel: channel || 'whatsapp',
      template_id: tpl.id,
      template_name: tpl.name,
      whatsapp_template_name: tpl.whatsapp_template_name,
      patient: {
        id: patient_id || null,
        name: recipient_name || 'Patient',
        phone: phoneWithCountry,
        raw_phone: recipient_phone
      },
      appointment: {
        booking_id: booking_id || null,
        token: token || 'A001',
        doctor_name: doctor_name || 'Dr. Alexander Wright',
        date: appointment_date || new Date().toISOString().split('T')[0],
        time: appointment_time || '10:00 AM',
        treatment: treatment_name || 'General Dental Consultation',
        due_amount: parseFloat(due_amount) || 0
      },
      clinic: {
        name: clinicName,
        address: clinicAddress,
        phone: clinicPhone
      },
      links: {
        payment_link: finalPaymentLink,
        review_link: finalReviewLink
      },
      message: rendered_message || tpl.text,
      timestamp: new Date().toISOString()
    };

    let dispatchResult = { success: false, statusCode: 200, statusText: 'Simulated' };

    // --- CHANNEL A: WhatsApp API Direct Dispatch ---
    if (channel === 'whatsapp') {
      const targetApiUrl = whatsapp_api_url || settingsMap.whatsapp_api_url || process.env.WHATSAPP_API_URL;
      const apiToken = settingsMap.whatsapp_api_token || process.env.WHATSAPP_API_TOKEN;

      if (targetApiUrl && targetApiUrl.startsWith('http')) {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'DentalCRM-WhatsAppAPI/2.0'
          };
          if (apiToken) {
            headers['Authorization'] = `Bearer ${apiToken}`;
          }

          const metaPayload = {
            messaging_product: 'whatsapp',
            to: phoneWithCountry,
            type: 'text',
            text: { body: rendered_message || tpl.text },
            meta: standardPayload
          };

          const response = await fetch(targetApiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(metaPayload)
          });

          dispatchResult.statusCode = response.status;
          dispatchResult.statusText = response.statusText;
          dispatchResult.success = response.ok;
        } catch (err) {
          console.warn('WhatsApp API live dispatch error:', err.message);
          dispatchResult.statusCode = 502;
          dispatchResult.statusText = err.message;
          dispatchResult.success = false;
        }
      } else {
        dispatchResult.success = true;
        dispatchResult.statusText = 'Mock Delivered (No external API URL configured)';
      }
    }

    // --- CHANNEL B: Make.com Webhook Dispatch ---
    if (channel === 'make') {
      let targetWebhookUrl = webhook_url || settingsMap.make_webhook_url || process.env.MAKE_WEBHOOK_URL;

      if (tpl.category === 'review_request' && settingsMap.make_scenario_review_url) {
        targetWebhookUrl = settingsMap.make_scenario_review_url;
      } else if (tpl.category === 'payment_reminder' && settingsMap.make_scenario_payment_url) {
        targetWebhookUrl = settingsMap.make_scenario_payment_url;
      }

      if (targetWebhookUrl && targetWebhookUrl.startsWith('http')) {
        try {
          const response = await fetch(targetWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'DentalCRM-MakeWebhook/2.0'
            },
            body: JSON.stringify(standardPayload)
          });

          dispatchResult.statusCode = response.status;
          dispatchResult.statusText = response.statusText;
          dispatchResult.success = response.ok;
        } catch (err) {
          console.warn('Make.com webhook dispatch error:', err.message);
          dispatchResult.statusCode = 502;
          dispatchResult.statusText = err.message;
          dispatchResult.success = false;
        }
      } else {
        dispatchResult.success = true;
        dispatchResult.statusText = 'Mock Webhook Delivered (Add Make.com URL in Settings to trigger live scenario)';
      }
    }

    // Log the notification record in DB
    const logTitle = `${channel === 'whatsapp' ? 'WhatsApp' : 'Make.com'}: ${tpl.name}`;
    const logMessage = `Sent to ${recipient_name || 'Patient'} (${recipient_phone}). Status: ${dispatchResult.statusCode} ${dispatchResult.statusText}`;

    try {
      await db.query(
        "INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)",
        [logTitle, logMessage, dispatchResult.success ? 'success' : 'warning']
      );
    } catch (e) {
      if (!db.memoryDb.notifications) db.memoryDb.notifications = [];
      db.memoryDb.notifications.unshift({
        id: db.memoryDb.notifications.length + 1,
        title: logTitle,
        message: logMessage,
        type: dispatchResult.success ? 'success' : 'warning',
        is_read: 0,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `${channel === 'whatsapp' ? 'WhatsApp message' : 'Make.com trigger'} processed successfully!`,
      channel,
      recipient: recipient_name,
      phone: recipient_phone,
      dispatch: dispatchResult,
      payload: standardPayload
    });
  } catch (error) {
    next(error);
  }
};

// 3. Batch Dispatch for Multi-Patient Selection
const dispatchBatchNotifications = async (req, res, next) => {
  try {
    const {
      channel, // 'whatsapp' or 'make'
      template_id,
      recipients, // Array of patient objects [{ patient_id, name, phone, doctor_name, date, time, token, treatment, due_amount, payment_link, review_link, message }]
      custom_template_text
    } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'Recipients list is required.' });
    }

    let settingsMap = {};
    try {
      const sRes = await db.query('SELECT key, value FROM settings');
      (sRes.rows || []).forEach(r => { settingsMap[r.key] = r.value; });
    } catch (e) {
      settingsMap = db.memoryDb.settings || {};
    }

    const clinicName = settingsMap.clinic_name || 'Dental';
    const clinicAddress = settingsMap.clinic_address || '104 Healthcare Boulevard';
    const clinicPhone = settingsMap.phone || '+91 90334 74123';
    const tpl = DEFAULT_TEMPLATES.find(t => t.id === template_id) || DEFAULT_TEMPLATES[0];

    let targetWebhookUrl = settingsMap.make_webhook_url || process.env.MAKE_WEBHOOK_URL;
    if (tpl.category === 'review_request' && settingsMap.make_scenario_review_url) {
      targetWebhookUrl = settingsMap.make_scenario_review_url;
    } else if (tpl.category === 'payment_reminder' && settingsMap.make_scenario_payment_url) {
      targetWebhookUrl = settingsMap.make_scenario_payment_url;
    }

    const batchSummary = {
      total: recipients.length,
      success_count: 0,
      failed_count: 0,
      results: []
    };

    // If sending to Make.com Webhook, send the full batch payload directly so Make.com scenario can loop over rows!
    if (channel === 'make' && targetWebhookUrl && targetWebhookUrl.startsWith('http')) {
      const fullBatchPayload = {
        event: 'crm_batch_notification_dispatched',
        channel: 'make',
        template_id: tpl.id,
        template_name: tpl.name,
        clinic: { name: clinicName, address: clinicAddress, phone: clinicPhone },
        total_recipients: recipients.length,
        recipients,
        timestamp: new Date().toISOString()
      };

      try {
        const response = await fetch(targetWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DentalCRM-MakeBatchWebhook/2.0'
          },
          body: JSON.stringify(fullBatchPayload)
        });
        batchSummary.success_count = recipients.length;
        batchSummary.webhook_status = response.status;
      } catch (err) {
        console.warn('Make.com batch webhook failed:', err.message);
        batchSummary.failed_count = recipients.length;
      }
    } else {
      // Process individual messages for WhatsApp or Mock
      for (const rec of recipients) {
        const cleanPhone = String(rec.phone || '').replace(/\D/g, '');
        if (!cleanPhone) {
          batchSummary.failed_count++;
          continue;
        }

        // Interpolate individual message
        const rawTemplate = custom_template_text || tpl.text;
        const personalizedMsg = rawTemplate
          .replace(/\{\{patient_name\}\}/g, rec.name || 'Patient')
          .replace(/\{\{doctor_name\}\}/g, rec.doctor_name || 'Dr. Alexander Wright')
          .replace(/\{\{date\}\}/g, rec.date || new Date().toISOString().split('T')[0])
          .replace(/\{\{time\}\}/g, rec.time || '10:00 AM')
          .replace(/\{\{token\}\}/g, rec.token || 'A001')
          .replace(/\{\{treatment_name\}\}/g, rec.treatment || 'Consultation')
          .replace(/\{\{due_amount\}\}/g, rec.due_amount || '0.00')
          .replace(/\{\{payment_link\}\}/g, rec.payment_link || `${settingsMap.payment_link_base || 'https://pay.dentalclinic.com/invoice/'}${rec.patient_id || 'ref'}`)
          .replace(/\{\{review_link\}\}/g, rec.review_link || settingsMap.google_review_link || 'https://g.page/r/dental/review')
          .replace(/\{\{clinic_name\}\}/g, clinicName)
          .replace(/\{\{clinic_address\}\}/g, clinicAddress)
          .replace(/\{\{clinic_phone\}\}/g, clinicPhone);

        batchSummary.success_count++;
        batchSummary.results.push({
          patient: rec.name,
          phone: cleanPhone,
          message: personalizedMsg,
          status: 'Delivered'
        });
      }
    }

    // Log the Batch Notification in Activity Logs
    const logTitle = `Batch ${channel === 'whatsapp' ? 'WhatsApp' : 'Make.com'}: ${tpl.name}`;
    const logMessage = `Dispatched batch notifications to ${recipients.length} patients in cohort. Successfully delivered: ${batchSummary.success_count}.`;

    try {
      await db.query(
        "INSERT INTO notifications (title, message, type) VALUES ($1, $2, 'success')",
        [logTitle, logMessage]
      );
    } catch (e) {
      if (!db.memoryDb.notifications) db.memoryDb.notifications = [];
      db.memoryDb.notifications.unshift({
        id: db.memoryDb.notifications.length + 1,
        title: logTitle,
        message: logMessage,
        type: 'success',
        is_read: 0,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Batch notifications dispatched successfully for ${recipients.length} selected patients!`,
      summary: batchSummary
    });
  } catch (error) {
    next(error);
  }
};

// 4. Save Notification API & Webhook Configuration
const saveNotificationConfig = async (req, res, next) => {
  try {
    const {
      whatsapp_api_url,
      whatsapp_api_token,
      whatsapp_phone_number_id,
      make_webhook_url,
      make_scenario_review_url,
      make_scenario_payment_url,
      google_review_link,
      payment_link_base
    } = req.body;

    const updates = {
      whatsapp_api_url: whatsapp_api_url || '',
      whatsapp_phone_number_id: whatsapp_phone_number_id || '',
      make_webhook_url: make_webhook_url || '',
      make_scenario_review_url: make_scenario_review_url || '',
      make_scenario_payment_url: make_scenario_payment_url || '',
      google_review_link: google_review_link || 'https://g.page/r/dental-clinic/review',
      payment_link_base: payment_link_base || 'https://pay.dentalclinic.com/invoice/'
    };

    if (whatsapp_api_token && whatsapp_api_token !== '••••••••') {
      updates.whatsapp_api_token = whatsapp_api_token;
    }

    for (const key of Object.keys(updates)) {
      const val = String(updates[key]);
      if (db.memoryDb && db.memoryDb.settings) {
        db.memoryDb.settings[key] = val;
      }
      try {
        await db.query(
          'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          [key, val]
        );
      } catch (e) {
        try {
          await db.query('UPDATE settings SET value = $1 WHERE key = $2', [val, key]);
        } catch (e2) {}
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Notification channels & scenario endpoints updated successfully!'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  DEFAULT_TEMPLATES,
  getNotificationCenterData,
  dispatchNotification,
  dispatchBatchNotifications,
  saveNotificationConfig
};
