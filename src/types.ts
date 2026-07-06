export type UserRole = 'SUPER_ADMIN' | 'MANAGEMENT' | 'TENTOR';

export type GradeLevel = 'PAUD' | 'TK Kecil' | 'TK Besar' | 'SD' | 'SMP' | 'SMA';

export type PackageStatus = 'Aktif' | 'Hampir Habis' | 'Habis' | 'Nonaktif';

export type ScheduleType = 'Jadwal Tetap' | 'Jadwal Reschedule' | 'Jadwal Substitusi Tentor';

export type AttendanceStatus = 'Hadir' | 'Izin Mendadak';

export type ApprovalType = 'Force Majeure' | 'Izin Mendadak' | 'Over-Limit Reschedule' | 'Tarif Non-Standar' | 'Pengajuan Kuota Extra';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export type InvoiceStatus = 'Belum Lunas' | 'Cicilan' | 'Lunas';

export type SalaryStatus = 'Pending' | 'Approved' | 'Paid';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  tutorId?: string;
  status: 'Aktif' | 'Nonaktif';
  desc?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  grade: GradeLevel;
  className: string;
  school: string;
  address: string;
  parentName: string;
  parentWA: string;
  subjects: string[];
  totalPackageSessions: number;
  remainingSessions: number;
  packageStartDate: string;
  packageEndDate: string;
  packageStatus: PackageStatus;
  ratePerSession: number; // TARIF SISWA (SPP PER SESI)
  managementMarginNominal?: number; // POTONGAN / MARGIN MANAJEMEN NOMINAL (MISAL: 5000, 7000, 10000 PER SESI)
  status: 'Aktif' | 'Nonaktif' | 'Arsip';
  createdAt: string;
}

export interface Tutor {
  id: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  address: string;
  wa: string;
  subjects: string[];
  gradesMastered: GradeLevel[];
  ratePerSession: number; // ACUAN KELAS STANDAR
  workingArea: string[];
  workingHours: string[];
  salarySystem: 'Per Pertemuan' | 'Bulanan' | 'Bagi Hasil';
  status: 'Aktif' | 'Nonaktif' | 'Arsip' | 'Resign';
  averageRating: number;
  totalRatings: number;
  maxHoursPerDay: number;
  maxHoursPerWeek: number;
  maxStudents: number;
  evaluationNotes?: string;
  createdAt: string;
}

export interface Parent {
  id: string;
  name: string;
  wa: string;
  studentIds: string[];
  address: string;
}

export interface Subject {
  id: string;
  name: string;
  grade: GradeLevel;
}

export interface WorkingArea {
  id: string;
  name: string;
  postcode: string;
}

export interface Schedule {
  id: string;
  studentId: string;
  tutorId: string;
  subject: string;
  dayOfWeek: string;
  timeSlot: string; // "15:00 - 16:30"
  type: ScheduleType;
  sessionRate?: number; // TARIF / HONOR TENTOR PER SESI (DEAL PASANGAN SISWA-TENTOR)
  status: 'Aktif' | 'Dibatalkan' | 'Selesai';
  rescheduleCountThisMonth: number;
  createdAt: string;
}

export interface Attendance {
  id: string;
  scheduleId: string;
  tutorId: string;
  studentId: string;
  date: string;
  selfieUrl: string; // VERIFIKASI FOTO SELFIE
  status: AttendanceStatus;
  materialCovered: string; // LAPORAN MENGAJAR
  progressNotes: string;   // CATATAN KEMAJUAN SISWA
  tutorFeedback?: string;  // FEEDBACK UNTUK ORANG TUA
  additionalNotes?: string;
  serverTime: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  isRevised?: boolean;
  revisedAt?: string;
  revisionNote?: string;
}

export interface Finance {
  id: string;
  type: 'Pemasukan' | 'Pengeluaran';
  category: 'SPP Siswa' | 'Gaji Tentor' | 'Fee Manajemen' | 'Operasional';
  amount: number;
  date: string;
  description: string;
  studentId?: string;
  tutorId?: string;
  attendanceId?: string;
  createdBy: string;
  createdAt: string;
  isRevised?: boolean;
  revisedAt?: string;
  revisionNote?: string;
}

export interface TutorSalary {
  id: string;
  tutorId: string;
  monthYear: string; // "2026-07"
  totalAttendanceRate: number;
  cancellationCompensation?: number;
  bonus?: number;
  deductions?: number;
  totalSalary: number;
  paymentStatus: SalaryStatus;
  paymentDate?: string;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  subject: string;
  grade: GradeLevel;
  driveFileUrl: string; // INTEGRASI GOOGLE DRIVE ATAU FILE LINK
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  fileType?: string;
}

export interface Approval {
  id: string;
  type: ApprovalType;
  requestedBy: string;
  tutorId?: string;
  studentId?: string;
  reason: string;
  status: ApprovalStatus;
  remarks?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: any;
  description: string;
  category: string;
}

export interface AuditLog {
  id: string;
  time: string;
  user: string;
  activity: string;
  dataBefore?: any;
  dataAfter?: any;
}

export interface DashboardStats {
  totalActiveStudents: number;
  totalActiveTutors: number;
  totalSessionsThisMonth: number;
  grossIncomeThisMonth: number;
  netManagementProfitThisMonth: number;
  pendingApprovals: number;
  unpaidInvoices: number;
  monthlyRevenue?: number;
  monthlyTutorSalaries?: number;
  monthlyManagementFees?: number;
  monthlyOperationalExpenses?: number;
  monthlyNetProfit?: number;
  unpaidInvoicesAmount?: number;
}
