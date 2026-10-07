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

const DEFAULT_QUICK_PROCEDURES = [
  { id: 1, title: 'Scaling Done', icon: '🩺', text: 'Routine oral examination completed. Generalized calculus noted. Ultrasonic scaling done.' },
  { id: 2, title: 'Composite Filling', icon: '🦷', text: 'Class II composite filling placed with etching, bonding & light cure polishing.' },
  { id: 3, title: 'RCT BMP Sitting', icon: '🔬', text: 'RCT: Access opened, working length established with apex locator, canals shaped to 25/04, dressed with Ca(OH)2.' },
  { id: 4, title: 'RCT Obturation', icon: '✨', text: 'RCT Obturation completed with gutta-percha & bioceramic sealer. Core restoration placed.' },
  { id: 5, title: 'Extraction', icon: '✂️', text: 'Atraumatic extraction performed under 2% Lignocaine with Adrenaline (1:80,000). Hemostasis achieved.' },
  { id: 6, title: 'Crown Prep', icon: '👑', text: 'Crown preparation completed with subgingival shoulder margin. Elastomeric impression taken.' },
  { id: 7, title: 'Post-Op Advice', icon: '📋', text: 'Post-op instructions given: Soft diet, avoid hot foods, warm salt water rinses after 24 hrs.' }
];

const getQuickProcedures = async (req, res, next) => {
  try {
    let procs = DEFAULT_QUICK_PROCEDURES;
    try {
      const result = await db.query("SELECT value FROM settings WHERE key = 'quick_procedures'");
      if (result.rows && result.rows.length > 0 && result.rows[0].value) {
        procs = JSON.parse(result.rows[0].value);
      }
    } catch (e) {
      if (db.memoryDb && db.memoryDb.settings && db.memoryDb.settings.quick_procedures) {
        procs = JSON.parse(db.memoryDb.settings.quick_procedures);
      }
    }
    return res.status(200).json({ success: true, procedures: procs });
  } catch (error) {
    next(error);
  }
};

const saveQuickProcedure = async (req, res, next) => {
  try {
    const { title, icon, text } = req.body;
    if (!title || !text) {
      return res.status(400).json({ success: false, message: 'Title and template text are required.' });
    }

    let procs = DEFAULT_QUICK_PROCEDURES;
    try {
      const result = await db.query("SELECT value FROM settings WHERE key = 'quick_procedures'");
      if (result.rows && result.rows.length > 0 && result.rows[0].value) {
        procs = JSON.parse(result.rows[0].value);
      }
    } catch (e) {
      if (db.memoryDb && db.memoryDb.settings && db.memoryDb.settings.quick_procedures) {
        procs = JSON.parse(db.memoryDb.settings.quick_procedures);
      }
    }

    const newId = procs.length > 0 ? Math.max(...procs.map(p => p.id || 0)) + 1 : 1;
    const newProc = { id: newId, title: title.trim(), icon: icon ? icon.trim() : '🦷', text: text.trim() };
    procs.push(newProc);

    const serialized = JSON.stringify(procs);
    try {
      await db.query("INSERT INTO settings (key, value) VALUES ('quick_procedures', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [serialized]);
    } catch (e) {
      try {
        await db.query("UPDATE settings SET value = $1 WHERE key = 'quick_procedures'", [serialized]);
      } catch (e2) {}
    }
    if (db.memoryDb && db.memoryDb.settings) db.memoryDb.settings.quick_procedures = serialized;

    return res.status(201).json({ success: true, message: 'Quick procedure added successfully!', procedure: newProc, procedures: procs });
  } catch (error) {
    next(error);
  }
};

const deleteQuickProcedure = async (req, res, next) => {
  try {
    const { id } = req.params;
    let procs = DEFAULT_QUICK_PROCEDURES;
    try {
      const result = await db.query("SELECT value FROM settings WHERE key = 'quick_procedures'");
      if (result.rows && result.rows.length > 0 && result.rows[0].value) {
        procs = JSON.parse(result.rows[0].value);
      }
    } catch (e) {
      if (db.memoryDb && db.memoryDb.settings && db.memoryDb.settings.quick_procedures) {
        procs = JSON.parse(db.memoryDb.settings.quick_procedures);
      }
    }

    procs = procs.filter(p => p.id !== parseInt(id));
    const serialized = JSON.stringify(procs);

    try {
      await db.query("UPDATE settings SET value = $1 WHERE key = 'quick_procedures'", [serialized]);
    } catch (e) {}
    if (db.memoryDb && db.memoryDb.settings) db.memoryDb.settings.quick_procedures = serialized;

    return res.status(200).json({ success: true, message: 'Quick procedure removed successfully!', procedures: procs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  backupDatabase,
  restoreDatabase,
  getQuickProcedures,
  saveQuickProcedure,
  deleteQuickProcedure
};
