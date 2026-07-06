import React, { useState } from 'react';
import {
  Student, Tutor, Parent, Subject, WorkingArea, Schedule,
  Attendance, Invoice, Finance, TutorSalary, Module, Approval, AuditLog
} from '../types';
import {
  FileSpreadsheet, Search, RefreshCw, Download, ExternalLink,
  Eye, CheckCircle2, Table, Grid, Layers, ShieldCheck, Filter
} from 'lucide-react';

interface GoogleSheetsTablesViewProps {
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
  auditLogs: AuditLog[];
  syncStatus?: any;
  onRefresh: () => void;
}

type TableTabKey =
  | 'students'
  | 'tutors'
  | 'parents'
  | 'subjects'
  | 'workingAreas'
  | 'schedules'
  | 'attendances'
  | 'invoices'
  | 'finance'
  | 'salaries'
  | 'approvals'
  | 'modules'
  | 'auditLogs';

export const GoogleSheetsTablesView: React.FC<GoogleSheetsTablesViewProps> = ({
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
  auditLogs,
  syncStatus,
  onRefresh
}) => {
  const [activeTable, setActiveTable] = useState<TableTabKey>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'iframe'>('grid');
  const [selectedSelfieUrl, setSelectedSelfieUrl] = useState<string | null>(null);

  const formatRupiah = (num?: number) => {
    if (num === undefined || num === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const tableTabs: { key: TableTabKey; label: string; sheetName: string; count: number; icon: string }[] = [
    { key: 'students', label: '1. Siswa', sheetName: 'Sheet `Siswa`', count: students.length, icon: '👨‍🎓' },
    { key: 'tutors', label: '2. Tentor', sheetName: 'Sheet `Tentor`', count: tutors.length, icon: '👨‍🏫' },
    { key: 'parents', label: '3. Orang Tua', sheetName: 'Sheet `Orang_Tua`', count: parents.length, icon: '👪' },
    { key: 'subjects', label: '4. Mapel', sheetName: 'Sheet `Mata_Pelajaran`', count: subjects.length, icon: '📚' },
    { key: 'workingAreas', label: '5. Wilayah', sheetName: 'Sheet `Wilayah_Kerja`', count: workingAreas.length, icon: '📍' },
    { key: 'schedules', label: '6. Jadwal', sheetName: 'Sheet `Jadwal`', count: schedules.length, icon: '📅' },
    { key: 'attendances', label: '7. Absensi & Selfie', sheetName: 'Sheet `Absensi`', count: attendances.length, icon: '📸' },
    { key: 'invoices', label: '8. Tagihan SPP', sheetName: 'Sheet `Tagihan_SPP`', count: invoices.length, icon: '🧾' },
    { key: 'finance', label: '9. Keuangan', sheetName: 'Sheet `Keuangan`', count: finance.length, icon: '💵' },
    { key: 'salaries', label: '10. Gaji Tentor', sheetName: 'Sheet `Gaji_Tentor`', count: salaries.length, icon: '💸' },
    { key: 'approvals', label: '11. Persetujuan', sheetName: 'Sheet `Persetujuan`', count: approvals.length, icon: '✅' },
    { key: 'modules', label: '12. Modul Belajar', sheetName: 'Sheet `Modul`', count: modules.length, icon: '📖' },
    { key: 'auditLogs', label: '13. Audit Log', sheetName: 'Sheet `Audit_Log`', count: auditLogs.length, icon: '🛡️' }
  ];

  const currentTabInfo = tableTabs.find(t => t.key === activeTable);

  // Helper map for Student/Tutor names
  const studentMap = new Map(students.map(s => [s.id, s.name]));
  const tutorMap = new Map(tutors.map(t => [t.id, t.name]));

  // Generate Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    switch (activeTable) {
      case 'students':
        headers = ['ID', 'Nama Siswa', 'Gender', 'Jenjang', 'Kelas', 'Sekolah', 'Wali', 'WA Wali', 'Sisa Sesi', 'Tarif SPP/Sesi', 'Status'];
        rows = students.map(s => [s.id, s.name, s.gender, s.grade, s.className, s.school, s.parentName, s.parentWA, s.remainingSessions, s.ratePerSession, s.status]);
        break;
      case 'tutors':
        headers = ['ID', 'Nama Tentor', 'Gender', 'WA', 'Spesialisasi', 'Tarif Standar/Sesi', 'Rating', 'Status'];
        rows = tutors.map(t => [t.id, t.name, t.gender, t.wa, t.subjects.join(', '), t.ratePerSession, t.averageRating, t.status]);
        break;
      case 'schedules':
        headers = ['ID', 'Siswa', 'Tentor', 'Mata Pelajaran', 'Hari', 'Jam', 'Jenis', 'Tarif Deal/Sesi', 'Status'];
        rows = schedules.map(s => [
          s.id,
          studentMap.get(s.studentId) || s.studentId,
          tutorMap.get(s.tutorId) || s.tutorId,
          s.subject,
          s.dayOfWeek,
          s.timeSlot,
          s.type,
          s.sessionRate || 40000,
          s.status
        ]);
        break;
      case 'attendances':
        headers = ['ID', 'Tanggal', 'Siswa', 'Tentor', 'Status', 'Materi', 'Catatan Kemajuan'];
        rows = attendances.map(a => [
          a.id,
          a.date,
          studentMap.get(a.studentId) || a.studentId,
          tutorMap.get(a.tutorId) || a.tutorId,
          a.status,
          a.materialCovered,
          a.progressNotes
        ]);
        break;
      case 'finance':
        headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Jumlah (Rp)', 'Keterangan', 'Oleh'];
        rows = finance.map(f => [f.id, f.date, f.type, f.category, f.amount, f.description, f.createdBy]);
        break;
      default:
        headers = ['Data'];
        rows = [['Informasi Tabel']];
    }

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Google_Sheet_${activeTable}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterRows = (items: any[]) => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      Object.values(item).some(val =>
        val && String(val).toLowerCase().includes(term)
      )
    );
  };

  const spreadsheetUrl = syncStatus?.spreadsheetUrl;
  const spreadsheetId = syncStatus?.spreadsheetId;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Penjelajah Tabel Google Sheets</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Superadmin Menu
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Lihat & kelola seluruh 13 tabel database Google Sheets secara langsung dalam sistem tanpa perlu berpindah tab browser.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid Spreadsheet</span>
              </button>
              <button
                onClick={() => setViewMode('iframe')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'iframe'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Embed Google Sheet</span>
              </button>
            </div>

            <button
              onClick={onRefresh}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Data</span>
            </button>

            {viewMode === 'grid' && (
              <button
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Metadata Banner */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Status Sinkronisasi Sheet:{' '}
              {spreadsheetId ? (
                <strong className="text-emerald-400">Terhubung Auto-Sync Engine</strong>
              ) : (
                <strong className="text-amber-400">Belum Ada Spreadsheet Dihubungkan</strong>
              )}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              Terakhir Diperbarui: {syncStatus?.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleString('id-ID') : 'Belum Pernah'}
            </span>
          </div>

          <a
            href={spreadsheetUrl || (spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : 'https://docs.google.com/spreadsheets/u/0/')}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 underline text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition-all"
          >
            <span>Buka Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Sheet Tabs Selector (13 Tables) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
          <span>Pilih Tabel Sheet (Total 13 Sheet ERP)</span>
          <span className="text-emerald-600 font-semibold">{currentTabInfo?.sheetName}</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {tableTabs.map((tab) => {
            const isActive = activeTable === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTable(tab.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                  isActive ? 'bg-emerald-900/60 text-emerald-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT VIEW */}
      {viewMode === 'iframe' ? (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Tampilan Google Sheets Embedded Iframe Real-time</span>
            </div>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Buka di Google Drive Tab Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {spreadsheetId || spreadsheetUrl ? (
            <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-300 shadow-inner">
              <iframe
                src={spreadsheetUrl ? spreadsheetUrl.replace(/\/edit.*$/, '/htmlview') : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/preview`}
                className="w-full h-full border-0"
                title="Google Sheet Viewer"
              />
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Spreadsheet Belum Dihubungkan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan buka menu <strong>Google Sheets</strong> di sidebar untuk melakukan autentikasi OAuth & membuat spreadsheet baru di Drive.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* SPREADSHEET GRID MODE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 bg-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentTabInfo?.icon}</span>
              <div>
                <h3 className="font-bold text-sm tracking-wide">{currentTabInfo?.sheetName}</h3>
                <p className="text-[11px] text-emerald-200">Menampilkan {filterRows(getRawData(activeTable)).length} baris data terstruktur</p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-emerald-300" />
              <input
                type="text"
                placeholder={`Cari di ${currentTabInfo?.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs text-white placeholder-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Excel / Google Sheets Column Index Bar */}
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-[10px] font-mono text-emerald-900 font-extrabold flex items-center justify-between uppercase tracking-wider">
            <span>Kolom spreadsheet terindeks otomatis (A..Z)</span>
            <span>Tipe: Live ERP Google Sheet Format</span>
          </div>

          {/* Table Data Render */}
          <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
            {renderTableContent()}
          </div>
        </div>
      )}

      {/* Selfie Photo Zoom Modal */}
      {selectedSelfieUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full space-y-3 relative">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                📸 Verifikasi Foto Selfie Absensi
              </h3>
              <button
                onClick={() => setSelectedSelfieUrl(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[400px] flex items-center justify-center">
              <img
                src={selectedSelfieUrl}
                alt="Selfie Absensi"
                className="object-contain max-h-[380px] w-full"
                onError={(e) => {
                  (e.target as any).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                }}
              />
            </div>
            <button
              onClick={() => setSelectedSelfieUrl(null)}
              className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to extract array for current tab
  function getRawData(tabKey: TableTabKey): any[] {
    switch (tabKey) {
      case 'students': return students;
      case 'tutors': return tutors;
      case 'parents': return parents;
      case 'subjects': return subjects;
      case 'workingAreas': return workingAreas;
      case 'schedules': return schedules;
      case 'attendances': return attendances;
      case 'invoices': return invoices;
      case 'finance': return finance;
      case 'salaries': return salaries;
      case 'approvals': return approvals;
      case 'modules': return modules;
      case 'auditLogs': return auditLogs;
      default: return [];
    }
  }

  function renderTableContent() {
    const rawList = getRawData(activeTable);
    const filtered = filterRows(rawList);

    if (filtered.length === 0) {
      return (
        <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
          <Filter className="w-8 h-8 text-slate-300 mx-auto" />
          <p>Tidak ada data baris ditemukan pada sheet ini.</p>
        </div>
      );
    }

    switch (activeTable) {
      case 'students':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">ID Siswa (B)</th>
                <th className="p-3 border-r border-slate-200">Nama Siswa (C)</th>
                <th className="p-3 border-r border-slate-200">L/P (D)</th>
                <th className="p-3 border-r border-slate-200">Jenjang/Kelas (E)</th>
                <th className="p-3 border-r border-slate-200">Sekolah (F)</th>
                <th className="p-3 border-r border-slate-200">Orang Tua (G)</th>
                <th className="p-3 border-r border-slate-200">WA Wali (H)</th>
                <th className="p-3 border-r border-slate-200">Sisa Sesi (I)</th>
                <th className="p-3 border-r border-slate-200 text-right">Tarif SPP/Sesi (J)</th>
                <th className="p-3">Status (K)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((s: Student, idx: number) => (
                <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{s.id}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-900">{s.name}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{s.gender}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{s.grade} - {s.className}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{s.school}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{s.parentName}</td>
                  <td className="p-2.5 border-r border-slate-200">{s.parentWA}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-indigo-700">{s.remainingSessions} sesi</td>
                  <td className="p-2.5 border-r border-slate-200 text-right font-bold text-emerald-800">{formatRupiah(s.ratePerSession)}</td>
                  <td className="p-2.5 font-sans">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'tutors':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">ID Tentor (B)</th>
                <th className="p-3 border-r border-slate-200">Nama Tentor (C)</th>
                <th className="p-3 border-r border-slate-200">WhatsApp (D)</th>
                <th className="p-3 border-r border-slate-200">Mata Pelajaran (E)</th>
                <th className="p-3 border-r border-slate-200">Wilayah (F)</th>
                <th className="p-3 border-r border-slate-200 text-right">Tarif Standard/Sesi (G)</th>
                <th className="p-3 border-r border-slate-200 text-center">Rating (H)</th>
                <th className="p-3">Status (I)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((t: Tutor, idx: number) => (
                <tr key={t.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{t.id}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-900">{t.name}</td>
                  <td className="p-2.5 border-r border-slate-200">{t.wa}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{t.subjects.join(', ')}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{t.workingArea.join(', ')}</td>
                  <td className="p-2.5 border-r border-slate-200 text-right font-bold text-emerald-800">{formatRupiah(t.ratePerSession)}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-amber-600">⭐ {t.averageRating}</td>
                  <td className="p-2.5 font-sans">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      t.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'schedules':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">ID Jadwal (B)</th>
                <th className="p-3 border-r border-slate-200">Siswa (C)</th>
                <th className="p-3 border-r border-slate-200">Tentor (D)</th>
                <th className="p-3 border-r border-slate-200">Mata Pelajaran (E)</th>
                <th className="p-3 border-r border-slate-200">Hari (F)</th>
                <th className="p-3 border-r border-slate-200">Jam (G)</th>
                <th className="p-3 border-r border-slate-200">Jenis Jadwal (H)</th>
                <th className="p-3 border-r border-slate-200 text-right">Honor Deal/Sesi (I)</th>
                <th className="p-3">Status (J)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((sch: Schedule, idx: number) => {
                const sName = studentMap.get(sch.studentId) || sch.studentId;
                const tName = tutorMap.get(sch.tutorId) || sch.tutorId;
                return (
                  <tr key={sch.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{sch.id}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-900">{sName}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans text-indigo-950 font-semibold">{tName}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans">{sch.subject}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-800">{sch.dayOfWeek}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans">{sch.timeSlot}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans">{sch.type}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-extrabold text-emerald-800">
                      {formatRupiah(sch.sessionRate || 40000)}
                    </td>
                    <td className="p-2.5 font-sans">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        {sch.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case 'attendances':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">Tanggal (B)</th>
                <th className="p-3 border-r border-slate-200">Siswa (C)</th>
                <th className="p-3 border-r border-slate-200">Tentor (D)</th>
                <th className="p-3 border-r border-slate-200 text-center">Foto Selfie (E)</th>
                <th className="p-3 border-r border-slate-200">Status Absen (F)</th>
                <th className="p-3 border-r border-slate-200">Materi Diajarkan (G)</th>
                <th className="p-3">Catatan Kemajuan (H)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((att: Attendance, idx: number) => {
                const sName = studentMap.get(att.studentId) || att.studentId;
                const tName = tutorMap.get(att.tutorId) || att.tutorId;
                return (
                  <tr key={att.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{att.date}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-900">{sName}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans text-indigo-950 font-semibold">{tName}</td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      {att.selfieUrl ? (
                        <button
                          onClick={() => setSelectedSelfieUrl(att.selfieUrl)}
                          className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Foto Selfie</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-sans text-[10px]">-</span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-sans">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        att.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-sans max-w-xs truncate">{att.materialCovered}</td>
                    <td className="p-2.5 font-sans max-w-xs truncate">{att.progressNotes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case 'invoices':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">No. Invoice (B)</th>
                <th className="p-3 border-r border-slate-200">Nama Siswa (C)</th>
                <th className="p-3 border-r border-slate-200 text-right">Total Tagihan (D)</th>
                <th className="p-3 border-r border-slate-200 text-right">Dibayar (E)</th>
                <th className="p-3 border-r border-slate-200">Tenggat Waktu (F)</th>
                <th className="p-3">Status Pembayaran (G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((inv: Invoice, idx: number) => {
                const sName = studentMap.get(inv.studentId) || inv.studentId;
                return (
                  <tr key={inv.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-900">{sName}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-bold text-slate-900">{formatRupiah(inv.amount)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-bold text-emerald-700">{formatRupiah(inv.amountPaid)}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans">{inv.dueDate}</td>
                    <td className="p-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        inv.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case 'finance':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">Tanggal (B)</th>
                <th className="p-3 border-r border-slate-200">Jenis Trx (C)</th>
                <th className="p-3 border-r border-slate-200">Kategori (D)</th>
                <th className="p-3 border-r border-slate-200 text-right">Jumlah (E)</th>
                <th className="p-3 border-r border-slate-200">Keterangan (F)</th>
                <th className="p-3">Petugas (G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((f: Finance, idx: number) => (
                <tr key={f.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{f.date}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      f.type === 'Pemasukan' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {f.type}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{f.category}</td>
                  <td className={`p-2.5 border-r border-slate-200 text-right font-extrabold ${
                    f.type === 'Pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {f.type === 'Pemasukan' ? '+' : '-'}{formatRupiah(f.amount)}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-sans max-w-xs truncate">{f.description}</td>
                  <td className="p-2.5 font-sans text-slate-600">{f.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'salaries':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">Periode (B)</th>
                <th className="p-3 border-r border-slate-200">Nama Tentor (C)</th>
                <th className="p-3 border-r border-slate-200 text-right">Honor Mengajar (D)</th>
                <th className="p-3 border-r border-slate-200 text-right">Bonus (E)</th>
                <th className="p-3 border-r border-slate-200 text-right font-bold text-emerald-900">Total Gaji (F)</th>
                <th className="p-3">Status Cair (G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((sal: TutorSalary, idx: number) => {
                const tName = tutorMap.get(sal.tutorId) || sal.tutorId;
                return (
                  <tr key={sal.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{sal.monthYear}</td>
                    <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-900">{tName}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right">{formatRupiah(sal.totalAttendanceRate)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right text-emerald-700">{formatRupiah(sal.bonus || 0)}</td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-extrabold text-emerald-800">{formatRupiah(sal.totalSalary)}</td>
                    <td className="p-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        sal.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sal.paymentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );

      case 'approvals':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">ID Pengajuan (B)</th>
                <th className="p-3 border-r border-slate-200">Jenis Approval (C)</th>
                <th className="p-3 border-r border-slate-200">Pemohon (D)</th>
                <th className="p-3 border-r border-slate-200">Alasan / Detail (E)</th>
                <th className="p-3">Status Approval (F)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((appr: Approval, idx: number) => (
                <tr key={appr.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{appr.id}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-indigo-900">{appr.type}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{appr.requestedBy}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans max-w-xs truncate">{appr.reason}</td>
                  <td className="p-2.5 font-sans">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      appr.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      appr.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {appr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'modules':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">Judul Modul (B)</th>
                <th className="p-3 border-r border-slate-200">Mata Pelajaran (C)</th>
                <th className="p-3 border-r border-slate-200">Jenjang (D)</th>
                <th className="p-3 border-r border-slate-200">Diunggah Oleh (E)</th>
                <th className="p-3 border-r border-slate-200">Tanggal Upload (F)</th>
                <th className="p-3">Link Google Drive (G)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((mod: Module, idx: number) => (
                <tr key={mod.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-slate-900">{mod.title}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{mod.subject}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{mod.grade}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{mod.uploadedBy}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans">{mod.uploadedAt}</td>
                  <td className="p-2.5 font-sans">
                    <a
                      href={mod.driveFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Buka Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'auditLogs':
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-3 border-r border-slate-200 w-12 text-center"># (A)</th>
                <th className="p-3 border-r border-slate-200">Waktu (B)</th>
                <th className="p-3 border-r border-slate-200">Pengguna (C)</th>
                <th className="p-3 border-r border-slate-200">Aktivitas Sistem (D)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((log: AuditLog, idx: number) => (
                <tr key={log.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{log.time}</td>
                  <td className="p-2.5 border-r border-slate-200 font-sans font-bold text-indigo-900">{log.user}</td>
                  <td className="p-2.5 font-sans font-medium text-slate-800">{log.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="p-3 border-r border-slate-200">ID</th>
                <th className="p-3">Detail Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {filtered.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="hover:bg-emerald-50/40">
                  <td className="p-2.5 border-r border-slate-200 font-bold">{item.id || idx + 1}</td>
                  <td className="p-2.5 font-sans">{JSON.stringify(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  }
};
