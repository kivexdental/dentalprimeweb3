const db = require('../db/dbQuery');

const getHistory = async (req, res, next) => {
  try {
    const { date, month, year, doctor, service, search } = req.query;

    let list = [];
    try {
      let sql = 'SELECT * FROM history WHERE (is_deleted = 0 OR is_deleted IS NULL)';
      const params = [];

      if (date) {
        params.push(date);
        sql += ` AND appointment_date = $${params.length}`;
      }
      if (doctor) {
        params.push(doctor);
        sql += ` AND doctor_name = $${params.length}`;
      }
      if (service) {
        params.push(service);
        sql += ` AND service_name = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        sql += ` AND (patient_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR booking_code ILIKE $${params.length} OR service_name ILIKE $${params.length} OR doctor_name ILIKE $${params.length})`;
      }

      sql += ' ORDER BY id DESC';

      const result = await db.query(sql, params);
      list = result.rows;
    } catch (e) {
      list = [...(db.memoryDb.history || [])].filter(h => !h.is_deleted || h.is_deleted === 0);
      if (date) list = list.filter(h => h.appointment_date === date);
      if (doctor) list = list.filter(h => h.doctor_name === doctor);
      if (service) list = list.filter(h => h.service_name === service);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(h =>
          h.patient_name.toLowerCase().includes(q) ||
          h.phone.includes(q) ||
          h.booking_code.toLowerCase().includes(q) ||
          h.service_name.toLowerCase().includes(q)
        );
      }
    }

    // Additional filtering for month and year if provided
    if (month) {
      list = list.filter(h => {
        const d = new Date(h.appointment_date);
        return (d.getMonth() + 1) === parseInt(month);
      });
    }
    if (year) {
      list = list.filter(h => {
        const d = new Date(h.appointment_date);
        return d.getFullYear() === parseInt(year);
      });
    }

    return res.status(200).json({
      success: true,
      count: list.length,
      history: list
    });
  } catch (error) {
    next(error);
  }
};

const getHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let item = null;
    try {
      const result = await db.query('SELECT * FROM history WHERE id = $1', [id]);
      if (result.rows.length > 0) item = result.rows[0];
    } catch (e) {
      item = db.memoryDb.history.find(h => h.id === parseInt(id));
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Appointment history record not found' });
    }

    return res.status(200).json({ success: true, history: item });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory, getHistoryById };
