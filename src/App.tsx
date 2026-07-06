import React, { useState, useEffect } from 'react';
import {
  User, Student, Tutor, Parent, Subject, WorkingArea, Schedule,
  Attendance, Invoice, Finance, TutorSalary, Module, Approval,
  Setting, AuditLog, DashboardStats
} from './types';
import { LayoutDashboard, Camera, Calendar, Wallet, Menu, BookOpen } from 'lucide-react';
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
import { LoginView } from './components/LoginView';
import { getAccessToken, googleSignIn } from './services/googleAuth';
import { pullErpDataFromSheet, syncErpDataToSheet } from './services/googleSheets';
import {
  loadErpJsonDatabase,
  saveErpJsonDatabase,
  sanitizeErpDatabase,
  exportDatabaseToJson,
  importDatabaseFromJson,
  resetDatabaseToDefaultJson
} from './services/jsonStorage';
import {
  loadFromFirestore,
  saveToFirestore,
  subscribeToFirestore
} from './services/firestoreService';

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
  const [syncStatus, setSyncStatus] = useState<any>(null);

  // Dynamic recalculation of stats whenever data updates
  useEffect(() => {
    const activeStudentsCount = students.filter(s => s.status === 'Aktif').length;
    const activeTutorsCount = tutors.filter(t => t.status === 'Aktif').length;
    const totalSessions = attendances.length;

    const monthlyRevenue = finance
      .filter(f => f.type === 'Pemasukan')
      .reduce((acc, f) => acc + f.amount, 0);

    const monthlyTutorSalaries = finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Gaji Tentor')
      .reduce((acc, f) => acc + f.amount, 0);

    const monthlyOperationalExpenses = finance
      .filter(f => f.type === 'Pengeluaran' && f.category === 'Operasional')
      .reduce((acc, f) => acc + f.amount, 0);

    const totalPengeluaran = finance
      .filter(f => f.type === 'Pengeluaran')
      .reduce((acc, f) => acc + f.amount, 0);

    const defaultMargin = Number(settings.find(s => s.key === 'MARGIN_MANAGEMENT_NOMINAL')?.value || 10000);
    const monthlyManagementFees = attendances.length > 0 
      ? attendances.reduce((acc, att) => {
          const st = students.find(s => s.id === att.studentId);
          return acc + (st?.managementMarginNominal !== undefined ? Number(st.managementMarginNominal) : defaultMargin);
        }, 0)
      : (activeStudentsCount * defaultMargin);

    const monthlyNetProfit = monthlyRevenue - totalPengeluaran;

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
  }, [students, tutors, attendances, finance, invoices, approvals, settings]);

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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    // 1. First load from Cloud Firestore as primary source of truth
    try {
      const rawCloudDb = await loadFromFirestore();
      if (rawCloudDb) {
        const cloudDb = sanitizeErpDatabase(rawCloudDb);
        if (cloudDb.students) setStudents(cloudDb.students);
        if (cloudDb.tutors) setTutors(cloudDb.tutors);
        if (cloudDb.parents) setParents(cloudDb.parents);
        if (cloudDb.subjects) setSubjects(cloudDb.subjects);
        if (cloudDb.workingAreas) setWorkingAreas(cloudDb.workingAreas);
        if (cloudDb.schedules) setSchedules(cloudDb.schedules);
        if (cloudDb.attendances) setAttendances(cloudDb.attendances);
        if (cloudDb.invoices) setInvoices(cloudDb.invoices);
        if (cloudDb.finance) setFinance(cloudDb.finance);
        if (cloudDb.salaries) setSalaries(cloudDb.salaries);
        if (cloudDb.approvals) setApprovals(cloudDb.approvals);
        if (cloudDb.modules) setModules(cloudDb.modules);
        if (cloudDb.settings) setSettings(cloudDb.settings);
        if (cloudDb.auditLogs) setAuditLogs(cloudDb.auditLogs);
        if (cloudDb.users) setUsers(cloudDb.users);
        saveErpJsonDatabase(cloudDb);
      } else {
        // Fallback to local JSON storage
        const localDb = loadErpJsonDatabase();
        setStudents(localDb.students);
        setTutors(localDb.tutors);
        setParents(localDb.parents);
        setSubjects(localDb.subjects);
        setWorkingAreas(localDb.workingAreas);
        setSchedules(localDb.schedules);
        setAttendances(localDb.attendances);
        setInvoices(localDb.invoices);
        setFinance(localDb.finance);
        setSalaries(localDb.salaries);
        setApprovals(localDb.approvals);
        setModules(localDb.modules);
        setSettings(localDb.settings);
        setAuditLogs(localDb.auditLogs);
        setUsers(localDb.users);
      }
    } catch (e) {
      console.warn('Firestore initial load error:', e);
    }

    // 2. Optionally fetch from backend API if custom server is active
    try {
      const [
        resStats, resStudents, resTutors, resParents, resSubjects, resAreas,
        resSchedules, resAttendances, resInvoices, resFinance, resSalaries,
        resApprovals, resModules, resSettings, resAuditLogs, resSheets, resUsers
      ] = await Promise.all([
        safeFetch('/api/dashboard/stats', null),
        safeFetch('/api/students', []),
        safeFetch('/api/tutors', []),
        safeFetch('/api/parents', []),
        safeFetch('/api/subjects', []),
        safeFetch('/api/working-areas', []),
        safeFetch('/api/schedules', []),
        safeFetch('/api/attendances', []),
        safeFetch('/api/invoices', []),
        safeFetch('/api/finance', []),
        safeFetch('/api/salaries', []),
        safeFetch('/api/approvals', []),
        safeFetch('/api/modules', []),
        safeFetch('/api/settings', []),
        safeFetch('/api/audit-logs', []),
        safeFetch('/api/sheets/status', null),
        safeFetch('/api/users', [])
      ]);

      if (resStats) setStats(resStats);
      if (Array.isArray(resStudents) && resStudents.length > 0) setStudents(resStudents);
      if (Array.isArray(resTutors) && resTutors.length > 0) setTutors(resTutors);
      if (Array.isArray(resParents) && resParents.length > 0) setParents(resParents);
      if (Array.isArray(resSubjects) && resSubjects.length > 0) setSubjects(resSubjects);
      if (Array.isArray(resAreas) && resAreas.length > 0) setWorkingAreas(resAreas);
      if (Array.isArray(resSchedules) && resSchedules.length > 0) setSchedules(resSchedules);
      if (Array.isArray(resAttendances) && resAttendances.length > 0) setAttendances(resAttendances);
      if (Array.isArray(resInvoices) && resInvoices.length > 0) setInvoices(resInvoices);
      if (Array.isArray(resFinance) && resFinance.length > 0) setFinance(resFinance);
      if (Array.isArray(resSalaries) && resSalaries.length > 0) setSalaries(resSalaries);
      if (Array.isArray(resApprovals) && resApprovals.length > 0) setApprovals(resApprovals);
      if (Array.isArray(resModules) && resModules.length > 0) setModules(resModules);
      if (Array.isArray(resSettings) && resSettings.length > 0) setSettings(resSettings);
      if (Array.isArray(resAuditLogs) && resAuditLogs.length > 0) setAuditLogs(resAuditLogs);
      if (resSheets) setSyncStatus(resSheets);
      if (Array.isArray(resUsers) && resUsers.length > 0) {
        const cleanUsers = sanitizeErpDatabase({ users: resUsers }).users;
        setUsers(cleanUsers);
      }
    } catch (err) {
      console.warn('Backend API sync notice: running with Firestore / JSON Storage', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial load from Cloud Firestore
    loadFromFirestore().then(cloudDb => {
      if (cloudDb) {
        if (cloudDb.students?.length) setStudents(cloudDb.students);
        if (cloudDb.tutors?.length) setTutors(cloudDb.tutors);
        if (cloudDb.parents?.length) setParents(cloudDb.parents);
        if (cloudDb.subjects?.length) setSubjects(cloudDb.subjects);
        if (cloudDb.workingAreas?.length) setWorkingAreas(cloudDb.workingAreas);
        if (cloudDb.schedules?.length) setSchedules(cloudDb.schedules);
        if (cloudDb.attendances?.length) setAttendances(cloudDb.attendances);
        if (cloudDb.invoices?.length) setInvoices(cloudDb.invoices);
        if (cloudDb.finance?.length) setFinance(cloudDb.finance);
        if (cloudDb.salaries?.length) setSalaries(cloudDb.salaries);
        if (cloudDb.approvals?.length) setApprovals(cloudDb.approvals);
        if (cloudDb.modules?.length) setModules(cloudDb.modules);
        if (cloudDb.settings?.length) setSettings(cloudDb.settings);
        if (cloudDb.auditLogs?.length) setAuditLogs(cloudDb.auditLogs);
        if (cloudDb.users?.length) setUsers(cloudDb.users);
      }
    });

    // 2. Subscribe to real-time sync across all devices
    const unsubscribe = subscribeToFirestore((rawCloudDb) => {
      if (rawCloudDb) {
        const cloudDb = sanitizeErpDatabase(rawCloudDb);
        if (cloudDb.students) setStudents(cloudDb.students);
        if (cloudDb.tutors) setTutors(cloudDb.tutors);
        if (cloudDb.parents) setParents(cloudDb.parents);
        if (cloudDb.subjects) setSubjects(cloudDb.subjects);
        if (cloudDb.workingAreas) setWorkingAreas(cloudDb.workingAreas);
        if (cloudDb.schedules) setSchedules(cloudDb.schedules);
        if (cloudDb.attendances) setAttendances(cloudDb.attendances);
        if (cloudDb.invoices) setInvoices(cloudDb.invoices);
        if (cloudDb.finance) setFinance(cloudDb.finance);
        if (cloudDb.salaries) setSalaries(cloudDb.salaries);
        if (cloudDb.approvals) setApprovals(cloudDb.approvals);
        if (cloudDb.modules) setModules(cloudDb.modules);
        if (cloudDb.settings) setSettings(cloudDb.settings);
        if (cloudDb.auditLogs) setAuditLogs(cloudDb.auditLogs);
        if (cloudDb.users) setUsers(cloudDb.users);
      }
    });

    loadAllData();

    return () => unsubscribe();
  }, []);

  const handleSwitchUser = (username: string) => {
    const found = users.find(u => u.username === username);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('erp_session_user', JSON.stringify(found));
      // Auto adjust tab if current tab is forbidden for role
      if (found.role === 'TENTOR' && ['master', 'finance', 'sheets', 'audit', 'settings'].includes(activeTab)) {
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

  const handlePullSheet = async () => {
    let token = getAccessToken();
    if (!token) {
      try {
        const authResult = await googleSignIn();
        if (authResult?.accessToken) {
          token = authResult.accessToken;
        } else {
          return;
        }
      } catch (err: any) {
        alert(`Gagal login Google Workspace: ${err.message || 'Error login'}`);
        return;
      }
    }

    let spreadsheetId = localStorage.getItem('erp_spreadsheet_id') || syncStatus?.spreadsheetId;
    if (!spreadsheetId) {
      const input = prompt('Masukkan Spreadsheet ID atau URL Google Spreadsheet Anda:');
      if (input) {
        let trimmed = input.trim();
        const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) trimmed = match[1];
        spreadsheetId = trimmed;
        localStorage.setItem('erp_spreadsheet_id', trimmed);
      } else {
        setActiveTab('sheets');
        return;
      }
    }

    try {
      setIsLoading(true);
      const pulled = await pullErpDataFromSheet(token, spreadsheetId);
      await fetch('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pulled)
      });
      alert('✅ Data berhasil ditarik & disinkronkan dari Google Sheets!');
      await loadAllData();
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('401')) {
        localStorage.removeItem('google_access_token');
      }
      alert(`⚠️ Gagal menarik data dari Google Sheets: ${err.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushSheet = async () => {
    let token = getAccessToken();
    if (!token) {
      try {
        const authResult = await googleSignIn();
        if (authResult?.accessToken) {
          token = authResult.accessToken;
        } else {
          return;
        }
      } catch (err: any) {
        alert(`Gagal login Google Workspace: ${err.message || 'Error login'}`);
        return;
      }
    }

    let spreadsheetId = localStorage.getItem('erp_spreadsheet_id') || syncStatus?.spreadsheetId;
    if (!spreadsheetId) {
      const input = prompt('Masukkan Spreadsheet ID atau URL Google Spreadsheet Anda:');
      if (input) {
        let trimmed = input.trim();
        const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) trimmed = match[1];
        spreadsheetId = trimmed;
        localStorage.setItem('erp_spreadsheet_id', trimmed);
      } else {
        setActiveTab('sheets');
        return;
      }
    }

    try {
      setIsLoading(true);
      await syncErpDataToSheet(token, spreadsheetId, {
        students,
        tutors,
        schedules,
        attendances,
        invoices,
        finances: finance,
        tutorSalaries: salaries,
        approvals,
        auditLogs,
        modules
      });
      alert('✅ Seluruh data ERP berhasil dikirim & disimpan ke Google Sheets!');
    } catch (err: any) {
      alert(`⚠️ Gagal mengirim data ke Google Sheets: ${err.message || 'Error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = getAccessToken();
    const spreadsheetId = localStorage.getItem('erp_spreadsheet_id') || syncStatus?.spreadsheetId;

    if (token && spreadsheetId) {
      setIsLoggingOut(true);
      try {
        await syncErpDataToSheet(token, spreadsheetId, {
          students,
          tutors,
          schedules,
          attendances,
          invoices,
          finances: finance,
          tutorSalaries: salaries,
          approvals,
          auditLogs,
          modules
        });
      } catch (err) {
        console.error('Auto-push on logout error:', err);
      } finally {
        setIsLoggingOut(false);
      }
    }

    localStorage.removeItem('erp_session_user');
    setIsLoggedIn(false);
  };

  const handleManualSync = async () => {
    try {
      const res = await fetch('/api/sheets/sync', { method: 'POST' });
      const data = await res.json();
      setSyncStatus(data.sync);
      alert('Google Sheets disinkronkan!');
    } catch (err) {
      alert('Gagal menyinkronkan Google Sheets');
    }
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
      {/* Auto-push on logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center text-white">
          <div className="text-center space-y-4 max-w-sm p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="font-extrabold text-base text-emerald-400">Mengamankan Data ke Google Sheets...</p>
              <p className="text-xs text-slate-300 mt-1">Seluruh data ERP otomatis disimpan sebelum Anda keluar.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        onLogout={handleLogout}
        onPullSheet={handlePullSheet}
        onPushSheet={handlePushSheet}
        onOpenSheetsTab={() => setActiveTab('sheets')}
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
              userRole={currentUser.role}
              currentUserTutorId={currentUser.tutorId}
              onNavigate={(tab) => setActiveTab(tab)}
              onPullSheet={handlePullSheet}
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
