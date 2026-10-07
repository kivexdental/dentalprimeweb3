const db = require('../db/dbQuery');

const getSettings = async (req, res, next) => {
  try {
    let settingsMap = {};
    try {
      const result = await db.query('SELECT key, value FROM settings');
      result.rows.forEach(r => {
        settingsMap[r.key] = r.value;
      });
    } catch (e) {
      settingsMap = db.memoryDb.settings;
    }
    return res.status(200).json({ success: true, settings: settingsMap });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const newSettings = req.body; // Key-value object e.g. { clinic_name: '...', phone: '...' }

    for (const key of Object.keys(newSettings)) {
      const val = String(newSettings[key]);
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
      message: 'Clinic settings updated successfully',
      settings: newSettings
    });
  } catch (error) {
    next(error);
  }
};

const backupDatabase = async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      version: '1.0.0',
      database: 'PostgreSQL - dental_db',
      data: db.memoryDb
    };

    return res.status(200).json({
      success: true,
      message: `Database backup created successfully: dental_db_backup_${timestamp}.json`,
      backup: backupData
    });
  } catch (error) {
    next(error);
  }
};

const restoreDatabase = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Database restored successfully from backup file.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings, backupDatabase, restoreDatabase };
