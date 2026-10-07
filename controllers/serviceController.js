const db = require('../db/dbQuery');

const getServices = async (req, res, next) => {
  try {
    let services = [];
    try {
      const result = await db.query('SELECT * FROM services ORDER BY id ASC');
      services = result.rows;
    } catch (e) {
      services = db.memoryDb.services;
    }
    return res.status(200).json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { name, duration_mins, price, description, status } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Service Name and Price are required.' });
    }

    let newService;
    try {
      const sql = 'INSERT INTO services (name, duration_mins, price, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      const result = await db.query(sql, [name, duration_mins || 30, price, description || '', status || 'Active']);
      newService = result.rows[0];
    } catch (e) {
      newService = {
        id: db.memoryDb.services.length + 1,
        name,
        duration_mins: parseInt(duration_mins || 30),
        price: parseFloat(price),
        description: description || '',
        status: status || 'Active'
      };
      db.memoryDb.services.push(newService);
    }
    return res.status(201).json({ success: true, message: 'Dental service created successfully', service: newService });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, duration_mins, price, description, status } = req.body;

    let service;
    try {
      const sql = 'UPDATE services SET name=$1, duration_mins=$2, price=$3, description=$4, status=$5 WHERE id=$6 RETURNING *';
      const result = await db.query(sql, [name, duration_mins, price, description, status, id]);
      service = result.rows[0];
    } catch (e) {
      service = db.memoryDb.services.find(s => s.id === parseInt(id));
      if (service) Object.assign(service, { name, duration_mins, price, description, status });
    }
    return res.status(200).json({ success: true, message: 'Service updated successfully', service });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM services WHERE id = $1', [id]);
    } catch (e) {
      db.memoryDb.services = db.memoryDb.services.filter(s => s.id !== parseInt(id));
    }
    return res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getServices, createService, updateService, deleteService };
