import express from 'express';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
import {
  DEFAULT_JSON_USERS,
  DEFAULT_JSON_TUTORS,
  DEFAULT_JSON_STUDENTS,
  DEFAULT_JSON_SCHEDULES,
  DEFAULT_JSON_PARENTS,
  DEFAULT_JSON_SUBJECTS,
  DEFAULT_JSON_WORKING_AREAS,
  DEFAULT_JSON_SETTINGS
} from './src/data/defaultJsonData';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 3000;

// Default initial mock database from defaultJsonData
let students: any[] = [...DEFAULT_JSON_STUDENTS];
let tutors: any[] = [...DEFAULT_JSON_TUTORS];
let parents: any[] = [...DEFAULT_JSON_PARENTS];
let subjects: any[] = [...DEFAULT_JSON_SUBJECTS];
let workingAreas: any[] = [...DEFAULT_JSON_WORKING_AREAS];
let schedules: any[] = [...DEFAULT_JSON_SCHEDULES];
let attendances: any[] = [];
let invoices: any[] = [];
let finance: any[] = [];
let salaries: any[] = [];
let approvals: any[] = [];
let modules: any[] = [];
let settings: any[] = [...DEFAULT_JSON_SETTINGS];
let users: any[] = [...DEFAULT_JSON_USERS];
let auditLogs: any[] = [];

// MySQL Connection Pool Management
let pool: mysql.Pool | null = null;

function getMySQLPool(): mysql.Pool | null {
  if (pool) return pool;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

  if (!host || !user || !database) {
    return null;
  }

  pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000
  });

  return pool;
}

const DB_FILE_PATH = path.join(process.cwd(), 'server_db.json');

function loadServerDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (Array.isArray(data.students)) students = data.students;
        if (Array.isArray(data.tutors)) tutors = data.tutors;
        if (Array.isArray(data.parents)) parents = data.parents;
        if (Array.isArray(data.subjects)) subjects = data.subjects;
        if (Array.isArray(data.workingAreas)) workingAreas = data.workingAreas;
        if (Array.isArray(data.schedules)) schedules = data.schedules;
        if (Array.isArray(data.attendances)) attendances = data.attendances;
        if (Array.isArray(data.invoices)) invoices = data.invoices;
        if (Array.isArray(data.finance)) finance = data.finance;
        if (Array.isArray(data.salaries)) salaries = data.salaries;
        if (Array.isArray(data.approvals)) approvals = data.approvals;
        if (Array.isArray(data.modules)) modules = data.modules;
        if (Array.isArray(data.settings)) settings = data.settings;
        if (Array.isArray(data.users)) users = data.users;
        if (Array.isArray(data.auditLogs)) auditLogs = data.auditLogs;
        console.log('Successfully loaded database from server_db.json');
      }
    }
  } catch (err) {
    console.warn('Failed to load database from server_db.json, using defaults:', err);
  }
}

async function saveServerDbMySQL() {
  const p = getMySQLPool();
  if (!p) return;

  try {
    const keys = [
      { k: 'students', v: students },
      { k: 'tutors', v: tutors },
      { k: 'parents', v: parents },
      { k: 'subjects', v: subjects },
      { k: 'workingAreas', v: workingAreas },
      { k: 'schedules', v: schedules },
      { k: 'attendances', v: attendances },
      { k: 'invoices', v: invoices },
      { k: 'finance', v: finance },
      { k: 'salaries', v: salaries },
      { k: 'approvals', v: approvals },
      { k: 'modules', v: modules },
      { k: 'settings', v: settings },
      { k: 'users', v: users },
      { k: 'auditLogs', v: auditLogs }
    ];

    for (const item of keys) {
      await p.query(
        'INSERT INTO erp_store (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        [item.k, JSON.stringify(item.v)]
      );
    }
    console.log('Successfully saved and synchronized data to MySQL (erp_store)');
  } catch (err) {
    console.error('Failed to save data to MySQL:', err);
  }
}

async function initAndLoadDatabase() {
  const p = getMySQLPool();
  if (!p) {
    console.log('No MySQL configuration detected. Using local JSON file (server_db.json).');
    loadServerDb();
    return;
  }

  try {
    // Ensure erp_store table exists
    await p.query(`
      CREATE TABLE IF NOT EXISTS erp_store (
        \`key\` VARCHAR(50) PRIMARY KEY,
        \`value\` LONGTEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Fetch existing entries from the table
    const [rows]: any = await p.query('SELECT `key`, `value` FROM erp_store');

    if (rows.length === 0) {
      console.log('MySQL erp_store table is empty. Auto-seeding with current local data from server_db.json...');
      loadServerDb(); // load from server_db.json
      await saveServerDbMySQL(); // seed it to MySQL
      console.log('Seeding MySQL from server_db.json finished successfully!');
    } else {
      console.log('MySQL erp_store table has data. Loading database from MySQL...');
      const dbMap = new Map<string, any>();
      for (const row of rows) {
        try {
          dbMap.set(row.key, JSON.parse(row.value));
        } catch (e) {
          console.warn(`Failed to parse row for key ${row.key}:`, e);
        }
      }

      if (dbMap.has('students')) students = dbMap.get('students');
      if (dbMap.has('tutors')) tutors = dbMap.get('tutors');
      if (dbMap.has('parents')) parents = dbMap.get('parents');
      if (dbMap.has('subjects')) subjects = dbMap.get('subjects');
      if (dbMap.has('workingAreas')) workingAreas = dbMap.get('workingAreas');
      if (dbMap.has('schedules')) schedules = dbMap.get('schedules');
      if (dbMap.has('attendances')) attendances = dbMap.get('attendances');
      if (dbMap.has('invoices')) invoices = dbMap.get('invoices');
      if (dbMap.has('finance')) finance = dbMap.get('finance');
      if (dbMap.has('salaries')) salaries = dbMap.get('salaries');
      if (dbMap.has('approvals')) approvals = dbMap.get('approvals');
      if (dbMap.has('modules')) modules = dbMap.get('modules');
      if (dbMap.has('settings')) settings = dbMap.get('settings');
      if (dbMap.has('users')) users = dbMap.get('users');
      if (dbMap.has('auditLogs')) auditLogs = dbMap.get('auditLogs');
      console.log('Successfully loaded all ERP data from MySQL!');
    }
  } catch (err) {
    console.error('Failed to initialize or load from MySQL, falling back to local server_db.json:', err);
    loadServerDb();
  }
}

function saveServerDb() {
  try {
    const data = {
      students,
      tutors,
      parents,
      subjects,
      workingAreas,
      schedules,
      attendances,
      invoices,
      finance,
      salaries,
      approvals,
      modules,
      settings,
      users,
      auditLogs,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to save database to server_db.json:', err);
  }

  // Dual-write: update MySQL in the background (fire-and-forget)
  saveServerDbMySQL().catch(err => {
    console.error('Background MySQL save failed:', err);
  });
}

// Load DB immediately on server startup
loadServerDb();

app.get('/api/db', (req, res) => {
  res.json({
    students,
    tutors,
    parents,
    subjects,
    workingAreas,
    schedules,
    attendances,
    invoices,
    finance,
    salaries,
    approvals,
    modules,
    settings,
    users,
    auditLogs
  });
});

app.post('/api/db', (req, res) => {
  const data = req.body;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.students)) students = data.students;
    if (Array.isArray(data.tutors)) tutors = data.tutors;
    if (Array.isArray(data.parents)) parents = data.parents;
    if (Array.isArray(data.subjects)) subjects = data.subjects;
    if (Array.isArray(data.workingAreas)) workingAreas = data.workingAreas;
    if (Array.isArray(data.schedules)) schedules = data.schedules;
    if (Array.isArray(data.attendances)) attendances = data.attendances;
    if (Array.isArray(data.invoices)) invoices = data.invoices;
    if (Array.isArray(data.finance)) finance = data.finance;
    if (Array.isArray(data.salaries)) salaries = data.salaries;
    if (Array.isArray(data.approvals)) approvals = data.approvals;
    if (Array.isArray(data.modules)) modules = data.modules;
    if (Array.isArray(data.settings)) settings = data.settings;
    if (Array.isArray(data.users)) users = data.users;
    if (Array.isArray(data.auditLogs)) auditLogs = data.auditLogs;
    
    saveServerDb();
    res.json({ success: true, message: 'Database updated successfully on server' });
  } else {
    res.status(400).json({ error: 'Invalid database data' });
  }
});

// API ROUTES
app.get('/api/dashboard/stats', (req, res) => {
  const activeStudentsCount = students.filter(s => s.status === 'Aktif').length;
  const activeTutorsCount = tutors.filter(t => t.status === 'Aktif').length;
  const totalSessionsThisMonth = attendances.length;
  
  // Total Pemasukan
  const monthlyRevenue = finance
    .filter(f => f.type === 'Pemasukan')
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  // Total Gaji Tentor (Pengeluaran category 'Gaji Tentor')
  const monthlyTutorSalaries = finance
    .filter(f => f.type === 'Pengeluaran' && f.category === 'Gaji Tentor')
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  // Total Biaya Operasional (Pengeluaran category 'Operasional')
  const monthlyOperationalExpenses = finance
    .filter(f => f.type === 'Pengeluaran' && f.category === 'Operasional')
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  // Total Pengeluaran Keseluruhan
  const totalPengeluaran = finance
    .filter(f => f.type === 'Pengeluaran')
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  // Fee / Margin Manajemen: dihitung berdasarkan Nominal Margin masing-masing Siswa (misal 5.000, 7.000, 10.000)
  const defaultMargin = Number(settings.find(s => s.key === 'MARGIN_MANAGEMENT_NOMINAL')?.value || 10000);
  const monthlyManagementFees = attendances.length > 0 
    ? attendances.reduce((acc, att) => {
        const st = students.find(s => s.id === att.studentId);
        return acc + (st?.managementMarginNominal !== undefined ? Number(st.managementMarginNominal) : defaultMargin);
      }, 0)
    : (students.filter(s => s.status === 'Aktif').length * defaultMargin);

  // Profit Bersih Manajemen / Pemilik Usaha
  const monthlyNetProfit = monthlyRevenue - totalPengeluaran;

  // Piutang SPP Belum Lunas
  const unpaidInvoicesAmount = invoices
    .filter(i => i.status !== 'Lunas')
    .reduce((acc, i) => acc + (i.amount - (i.amountPaid || 0)), 0);

  const pendingApps = approvals.filter(a => a.status === 'Pending').length;
  const unpaidInvs = invoices.filter(i => i.status !== 'Lunas').length;

  res.json({
    totalActiveStudents: activeStudentsCount,
    totalActiveTutors: activeTutorsCount,
    totalSessionsThisMonth: totalSessionsThisMonth || 88,
    grossIncomeThisMonth: monthlyRevenue,
    netManagementProfitThisMonth: monthlyNetProfit,
    pendingApprovals: pendingApps,
    unpaidInvoices: unpaidInvs,
    monthlyRevenue,
    monthlyTutorSalaries,
    monthlyManagementFees,
    monthlyOperationalExpenses,
    monthlyNetProfit,
    unpaidInvoicesAmount
  });
});

app.get('/api/students', (req, res) => res.json(students));

app.post('/api/students', (req, res) => {
  const newStudent = {
    id: `std-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString().substring(0, 10)
  };
  students.unshift(newStudent);
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    time: new Date().toLocaleString('id-ID'),
    user: 'OPERATOR',
    activity: `Menambahkan siswa baru: ${newStudent.name}`
  });
  saveServerDb();
  res.json(newStudent);
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const index = students.findIndex(s => s.id === id);
  if (index !== -1) {
    students[index] = { ...students[index], ...req.body };
    saveServerDb();
    res.json(students[index]);
  } else {
    res.status(404).json({ error: 'Siswa tidak ditemukan' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  students = students.filter(s => s.id !== id);
  saveServerDb();
  res.json({ success: true });
});

app.get('/api/users', (req, res) => res.json(users));

app.post('/api/users', (req, res) => {
  const newUser = {
    id: `usr-${Date.now()}`,
    username: req.body.username || `user_${Date.now()}`,
    passwordHash: req.body.passwordHash || req.body.password || 'tentor123',
    name: req.body.name || 'Pengguna Baru',
    role: (req.body.role || 'TENTOR') as any,
    tutorId: req.body.tutorId || null,
    status: (req.body.status || 'Aktif') as any,
    desc: req.body.desc || `Akses ${req.body.role || 'TENTOR'} ERP Bimbel Privat`,
    createdAt: new Date().toISOString().substring(0, 10)
  };
  users.unshift(newUser);
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    time: new Date().toLocaleString('id-ID'),
    user: 'MANAGEMENT',
    activity: `Menerbitkan akun login user baru: ${newUser.username} (${newUser.role})`
  });
  saveServerDb();
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    saveServerDb();
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User tidak ditemukan' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.filter(u => u.id !== id && u.username !== id);
  saveServerDb();
  res.json({ success: true });
});

app.get('/api/tutors', (req, res) => res.json(tutors));

app.get('/api/tutors/recommend', (req, res) => {
  const { subject, grade } = req.query;
  let filtered = tutors;
  if (subject) {
    filtered = filtered.filter(t => (t.subjects || []).some(s => s.toLowerCase().includes(String(subject).toLowerCase())));
  }
  res.json(filtered.length ? filtered : tutors);
});

app.post('/api/tutors', (req, res) => {
  const newTutorId = `tut-${Date.now()}`;
  const newTutor = {
    id: newTutorId,
    ...req.body,
    averageRating: 5.0,
    totalRatings: 1,
    createdAt: new Date().toISOString().substring(0, 10)
  };
  tutors.unshift(newTutor);

  // Auto create user account for login if username provided
  if (req.body.username) {
    const newUser = {
      id: `usr-${Date.now()}`,
      username: req.body.username,
      passwordHash: req.body.password || 'tentor123',
      name: newTutor.name,
      role: 'TENTOR' as any,
      tutorId: newTutorId,
      status: 'Aktif' as any,
      desc: `Akses khusus tentor ${newTutor.name}: presensi mengajar, modul & rincian honor.`,
      createdAt: new Date().toISOString().substring(0, 10)
    };
    users.unshift(newUser);
  }
  saveServerDb();
  res.json(newTutor);
});

app.put('/api/tutors/:id', (req, res) => {
  const { id } = req.params;
  const index = tutors.findIndex(t => t.id === id);
  if (index !== -1) {
    tutors[index] = { ...tutors[index], ...req.body };
    saveServerDb();
    res.json(tutors[index]);
  } else {
    res.status(404).json({ error: 'Tentor tidak ditemukan' });
  }
});

app.delete('/api/tutors/:id', (req, res) => {
  const { id } = req.params;
  tutors = tutors.filter(t => t.id !== id);
  saveServerDb();
  res.json({ success: true });
});

app.get('/api/parents', (req, res) => res.json(parents));
app.get('/api/subjects', (req, res) => res.json(subjects));
app.get('/api/working-areas', (req, res) => res.json(workingAreas));

app.get('/api/schedules', (req, res) => {
  const mapped = schedules.map(sch => {
    const st = students.find(s => s.id === sch.studentId);
    const tt = tutors.find(t => t.id === sch.tutorId);
    return {
      ...sch,
      studentName: st?.name || sch.studentId,
      tutorName: tt?.name || sch.tutorId
    };
  });
  res.json(mapped);
});

app.post('/api/schedules/check-clash', (req, res) => {
  const { tutorId, studentId, dayOfWeek, timeSlot } = req.body;
  const clashes: string[] = [];

  const tutorClash = schedules.find(s => s.tutorId === tutorId && s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot && s.status === 'Aktif');
  if (tutorClash) {
    clashes.push(`Bentrok Jadwal Tentor pada ${dayOfWeek} ${timeSlot}`);
  }

  const studentClash = schedules.find(s => s.studentId === studentId && s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot && s.status === 'Aktif');
  if (studentClash) {
    clashes.push(`Bentrok Jadwal Siswa pada ${dayOfWeek} ${timeSlot}`);
  }

  res.json({
    hasClash: clashes.length > 0,
    clashes
  });
});

app.post('/api/schedules', (req, res) => {
  const tutor = tutors.find(t => t.id === req.body.tutorId);
  const newSch = {
    id: `sch-${Date.now()}`,
    ...req.body,
    sessionRate: req.body.sessionRate ? Number(req.body.sessionRate) : (tutor?.ratePerSession || 40000),
    status: 'Aktif',
    rescheduleCountThisMonth: 0,
    createdAt: new Date().toISOString().substring(0, 10)
  };
  schedules.unshift(newSch);
  saveServerDb();
  res.json(newSch);
});

app.put('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const index = schedules.findIndex(s => s.id === id);
  if (index !== -1) {
    schedules[index] = { ...schedules[index], ...req.body };
    saveServerDb();
    res.json(schedules[index]);
  } else {
    res.status(404).json({ error: 'Jadwal tidak ditemukan' });
  }
});

app.delete('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  schedules = schedules.filter(s => s.id !== id);
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    time: new Date().toLocaleString('id-ID'),
    user: 'MANAGEMENT',
    activity: `Menghapus entri jadwal mengajar ID: ${id}`
  });
  saveServerDb();
  res.json({ success: true });
});

app.get('/api/attendances', (req, res) => {
  const mapped = attendances.map(a => {
    const st = students.find(s => s.id === a.studentId);
    const tt = tutors.find(t => t.id === a.tutorId);
    return {
      ...a,
      studentName: st?.name || a.studentId,
      tutorName: tt?.name || a.tutorId,
      subject: a.materialCovered ? a.materialCovered.split(' ')[0] : 'Pelajaran'
    };
  });
  res.json(mapped);
});

app.post('/api/attendances', (req, res) => {
  const { scheduleId, studentId, tutorId, date } = req.body;
  const targetDate = date || new Date().toISOString().substring(0, 10);
  const incomingId = req.body.id || `att-${Date.now()}`;

  // Find if it already exists
  const existingIndex = attendances.findIndex(a => a.id === incomingId);
  let oldAtt = null;
  if (existingIndex !== -1) {
    oldAtt = attendances[existingIndex];
  }

  // Revert old attendance impact if it was 'Hadir'
  if (oldAtt && oldAtt.status === 'Hadir') {
    // 1. Revert student remaining sessions
    const stIndex = students.findIndex(s => s.id === oldAtt.studentId);
    if (stIndex !== -1) {
      students[stIndex].remainingSessions = (students[stIndex].remainingSessions || 0) + 1;
      students[stIndex].packageStatus = students[stIndex].remainingSessions <= 0 ? 'Habis' : students[stIndex].remainingSessions <= 2 ? 'Hampir Habis' : 'Aktif';
    }
    // 2. Revert finance records associated with oldAtt.id
    finance = finance.filter(f => f.attendanceId !== oldAtt.id);
    // 3. Revert tutor salaries
    const oldMonth = oldAtt.date.substring(0, 7);
    const salIdx = salaries.findIndex(s => s.tutorId === oldAtt.tutorId && s.monthYear === oldMonth);
    if (salIdx !== -1) {
      const sch = schedules.find(sc => sc.id === oldAtt.scheduleId);
      const tut = tutors.find(t => t.id === oldAtt.tutorId);
      const honorRate = sch?.sessionRate || tut?.ratePerSession || 40000;
      salaries[salIdx].totalAttendanceRate = Math.max(0, (salaries[salIdx].totalAttendanceRate || 0) - honorRate);
      salaries[salIdx].totalSalary = salaries[salIdx].totalAttendanceRate + (salaries[salIdx].cancellationCompensation || 0) + (salaries[salIdx].bonus || 0) - (salaries[salIdx].deductions || 0);
    }
  }

  // Create new attendance object
  const newAtt = {
    id: incomingId,
    ...req.body,
    date: targetDate,
    serverTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  // Update or insert
  if (existingIndex !== -1) {
    attendances[existingIndex] = newAtt;
  } else {
    attendances.unshift(newAtt);
  }

  // Apply new attendance impact if status is 'Hadir'
  if (!newAtt.status || newAtt.status === 'Hadir') {
    const stIndex = students.findIndex(s => s.id === newAtt.studentId);
    if (stIndex !== -1 && students[stIndex].remainingSessions > 0) {
      students[stIndex].remainingSessions -= 1;
      if (students[stIndex].remainingSessions <= 0) {
        students[stIndex].packageStatus = 'Habis';
      } else if (students[stIndex].remainingSessions <= 2) {
        students[stIndex].packageStatus = 'Hampir Habis';
      }
    }

    const tutor = tutors.find(t => t.id === tutorId);
    const student = students.find(s => s.id === studentId);
    const schedule = schedules.find(sc => sc.id === scheduleId);

    const honorRate = schedule?.sessionRate || tutor?.ratePerSession || 40000;
    const marginRate = student?.managementMarginNominal || 10000;
    const monthYearStr = targetDate.substring(0, 7);

    // Finance Expense: Gaji Tentor
    finance.unshift({
      id: `fin-sal-${Date.now()}`,
      type: 'Pengeluaran',
      category: 'Gaji Tentor',
      amount: honorRate,
      date: targetDate,
      description: `Honor Mengajar Tentor (${tutor?.name || 'Tentor'}) - Siswa ${student?.name || 'Siswa'} (${targetDate})`,
      tutorId,
      studentId,
      attendanceId: newAtt.id,
      createdBy: 'SYSTEM_AUTO_RECAP',
      createdAt: new Date().toISOString()
    });

    // Finance Income: Fee Manajemen
    finance.unshift({
      id: `fin-fee-${Date.now()}`,
      type: 'Pemasukan',
      category: 'Fee Manajemen',
      amount: marginRate,
      date: targetDate,
      description: `Fee Margin Manajemen Sesi - ${student?.name || 'Siswa'} (${targetDate})`,
      studentId,
      attendanceId: newAtt.id,
      createdBy: 'SYSTEM_AUTO_RECAP',
      createdAt: new Date().toISOString()
    });

    // Update Salaries
    const salIdx = salaries.findIndex(s => s.tutorId === tutorId && s.monthYear === monthYearStr);
    if (salIdx !== -1) {
      salaries[salIdx].totalAttendanceRate = (salaries[salIdx].totalAttendanceRate || 0) + honorRate;
      salaries[salIdx].totalSalary = salaries[salIdx].totalAttendanceRate + (salaries[salIdx].cancellationCompensation || 0) + (salaries[salIdx].bonus || 0) - (salaries[salIdx].deductions || 0);
    } else {
      salaries.unshift({
        id: `sal-${Date.now()}`,
        tutorId,
        monthYear: monthYearStr,
        totalAttendanceRate: honorRate,
        cancellationCompensation: 0,
        bonus: 0,
        deductions: 0,
        totalSalary: honorRate,
        paymentStatus: 'Pending',
        createdAt: new Date().toISOString().substring(0, 10)
      });
    }
  }

  saveServerDb();
  res.json(newAtt);
});

app.delete('/api/attendances/:id', (req, res) => {
  const { id } = req.params;
  const targetAtt = attendances.find(a => a.id === id);
  if (targetAtt) {
    attendances = attendances.filter(a => a.id !== id);
    if (targetAtt.status === 'Hadir') {
      const stIdx = students.findIndex(s => s.id === targetAtt.studentId);
      if (stIdx !== -1) {
        students[stIdx].remainingSessions = (students[stIdx].remainingSessions || 0) + 1;
        students[stIdx].packageStatus = students[stIdx].remainingSessions <= 0 ? 'Habis' : students[stIdx].remainingSessions <= 2 ? 'Hampir Habis' : 'Aktif';
      }
      finance = finance.filter(f => f.attendanceId !== id);
      const monthYearStr = targetAtt.date.substring(0, 7);
      const salIdx = salaries.findIndex(s => s.tutorId === targetAtt.tutorId && s.monthYear === monthYearStr);
      if (salIdx !== -1) {
        const sch = schedules.find(sc => sc.id === targetAtt.scheduleId);
        const tut = tutors.find(t => t.id === targetAtt.tutorId);
        const honorRate = sch?.sessionRate || tut?.ratePerSession || 40000;
        salaries[salIdx].totalAttendanceRate = Math.max(0, (salaries[salIdx].totalAttendanceRate || 0) - honorRate);
        salaries[salIdx].totalSalary = salaries[salIdx].totalAttendanceRate + (salaries[salIdx].cancellationCompensation || 0) + (salaries[salIdx].bonus || 0) - (salaries[salIdx].deductions || 0);
      }
    }
    saveServerDb();
  }
  res.json({ success: true, message: 'Data absensi berhasil dihapus.' });
});

app.get('/api/invoices', (req, res) => {
  const mapped = invoices.map(inv => {
    const st = students.find(s => s.id === inv.studentId);
    return {
      ...inv,
      studentName: st?.name || inv.studentId,
      monthPeriod: 'Juli 2026'
    };
  });
  res.json(mapped);
});

app.post('/api/invoices', (req, res) => {
  const newInv = {
    id: req.body.id || `inv-${Date.now()}`,
    invoiceNumber: req.body.invoiceNumber || `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
    studentId: req.body.studentId,
    amount: Number(req.body.amount),
    amountPaid: req.body.amountPaid || 0,
    status: req.body.status || 'Belum Lunas',
    dueDate: req.body.dueDate,
    createdAt: req.body.createdAt || new Date().toISOString().substring(0, 10),
    sessionCount: req.body.sessionCount !== undefined ? Number(req.body.sessionCount) : undefined,
    ratePerSession: req.body.ratePerSession !== undefined ? Number(req.body.ratePerSession) : undefined,
    additionalAmount: req.body.additionalAmount !== undefined ? Number(req.body.additionalAmount) : 0,
    additionalNotes: req.body.additionalNotes || '',
    additionalTutorId: req.body.additionalTutorId || '',
    isRevised: req.body.isRevised || false,
    revisedAt: req.body.revisedAt,
    revisionNote: req.body.revisionNote
  };
  invoices.unshift(newInv);
  saveServerDb();
  res.json(newInv);
});

app.post('/api/invoices/:id/pay', (req, res) => {
  const { id } = req.params;
  const invIndex = invoices.findIndex(i => i.id === id);
  if (invIndex !== -1) {
    const inv = invoices[invIndex];
    const amountToPay = Number(req.body.paymentAmount) || (inv.amount - inv.amountPaid);
    inv.amountPaid = (inv.amountPaid || 0) + amountToPay;
    if (inv.amountPaid >= inv.amount) {
      inv.status = 'Lunas';
    } else if (inv.amountPaid > 0) {
      inv.status = 'Cicilan';
    }

    // Add finance income record
    finance.unshift({
      id: `fin-${Date.now()}`,
      type: 'Pemasukan',
      category: 'SPP Siswa',
      amount: amountToPay,
      date: new Date().toISOString().substring(0, 10),
      description: `Pelunasan SPP Nomor Invoice ${inv.invoiceNumber}`,
      studentId: inv.studentId,
      createdBy: 'MANAGEMENT',
      createdAt: new Date().toISOString().substring(0, 10)
    });

    saveServerDb();
    res.json(inv);
  } else {
    res.status(404).json({ error: 'Invoice tidak ditemukan' });
  }
});

app.put('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const index = invoices.findIndex(i => i.id === id);
  if (index !== -1) {
    invoices[index] = {
      ...invoices[index],
      ...req.body,
      isRevised: true,
      revisedAt: new Date().toISOString().substring(0, 10)
    };
    saveServerDb();
    res.json(invoices[index]);
  } else {
    res.status(404).json({ error: 'Invoice tidak ditemukan' });
  }
});

app.delete('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  invoices = invoices.filter(i => i.id !== id);
  saveServerDb();
  res.json({ success: true });
});

app.get('/api/finance', (req, res) => res.json(finance));

app.put('/api/finance/:id', (req, res) => {
  const { id } = req.params;
  const index = finance.findIndex(f => f.id === id);
  if (index !== -1) {
    finance[index] = {
      ...finance[index],
      ...req.body,
      isRevised: true,
      revisedAt: new Date().toISOString().substring(0, 10)
    };
    saveServerDb();
    res.json(finance[index]);
  } else {
    res.status(404).json({ error: 'Data keuangan tidak ditemukan' });
  }
});

app.delete('/api/finance/:id', (req, res) => {
  const { id } = req.params;
  finance = finance.filter(f => f.id !== id);
  saveServerDb();
  res.json({ success: true });
});

app.get('/api/finance/mutasi', (req, res) => {
  let runningBalance = 0;
  const mutasi = [...finance].reverse().map(f => {
    const debit = f.type === 'Pemasukan' ? (Number(f.amount) || 0) : 0;
    const kredit = f.type === 'Pengeluaran' ? (Number(f.amount) || 0) : 0;
    runningBalance += (debit - kredit);
    return {
      ...f,
      debit,
      kredit,
      cumulativeBalance: runningBalance
    };
  }).reverse();
  res.json(mutasi);
});

app.post('/api/clear-finance-spp', (req, res) => {
  finance = [];
  invoices = [];
  salaries = [];
  saveServerDb();
  res.json({ success: true, message: 'Semua data Keuangan, Invoice SPP, dan Payroll Gaji telah dikosongkan.' });
});

app.post('/api/finance', (req, res) => {
  const newFin = {
    id: `fin-${Date.now()}`,
    ...req.body,
    createdBy: 'MANAGEMENT',
    createdAt: new Date().toISOString().substring(0, 10)
  };
  finance.unshift(newFin);
  saveServerDb();
  res.json(newFin);
});

app.get('/api/salaries', (req, res) => {
  const mapped = salaries.map(sal => {
    const tt = tutors.find(t => t.id === sal.tutorId);
    return {
      ...sal,
      tutorName: tt?.name || sal.tutorId,
      period: sal.monthYear,
      totalSessions: sal.totalAttendanceRate,
      totalAmount: sal.totalSalary,
      status: sal.paymentStatus,
      paidAt: sal.paymentDate
    };
  });
  res.json(mapped);
});

app.put('/api/salaries/:id/status', (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  const index = salaries.findIndex(s => s.id === id);
  if (index !== -1) {
    salaries[index].paymentStatus = paymentStatus;
    if (paymentStatus === 'Paid') {
      salaries[index].paymentDate = new Date().toISOString().substring(0, 10);
      // add finance pengeluaran
      const tut = tutors.find(t => t.id === salaries[index].tutorId);
      finance.unshift({
        id: `fin-${Date.now()}`,
        type: 'Pengeluaran',
        category: 'Gaji Tentor',
        amount: salaries[index].totalSalary,
        date: new Date().toISOString().substring(0, 10),
        description: `Pembayaran Gaji Tentor ${tut?.name || salaries[index].tutorId}`,
        tutorId: salaries[index].tutorId,
        createdBy: 'MANAGEMENT',
        createdAt: new Date().toISOString().substring(0, 10)
      });
    }
    saveServerDb();
    res.json(salaries[index]);
  } else {
    res.status(404).json({ error: 'Gaji tidak ditemukan' });
  }
});

app.get('/api/approvals', (req, res) => res.json(approvals));

app.put('/api/approvals/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, remarks, approvedBy } = req.body;
  const index = approvals.findIndex(a => a.id === id);
  if (index !== -1) {
    approvals[index].status = status;
    approvals[index].remarks = remarks;
    approvals[index].approvedBy = approvedBy;
    saveServerDb();
    res.json(approvals[index]);
  } else {
    res.status(404).json({ error: 'Pengajuan tidak ditemukan' });
  }
});

app.get('/api/modules', (req, res) => res.json(modules));

app.post('/api/modules', (req, res) => {
  const newMod = {
    id: `mod-${Date.now()}`,
    ...req.body,
    uploadedAt: new Date().toISOString().substring(0, 10)
  };
  modules.unshift(newMod);
  saveServerDb();
  res.json(newMod);
});

app.put('/api/modules/:id', (req, res) => {
  const { id } = req.params;
  const index = modules.findIndex(m => m.id === id);
  if (index !== -1) {
    modules[index] = { ...modules[index], ...req.body };
    saveServerDb();
    res.json(modules[index]);
  } else {
    res.status(404).json({ error: 'Modul tidak ditemukan' });
  }
});

app.delete('/api/modules/:id', (req, res) => {
  const { id } = req.params;
  modules = modules.filter(m => m.id !== id);
  saveServerDb();
  res.json({ success: true });
});

app.get('/api/settings', (req, res) => res.json(settings));

app.put('/api/settings', (req, res) => {
  if (req.body.settingsList) {
    settings = req.body.settingsList;
  }
  saveServerDb();
  res.json(settings);
});

app.get('/api/audit-logs', (req, res) => res.json(auditLogs));

app.post('/api/clear-all-activities-absensi-keuangan', (req, res) => {
  schedules = [];
  attendances = [];
  finance = [];
  invoices = [];
  salaries = [];
  approvals = [];
  // Reset student remaining sessions to total package sessions
  students = students.map((s: any) => ({
    ...s,
    remainingSessions: s.totalPackageSessions !== undefined ? Number(s.totalPackageSessions) : 10,
    packageStatus: 'Aktif'
  }));
  saveServerDb();
  res.json({ success: true, message: 'Data aktivitas, absensi, dan keuangan berhasil dikosongkan.' });
});

app.post('/api/clear-all-data', (req, res) => {
  students = [];
  tutors = [];
  parents = [];
  subjects = [];
  workingAreas = [];
  schedules = [];
  attendances = [];
  invoices = [];
  finance = [];
  salaries = [];
  approvals = [];
  modules = [];
  users = [
    { id: 'usr-admin', username: 'admin', passwordHash: 'admin123', name: 'Administrator', role: 'SUPER_ADMIN', status: 'Aktif', desc: 'Akses penuh ke seluruh modul ERP.', createdAt: '2026-01-01' }
  ];
  settings = [
    { key: 'MARGIN_MANAGEMENT_NOMINAL', value: 10000, description: 'Nominal Standar Fee/Potongan Manajemen (Rp per Sesi Pertemuan)', category: 'Keuangan' },
    { key: 'MAX_RESCHEDULE_PER_MONTH', value: 2, description: 'Batas Maksimal Reschedule Gratis Per Bulan', category: 'Operasional' },
    { key: 'MIN_NOTICE_RESCHEDULE_DAYS', value: 1, description: 'Minimal Pemberitahuan Reschedule Sebelum Hari Mengajar (Hari, misal 1 atau 2 hari)', category: 'Operasional' },
    { key: 'MAX_DEADLINE_RESCHEDULE_BEFORE_TEACHING_DAYS', value: 1, description: 'Batas Maksimal Pengajuan Reschedule Sebelum Hari Mengajar (Hari, Standar: H-1)', category: 'Operasional' }
  ];
  auditLogs = [];
  saveServerDb();
  res.json({ success: true, message: 'Semua data ERP telah dikosongkan.' });
});

// START SERVER WITH VITE MIDDLEWARE
async function startServer() {
  // Initialize and load MySQL database if configured; falls back to server_db.json
  await initAndLoadDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server ERP Bimbel Privat running on port ${PORT}`);
  });
}

startServer();

export default app;
