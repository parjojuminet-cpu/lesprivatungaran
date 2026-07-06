import React from 'react';
import { Approval, UserRole } from '../types';
import { CheckSquare, Check, X, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { persistDatabaseUpdate } from '../services/dataManager';

interface ApprovalViewProps {
  approvals: Approval[];
  userRole: UserRole;
  onRefresh: () => void;
}

export const ApprovalView: React.FC<ApprovalViewProps> = ({
  approvals,
  userRole,
  onRefresh
}) => {
  const handleProcess = async (id: string, status: 'Approved' | 'Rejected') => {
    const remarks = prompt(`Catatan approval (${status}):`, status === 'Approved' ? 'Disetujui oleh Manajemen' : 'Ditolak');
    try {
      await persistDatabaseUpdate(db => {
        const updatedApprovals = db.approvals.map(app => app.id === id ? {
          ...app,
          status,
          remarks: remarks || '',
          approvedBy: userRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'MANAGEMENT'
        } : app);
        return { ...db, approvals: updatedApprovals };
      });
      alert(`Pengajuan berhasil di-${status.toLowerCase()}`);
      onRefresh();
    } catch (err) {
      alert('Gagal memproses approval');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-purple-600" />
            Approval Center Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pusat persetujuan workflow untuk Force Majeure, Izin Darurat, Over-Limit Reschedule, dan Perubahan Tarif.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Tanggal & Pemohon</th>
                <th className="p-3.5">Jenis Pengajuan</th>
                <th className="p-3.5">Alasan / Detail</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Catatan Management</th>
                <th className="p-3.5 text-right">Aksi Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvals.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{app.requestedBy}</div>
                    <div className="text-[11px] text-slate-400">{new Date(app.createdAt).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-purple-100 text-purple-900 font-bold text-[11px] px-2.5 py-0.5 rounded-md">
                      {app.type}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-800 max-w-xs">{app.reason}</td>
                  <td className="p-3.5">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      app.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 italic">{app.remarks || '-'}</td>
                  <td className="p-3.5 text-right space-x-2">
                    {app.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleProcess(app.id, 'Approved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Setujui
                        </button>
                        <button
                          onClick={() => handleProcess(app.id, 'Rejected')}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Tolak
                        </button>
                      </>
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
