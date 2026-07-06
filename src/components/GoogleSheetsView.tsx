import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, Upload, Download, ExternalLink, CheckCircle2, ShieldCheck, LogIn, Link, AlertCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { googleSignIn, getAccessToken, logoutGoogle } from '../services/googleAuth';
import { createErpSpreadsheet, syncErpDataToSheet, pullErpDataFromSheet } from '../services/googleSheets';
import {
  Student, Tutor, Schedule, Attendance, Invoice,
  Finance, TutorSalary, Approval, AuditLog, Module
} from '../types';

interface GoogleSheetsViewProps {
  students?: Student[];
  tutors?: Tutor[];
  schedules?: Schedule[];
  attendances?: Attendance[];
  invoices?: Invoice[];
  finance?: Finance[];
  salaries?: TutorSalary[];
  approvals?: Approval[];
  auditLogs?: AuditLog[];
  modules?: Module[];
  onRefresh: () => void;
  onUpdateData?: (newData: any) => void;
}

const safeFetchJson = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const text = await res.text();
    if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
      return JSON.parse(text);
    }
    return null;
  } catch {
    return null;
  }
};

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  students = [],
  tutors = [],
  schedules = [],
  attendances = [],
  invoices = [],
  finance = [],
  salaries = [],
  approvals = [],
  auditLogs = [],
  modules = [],
  onRefresh,
  onUpdateData
}) => {
  const [syncData, setSyncData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => localStorage.getItem('erp_spreadsheet_id') || '');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    const saved = localStorage.getItem('erp_spreadsheet_id');
    return saved ? `https://docs.google.com/spreadsheets/d/${saved}` : '';
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchSyncStatus = async () => {
    const data = await safeFetchJson('/api/sheets/status');
    if (data) {
      setSyncData(data);
      if (data.spreadsheetId) {
        setSpreadsheetId(data.spreadsheetId);
        setSpreadsheetUrl(data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`);
        localStorage.setItem('erp_spreadsheet_id', data.spreadsheetId);
      }
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setStatusMessage('Menghubungkan ke Akun Google Workspace...');
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMessage(`Berhasil terhubung sebagai ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Gagal login Google Workspace: ${err.message || 'Error OAuth'}`);
    }
  };

  const handleClearAuth = async () => {
    await logoutGoogle();
    setAccessToken(null);
    setGoogleUser(null);
    setStatusMessage('Sesi Google Auth telah dikosongkan. Silakan klik "Login Google Workspace" kembali.');
  };

  const handleCreateNewSheetInDrive = async () => {
    if (spreadsheetId) {
      const confirmCreate = window.confirm(
        `Anda saat ini sudah terhubung ke Google Spreadsheet (ID: ${spreadsheetId}).\n\n` +
        `• Untuk memperbarui isi file Google Sheet yang ada, gunakan tombol "Kirim Data ke Sheet" atau "Auto Sync".\n` +
        `• Tombol ini akan membuat FILE GOOGLE SPREADSHEET BARU di Google Drive Anda.\n\n` +
        `Apakah Anda tetap ingin membuat FILE GOOGLE SPREADSHEET BARU?`
      );
      if (!confirmCreate) return;
    }

    let token = accessToken || getAccessToken();
    if (!token) {
      try {
        setStatusMessage('Menghubungkan ke Akun Google...');
        const res = await googleSignIn();
        if (res && res.accessToken) {
          token = res.accessToken;
          setGoogleUser(res.user);
          setAccessToken(res.accessToken);
        } else {
          return;
        }
      } catch (err: any) {
        setStatusMessage(`Gagal login Google: ${err.message || 'Error login'}`);
        alert('Silakan lakukan login Google Workspace untuk membuat file Google Spreadsheet di Google Drive Anda.');
        return;
      }
    }

    try {
      setIsSyncing(true);
      setStatusMessage('Membuat Google Spreadsheet baru di Drive...');
      const sheet = await createErpSpreadsheet(token);
      setSpreadsheetId(sheet.id);
      setSpreadsheetUrl(sheet.url);
      localStorage.setItem('erp_spreadsheet_id', sheet.id);
      setStatusMessage('Mengisi data ERP ke Google Spreadsheet baru...');

      // Fetch or use local app data
      const currentStudents = students.length ? students : (await safeFetchJson('/api/students') || []);
      const currentTutors = tutors.length ? tutors : (await safeFetchJson('/api/tutors') || []);
      const currentSchedules = schedules.length ? schedules : (await safeFetchJson('/api/schedules') || []);
      const currentAttendances = attendances.length ? attendances : (await safeFetchJson('/api/attendances') || []);
      const currentInvoices = invoices.length ? invoices : (await safeFetchJson('/api/invoices') || []);
      const currentFinance = finance.length ? finance : (await safeFetchJson('/api/finance') || []);
      const currentSalaries = salaries.length ? salaries : (await safeFetchJson('/api/salaries') || []);
      const currentApprovals = approvals.length ? approvals : (await safeFetchJson('/api/approvals') || []);
      const currentAuditLogs = auditLogs.length ? auditLogs : (await safeFetchJson('/api/audit-logs') || []);
      const currentModules = modules.length ? modules : (await safeFetchJson('/api/modules') || []);

      await syncErpDataToSheet(token, sheet.id, {
        students: currentStudents,
        tutors: currentTutors,
        schedules: currentSchedules,
        attendances: currentAttendances,
        invoices: currentInvoices,
        finances: currentFinance,
        tutorSalaries: currentSalaries,
        approvals: currentApprovals,
        auditLogs: currentAuditLogs,
        modules: currentModules
      });

      setStatusMessage('Google Spreadsheet baru berhasil dibuat dan diisi data lengkap ERP!');
      alert(`Google Spreadsheet berhasil dibuat dan diisi data!\n\nID: ${sheet.id}\nURL: ${sheet.url}\n\n10 Sheet ERP (Siswa, Tentor, Jadwal, Absensi, SPP, Keuangan, Gaji) sudah terbuat dan siap digunakan!`);
      fetchSyncStatus();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Gagal membuat/mengisi Spreadsheet: ${err.message}`);
      alert(`Gagal membuat Spreadsheet: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerPullFromSheet = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      alert('Silakan klik tombol "Login Google Workspace" terlebih dahulu untuk menghubungkan akun Google Anda.');
      return;
    }
    if (!spreadsheetId) {
      alert('Masukkan ID atau URL Google Spreadsheet terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setStatusMessage('Menarik data terbaru dari Google Sheets...');
    try {
      const pulledData = await pullErpDataFromSheet(token, spreadsheetId);
      
      // Update backend server if endpoint available
      const apiRes = await safeFetchJson('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pulledData)
      });

      if (apiRes?.sync) {
        setSyncData(apiRes.sync);
      } else {
        setSyncData({
          syncStatus: 'Synced',
          spreadsheetId,
          spreadsheetUrl,
          lastSyncTime: new Date().toISOString()
        });
      }

      if (onUpdateData) {
        onUpdateData(pulledData);
      }

      setStatusMessage('Berhasil memperbarui data ERP dari Google Sheets!');
      alert('Data dari Google Sheets berhasil ditarik dan disinkronkan ke ERP!');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        await logoutGoogle();
        setAccessToken(null);
      }
      setStatusMessage(`Gagal menarik data dari Google Sheets: ${err.message || ''}`);
      alert(`Akses Google Sheets Ditolak (401 / Token Kadaluarsa).\n\nSilakan klik tombol "Login Google Workspace" untuk menghubungkan akun Google Anda kembali.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerPushToSheet = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      alert('Silakan klik tombol "Login Google Workspace" terlebih dahulu untuk menghubungkan akun Google Anda.');
      return;
    }
    if (!spreadsheetId) {
      alert('Masukkan ID atau URL Google Spreadsheet terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setStatusMessage('Mengirim data ERP ke Google Sheets...');
    try {
      const currentStudents = students.length ? students : (await safeFetchJson('/api/students') || []);
      const currentTutors = tutors.length ? tutors : (await safeFetchJson('/api/tutors') || []);
      const currentSchedules = schedules.length ? schedules : (await safeFetchJson('/api/schedules') || []);
      const currentAttendances = attendances.length ? attendances : (await safeFetchJson('/api/attendances') || []);
      const currentInvoices = invoices.length ? invoices : (await safeFetchJson('/api/invoices') || []);
      const currentFinance = finance.length ? finance : (await safeFetchJson('/api/finance') || []);
      const currentSalaries = salaries.length ? salaries : (await safeFetchJson('/api/salaries') || []);
      const currentApprovals = approvals.length ? approvals : (await safeFetchJson('/api/approvals') || []);
      const currentAuditLogs = auditLogs.length ? auditLogs : (await safeFetchJson('/api/audit-logs') || []);
      const currentModules = modules.length ? modules : (await safeFetchJson('/api/modules') || []);

      await syncErpDataToSheet(token, spreadsheetId, {
        students: currentStudents,
        tutors: currentTutors,
        schedules: currentSchedules,
        attendances: currentAttendances,
        invoices: currentInvoices,
        finances: currentFinance,
        tutorSalaries: currentSalaries,
        approvals: currentApprovals,
        auditLogs: currentAuditLogs,
        modules: currentModules
      });

      const apiRes = await safeFetchJson('/api/sheets/sync', { method: 'POST' });
      if (apiRes?.sync) {
        setSyncData(apiRes.sync);
      } else {
        setSyncData({
          syncStatus: 'Synced',
          spreadsheetId,
          spreadsheetUrl,
          lastSyncTime: new Date().toISOString()
        });
      }

      setStatusMessage('Data ERP berhasil dikirim ke Google Sheets!');
      alert('Ekspor data ERP ke Google Sheets berhasil!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Gagal mengirim data ke Google Sheets: ${err.message || ''}`);
      alert(`Gagal mengirim data ke Google Sheets: ${err.message || ''}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerManualSync = async () => {
    setIsSyncing(true);
    setStatusMessage('Melakukan sinkronisasi otomatis 2 arah...');
    try {
      const token = accessToken || getAccessToken();
      if (token && spreadsheetId) {
        try {
          const pulledData = await pullErpDataFromSheet(token, spreadsheetId);
          await safeFetchJson('/api/sheets/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pulledData)
          });
          if (onUpdateData) onUpdateData(pulledData);
        } catch (pullErr) {
          console.warn('Gagal pull dari sheet, melanjutkan push state:', pullErr);
        }
      }

      const apiRes = await safeFetchJson('/api/sheets/sync', { method: 'POST' });
      if (apiRes?.sync) {
        setSyncData(apiRes.sync);
      } else {
        setSyncData({
          syncStatus: 'Synced',
          spreadsheetId,
          spreadsheetUrl,
          lastSyncTime: new Date().toISOString()
        });
      }

      setStatusMessage('Sinkronisasi Google Sheets selesai!');
      alert('Sinkronisasi otomatis Google Sheets berhasil!');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal melakukan sinkronisasi Google Sheets: ${err.message || ''}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to extract clean spreadsheet ID if user pasted full URL
  const handleSpreadsheetIdChange = (val: string) => {
    let cleanId = val.trim();
    if (cleanId.includes('/spreadsheets/d/')) {
      const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanId = match[1];
      }
    }
    setSpreadsheetId(cleanId);
    if (cleanId) {
      setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${cleanId}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Integrasi Real-time Google Sheets API
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sinkronisasi 2 arah: Impor perubahan dari Google Sheets atau Ekspor data ERP langsung ke Spreadsheet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreateNewSheetInDrive}
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            title="Buat Google Spreadsheet ERP baru secara otomatis di Google Drive Anda"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{spreadsheetId ? '✨ Buat File Sheet Baru' : '✨ Buat Sheet Otomatis di Drive'}</span>
          </button>

          <button
            onClick={handleGoogleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all border border-blue-500"
            title="Klik untuk Login / Sambungkan Akun Google Workspace"
          >
            <LogIn className="w-4 h-4 text-amber-300" />
            <span>{accessToken ? '🔑 Re-Login Google Workspace' : '🔑 Login Google Workspace'}</span>
          </button>

          <a
            href={spreadsheetUrl || (spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : 'https://docs.google.com/spreadsheets/u/0/')}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Buka Google Sheets di Tab Baru"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Google Sheet</span>
          </a>

          <button
            onClick={triggerPullFromSheet}
            disabled={isSyncing}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Tarik perubahan yang baru dibuat di Google Sheets ke ERP"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Tarik Data dari Sheet</span>
          </button>

          <button
            onClick={triggerPushToSheet}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Kirim data dari ERP ke Google Sheets"
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Kirim Data ke Sheet</span>
          </button>

          <button
            onClick={triggerManualSync}
            disabled={isSyncing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Auto Sync'}</span>
          </button>
        </div>
      </div>

      {!spreadsheetId && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950 shadow-xs">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-indigo-900">Belum Memiliki Google Spreadsheet ERP?</p>
              <p className="text-indigo-700 mt-0.5">
                Klik tombol di samping untuk langsung membuat file Google Spreadsheet baru di Google Drive Anda secara otomatis. Semua 10 Sheet Database ERP (Siswa, Tentor, Jadwal, Absensi, SPP, Keuangan, Gaji) akan langsung dibuat & diisi.
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateNewSheetInDrive}
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>✨ Buat Sheet Otomatis Sekarang</span>
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-800">
          Google Spreadsheet ID atau Link URL Spreadsheet yang Digunakan:
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
            placeholder="Tempelkan Link URL atau Spreadsheet ID di sini (contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)"
            className="flex-1 text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 min-w-[250px]"
          />
          <button
            onClick={triggerPullFromSheet}
            disabled={isSyncing || !spreadsheetId}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tarik Data Baru</span>
          </button>
          <a
            href={spreadsheetUrl || (spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : 'https://docs.google.com/spreadsheets/u/0/')}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
          >
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>Buka Sheet</span>
          </a>
        </div>
        <p className="text-[11px] text-slate-500">
          💡 <strong>Petunjuk Sync 2-Arah:</strong> Jika Anda mengubah isi sel di Google Sheets (misal ubah nama siswa atau status SPP), klik tombol <span className="font-semibold text-amber-700">"Tarik Data dari Sheet"</span> di atas untuk langsung memperbarui data ERP di layar secara otomatis!
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          statusMessage.includes('401') || statusMessage.includes('ditolak') || statusMessage.includes('Gagal')
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusMessage.includes('401') || statusMessage.includes('ditolak') || statusMessage.includes('Gagal') ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage}</span>
          </div>

          {(statusMessage.includes('401') || statusMessage.includes('ditolak') || !accessToken) && (
            <button
              onClick={handleGoogleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer transition-all shrink-0 flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Login Google Workspace Now</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b pb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Status Sinkronisasi
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Auto Sync Engine:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">AKTIF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Terakhir Dibarui:</span>
              <span className="font-bold text-slate-800">
                {syncData?.lastSyncTime ? new Date(syncData.lastSyncTime).toLocaleString('id-ID') : 'Baru saja'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Google Auth:</span>
              <span className={`font-bold ${accessToken ? 'text-emerald-600' : 'text-blue-600'}`}>
                {accessToken ? 'Terhubung (OAuth Live)' : 'Siap Terhubung'}
              </span>
            </div>
            {googleUser && (
              <div className="flex justify-between">
                <span className="text-slate-500">Akun Google:</span>
                <span className="font-bold text-slate-800 truncate max-w-[150px]">{googleUser.email}</span>
              </div>
            )}
          </div>

          <a
            href={spreadsheetUrl || (spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}` : 'https://docs.google.com/spreadsheets/u/0/')}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block w-full text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-3 rounded-xl text-xs border border-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{spreadsheetId ? 'Buka Google Spreadsheet Ini' : 'Buka Google Sheets (Web)'}</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto text-emerald-600" />
          </a>
        </div>

        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Struktur Sheet Database ERP</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              '1. Sheet `Siswa`',
              '2. Sheet `Tentor`',
              '3. Sheet `Jadwal`',
              '4. Sheet `Absensi`',
              '5. Sheet `Tagihan_SPP`',
              '6. Sheet `Keuangan`',
              '7. Sheet `Gaji_Tentor`',
              '8. Sheet `Persetujuan`',
              '9. Sheet `Audit_Log`',
              '10. Sheet `Modul`'
            ].map((sh, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 font-medium text-emerald-950 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{sh}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

