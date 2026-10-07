const db = require('../db/dbQuery');

const getDoctors = async (req, res, next) => {
  try {
    let doctors = [];
    try {
      const result = await db.query('SELECT * FROM doctors ORDER BY id ASC');
      doctors = result.rows;
    } catch (e) {
      doctors = db.memoryDb.doctors;
    }
    return res.status(200).json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    next(error);
  }
};

const createDoctor = async (req, res, next) => {
  try {
    const { name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url } = req.body;
    if (!name || !specialization) {
      return res.status(400).json({ success: false, message: 'Doctor Name and Specialization are required.' });
    }

    let newDoctor;
    const defaultPhoto = photo_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80';
    try {
      const sql = `
        INSERT INTO doctors (name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `;
      const result = await db.query(sql, [name, qualification, specialization, experience, contact, email, available_days, available_time, defaultPhoto]);
      newDoctor = result.rows[0];
    } catch (e) {
      newDoctor = {
        id: db.memoryDb.doctors.length + 1,
        name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url: defaultPhoto
      };
      db.memoryDb.doctors.push(newDoctor);
    }
    return res.status(201).json({ success: true, message: 'Doctor added successfully', doctor: newDoctor });
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url } = req.body;
    let doctor;
    try {
      const sql = `
        UPDATE doctors SET name=$1, qualification=$2, specialization=$3, experience=$4, contact=$5, email=$6, available_days=$7, available_time=$8, photo_url=$9
        WHERE id=$10 RETURNING *
      `;
      const result = await db.query(sql, [name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url, id]);
      doctor = result.rows[0];
    } catch (e) {
      doctor = db.memoryDb.doctors.find(d => d.id === parseInt(id));
      if (doctor) Object.assign(doctor, { name, qualification, specialization, experience, contact, email, available_days, available_time, photo_url });
    }
    return res.status(200).json({ success: true, message: 'Doctor updated successfully', doctor });
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM doctors WHERE id = $1', [id]);
    } catch (e) {
      db.memoryDb.doctors = db.memoryDb.doctors.filter(d => d.id !== parseInt(id));
    }
    return res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDoctors, createDoctor, updateDoctor, deleteDoctor };
