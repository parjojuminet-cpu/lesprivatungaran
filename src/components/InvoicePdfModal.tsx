import React, { useRef } from 'react';
import { Invoice, Student, Attendance, Tutor } from '../types';
import { getStudentTutorBreakdown } from '../utils/tutorBreakdown';
import {
  X, Printer, Send, FileText, CheckCircle2,
  Calendar, Award, BookOpen, User, Building2, Wallet, Share2, Users
} from 'lucide-react';

interface InvoicePdfModalProps {
  invoice: Invoice;
  student?: Student;
  attendances: Attendance[];
  tutors: Tutor[];
  onClose: () => void;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  invoice,
  student,
  attendances,
  tutors,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Filter student attendances
  const studentAttendances = attendances.filter(a => a.studentId === invoice.studentId);
  const totalHadir = studentAttendances.filter(a => a.status === 'Hadir').length;

  // Derive session/token count and rates
  const sessionCount = invoice.sessionCount ?? (totalHadir > 0 ? totalHadir : 1);
  const ratePerSession = invoice.ratePerSession ?? (student?.ratePerSession || 25000);
  const subtotalSpp = sessionCount * ratePerSession;
  const additionalAmount = invoice.additionalAmount || 0;
  const additionalNotes = invoice.additionalNotes || '';
  const totalAmount = invoice.amount || (subtotalSpp + additionalAmount);

  const tutorMap = new Map(tutors.map(t => [t.id, t.name]));

  // Calculate detailed multi-tutor session breakdown
  const tutorBreakdown = getStudentTutorBreakdown(
    invoice.studentId,
    attendances,
    tutors,
    ratePerSession
  );

  // Identify additional cost tutor name
  const additionalTutor = invoice.additionalTutorId
    ? tutors.find(t => t.id === invoice.additionalTutorId)
    : null;
  const additionalTutorName = additionalTutor?.name || (tutorBreakdown.length === 1 ? tutorBreakdown[0].tutorName : '');

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  // Browser print to PDF function
  const handlePrintPdf = () => {
    window.print();
  };

  // WhatsApp Message with Text + Learning Summary & Tutor Breakdown
  const handleSendWhatsApp = () => {
    if (!student) return;

    const remaining = totalAmount - (invoice.amountPaid || 0);
    const dateNow = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Format list of materials covered with tutor name
    const recentMaterials = studentAttendances.filter(a => a.status === 'Hadir').map((att, i) => {
      const tName = tutorMap.get(att.tutorId) || 'Tentor';
      return `  ${i + 1}. ${att.date} (*Tentor ${tName}*): ${att.materialCovered}`;
    }).join('\n');

    // Format tutor session breakdown
    const tutorBreakdownLines = tutorBreakdown.length > 0
      ? tutorBreakdown.map((tb, idx) =>
          `  ${idx + 1}. *Tentor ${tb.tutorName}*: ${tb.sessionCount} Sesi x ${formatRupiah(ratePerSession)} = *${formatRupiah(tb.subtotal)}*`
        ).join('\n')
      : `  • Bimbingan Belajar: ${sessionCount} Sesi x ${formatRupiah(ratePerSession)} = *${formatRupiah(subtotalSpp)}*`;

    const addTutorSuffix = additionalTutorName ? ` (oleh *Tentor ${additionalTutorName}*)` : '';
    const additionalText = additionalAmount > 0
      ? `\n• Biaya/Cas Tambahan: *${formatRupiah(additionalAmount)}* - ${additionalNotes || 'Perlengkapan/Denda'}${addTutorSuffix}`
      : '';

    const message = `Yth. Bapak/Ibu *${student.parentName}* (Orang Tua dari *${student.name}*),\n\nSalam hangat dari Management *Bimbel Privat Academia*.\n\nBerikut kami lampirkan *Nota Penagihan SPP & Rincian Presensi Tentor* an. *${student.name}* (${student.grade} - ${student.school}) per tanggal ${dateNow}:\n\n🧾 *DETAIL NOTA TAGIHAN SPP*\n• No. Invoice: *${invoice.invoiceNumber}*\n• Total Sesi Terpakai: *${sessionCount} Sesi*\n\n👥 *RINCIAN SESI PER TENTOR PENGAJAR*:\n${tutorBreakdownLines}${additionalText}\n\n• *Total Tagihan Akhir*: *${formatRupiah(totalAmount)}*\n• Jumlah Terbayar: *${formatRupiah(invoice.amountPaid)}*\n• Sisa Kekurangan: *${formatRupiah(remaining)}*\n• Status Pembayaran: *${invoice.status.toUpperCase()}*\n• Jatuh Tempo: *${invoice.dueDate}*\n\n📚 *RINCIAN ABSENSI & JADWAL PENGAJARAN TENOR*\n${recentMaterials || '  (Siswa mengikuti seluruh sesi dengan sangat antusias)'}\n\n💳 *REKENING PEMBAYARAN RESMI*\n• BCA: *1234-5678-90* a.n Bimbel Privat Academia\n• Mandiri: *9876-5432-10* a.n Bimbel Privat Academia\n\n📄 *Dokumen Nota Penagihan & Rapor PDF lengkap* dapat diunduh/dicetak dari sistem atau diminta ke Admin.\n\nMohon konfirmasi jika pembayaran telah dilakukan. Terima kasih atas kepercayaan Bapak/Ibu! 🙏✨`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${student.parentWA}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container Card */}
      <div className="bg-white rounded-2xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">

        {/* Modal Header Bar (Hidden during window.print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Nota Penagihan & Rapor Belajar PDF</h3>
              <p className="text-[11px] text-slate-400">Siap cetak / download PDF dan kirim via WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Download PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim WA + PDF Nota</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCUMENT CONTENT TO PRINT */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" ref={printRef} id="printable-invoice">

          {/* Print specific CSS rule */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-invoice, #printable-invoice * {
                visibility: visible;
              }
              #printable-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
                background: white !important;
                color: black !important;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}</style>

          {/* 1. KOP SURAT BIMBEL */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl tracking-wider">
                BPA
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  BIMBEL PRIVAT ACADEMIA
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Lembaga Bimbingan Belajar & Privat Profesional
                </p>
                <p className="text-[11px] text-slate-500">
                  Jl. Pendidikan No. 88, Kota Malang • Hotline WA: 0812-3456-7890 • email: admin@bimbelacademia.com
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 text-slate-900 font-extrabold text-xs px-3 py-1 rounded-lg uppercase tracking-wider">
                NOTA PENAGIHAN SPP
              </div>
              {invoice.isRevised && (
                <div className="mt-1">
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" /> REVISI ADMIN
                  </span>
                </div>
              )}
              <div className="text-xs font-bold text-slate-700 mt-1">
                No. {invoice.invoiceNumber}
              </div>
              <div className="text-[11px] text-slate-500">
                Tgl Terbit: {invoice.createdAt || new Date().toISOString().substring(0, 10)}
                {invoice.revisedAt && <span> • Revised: {invoice.revisedAt}</span>}
              </div>
            </div>
          </div>

          {/* 2. INFORMASI TAGIHAN & SISWA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>INFORMASI SISWA & WALI</span>
              </div>
              <div><span className="text-slate-500">Nama Siswa:</span> <strong className="text-slate-900">{student?.name || 'Siswa'}</strong></div>
              <div><span className="text-slate-500">Jenjang / Kelas:</span> <strong>{student?.grade} - {student?.className}</strong></div>
              <div><span className="text-slate-500">Sekolah:</span> {student?.school || '-'}</div>
              <div><span className="text-slate-500">Orang Tua / Wali:</span> <strong>{student?.parentName}</strong></div>
              <div><span className="text-slate-500">No. WhatsApp Wali:</span> {student?.parentWA}</div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>STATUS STATUS & JATUH TEMPO</span>
              </div>
              <div><span className="text-slate-500">Jatuh Tempo Pembayaran:</span> <strong className="text-rose-700">{invoice.dueDate}</strong></div>
              <div>
                <span className="text-slate-500">Status Invoice:</span>{' '}
                <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                  invoice.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
              <div><span className="text-slate-500">Total Sesi / Token Terpakai:</span> <strong>{sessionCount} Sesi Belajar</strong></div>
              <div><span className="text-slate-500">Tarif SPP / Sesi:</span> {formatRupiah(ratePerSession)}</div>
            </div>
          </div>

          {/* 3. RINCIAN TABEL ITEM SPP */}
          <div>
            <div className="font-extrabold text-xs text-slate-900 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>RINCIAN BIAYA SPP BIMBEL & NOMINAL TAMBAHAN</span>
              </span>
              {tutorBreakdown.length > 1 && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                  Diajar oleh {tutorBreakdown.length} Tentor
                </span>
              )}
            </div>
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2.5 border-r border-slate-300">Deskripsi Layanan & Tentor Pengajar</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Jumlah Sesi</th>
                  <th className="p-2.5 border-r border-slate-300 text-right">Tarif Satuan</th>
                  <th className="p-2.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {tutorBreakdown.length > 0 ? (
                  tutorBreakdown.map((tb) => (
                    <tr key={tb.tutorId}>
                      <td className="p-2.5 border-r border-slate-300 font-semibold text-slate-900">
                        Bimbingan Belajar Privat — <span className="text-indigo-950 font-bold">Tentor {tb.tutorName}</span>
                        {tb.dates.length > 0 && (
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Tanggal Mengajar: {tb.dates.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-300 text-center font-bold">
                        {tb.sessionCount} Sesi
                      </td>
                      <td className="p-2.5 border-r border-slate-300 text-right">
                        {formatRupiah(ratePerSession)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatRupiah(tb.subtotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-2.5 border-r border-slate-300 font-semibold text-slate-900">
                      Bimbingan Belajar Privat (Sesi Pertemuan Periode Bulan Ini)
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-center font-bold">
                      {sessionCount} Sesi
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-right">
                      {formatRupiah(ratePerSession)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {formatRupiah(subtotalSpp)}
                    </td>
                  </tr>
                )}
                {additionalAmount > 0 && (
                  <tr className="bg-amber-50/50">
                    <td className="p-2.5 border-r border-slate-300 font-semibold text-amber-950">
                      Biaya / Cas Tambahan: {additionalNotes || 'Denda keterlambatan / Perlengkapan tentor'}
                      {additionalTutorName && (
                        <span className="ml-1.5 text-[10px] font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300">
                          (Tentor {additionalTutorName})
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-center font-bold text-amber-900">
                      1 Item
                    </td>
                    <td className="p-2.5 border-r border-slate-300 text-right text-amber-900">
                      {formatRupiah(additionalAmount)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-amber-900">
                      +{formatRupiah(additionalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="p-2 border-r border-slate-300 text-right">Total Tagihan Akhir:</td>
                  <td className="p-2 text-right font-black text-slate-900 text-sm">{formatRupiah(totalAmount)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-2 border-r border-slate-300 text-right text-emerald-700">Sudah Dibayar:</td>
                  <td className="p-2 text-right font-bold text-emerald-700">{formatRupiah(invoice.amountPaid)}</td>
                </tr>
                <tr className="bg-emerald-50">
                  <td colSpan={3} className="p-2 border-r border-slate-300 text-right text-emerald-900 font-extrabold">SISA KEKURANGAN TAGIHAN:</td>
                  <td className="p-2 text-right font-black text-emerald-800 text-sm">{formatRupiah(totalAmount - (invoice.amountPaid || 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. SEKSI RAPOR / HASIL PEMBELAJARAN 1 BULAN */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-emerald-50/60 p-4 rounded-xl border border-indigo-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-indigo-200 pb-2 gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-700" />
                <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wide">
                  RAPOR HASIL PEMBELAJARAN SISWA (BULAN INI)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Total Kehadiran: {totalHadir} Sesi
                </span>
                {tutorBreakdown.map(tb => (
                  <span key={tb.tutorId} className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Tentor {tb.tutorName}: {tb.sessionCount} Sesi
                  </span>
                ))}
              </div>
            </div>

            {studentAttendances.length > 0 ? (
              <div className="space-y-2">
                <table className="w-full text-left text-[11px] border-collapse bg-white rounded-lg overflow-hidden border border-slate-200">
                  <thead className="bg-indigo-900 text-white font-bold">
                    <tr>
                      <th className="p-2 w-24">Tanggal</th>
                      <th className="p-2 w-32">Tentor Pengajar</th>
                      <th className="p-2">Materi Pembelajaran</th>
                      <th className="p-2">Catatan Perkembangan Siswa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {studentAttendances.map((att) => (
                      <tr key={att.id} className="hover:bg-indigo-50/30">
                        <td className="p-2 font-bold text-slate-800 whitespace-nowrap">{att.date}</td>
                        <td className="p-2 font-semibold text-indigo-950">{tutorMap.get(att.tutorId) || 'Tentor'}</td>
                        <td className="p-2 text-slate-800 font-medium">{att.materialCovered}</td>
                        <td className="p-2 text-slate-600">{att.progressNotes || 'Memahami materi dengan sangat baik.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <p className="font-bold text-slate-800">Catatan Ringkasan Akademik Tentor:</p>
                <p className="mt-1 italic">
                  "Siswa {student?.name} menunjukkan motivasi belajar yang sangat tinggi. Pemahaman konsep dasar mata pelajaran telah berkembang pesat dan sangat siap menghadapi ujian sekolah."
                </p>
              </div>
            )}
          </div>

          {/* 5. METODE PEMBAYARAN & REKENING RESMI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 mb-1">💳 Rekening Pembayaran Resmi Bimbel:</div>
              <div className="font-mono text-[11px]">
                <div>• <strong>Bank BCA:</strong> 1234-5678-90 (a.n Bimbel Privat Academia)</div>
                <div>• <strong>Bank Mandiri:</strong> 9876-5432-10 (a.n Bimbel Privat Academia)</div>
                <div>• <strong>QRIS / E-Wallet:</strong> DANA / OVO (0812-3456-7890)</div>
              </div>
            </div>

            {/* Tanda Tangan & Stempel Digital */}
            <div className="flex justify-end items-center gap-6 pr-4">
              <div className="text-center space-y-1">
                <p className="text-[10px] text-slate-500">Malang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-900 text-xs">Management Bimbel Privat</p>
                <div className="h-12 flex items-center justify-center my-1">
                  <div className="border-2 border-indigo-800 text-indigo-800 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest rotate-[-5deg] opacity-80">
                    ★ LUNAS / VERIFIED ★
                  </div>
                </div>
                <p className="font-extrabold text-slate-800 text-xs text-underline">Koordinator Akademik</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-medium">
            Dokumen ini diterbitkan secara otomatis oleh Sistem Management ERP Bimbel Privat Academia. Valid tanpa tanda tangan basah.
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Download PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim WA + PDF Nota</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
