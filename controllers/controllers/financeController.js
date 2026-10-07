const db = require('../db/dbQuery');

// 1. Get Financial Overview & Key Metrics
const getFinanceOverview = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let history = [];
    let expenses = [];
    let patients = [];

    try {
      const hRes = await db.query('SELECT * FROM history WHERE (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC');
      history = hRes.rows;
      const eRes = await db.query('SELECT * FROM expenses ORDER BY date DESC, id DESC');
      expenses = eRes.rows;
      const pRes = await db.query('SELECT * FROM patients WHERE (is_deleted = 0 OR is_deleted IS NULL)');
      patients = pRes.rows;
    } catch (e) {
      history = (db.memoryDb.history || []).filter(h => !h.is_deleted || h.is_deleted === 0);
      expenses = db.memoryDb.expenses || [];
      patients = (db.memoryDb.patients || []).filter(p => !p.is_deleted || p.is_deleted === 0);
    }

    const getPaidAmount = (h) => {
      if (h.paid_amount !== undefined && h.paid_amount !== null) {
        return parseFloat(h.paid_amount) || 0;
      }
      if (h.payment_status === 'Pending') return 0;
      return parseFloat(h.final_amount || 0);
    };

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    const totalRevenue = history.reduce((sum, h) => sum + getPaidAmount(h), 0);
    const todayRevenue = history
      .filter(h => (h.appointment_date === today || (h.completion_date && h.completion_date.startsWith(today))))
      .reduce((sum, h) => sum + getPaidAmount(h), 0);
    const monthlyRevenue = history
      .filter(h => {
        const d = h.appointment_date || h.completion_date || '';
        return d.startsWith(currentMonthPrefix);
      })
      .reduce((sum, h) => sum + getPaidAmount(h), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const todayExpenses = expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const monthlyExpenses = expenses
      .filter(e => (e.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const netProfit = totalRevenue - totalExpenses;
    const monthlyNetProfit = monthlyRevenue - monthlyExpenses;

    const totalOutstanding = patients.reduce((sum, p) => sum + Math.max(0, parseFloat(p.outstanding_balance || 0)), 0);

    // Payment method breakdown (actual collected)
    const paymentModes = { Cash: 0, Card: 0, UPI: 0, Other: 0 };
    history.forEach(h => {
      const mode = h.payment_mode || 'Cash';
      const amt = getPaidAmount(h);
      if (paymentModes[mode] !== undefined) {
        paymentModes[mode] += amt;
      } else {
        paymentModes.Other += amt;
      }
    });

    // Category breakdown for expenses
    const expenseCategories = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      expenseCategories[cat] = (expenseCategories[cat] || 0) + parseFloat(e.amount || 0);
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        todayRevenue: todayRevenue.toFixed(2),
        monthlyRevenue: monthlyRevenue.toFixed(2),
        monthlyExpenses: monthlyExpenses.toFixed(2),
        monthlyNetProfit: monthlyNetProfit.toFixed(2),
        currentMonthName,
        totalExpenses: totalExpenses.toFixed(2),
        todayExpenses: todayExpenses.toFixed(2),
        netProfit: netProfit.toFixed(2),
        totalOutstanding: totalOutstanding.toFixed(2),
        paymentModes,
        expenseCategories
      },
      recentPayments: history.slice(0, 10),
      recentExpenses: expenses.slice(0, 10)
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Payments Ledger
const getPayments = async (req, res, next) => {
  try {
    const { search, payment_mode, date, status } = req.query;
    let list = [];

    try {
      let sql = 'SELECT * FROM history WHERE (is_deleted = 0 OR is_deleted IS NULL)';
      const params = [];
      if (payment_mode) {
        params.push(payment_mode);
        sql += ` AND payment_mode = $${params.length}`;
      }
      if (date) {
        params.push(date);
        sql += ` AND appointment_date = $${params.length}`;
      }
      if (status) {
        params.push(status);
        sql += ` AND payment_status = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        sql += ` AND (patient_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR booking_code ILIKE $${params.length})`;
      }
      sql += ' ORDER BY id DESC';
      const result = await db.query(sql, params);
      list = result.rows;
    } catch (e) {
      list = [...(db.memoryDb.history || [])].filter(h => !h.is_deleted || h.is_deleted === 0);
      if (payment_mode) list = list.filter(h => (h.payment_mode || 'Cash') === payment_mode);
      if (date) list = list.filter(h => h.appointment_date === date);
      if (status) list = list.filter(h => (h.payment_status || 'Paid') === status);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(h =>
          (h.patient_name || '').toLowerCase().includes(q) ||
          (h.phone || '').includes(q) ||
          (h.booking_code || '').toLowerCase().includes(q) ||
          (h.service_name || '').toLowerCase().includes(q)
        );
      }
    }

    return res.status(200).json({ success: true, count: list.length, payments: list });
  } catch (error) {
    next(error);
  }
};

// 3. Get Expenses List
const getExpenses = async (req, res, next) => {
  try {
    const { category, date, search } = req.query;
    let list = [];

    try {
      let sql = 'SELECT * FROM expenses WHERE 1=1';
      const params = [];
      if (category) {
        params.push(category);
        sql += ` AND category = $${params.length}`;
      }
      if (date) {
        params.push(date);
        sql += ` AND date = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        sql += ` AND (title ILIKE $${params.length} OR notes ILIKE $${params.length})`;
      }
      sql += ' ORDER BY date DESC, id DESC';
      const result = await db.query(sql, params);
      list = result.rows;
    } catch (e) {
      list = [...(db.memoryDb.expenses || [])];
      if (category) list = list.filter(e => e.category === category);
      if (date) list = list.filter(e => e.date === date);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(e =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.notes || '').toLowerCase().includes(q)
        );
      }
    }

    return res.status(200).json({ success: true, count: list.length, expenses: list });
  } catch (error) {
    next(error);
  }
};

// 4. Create an Expense
const createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, date, notes } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ success: false, message: 'Expense title and amount are required.' });
    }

    const expDate = date || new Date().toISOString().split('T')[0];
    const expAmount = parseFloat(amount);
    const expCategory = category || 'General';

    let newExpense;
    try {
      const sql = 'INSERT INTO expenses (title, category, amount, date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      const result = await db.query(sql, [title, expCategory, expAmount, expDate, notes || '']);
      newExpense = result.rows[0];
    } catch (e) {
      if (!db.memoryDb.expenses) db.memoryDb.expenses = [];
      const maxId = db.memoryDb.expenses.length > 0 ? Math.max(...db.memoryDb.expenses.map(e => e.id)) : 0;
      newExpense = {
        id: maxId + 1,
        title,
        category: expCategory,
        amount: expAmount,
        date: expDate,
        notes: notes || '',
        created_at: new Date().toISOString()
      };
      db.memoryDb.expenses.unshift(newExpense);
    }

    return res.status(201).json({ success: true, message: 'Expense recorded successfully', expense: newExpense });
  } catch (error) {
    next(error);
  }
};

// 5. Delete an Expense
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM expenses WHERE id = $1', [id]);
    } catch (e) {
      if (db.memoryDb.expenses) {
        db.memoryDb.expenses = db.memoryDb.expenses.filter(e => e.id !== parseInt(id));
      }
    }
    return res.status(200).json({ success: true, message: 'Expense record deleted.' });
  } catch (error) {
    next(error);
  }
};

// 6. Collect Outstanding Patient Balance
const collectPatientBalance = async (req, res, next) => {
  try {
    const { patient_id, amount_paid, payment_mode, notes } = req.body;
    if (!patient_id || !amount_paid) {
      return res.status(400).json({ success: false, message: 'Patient ID and amount paid are required.' });
    }

    const amt = parseFloat(amount_paid);
    const mode = payment_mode || 'Cash';
    let patient;

    try {
      const pRes = await db.query('SELECT * FROM patients WHERE id = $1', [patient_id]);
      if (pRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });
      patient = pRes.rows[0];
      const newBal = Math.max(0, parseFloat(patient.outstanding_balance || 0) - amt);
      await db.query('UPDATE patients SET outstanding_balance = $1 WHERE id = $2', [newBal, patient_id]);
      
      // Insert payment into history
      await db.query(`
        INSERT INTO history (
          patient_name, phone, email, service_name, doctor_name, appointment_date, appointment_time,
          status, treatment_performed, amount, discount, final_amount, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completed', $8, $9, 0.00, $10, 'Paid')
      `, [
        patient.name, patient.phone, patient.email || '', 'Outstanding Balance Settlement',
        'Accounts Dept', new Date().toISOString().split('T')[0], '12:00:00',
        `Balance clearance: ${notes || ''}`, amt, amt
      ]);
    } catch (e) {
      patient = (db.memoryDb.patients || []).find(p => p.id === parseInt(patient_id));
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
      patient.outstanding_balance = Math.max(0, parseFloat(patient.outstanding_balance || 0) - amt);

      if (!db.memoryDb.history) db.memoryDb.history = [];
      db.memoryDb.history.unshift({
        id: db.memoryDb.history.length + 1,
        booking_code: `SETTLE-${patient.patient_code}`,
        visual_token: 'BAL',
        booking_type: 'Walk-In',
        patient_name: patient.name,
        phone: patient.phone,
        email: patient.email || '',
        service_name: 'Outstanding Balance Settlement',
        doctor_name: 'Accounts Dept',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '12:00:00',
        completion_date: new Date().toISOString(),
        status: 'Completed',
        treatment_performed: `Balance clearance: ${notes || ''}`,
        amount: amt,
        discount: 0,
        final_amount: amt,
        payment_status: 'Paid',
        payment_mode: mode,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `₹${amt} collected successfully via ${mode}. Updated balance: ₹${patient.outstanding_balance}`,
      patient
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinanceOverview,
  getPayments,
  getExpenses,
  createExpense,
  deleteExpense,
  collectPatientBalance
};
