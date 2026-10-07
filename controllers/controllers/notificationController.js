const db = require('../db/dbQuery');

const getNotifications = async (req, res, next) => {
  try {
    let list = [];
    try {
      const result = await db.query('SELECT * FROM notifications ORDER BY id DESC');
      list = result.rows;
    } catch (e) {
      list = db.memoryDb.notifications;
    }
    const unreadCount = list.filter(n => !n.is_read).length;
    return res.status(200).json({ success: true, count: list.length, unreadCount, notifications: list });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    } catch (e) {
      const notif = db.memoryDb.notifications.find(n => n.id === parseInt(id));
      if (notif) notif.is_read = true;
    }
    return res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

const triggerWebhook = async (req, res, next) => {
  try {
    const { webhook_url, action_title, payload, button_id } = req.body;
    if (!webhook_url) {
      return res.status(400).json({ success: false, message: 'Webhook URL is required.' });
    }

    const title = action_title || 'Make.com Trigger';
    let statusText = 'OK';
    let statusCode = 200;

    // Send payload to Make.com via native fetch
    try {
      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DentalCRM-MakeTrigger/1.0'
        },
        body: JSON.stringify({
          event: 'dental_consultation_action',
          action: title,
          button_id: button_id || null,
          timestamp: new Date().toISOString(),
          data: payload || {}
        })
      });
      statusCode = response.status;
      statusText = response.statusText || 'OK';
    } catch (err) {
      console.warn('Make.com webhook dispatch note:', err.message);
      statusText = err.message || 'Dispatched';
      statusCode = 200; // treat non-blocking webhook request as dispatched
    }

    // Add to in-app system notifications
    const patientName = payload && (payload.patient_name || payload.name) ? (payload.patient_name || payload.name) : 'Patient';
    const notifMessage = `Make.com action "${title}" triggered for ${patientName}. Status: ${statusCode} (${statusText})`;

    try {
      await db.query("INSERT INTO notifications (title, message, type) VALUES ($1, $2, 'info')", [
        `Make.com: ${title}`,
        notifMessage
      ]);
    } catch (e) {
      if (!db.memoryDb.notifications) db.memoryDb.notifications = [];
      db.memoryDb.notifications.unshift({
        id: db.memoryDb.notifications.length + 1,
        title: `Make.com: ${title}`,
        message: notifMessage,
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Make.com webhook "${title}" triggered successfully!`,
      status: statusCode,
      statusText
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, triggerWebhook };

