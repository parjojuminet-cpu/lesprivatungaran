import React, { useState, useEffect } from 'react';
import {
  User, Student, Tutor, Parent, Subject, WorkingArea, Schedule,
  Attendance, Invoice, Finance, TutorSalary, Module, Approval,
  Setting, AuditLog, DashboardStats
} from './types';
import { LayoutDashboard, Camera, Calendar, Wallet, Menu, BookOpen, Database, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MasterDataView } from './components/MasterDataView';
import { ScheduleView } from './components/ScheduleView';
import { AttendanceView } from './components/AttendanceView';
import { FinanceView } from './components/FinanceView';
import { ModulesView } from './components/ModulesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { JantungView } from './components/JantungView';
import { LoginView } from './components/LoginView';
import {
  loadErpJsonDatabase,
  saveErpJsonDatabase,
  sanitizeErpDatabase,
  exportDatabaseToJson,
  importDatabaseFromJson,
  resetDatabaseToDefaultJson
} from './services/jsonStorage';

export default function App() {
  // Initial load from JSON storage (localStorage / default dataset)
  const initialDb = loadErpJsonDatabase();

  const [users, setUsers] = useState<User[]>(initialDb.users);
  const [students, setStudents] = useState<Student[]>(initialDb.students);
  const [tutors, setTutors] = useState<Tutor[]>(initialDb.tutors);
  const [parents, setParents] = useState<Parent[]>(initialDb.parents);
  const [subjects, setSubjects] = useState<Subject[]>(initialDb.subjects);
  const [workingAreas, setWorkingAreas] = useState<WorkingArea[]>(initialDb.workingAreas);
  const [schedules, setSchedules] = useState<Schedule[]>(initialDb.schedules);
  const [attendances, setAttendances] = useState<Attendance[]>(initialDb.attendances);
  const [invoices, setInvoices] = useState<Invoice[]>(initialDb.invoices);
  const [finance, setFinance] = useState<Finance[]>(initialDb.finance);
  const [salaries, setSalaries] = useState<TutorSalary[]>(initialDb.salaries);
  const [approvals, setApprovals] = useState<Approval[]>(initialDb.approvals);
  const [modules, setModules] = useState<Module[]>(initialDb.modules);
  const [settings, setSettings] = useState<Setting[]>(initialDb.settings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialDb.auditLogs);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Dynamic recalculation of stats whenever data updates
  useEffect(() => {
    const activeStudentsCount = students.filter(s => s.status === 'Aktif').length;
    const activeTutorsCount = tutors.filter(t => t.status === 'Aktif').length;
    const totalSessions = attendances.length;

    // 1. Calculate Real SPP Revenue & Tutor Honor from Attendance (Sesi Hadir)
    const totalHadirAttendances = attendances.filter(a => a.status === 'Hadir');

    const attendanceSppGross = totalHadirAttendances.reduce((acc, att) => {
      const st = students.find(s => s.id === att.studentId);
      return acc + (st?.ratePerSession || 25000);
    }, 0);

    const attendanceTutorHonor = totalHadirAttendances.reduce((acc, att) => {
      const sch = schedules.find(s => s.id === att.scheduleId);
      const st = students.find(s => s.id === att.studentId);
      const sppRate = st?.ratePerSession || 25000;
      const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
      const honorRate = sch?.sessionRate ?? (sppRate - adminFee);
      return acc + honorRate;
    }, 0);

    // Fee Admin Bimbel per Sesi = Tarif SPP Siswa - Honor Tentor per Sesi
    const attendanceManagementFee = totalHadirAttendances.reduce((acc, att) => {
      const st = students.find(s => s.id === att.studentId);
      const sch = schedules.find(s => s.id === att.scheduleId);
      const sppRate = st?.ratePerSession || 25000;
      const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
      const honorRate = sch?.sessionRate ?? (sppRate - adminFee);
      return acc + Math.max(0, sppRate - honorRate);
    }, 0);

    // Estimasi Fee Admin Bimbel dari jadwal aktif jika belum ada absensi
    const estimatedScheduleManagementFee = schedules
      .filter(sch => sch.status === 'Aktif')
      .reduce((acc, sch) => {
        const st = students.find(s => s.id === sch.studentId);
        const sppRate = st?.ratePerSession || 25000;
        const adminFee = sch?.adminFee ?? st?.managementMarginNominal ?? 5000;
        const honorRate = sch?.sessionRate ?? (sppRate - adminFee);
        return acc + Math.max(0, sppRate - honorRate);
      }, 0);

    // 2. Finance Table Record aggregations
    const financeRevenue = finance
      .filter(f => f.type === 'Pemasukan')
      .reduce((acc, f) => acc + f.amount, 0);

    const financeTutorSalaries = finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Gaji Tentor')
      .reduce((acc, f) => acc + f.amount, 0);

    const monthlyOperationalExpenses = finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Operasional')
      .reduce((acc, f) => acc + f.amount, 0);

    // 3. Adjusted Omset & Honor & Management Fee
    const monthlyRevenue = financeRevenue > 0 ? financeRevenue : (attendanceSppGross > 0 ? attendanceSppGross : activeStudentsCount * 480000);

    const monthlyTutorSalaries = financeTutorSalaries > 0 ? financeTutorSalaries : attendanceTutorHonor;

    const monthlyManagementFees = totalHadirAttendances.length > 0 
      ? attendanceManagementFee 
      : estimatedScheduleManagementFee;

    // Profit Bersih Manajemen = Total Fee Manajemen - Biaya Operasional
    const monthlyNetProfit = monthlyManagementFees - monthlyOperationalExpenses;

    const unpaidInvoicesAmount = invoices
      .filter(i => i.status !== 'Lunas')
      .reduce((acc, i) => acc + (i.amount - (i.amountPaid || 0)), 0);

    const pendingApps = approvals.filter(a => a.status === 'Pending').length;
    const unpaidInvs = invoices.filter(i => i.status !== 'Lunas').length;

    setStats({
      totalActiveStudents: activeStudentsCount,
      totalActiveTutors: activeTutorsCount,
      totalSessionsThisMonth: totalSessions,
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
  }, [students, tutors, schedules, attendances, finance, invoices, approvals, settings]);

  // Read saved session user from localStorage if exists
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('erp_session_user');
    return !!saved;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('erp_session_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.username !== 'superadmin' && u.username !== 'management' && u.username !== 'tentor_budi' && u.username !== 'tentor_rina' && !u.name?.includes('Budi Santoso') && !u.name?.includes('Rina Wijaya')) {
          return u;
        }
      } catch {
        // fallback
      }
    }
    return initialDb.users[0];
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to safely fetch JSON from backend
  const safeFetch = async (url: string, fallback: any = []) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      const text = await res.text();
      if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
        return JSON.parse(text);
      }
      return fallback;
    } catch {
      return fallback;
    }
  };

  // Fetch all database state
  const loadAllData = async () => {
    const currentDb = loadErpJsonDatabase();

    // Always fetch from Express Server first as the primary database
    try {
      console.log('Fetching database from Express server /api/db as primary source of truth...');
      const response = await fetch('/api/db');
      if (response.ok) {
        const serverDb = await response.json();
        if (serverDb && serverDb.students) {
          let sanitized = sanitizeErpDatabase(serverDb);

          if (sanitized.students) setStudents(sanitized.students);
          if (sanitized.tutors) setTutors(sanitized.tutors);
          if (sanitized.parents) setParents(sanitized.parents);
          if (sanitized.subjects) setSubjects(sanitized.subjects);
          if (sanitized.workingAreas) setWorkingAreas(sanitized.workingAreas);
          if (sanitized.schedules) setSchedules(sanitized.schedules);
          if (sanitized.attendances) setAttendances(sanitized.attendances);
          if (sanitized.invoices) setInvoices(sanitized.invoices);
          if (sanitized.finance) setFinance(sanitized.finance);
          if (sanitized.salaries) setSalaries(sanitized.salaries);
          if (sanitized.approvals) setApprovals(sanitized.approvals);
          if (sanitized.modules) setModules(sanitized.modules);
          if (sanitized.settings) setSettings(sanitized.settings);
          if (sanitized.auditLogs) setAuditLogs(sanitized.auditLogs);
          if (sanitized.users) setUsers(sanitized.users);
          saveErpJsonDatabase(sanitized);
          
          // Fetch additional stats in background
          try {
            const resStats = await safeFetch('/api/dashboard/stats', null);
            if (resStats) setStats(resStats);
          } catch (err) {
            console.warn('Backend API background sync notice:', err);
          } finally {
            setIsLoading(false);
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Express server database unreachable, falling back to other sources:', err);
    }

    // Ultimate fallback: Use local JSON Storage from localStorage (already loaded in state initials)
    console.log('Express Server is unavailable, using offline local state.');
    const localDb = loadErpJsonDatabase();
    if (localDb.students) setStudents(localDb.students);
    if (localDb.tutors) setTutors(localDb.tutors);
    if (localDb.parents) setParents(localDb.parents);
    if (localDb.subjects) setSubjects(localDb.subjects);
    if (localDb.workingAreas) setWorkingAreas(localDb.workingAreas);
    if (localDb.schedules) setSchedules(localDb.schedules);
    if (localDb.attendances) setAttendances(localDb.attendances);
    if (localDb.invoices) setInvoices(localDb.invoices);
    if (localDb.finance) setFinance(localDb.finance);
    if (localDb.salaries) setSalaries(localDb.salaries);
    if (localDb.approvals) setApprovals(localDb.approvals);
    if (localDb.modules) setModules(localDb.modules);
    if (localDb.settings) setSettings(localDb.settings);
    if (localDb.auditLogs) setAuditLogs(localDb.auditLogs);
    if (localDb.users) setUsers(localDb.users);

    // Fetch stats
    try {
      const resStats = await safeFetch('/api/dashboard/stats', null);
      if (resStats) setStats(resStats);
    } catch (err) {
      console.warn('Stats fetch failure on fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Poll Express Server /api/db to keep multiple tabs/devices synced in real time
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/db');
        if (response.ok) {
          const serverDb = await response.json();
          if (serverDb && serverDb.students) {
            const sanitized = sanitizeErpDatabase(serverDb);
            if (sanitized.students) setStudents(sanitized.students);
            if (sanitized.tutors) setTutors(sanitized.tutors);
            if (sanitized.parents) setParents(sanitized.parents);
            if (sanitized.subjects) setSubjects(sanitized.subjects);
            if (sanitized.workingAreas) setWorkingAreas(sanitized.workingAreas);
            if (sanitized.schedules) setSchedules(sanitized.schedules);
            if (sanitized.attendances) setAttendances(sanitized.attendances);
            if (sanitized.invoices) setInvoices(sanitized.invoices);
            if (sanitized.finance) setFinance(sanitized.finance);
            if (sanitized.salaries) setSalaries(sanitized.salaries);
            if (sanitized.approvals) setApprovals(sanitized.approvals);
            if (sanitized.modules) setModules(sanitized.modules);
            if (sanitized.settings) setSettings(sanitized.settings);
            if (sanitized.auditLogs) setAuditLogs(sanitized.auditLogs);
            if (sanitized.users) setUsers(sanitized.users);
            saveErpJsonDatabase(sanitized);
          }
        }
      } catch (err) {
        console.warn('Express server background sync polling error:', err);
      }
    }, 8000); // Poll Express server database every 8 seconds

    loadAllData();

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleSwitchUser = (username: string) => {
    const found = users.find(u => u.username === username);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('erp_session_user', JSON.stringify(found));
      // Auto adjust tab if current tab is forbidden for role
      if (found.role === 'TENTOR' && ['master', 'finance', 'audit', 'settings'].includes(activeTab)) {
        setActiveTab('attendance');
      }
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('erp_session_user', JSON.stringify(user));
    if (user.role === 'TENTOR') {
      setActiveTab('attendance');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('erp_session_user');
    setIsLoggedIn(false);
  };

  const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-sm tracking-wide">Memuat System ERP Bimbel Privat...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 relative">
      {/* Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={currentUser.role}
          pendingApprovalsCount={pendingApprovalsCount}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content View Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-32 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              students={students}
              schedules={schedules}
              approvals={approvals}
              invoices={invoices}
              attendances={attendances}
              tutors={tutors}
              salaries={salaries}
              finance={finance}
              userRole={currentUser.role}
              currentUserTutorId={currentUser.tutorId}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'master' && (
            <MasterDataView
              students={students}
              tutors={tutors}
              parents={parents}
              subjects={subjects}
              workingAreas={workingAreas}
              userRole={currentUser.role}
              currentUserTutorId={currentUser.tutorId}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              schedules={schedules}
              students={students}
              tutors={tutors}
              userRole={currentUser.role}
              currentUserTutorId={currentUser.tutorId}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              attendances={attendances}
              schedules={schedules}
              students={students}
              tutors={tutors}
              userRole={currentUser.role}
              currentUserTutorId={currentUser.tutorId}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              students={students}
              attendances={attendances}
              tutors={tutors}
              subjects={subjects}
              userRole={currentUser.role}
              currentUserTutorId={currentUser.tutorId}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              finance={finance}
              invoices={invoices}
              salaries={salaries}
              students={students}
              tutors={tutors}
              attendances={attendances}
              schedules={schedules}
              userRole={currentUser.role}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'modules' && (
            <ModulesView
              modules={modules}
              userRole={currentUser.role}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              users={users}
              tutors={tutors}
              userRole={currentUser.role}
              currentUser={currentUser}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'jantung' && (
            <JantungView
              finance={finance}
              invoices={invoices}
              salaries={salaries}
              students={students}
              tutors={tutors}
              attendances={attendances}
              schedules={schedules}
              onRefresh={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation Dock */}
      <div className="lg:hidden fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto pointer-events-none">
        <nav className="pointer-events-auto bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 text-slate-400 py-2 px-2 rounded-2xl shadow-2xl flex items-center justify-around gap-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-xs scale-105'
                : 'hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('attendance'); setIsMobileMenuOpen(false); }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs scale-105'
                : 'hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Absensi</span>
          </button>

          <button
            onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-xs scale-105'
                : 'hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal</span>
          </button>

          <button
            onClick={() => { setActiveTab('modules'); setIsMobileMenuOpen(false); }}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs scale-105'
                : 'hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Materi</span>
          </button>

          {currentUser.role !== 'TENTOR' && (
            <button
              onClick={() => { setActiveTab('finance'); setIsMobileMenuOpen(false); }}
              className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-xs scale-105'
                  : 'hover:text-slate-200'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Keuangan</span>
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 rounded-xl text-[10px] font-medium transition-all cursor-pointer text-slate-300 hover:text-white"
          >
            <Menu className="w-4 h-4 text-indigo-400" />
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
