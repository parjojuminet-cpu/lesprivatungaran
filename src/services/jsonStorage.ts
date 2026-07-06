import {
  User, Student, Tutor, Parent, Subject, WorkingArea, Schedule,
  Attendance, Invoice, Finance, TutorSalary, Module, Approval,
  Setting, AuditLog
} from '../types';
import {
  DEFAULT_JSON_USERS, DEFAULT_JSON_STUDENTS, DEFAULT_JSON_TUTORS,
  DEFAULT_JSON_PARENTS, DEFAULT_JSON_SUBJECTS, DEFAULT_JSON_WORKING_AREAS,
  DEFAULT_JSON_SCHEDULES, DEFAULT_JSON_ATTENDANCES, DEFAULT_JSON_INVOICES,
  DEFAULT_JSON_FINANCE, DEFAULT_JSON_SALARIES, DEFAULT_JSON_APPROVALS,
  DEFAULT_JSON_MODULES, DEFAULT_JSON_SETTINGS, DEFAULT_JSON_AUDIT_LOGS
} from '../data/defaultJsonData';

export interface ErpDatabaseJson {
  users: User[];
  students: Student[];
  tutors: Tutor[];
  parents: Parent[];
  subjects: Subject[];
  workingAreas: WorkingArea[];
  schedules: Schedule[];
  attendances: Attendance[];
  invoices: Invoice[];
  finance: Finance[];
  salaries: TutorSalary[];
  approvals: Approval[];
  modules: Module[];
  settings: Setting[];
  auditLogs: AuditLog[];
  lastExportedAt?: string;
}

const STORAGE_KEY = 'erp_full_database_json';

// Helper to filter out legacy seed dummy items
const DUMMY_IDS = new Set([
  'sis-1', 'sis-2', 'tut-1', 'tut-2', 'ort-1', 'ort-2', 'map-1', 'map-2', 'map-3', 'map-4',
  'wil-1', 'wil-2', 'jad-1', 'jad-2', 'abs-1', 'inv-1', 'inv-2', 'fin-1', 'fin-2', 'sal-1',
  'app-1', 'mod-1', 'log-1', 'log-2', 'log-3', 'log-4', 'usr-1', 'usr-2', 'usr-3', 'usr-4'
]);

const DUMMY_USERNAMES = new Set(['superadmin', 'management', 'tentor_budi', 'tentor_rina']);

export function sanitizeErpDatabase(db: Partial<ErpDatabaseJson>): ErpDatabaseJson {
  let users = (db.users || []).filter(u => {
    if (!u) return false;
    const uname = (u.username || '').toLowerCase().trim();
    if (DUMMY_USERNAMES.has(uname)) return false;
    if (DUMMY_IDS.has(u.id)) return false;
    if (u.name && (u.name.includes('Budi Santoso') || u.name.includes('Rina Wijaya') || u.name.includes('Siti Rahma'))) return false;
    return true;
  });

  // 1. Ensure all default users from DEFAULT_JSON_USERS are included if missing
  for (const defaultUser of DEFAULT_JSON_USERS) {
    if (!users.some(u => u.username.toLowerCase() === defaultUser.username.toLowerCase())) {
      users.push(defaultUser);
    }
  }

  let cleanTutors = (db.tutors || []).filter(t => !DUMMY_IDS.has(t.id) && !t.name?.includes('Budi Santoso') && !t.name?.includes('Rina Wijaya'));
  let cleanStudents = (db.students || []).filter(s => !DUMMY_IDS.has(s.id) && !s.name?.includes('Ananda Rizky') && !s.name?.includes('Bintang Perkasa') && !s.name?.includes('Citra Kirana'));
  let cleanParents = (db.parents || []).filter(p => !DUMMY_IDS.has(p.id));
  let cleanSchedules = (db.schedules || []).filter(s => !DUMMY_IDS.has(s.id));

  for (const st of DEFAULT_JSON_STUDENTS) {
    if (!cleanStudents.some(s => s.id === st.id)) {
      cleanStudents.push(st);
    }
  }

  for (const tut of DEFAULT_JSON_TUTORS) {
    if (!cleanTutors.some(t => t.id === tut.id)) {
      cleanTutors.push(tut);
    }
  }

  for (const pr of DEFAULT_JSON_PARENTS) {
    if (!cleanParents.some(p => p.id === pr.id)) {
      cleanParents.push(pr);
    }
  }

  for (const sch of DEFAULT_JSON_SCHEDULES) {
    if (!cleanSchedules.some(s => s.id === sch.id)) {
      cleanSchedules.push(sch);
    }
  }

  // 2. Auto-generate login User accounts for any Tutor in cleanTutors who doesn't have a user account yet
  for (const tut of cleanTutors) {
    const hasAccount = users.some(u => u.tutorId === tut.id || u.username.toLowerCase() === tut.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, ''));
    if (!hasAccount) {
      const cleanUsername = tut.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '') || `tentor_${tut.id}`;
      users.push({
        id: `usr-${tut.id}`,
        username: cleanUsername,
        passwordHash: 'tentor123',
        name: tut.name,
        role: 'TENTOR',
        tutorId: tut.id,
        status: tut.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
        desc: `Tentor (${tut.subjects?.join(', ') || 'Mapel Bimbel'})`,
        createdAt: tut.createdAt || new Date().toISOString().substring(0, 10)
      });
    }
  }

  return {
    users,
    students: cleanStudents,
    tutors: cleanTutors,
    parents: cleanParents,
    subjects: (db.subjects && db.subjects.length > 0) ? db.subjects.filter(s => !DUMMY_IDS.has(s.id)) : DEFAULT_JSON_SUBJECTS,
    workingAreas: (db.workingAreas && db.workingAreas.length > 0) ? db.workingAreas.filter(w => !DUMMY_IDS.has(w.id)) : DEFAULT_JSON_WORKING_AREAS,
    schedules: cleanSchedules,
    attendances: (db.attendances || []).filter(a => !DUMMY_IDS.has(a.id)),
    invoices: (db.invoices || []).filter(i => !DUMMY_IDS.has(i.id)),
    finance: (db.finance || []).filter(f => !DUMMY_IDS.has(f.id)),
    salaries: (db.salaries || []).filter(s => !DUMMY_IDS.has(s.id)),
    approvals: (db.approvals || []).filter(a => !DUMMY_IDS.has(a.id)),
    modules: (db.modules || []).filter(m => !DUMMY_IDS.has(m.id)),
    settings: db.settings && db.settings.length > 0 ? db.settings : DEFAULT_JSON_SETTINGS,
    auditLogs: (db.auditLogs || []).filter(l => !DUMMY_IDS.has(l.id))
  };
}

function getLocalArray<T>(key: string, fallback: T[]): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage`, e);
  }
  return fallback;
}

export function loadErpJsonDatabase(): ErpDatabaseJson {
  try {
    const fullSaved = localStorage.getItem(STORAGE_KEY);
    if (fullSaved) {
      const db: ErpDatabaseJson = JSON.parse(fullSaved);
      if (db && typeof db === 'object') {
        const sanitized = sanitizeErpDatabase(db);
        saveErpJsonDatabase(sanitized);
        return sanitized;
      }
    }
  } catch (e) {
    console.error('Failed reading full database json:', e);
  }

  const rawDb: ErpDatabaseJson = {
    users: getLocalArray('erp_local_users', DEFAULT_JSON_USERS),
    students: getLocalArray('erp_local_students', DEFAULT_JSON_STUDENTS),
    tutors: getLocalArray('erp_local_tutors', DEFAULT_JSON_TUTORS),
    parents: getLocalArray('erp_local_parents', DEFAULT_JSON_PARENTS),
    subjects: getLocalArray('erp_local_subjects', DEFAULT_JSON_SUBJECTS),
    workingAreas: getLocalArray('erp_local_areas', DEFAULT_JSON_WORKING_AREAS),
    schedules: getLocalArray('erp_local_schedules', DEFAULT_JSON_SCHEDULES),
    attendances: getLocalArray('erp_local_attendances', DEFAULT_JSON_ATTENDANCES),
    invoices: getLocalArray('erp_local_invoices', DEFAULT_JSON_INVOICES),
    finance: getLocalArray('erp_local_finance', DEFAULT_JSON_FINANCE),
    salaries: getLocalArray('erp_local_salaries', DEFAULT_JSON_SALARIES),
    approvals: getLocalArray('erp_local_approvals', DEFAULT_JSON_APPROVALS),
    modules: getLocalArray('erp_local_modules', DEFAULT_JSON_MODULES),
    settings: getLocalArray('erp_local_settings', DEFAULT_JSON_SETTINGS),
    auditLogs: getLocalArray('erp_local_audit_logs', DEFAULT_JSON_AUDIT_LOGS)
  };

  const sanitized = sanitizeErpDatabase(rawDb);
  saveErpJsonDatabase(sanitized);
  return sanitized;
}

export function saveErpJsonDatabase(db: ErpDatabaseJson): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    localStorage.setItem('erp_local_users', JSON.stringify(db.users));
    localStorage.setItem('erp_local_students', JSON.stringify(db.students));
    localStorage.setItem('erp_local_tutors', JSON.stringify(db.tutors));
    localStorage.setItem('erp_local_parents', JSON.stringify(db.parents));
    localStorage.setItem('erp_local_subjects', JSON.stringify(db.subjects));
    localStorage.setItem('erp_local_areas', JSON.stringify(db.workingAreas));
    localStorage.setItem('erp_local_schedules', JSON.stringify(db.schedules));
    localStorage.setItem('erp_local_attendances', JSON.stringify(db.attendances));
    localStorage.setItem('erp_local_invoices', JSON.stringify(db.invoices));
    localStorage.setItem('erp_local_finance', JSON.stringify(db.finance));
    localStorage.setItem('erp_local_salaries', JSON.stringify(db.salaries));
    localStorage.setItem('erp_local_approvals', JSON.stringify(db.approvals));
    localStorage.setItem('erp_local_modules', JSON.stringify(db.modules));
    localStorage.setItem('erp_local_settings', JSON.stringify(db.settings));
    localStorage.setItem('erp_local_audit_logs', JSON.stringify(db.auditLogs));
  } catch (e) {
    console.error('Failed saving ERP database to localStorage:', e);
  }
}

export function exportDatabaseToJson(): void {
  const db = loadErpJsonDatabase();
  db.lastExportedAt = new Date().toISOString();
  
  const jsonStr = JSON.stringify(db, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().substring(0, 10);
  a.download = `ERP_Bimbel_Database_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDatabaseFromJson(file: File): Promise<ErpDatabaseJson> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const db: ErpDatabaseJson = JSON.parse(text);
        
        if (!db || typeof db !== 'object') {
          throw new Error('Format file JSON tidak valid.');
        }

        const sanitized = sanitizeErpDatabase(db);
        saveErpJsonDatabase(sanitized);
        resolve(sanitized);
      } catch (err: any) {
        reject(err?.message || 'Gagal membaca file JSON');
      }
    };
    reader.onerror = () => reject('Gagal membuka file');
    reader.readAsText(file);
  });
}

export function resetDatabaseToDefaultJson(): ErpDatabaseJson {
  const defaultDb: ErpDatabaseJson = {
    users: DEFAULT_JSON_USERS,
    students: DEFAULT_JSON_STUDENTS,
    tutors: DEFAULT_JSON_TUTORS,
    parents: DEFAULT_JSON_PARENTS,
    subjects: DEFAULT_JSON_SUBJECTS,
    workingAreas: DEFAULT_JSON_WORKING_AREAS,
    schedules: DEFAULT_JSON_SCHEDULES,
    attendances: DEFAULT_JSON_ATTENDANCES,
    invoices: DEFAULT_JSON_INVOICES,
    finance: DEFAULT_JSON_FINANCE,
    salaries: DEFAULT_JSON_SALARIES,
    approvals: DEFAULT_JSON_APPROVALS,
    modules: DEFAULT_JSON_MODULES,
    settings: DEFAULT_JSON_SETTINGS,
    auditLogs: DEFAULT_JSON_AUDIT_LOGS
  };
  saveErpJsonDatabase(defaultDb);
  return defaultDb;
}
