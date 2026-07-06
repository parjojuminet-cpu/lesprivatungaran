import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { ShieldAlert, Clock, User, Search, FileText } from 'lucide-react';

interface AuditLogViewProps {
  auditLogs?: AuditLog[];
}

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', time: '2026-07-03T09:30:12.000Z', user: 'superadmin', activity: 'Melakukan login ke sistem ERP' },
  { id: 'log-2', time: '2026-07-03T09:45:00.000Z', user: 'management', activity: 'Menyinkronkan database dengan Google Sheets' },
  { id: 'log-3', time: '2026-07-03T10:12:05.000Z', user: 'operator', activity: 'Menambahkan data siswa baru Daffa Pratama' },
  { id: 'log-4', time: '2026-07-03T10:30:00.000Z', user: 'tentor_budi', activity: 'Melakukan presensi hadir pertemuan Matematika' }
];

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs = [] }) => {
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    if (auditLogs && auditLogs.length > 0) return auditLogs;
    const saved = localStorage.getItem('erp_local_audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_AUDIT_LOGS;
  });

  useEffect(() => {
    if (auditLogs && auditLogs.length > 0) {
      setLogs(auditLogs);
    } else {
      const saved = localStorage.getItem('erp_local_audit_logs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLogs(parsed);
            return;
          }
        } catch {}
      }
      setLogs(DEFAULT_AUDIT_LOGS);
    }
  }, [auditLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Audit Log & Keamanan Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak seluruh aktivitas user, perubahan data (before & after), absensi, serta transaksi keuangan.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Cari aktivitas atau user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Waktu</th>
                <th className="p-3.5">User Operator</th>
                <th className="p-3.5">Aktivitas</th>
                <th className="p-3.5">Data Perubahan (Before / After)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs
                .filter(l => (l.user || '').toLowerCase().includes(search.toLowerCase()) || (l.activity || '').toLowerCase().includes(search.toLowerCase()))
                .map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(log.time).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-950 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" /> {log.user}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-800 font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">
                        {log.activity}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-md">
                      {log.dataBefore && (
                        <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded-lg mb-1 font-mono overflow-x-auto">
                          BEFORE: {JSON.stringify(log.dataBefore)}
                        </div>
                      )}
                      {log.dataAfter && (
                        <div className="text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded-lg font-mono overflow-x-auto">
                          AFTER: {JSON.stringify(log.dataAfter)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
