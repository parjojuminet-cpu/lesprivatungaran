import { ErpDatabaseJson, loadErpJsonDatabase, saveErpJsonDatabase } from './jsonStorage';
import { saveToFirestore } from './firestoreService';
import {
  Student, Tutor, Parent, Subject, WorkingArea, Schedule,
  Attendance, Invoice, Finance, TutorSalary, Module, Approval,
  Setting, AuditLog, User, PackageStatus
} from '../types';

// Helper to update full database state locally & in Cloud Firestore
export async function persistDatabaseUpdate(updater: (db: ErpDatabaseJson) => ErpDatabaseJson): Promise<ErpDatabaseJson> {
  const currentDb = loadErpJsonDatabase();
  const nextDb = updater(currentDb);
  saveErpJsonDatabase(nextDb);
  
  // Background cloud Firestore save to keep UI fully instant & non-blocking
  saveToFirestore(nextDb).catch(err => {
    console.warn('Background Firestore save status:', err);
  });
  
  return nextDb;
}

// Student CRUD
export async function saveStudentData(student: Partial<Student> & { id?: string }): Promise<ErpDatabaseJson> {
  const isEdit = !!student.id;
  const newId = student.id || `std_${Date.now()}`;
  const fullStudent: Student = {
    id: newId,
    name: student.name || 'Siswa Baru',
    gender: student.gender || 'Laki-laki',
    grade: student.grade || 'SD',
    className: student.className || '',
    school: student.school || '',
    address: student.address || '',
    parentName: student.parentName || '',
    parentWA: student.parentWA || '',
    subjects: student.subjects || [],
    totalPackageSessions: Number(student.totalPackageSessions !== undefined ? student.totalPackageSessions : 10),
    remainingSessions: Number(student.remainingSessions !== undefined ? student.remainingSessions : 10),
    packageStartDate: student.packageStartDate || new Date().toISOString().substring(0, 10),
    packageEndDate: student.packageEndDate || new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10),
    ratePerSession: Number(student.ratePerSession || 40000),
    managementMarginNominal: Number(student.managementMarginNominal || 10000),
    packageStatus: student.packageStatus || 'Aktif',
    status: student.status || 'Aktif',
    createdAt: student.createdAt || new Date().toISOString().substring(0, 10)
  };

  try {
    const url = isEdit ? `/api/students/${newId}` : '/api/students';
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullStudent)
    });
  } catch (err) {
    console.warn('API backend unreachable, saving directly to Firestore & LocalStorage', err);
  }

  return persistDatabaseUpdate(db => {
    const exists = db.students.some(s => s.id === newId);
    const updatedStudents = exists
      ? db.students.map(s => s.id === newId ? { ...s, ...fullStudent } : s)
      : [fullStudent, ...db.students];
    return { ...db, students: updatedStudents };
  });
}

export async function deleteStudentData(studentId: string): Promise<ErpDatabaseJson> {
  try {
    await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('API backend unreachable, deleting directly from Firestore & LocalStorage', err);
  }

  return persistDatabaseUpdate(db => ({
    ...db,
    students: db.students.filter(s => s.id !== studentId)
  }));
}

export async function resetAllStudentsQuotaTo10(): Promise<ErpDatabaseJson> {
  return persistDatabaseUpdate(db => ({
    ...db,
    students: db.students.map(s => {
      const rem = Math.min(s.remainingSessions !== undefined ? s.remainingSessions : 10, 10);
      return {
        ...s,
        totalPackageSessions: 10,
        remainingSessions: rem,
        packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as PackageStatus
      };
    })
  }));
}

// Tutor CRUD
export async function saveTutorData(tutor: Partial<Tutor> & { id?: string; username?: string; password?: string; createAccount?: boolean }): Promise<ErpDatabaseJson> {
  const isEdit = !!tutor.id;
  const newId = tutor.id || `tut_${Date.now()}`;
  const fullTutor: Tutor = {
    id: newId,
    name: tutor.name || 'Tentor Baru',
    gender: tutor.gender || 'Laki-laki',
    address: tutor.address || '',
    wa: tutor.wa || '',
    subjects: tutor.subjects || [],
    gradesMastered: tutor.gradesMastered || ['SD'],
    ratePerSession: Number(tutor.ratePerSession || 30000),
    workingArea: tutor.workingArea || [],
    workingHours: tutor.workingHours || [],
    salarySystem: (tutor.salarySystem as any) || 'Bagi Hasil',
    status: tutor.status || 'Aktif',
    maxHoursPerDay: Number(tutor.maxHoursPerDay || 4),
    maxHoursPerWeek: Number(tutor.maxHoursPerWeek || 20),
    maxStudents: Number(tutor.maxStudents || 5),
    evaluationNotes: tutor.evaluationNotes || '',
    averageRating: tutor.averageRating || 4.9,
    totalRatings: tutor.totalRatings || 10,
    createdAt: tutor.createdAt || new Date().toISOString().substring(0, 10)
  };

  try {
    const url = isEdit ? `/api/tutors/${newId}` : '/api/tutors';
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullTutor)
    });
  } catch (err) {
    console.warn('API backend unreachable, saving directly to Firestore & LocalStorage', err);
  }

  const cleanUsername = (tutor.username && tutor.username.trim())
    ? tutor.username.trim()
    : (fullTutor.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, ''));
  const cleanPassword = (tutor.password && tutor.password.trim()) ? tutor.password.trim() : 'tentor123';

  return persistDatabaseUpdate(db => {
    const exists = db.tutors.some(t => t.id === newId);
    const updatedTutors = exists
      ? db.tutors.map(t => t.id === newId ? { ...t, ...fullTutor } : t)
      : [fullTutor, ...db.tutors];

    // Ensure User account exists or is updated in db.users
    let updatedUsers = db.users || [];
    const existingUserIndex = updatedUsers.findIndex(u => u.tutorId === newId || u.username.toLowerCase() === cleanUsername.toLowerCase());

    const userObj: User = {
      id: existingUserIndex >= 0 ? updatedUsers[existingUserIndex].id : `usr-${newId}`,
      username: cleanUsername,
      passwordHash: cleanPassword,
      name: fullTutor.name,
      role: 'TENTOR',
      tutorId: newId,
      status: fullTutor.status === 'Aktif' ? 'Aktif' : 'Nonaktif',
      desc: `Tentor (${fullTutor.subjects.join(', ') || 'Semua Mapel'})`,
      createdAt: fullTutor.createdAt
    };

    if (existingUserIndex >= 0) {
      updatedUsers = updatedUsers.map((u, idx) => idx === existingUserIndex ? { ...u, ...userObj } : u);
    } else {
      updatedUsers = [userObj, ...updatedUsers];
    }

    return { ...db, tutors: updatedTutors, users: updatedUsers };
  });
}

export async function deleteTutorData(tutorId: string): Promise<ErpDatabaseJson> {
  try {
    await fetch(`/api/tutors/${tutorId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('API backend unreachable, deleting directly from Firestore & LocalStorage', err);
  }

  return persistDatabaseUpdate(db => ({
    ...db,
    tutors: db.tutors.filter(t => t.id !== tutorId)
  }));
}

// Schedule CRUD
export async function saveScheduleData(schedule: Partial<Schedule> & { id?: string }): Promise<ErpDatabaseJson> {
  const isEdit = !!schedule.id;
  const newId = schedule.id || `sch_${Date.now()}`;
  const fullSchedule: Schedule = {
    id: newId,
    studentId: schedule.studentId || '',
    tutorId: schedule.tutorId || '',
    subject: schedule.subject || '',
    dayOfWeek: schedule.dayOfWeek || 'Senin',
    timeSlot: schedule.timeSlot || '15:00 - 16:30',
    type: schedule.type || 'Jadwal Tetap',
    sessionRate: schedule.sessionRate || 30000,
    status: schedule.status || 'Aktif',
    rescheduleCountThisMonth: schedule.rescheduleCountThisMonth || 0,
    createdAt: schedule.createdAt || new Date().toISOString().substring(0, 10)
  };

  try {
    const url = isEdit ? `/api/schedules/${newId}` : '/api/schedules';
    const method = isEdit ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullSchedule)
    });
  } catch (err) {
    console.warn('API backend unreachable, saving directly to Firestore & LocalStorage', err);
  }

  return persistDatabaseUpdate(db => {
    const exists = db.schedules.some(s => s.id === newId);
    const updatedSchedules = exists
      ? db.schedules.map(s => s.id === newId ? { ...s, ...fullSchedule } : s)
      : [fullSchedule, ...db.schedules];
    return { ...db, schedules: updatedSchedules };
  });
}

export async function deleteScheduleData(scheduleId: string): Promise<ErpDatabaseJson> {
  try {
    await fetch(`/api/schedules/${scheduleId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('API backend unreachable', err);
  }

  return persistDatabaseUpdate(db => ({
    ...db,
    schedules: db.schedules.filter(s => s.id !== scheduleId)
  }));
}

// Attendance CRUD
export async function saveAttendanceData(attendance: Partial<Attendance>): Promise<ErpDatabaseJson> {
  const newId = attendance.id || `att_${Date.now()}`;
  const fullAttendance: Attendance = {
    id: newId,
    scheduleId: attendance.scheduleId || '',
    studentId: attendance.studentId || '',
    tutorId: attendance.tutorId || '',
    date: attendance.date || new Date().toISOString().substring(0, 10),
    selfieUrl: attendance.selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: attendance.status || 'Hadir',
    materialCovered: attendance.materialCovered || 'Materi Rutin',
    progressNotes: attendance.progressNotes || 'Progres baik',
    tutorFeedback: attendance.tutorFeedback,
    additionalNotes: attendance.additionalNotes,
    serverTime: attendance.serverTime || new Date().toISOString()
  };

  try {
    await fetch('/api/attendances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullAttendance)
    });
  } catch (err) {
    console.warn('API backend unreachable, running local & Firestore sync', err);
  }

  return persistDatabaseUpdate(db => {
    const student = db.students.find(s => s.id === fullAttendance.studentId);
    const tutor = db.tutors.find(t => t.id === fullAttendance.tutorId);
    const schedule = db.schedules.find(sc => sc.id === fullAttendance.scheduleId);

    // 1. Deduct student package remaining session
    const updatedStudents = db.students.map(st => {
      if (st.id === fullAttendance.studentId && fullAttendance.status === 'Hadir') {
        const rem = Math.max(0, st.remainingSessions - 1);
        return {
          ...st,
          remainingSessions: rem,
          packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as any
        };
      }
      return st;
    });

    const updatedAttendances = [fullAttendance, ...db.attendances.filter(a => a.id !== newId)];

    // 2. Real-time automatic recap to Finance Mutasi & Tutor Salaries
    let updatedFinance = db.finance || [];
    let updatedSalaries = db.salaries || [];

    if (fullAttendance.status === 'Hadir') {
      const honorRate = schedule?.sessionRate || tutor?.ratePerSession || 40000;
      const marginRate = student?.managementMarginNominal || 10000;
      const currentDateStr = fullAttendance.date;
      const monthYearStr = currentDateStr.substring(0, 7); // e.g. "2026-07"

      // Add Finance entry for Gaji Tentor (Pengeluaran)
      const salaryExpenseFin: Finance = {
        id: `fin_sal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'Pengeluaran',
        category: 'Gaji Tentor',
        amount: honorRate,
        date: currentDateStr,
        description: `Honor Mengajar Tentor (${tutor?.name || 'Tentor'}) - Siswa ${student?.name || 'Siswa'} (${currentDateStr})`,
        tutorId: fullAttendance.tutorId,
        studentId: fullAttendance.studentId,
        attendanceId: newId,
        createdBy: 'SYSTEM_AUTO_RECAP',
        createdAt: new Date().toISOString()
      };

      // Add Finance entry for Fee Manajemen (Pemasukan)
      const marginIncomeFin: Finance = {
        id: `fin_fee_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'Pemasukan',
        category: 'Fee Manajemen',
        amount: marginRate,
        date: currentDateStr,
        description: `Fee Margin Manajemen Sesi - ${student?.name || 'Siswa'} (${currentDateStr})`,
        studentId: fullAttendance.studentId,
        attendanceId: newId,
        createdBy: 'SYSTEM_AUTO_RECAP',
        createdAt: new Date().toISOString()
      };

      updatedFinance = [salaryExpenseFin, marginIncomeFin, ...updatedFinance];

      // Update or Create TutorSalary record for this month
      const existingSalaryIdx = updatedSalaries.findIndex(s => s.tutorId === fullAttendance.tutorId && s.monthYear === monthYearStr);
      if (existingSalaryIdx !== -1) {
        const existingSal = updatedSalaries[existingSalaryIdx];
        const newAttendanceRate = (existingSal.totalAttendanceRate || 0) + honorRate;
        const newTotalSalary = newAttendanceRate + (existingSal.cancellationCompensation || 0) + (existingSal.bonus || 0) - (existingSal.deductions || 0);

        updatedSalaries = [...updatedSalaries];
        updatedSalaries[existingSalaryIdx] = {
          ...existingSal,
          totalAttendanceRate: newAttendanceRate,
          totalSalary: newTotalSalary
        };
      } else {
        const newTutorSalary: TutorSalary = {
          id: `sal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tutorId: fullAttendance.tutorId,
          monthYear: monthYearStr,
          totalAttendanceRate: honorRate,
          cancellationCompensation: 0,
          bonus: 0,
          deductions: 0,
          totalSalary: honorRate,
          paymentStatus: 'Pending',
          createdAt: new Date().toISOString().substring(0, 10)
        };
        updatedSalaries = [newTutorSalary, ...updatedSalaries];
      }
    }

    return {
      ...db,
      students: updatedStudents,
      attendances: updatedAttendances,
      finance: updatedFinance,
      salaries: updatedSalaries
    };
  });
}

export async function deleteAttendanceData(attendanceId: string): Promise<ErpDatabaseJson> {
  try {
    await fetch(`/api/attendances/${attendanceId}`, { method: 'DELETE' }).catch(() => {});
  } catch (err) {
    console.warn('API backend unreachable', err);
  }

  return persistDatabaseUpdate(db => {
    const targetAtt = db.attendances.find(a => a.id === attendanceId);
    if (!targetAtt) return db;

    const updatedAttendances = db.attendances.filter(a => a.id !== attendanceId);

    let updatedStudents = db.students;
    if (targetAtt.status === 'Hadir') {
      updatedStudents = db.students.map(st => {
        if (st.id === targetAtt.studentId) {
          const rem = st.remainingSessions + 1;
          return {
            ...st,
            remainingSessions: rem,
            packageStatus: (rem <= 0 ? 'Habis' : rem <= 2 ? 'Hampir Habis' : 'Aktif') as any
          };
        }
        return st;
      });
    }

    const updatedFinance = (db.finance || []).filter(f => f.attendanceId !== attendanceId);

    let updatedSalaries = db.salaries || [];
    if (targetAtt.status === 'Hadir') {
      const monthYearStr = targetAtt.date.substring(0, 7);
      const sch = db.schedules.find(s => s.id === targetAtt.scheduleId);
      const tut = db.tutors.find(t => t.id === targetAtt.tutorId);
      const honorRate = sch?.sessionRate || tut?.ratePerSession || 40000;

      const salIdx = updatedSalaries.findIndex(s => s.tutorId === targetAtt.tutorId && s.monthYear === monthYearStr);
      if (salIdx !== -1) {
        updatedSalaries = [...updatedSalaries];
        const existing = updatedSalaries[salIdx];
        const newRate = Math.max(0, (existing.totalAttendanceRate || 0) - honorRate);
        updatedSalaries[salIdx] = {
          ...existing,
          totalAttendanceRate: newRate,
          totalSalary: newRate + (existing.cancellationCompensation || 0) + (existing.bonus || 0) - (existing.deductions || 0)
        };
      }
    }

    return {
      ...db,
      attendances: updatedAttendances,
      students: updatedStudents,
      finance: updatedFinance,
      salaries: updatedSalaries
    };
  });
}

// Finance & Invoice CRUD
export async function saveInvoiceData(invoice: Partial<Invoice>): Promise<ErpDatabaseJson> {
  const newId = invoice.id || `inv_${Date.now()}`;
  const fullInvoice: Invoice = {
    id: newId,
    invoiceNumber: invoice.invoiceNumber || `INV-${Date.now()}`,
    studentId: invoice.studentId || '',
    sessionCount: invoice.sessionCount !== undefined ? Number(invoice.sessionCount) : undefined,
    ratePerSession: invoice.ratePerSession !== undefined ? Number(invoice.ratePerSession) : undefined,
    additionalAmount: invoice.additionalAmount !== undefined ? Number(invoice.additionalAmount) : 0,
    additionalNotes: invoice.additionalNotes || '',
    additionalTutorId: invoice.additionalTutorId || '',
    amount: Number(invoice.amount || 0),
    amountPaid: Number(invoice.amountPaid || 0),
    status: invoice.status || 'Belum Lunas',
    dueDate: invoice.dueDate || new Date().toISOString().substring(0, 10),
    createdAt: invoice.createdAt || new Date().toISOString().substring(0, 10),
    isRevised: invoice.isRevised,
    revisedAt: invoice.revisedAt,
    revisionNote: invoice.revisionNote
  };

  try {
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullInvoice)
    });
  } catch (err) {
    console.warn('API backend unreachable', err);
  }

  return persistDatabaseUpdate(db => ({
    ...db,
    invoices: [fullInvoice, ...db.invoices.filter(i => i.id !== newId)]
  }));
}

export async function payInvoiceData(invoiceId: string, paymentMethod: string, paymentAmount?: number): Promise<ErpDatabaseJson> {
  try {
    await fetch(`/api/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentAmount, paymentMethod })
    });
  } catch (err) {
    console.warn('API backend unreachable', err);
  }

  return persistDatabaseUpdate(db => {
    const targetInvoice = db.invoices.find(i => i.id === invoiceId);
    const payAmt = paymentAmount !== undefined ? Number(paymentAmount) : (targetInvoice ? targetInvoice.amount - (targetInvoice.amountPaid || 0) : 0);
    const updatedInvoices = db.invoices.map(i => {
      if (i.id === invoiceId) {
        const newPaid = (i.amountPaid || 0) + payAmt;
        return {
          ...i,
          amountPaid: newPaid,
          status: (newPaid >= i.amount ? 'Lunas' : newPaid > 0 ? 'Cicilan' : 'Belum Lunas') as any
        };
      }
      return i;
    });
    
    // Add income entry to Finance
    let updatedFinance = db.finance || [];
    if (targetInvoice && payAmt > 0) {
      const newFinance: Finance = {
        id: `fin_${Date.now()}`,
        type: 'Pemasukan',
        category: 'SPP Siswa',
        amount: payAmt,
        date: new Date().toISOString().substring(0, 10),
        description: `Pembayaran Invoice ${targetInvoice.invoiceNumber} (${paymentMethod})`,
        studentId: targetInvoice.studentId,
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString()
      };
      updatedFinance = [newFinance, ...updatedFinance];
    }

    return { ...db, invoices: updatedInvoices, finance: updatedFinance };
  });
}

export async function clearFinanceAndSppData(): Promise<ErpDatabaseJson> {
  try {
    await fetch('/api/clear-finance-spp', { method: 'POST' }).catch(() => {});
  } catch (err) {
    console.warn('API backend unreachable', err);
  }

  return persistDatabaseUpdate(db => ({
    ...db,
    finance: [],
    invoices: [],
    salaries: []
  }));
}

// User CRUD
export async function saveUserData(user: Partial<User> & { id?: string, password?: string }): Promise<ErpDatabaseJson> {
  const newId = user.id || `usr_${Date.now()}`;
  const fullUser: User = {
    id: newId,
    username: user.username || 'user',
    passwordHash: user.passwordHash || user.password || '123456',
    name: user.name || 'Pengguna',
    role: user.role || 'TENTOR',
    tutorId: user.tutorId,
    status: user.status || 'Aktif',
    desc: user.desc,
    createdAt: user.createdAt || new Date().toISOString().substring(0, 10)
  };

  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullUser)
    });
  } catch (err) {
    console.warn('API backend unreachable', err);
  }

  return persistDatabaseUpdate(db => ({
    ...db,
    users: [fullUser, ...db.users.filter(u => u.id !== newId)]
  }));
}

export async function deleteUserData(userId: string): Promise<ErpDatabaseJson> {
  try {
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('API backend unreachable', err);
  }

  return persistDatabaseUpdate(db => ({
    ...db,
    users: db.users.filter(u => u.id !== userId)
  }));
}
