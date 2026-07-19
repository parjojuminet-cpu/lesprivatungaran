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
    return true;
  });

  // 1. Ensure all default users from DEFAULT_JSON_USERS are included if missing
  for (const defaultUser of DEFAULT_JSON_USERS) {
    if (!users.some(u => u.username.toLowerCase() === defaultUser.username.toLowerCase())) {
      users.push(defaultUser);
    }
  }

  // Auto-migrate tutor passwords to: username + '111' if they are still '123' or 'tentor123'
  users = users.map(u => {
    if (u.role === 'TENTOR' && (u.passwordHash === '123' || u.passwordHash === 'tentor123')) {
      return {
        ...u,
        passwordHash: `${u.username.trim()}111`
      };
    }
    return u;
  });

  let cleanTutors = (db.tutors || []).filter(t => !DUMMY_IDS.has(t.id));
  let cleanStudents = (db.students || [])
    .filter(s => !DUMMY_IDS.has(s.id))
    .map(s => ({
      ...s,
      totalPackageSessions: s.totalPackageSessions !== undefined ? Number(s.totalPackageSessions) : 10,
      remainingSessions: s.remainingSessions !== undefined ? Number(s.remainingSessions) : 10
    }));
  let cleanParents = (db.parents || []).filter(p => !DUMMY_IDS.has(p.id));
  let cleanSchedules = (db.schedules || []).filter(s => !DUMMY_IDS.has(s.id));

  // 2. Auto-generate login User accounts for any Tutor in cleanTutors who doesn't have a user account yet
  for (const tut of cleanTutors) {
    const hasAccount = users.some(u => u.tutorId === tut.id || u.username.toLowerCase() === tut.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, ''));
    if (!hasAccount) {
      const cleanUsername = tut.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '') || `tentor_${tut.id}`;
      users.push({
        id: `usr-${tut.id}`,
        username: cleanUsername,
        passwordHash: `${cleanUsername}111`,
        name: tut.name,
        role: 'TENTOR',
        tutorId: tut.id,
        status: tut.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
        desc: `Tentor (${tut.subjects?.join(', ') || 'Mapel Bimbel'})`,
        createdAt: tut.createdAt || new Date().toISOString().substring(0, 10)
      });
    }
  }

  let cleanModules = (db.modules || []).filter(m => !DUMMY_IDS.has(m.id));
  for (const defaultMod of DEFAULT_JSON_MODULES) {
    const existingIdx = cleanModules.findIndex(m => m.id === defaultMod.id);
    if (existingIdx >= 0) {
      // Overwrite/update to ensure the user gets the real download links we set
      cleanModules[existingIdx] = {
        ...cleanModules[existingIdx],
        title: defaultMod.title,
        subject: defaultMod.subject,
        grade: defaultMod.grade,
        driveFileUrl: defaultMod.driveFileUrl,
        description: defaultMod.description,
        fileType: defaultMod.fileType,
        uploadedBy: defaultMod.uploadedBy,
        uploadedAt: defaultMod.uploadedAt
      };
    } else {
      cleanModules.push(defaultMod);
    }
  }

  // Deduplicate users strictly by ID and by Username
  const seenUserIds = new Set<string>();
  const seenUsernames = new Set<string>();
  const uniqueUsers: User[] = [];

  for (const u of users) {
    const id = (u.id || '').trim();
    const username = (u.username || '').toLowerCase().trim();
    if (id && !seenUserIds.has(id) && username && !seenUsernames.has(username)) {
      seenUserIds.add(id);
      seenUsernames.add(username);
      uniqueUsers.push(u);
    }
  }
  users = uniqueUsers;

  return {
    users,
    students: cleanStudents,
    tutors: cleanTutors,
    parents: cleanParents,
    subjects: db.subjects ? db.subjects.filter(s => !DUMMY_IDS.has(s.id)) : DEFAULT_JSON_SUBJECTS,
    workingAreas: db.workingAreas ? db.workingAreas.filter(w => !DUMMY_IDS.has(w.id)) : DEFAULT_JSON_WORKING_AREAS,
    schedules: cleanSchedules,
    attendances: (db.attendances || []).filter(a => !DUMMY_IDS.has(a.id)),
    invoices: (db.invoices || []).filter(i => !DUMMY_IDS.has(i.id)),
    finance: (db.finance || []).filter(f => !DUMMY_IDS.has(f.id)),
    salaries: (db.salaries || []).filter(s => !DUMMY_IDS.has(s.id)),
    approvals: (db.approvals || []).filter(a => !DUMMY_IDS.has(a.id)),
    modules: cleanModules,
    settings: db.settings ? db.settings : DEFAULT_JSON_SETTINGS,
    auditLogs: (db.auditLogs || []).filter(l => !DUMMY_IDS.has(l.id))
  };
}

export function loadErpJsonDatabase(): ErpDatabaseJson {
  const rawDb: ErpDatabaseJson = {
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

  return sanitizeErpDatabase(rawDb);
}

export function saveErpJsonDatabase(db: ErpDatabaseJson): void {
  // Client-side localStorage persistence completely disabled to prevent split-brain conflicts and data duplicates.
  // Express Server database server_db.json is the single source of truth.
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
