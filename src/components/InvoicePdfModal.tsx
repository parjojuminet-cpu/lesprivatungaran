import React, { useRef, useState } from 'react';
import { Invoice, Student, Attendance, Tutor } from '../types';
import { getStudentTutorBreakdown } from '../utils/tutorBreakdown';
import {
  X, Printer, Send, FileText, CheckCircle2,
  Calendar, Award, BookOpen, User, Building2, Wallet, Share2, Users, Download, Image as ImageIcon, Loader2
} from 'lucide-react';
import { toJpeg } from 'html-to-image';

// @ts-ignore
import invoiceLogo from '../assets/images/invoice_logo_1783502513743.jpg';
// @ts-ignore
import invoiceStamp from '../assets/images/invoice_stamp_new_1783514910353.jpg';
// @ts-ignore
import invoiceSosmed from '../assets/images/invoice_sosmed_1783502546137.jpg';

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
  const [isGeneratingJpg, setIsGeneratingJpg] = useState(false);

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

  // High-resolution JPG download via html-to-image
  const handleDownloadJpg = () => {
    if (printRef.current === null) return;
    setIsGeneratingJpg(true);

    // Render with 2x pixel ratio for crystal clear text on mobile/WhatsApp
    toJpeg(printRef.current, {
      quality: 0.98,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        const safeName = (student?.name || 'Siswa').replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `Nota_${invoice.invoiceNumber}_${safeName}.jpg`;
        link.href = dataUrl;
        link.click();
        setIsGeneratingJpg(false);
      })
      .catch((err) => {
        console.error('Gagal membuat gambar JPG:', err);
        alert('Gagal mendownload gambar. Silakan gunakan tombol "Cetak / Simpan PDF" sebagai alternatif.');
        setIsGeneratingJpg(false);
      });
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

    const message = `Yth. Bapak/Ibu *${student.parentName}* (Orang Tua dari *${student.name}*),\n\nSalam hangat dari Management *Les Privat Ungaran*.\n\nBerikut kami lampirkan *Nota Penagihan SPP & Rincian Presensi Tentor* an. *${student.name}* (${student.grade} - ${student.school}) per tanggal ${dateNow}:\n\n🧾 *DETAIL NOTA TAGIHAN SPP*\n• No. Invoice: *${invoice.invoiceNumber}*\n• Total Sesi Terpakai: *${sessionCount} Sesi*\n\n👥 *RINCIAN SESI PER TENTOR PENGAJAR*:\n${tutorBreakdownLines}${additionalText}\n\n• *Total Tagihan Akhir*: *${formatRupiah(totalAmount)}*\n• Jumlah Terbayar: *${formatRupiah(invoice.amountPaid)}*\n• Sisa Kekurangan: *${formatRupiah(remaining)}*\n• Status Pembayaran: *${invoice.status.toUpperCase()}*\n• Jatuh Tempo: *${invoice.dueDate}*\n\n📚 *RINCIAN ABSENSI & JADWAL PENGAJARAN TENTOR*\n${recentMaterials || '  (Siswa mengikuti seluruh sesi dengan sangat antusias)'}\n\n💳 *REKENING PEMBAYARAN RESMI*\n• BNI: *1794373083* a.n LES PRIVAT UNGARAN\n• BRI: *609501001575508* a.n LES PRIVAT UNGARAN\n\n📄 *Dokumen Nota Penagihan & Rapor Gambar/PDF lengkap* dapat diunduh/dicetak dari sistem atau diminta ke Admin.\n\nMohon konfirmasi jika pembayaran telah dilakukan. Terima kasih atas kepercayaan Bapak/Ibu! 🙏✨`;

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
              <h3 className="font-bold text-xs sm:text-sm">Nota & Rapor Pembelajaran</h3>
              <p className="text-[10px] text-slate-400">Desain profesional siap kirim ke WhatsApp / Orang Tua</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownloadJpg}
              disabled={isGeneratingJpg}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {isGeneratingJpg ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
              <span>{isGeneratingJpg ? 'Memproses...' : 'Unduh JPG'}</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Simpan PDF / Cetak</span>
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
                padding: 24px;
                background: white !important;
                color: black !important;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}</style>

          {/* 1. KOP SURAT BIMBEL */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 pb-6 border-b-4 border-double border-slate-900">
            {/* Left Brand Identity */}
            <div className="flex items-center gap-4">
              <div className="p-1 bg-white border border-slate-200 rounded-2xl shadow-xs shrink-0">
                <img
                  src={invoiceLogo}
                  alt="Les Privat Ungaran Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
                  LES PRIVAT <span className="text-emerald-600">UNGARAN</span>
                </h1>
                <p className="text-xs font-bold text-slate-700 tracking-wide">
                  Lembaga Bimbingan Belajar & Privat Profesional Terpercaya
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-0.5">📍 Semarang - Ungaran</span>
                  <span className="flex items-center gap-0.5">💬 WA: 0857-2770-7500</span>
                  <span className="flex items-center gap-0.5">📸 @lesprivat_ungaran</span>
                </div>
              </div>
            </div>

            {/* Right Invoice Meta Card */}
            <div className="w-full md:w-auto flex flex-col justify-between items-start md:items-end text-left md:text-right">
              <div className="bg-slate-900 text-white rounded-xl px-4 py-2 border border-slate-800 inline-block shadow-sm">
                <span className="text-[9px] font-black tracking-widest uppercase block text-emerald-400">Nota Penagihan SPP</span>
                <span className="text-sm font-mono font-bold tracking-tight">No. {invoice.invoiceNumber}</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <div>Tanggal Terbit: <strong className="text-slate-800 font-semibold">{invoice.createdAt || new Date().toISOString().substring(0, 10)}</strong></div>
                <div>Jatuh Tempo: <strong className="text-rose-600 font-bold">{invoice.dueDate}</strong></div>
                {invoice.isRevised && (
                  <span className="mt-1 bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" /> REVISI ADMIN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. INFORMASI TAGIHAN & SISWA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Siswa & Orang Tua Card */}
            <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-100 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-indigo-100 pb-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-[11px] text-indigo-950 uppercase tracking-wider">Penerima Tagihan (Siswa & Wali)</h3>
              </div>
              <div className="grid grid-cols-3 text-xs gap-y-1.5 gap-x-1">
                <span className="text-slate-500 font-medium">Nama Siswa</span>
                <span className="col-span-2 text-slate-900 font-extrabold">: {student?.name || 'Siswa'}</span>
                
                <span className="text-slate-500 font-medium">Kelas / Jenjang</span>
                <span className="col-span-2 text-slate-800 font-bold">: {student?.grade} ({student?.className || '-'})</span>
                
                <span className="text-slate-500 font-medium">Sekolah</span>
                <span className="col-span-2 text-slate-800 font-medium">: {student?.school || '-'}</span>

                <span className="text-slate-500 font-medium">Orang Tua / Wali</span>
                <span className="col-span-2 text-slate-900 font-bold">: {student?.parentName || '-'}</span>
                
                <span className="text-slate-500 font-medium">WhatsApp Wali</span>
                <span className="col-span-2 text-slate-800 font-medium">: {student?.parentWA || '-'}</span>
              </div>
            </div>

            {/* Status & Ringkasan Sesi Card */}
            <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100/80 space-y-2.5">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-extrabold text-[11px] text-emerald-950 uppercase tracking-wider">Rangkuman Sesi & Status</h3>
              </div>
              <div className="grid grid-cols-3 text-xs gap-y-1.5 gap-x-1">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="col-span-2">
                  : <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider inline-block ${
                    invoice.status === 'Lunas'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {invoice.status}
                  </span>
                </span>

                <span className="text-slate-500 font-medium">Bulan / Sesi</span>
                <span className="col-span-2 text-slate-800 font-bold">: {sessionCount} Sesi Pertemuan</span>

                <span className="text-slate-500 font-medium">Tarif Sesi</span>
                <span className="col-span-2 text-slate-800 font-semibold">: {formatRupiah(ratePerSession)} / sesi</span>

                <span className="text-slate-500 font-medium">Jatuh Tempo</span>
                <span className="col-span-2 text-rose-700 font-extrabold">: {invoice.dueDate}</span>
              </div>
            </div>
          </div>

          {/* 3. RINCIAN TABEL ITEM SPP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" /> Rincian Biaya Bimbingan Belajar
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-3xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3">Layanan & Tentor Pengajar</th>
                    <th className="p-3 text-center w-24">Sesi</th>
                    <th className="p-3 text-right w-32">Tarif</th>
                    <th className="p-3 text-right w-36">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {tutorBreakdown.length > 0 ? (
                    tutorBreakdown.map((tb) => (
                      <tr key={tb.tutorId} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-950">Bimbingan Belajar Privat</div>
                          <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Tentor: {tb.tutorName}</div>
                          {tb.dates.length > 0 && (
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5 max-w-sm leading-relaxed">
                              Tanggal: {tb.dates.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-extrabold text-slate-900 text-sm">
                          {tb.sessionCount}
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {formatRupiah(ratePerSession)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-950 text-sm">
                          {formatRupiah(tb.subtotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-950">Bimbingan Belajar Privat</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">Seluruh Sesi Pertemuan Bulan Ini</div>
                      </td>
                      <td className="p-3 text-center font-extrabold text-slate-900 text-sm">
                        {sessionCount}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {formatRupiah(ratePerSession)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-950 text-sm">
                        {formatRupiah(subtotalSpp)}
                      </td>
                    </tr>
                  )}

                  {additionalAmount > 0 && (
                    <tr className="bg-amber-50/40">
                      <td className="p-3">
                        <div className="font-bold text-amber-950">Biaya / Cas Tambahan</div>
                        <div className="text-[10px] text-amber-800 font-medium mt-0.5">{additionalNotes || 'Kebutuhan belajar / modul / perlengkapan'}</div>
                        {additionalTutorName && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Tutor: {additionalTutorName}</div>
                        )}
                      </td>
                      <td className="p-3 text-center font-extrabold text-amber-900">
                        1
                      </td>
                      <td className="p-3 text-right text-amber-800">
                        {formatRupiah(additionalAmount)}
                      </td>
                      <td className="p-3 text-right font-extrabold text-amber-900 text-sm">
                        +{formatRupiah(additionalAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                
                {/* Footer Totals */}
                <tbody className="bg-slate-50 border-t-2 border-slate-300 font-bold divide-y divide-slate-100">
                  <tr>
                    <td colSpan={3} className="p-2.5 text-right text-slate-500 font-semibold">Total Tagihan SPP:</td>
                    <td className="p-2.5 text-right font-extrabold text-slate-900 text-sm">{formatRupiah(totalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-2.5 text-right text-emerald-700 font-semibold">Sudah Dibayar:</td>
                    <td className="p-2.5 text-right font-extrabold text-emerald-700 text-sm">{formatRupiah(invoice.amountPaid)}</td>
                  </tr>
                  <tr className="bg-emerald-100/80">
                    <td colSpan={3} className="p-3 text-right text-emerald-950 font-black uppercase tracking-wider text-xs">Sisa Kekurangan Pembayaran:</td>
                    <td className="p-3 text-right font-black text-emerald-800 text-base">{formatRupiah(totalAmount - (invoice.amountPaid || 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. SEKSI RAPOR / HASIL PEMBELAJARAN 1 BULAN */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-700" />
                <h3 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">
                  Rapor & Ringkasan Hasil Belajar Siswa (Periode ini)
                </h3>
              </div>
              <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                Total Hadir: {totalHadir} Sesi
              </span>
            </div>

            {studentAttendances.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-indigo-950 text-white font-bold text-[10px] uppercase tracking-wider">
                      <th className="p-2.5 w-24">Tanggal</th>
                      <th className="p-2.5 w-32">Tentor</th>
                      <th className="p-2.5">Materi Bimbingan</th>
                      <th className="p-2.5">Catatan & Perkembangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {studentAttendances.map((att) => (
                      <tr key={att.id} className="hover:bg-indigo-50/20">
                        <td className="p-2.5 font-bold text-slate-800 whitespace-nowrap">{att.date}</td>
                        <td className="p-2.5 font-semibold text-indigo-950">{tutorMap.get(att.tutorId) || 'Tentor'}</td>
                        <td className="p-2.5 text-slate-800 font-medium leading-relaxed">{att.materialCovered}</td>
                        <td className="p-2.5 text-slate-600 leading-relaxed italic">{att.progressNotes || 'Memahami materi bimbingan dengan sangat baik.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  📝 Catatan Perkembangan Siswa:
                </p>
                <p className="italic leading-relaxed">
                  "Siswa {student?.name} menunjukkan motivasi belajar yang sangat tinggi selama bimbingan. Pemahaman konsep-konsep dasar mata pelajaran berkembang pesat dan siswa menunjukkan kesiapan akademis yang sangat prima."
                </p>
              </div>
            )}
          </div>

          {/* 5. METODE PEMBAYARAN & REKENING RESMI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-center">
            {/* Rekening Pembayaran */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                💳 Rekening Resmi Pembayaran SPP:
              </div>
              <div className="font-mono text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">BANK BNI</span>
                    <strong>1794373083</strong>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-sans">a.n LES PRIVAT UNGARAN</span>
                </div>
                
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">BANK BRI</span>
                    <strong>609501001575508</strong>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-sans">a.n LES PRIVAT UNGARAN</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1 font-sans">
                  ✓ Mohon kirimkan foto/screenshoot bukti transfer ke Admin WA.
                </div>
              </div>
            </div>

            {/* Tanda Tangan & Stempel Digital */}
            <div className="flex justify-center md:justify-end items-center pr-2 md:pr-6">
              <div className="text-center space-y-1 relative w-56">
                <p className="text-[10px] text-slate-500">Ungaran, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-900 text-xs">Pimpinan Les Privat Ungaran</p>
                
                {/* Stempel Area with highly proportional absolute overlapping signature lines */}
                <div className="h-24 relative flex items-center justify-center my-1 select-none">
                  <img
                    src={invoiceStamp}
                    alt="Stempel & Tanda Tangan Resmi"
                    className="w-28 h-28 object-contain mix-blend-multiply pointer-events-none opacity-95"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <p className="font-extrabold text-slate-800 text-xs underline decoration-2 decoration-emerald-500/50">Admin Keuangan</p>
              </div>
            </div>
          </div>

          {/* Social Media Banner */}
          <div className="pt-3 border-t-2 border-dashed border-slate-200">
            <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-indigo-50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-100 shadow-3xs">
              <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
                <span className="text-[11px] font-extrabold text-indigo-700 tracking-wider uppercase">Hubungi & Ikuti Kami</span>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-700 shadow-3xs">
                    <span className="text-emerald-500 text-xs">📞</span> WA: 0857-2770-7500
                  </span>
                  <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-700 shadow-3xs">
                    <span className="text-pink-500 text-xs">📸</span> IG: @lesprivat_ungaran
                  </span>
                  <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-slate-200 text-[10px] font-bold text-slate-700 shadow-3xs">
                    <span className="text-blue-600 text-xs">📘</span> FB: Les Privat Ungaran
                  </span>
                </div>
              </div>
              
              <div className="shrink-0 transition-all duration-300 hover:scale-105">
                <img
                  src={invoiceSosmed}
                  alt="Social Media Les Privat"
                  className="h-16 md:h-20 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-medium">
            Dokumen ini diterbitkan secara otomatis oleh Sistem Management ERP Les Privat Ungaran. Valid tanpa tanda tangan basah.
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
              onClick={handleDownloadJpg}
              disabled={isGeneratingJpg}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-70"
            >
              {isGeneratingJpg ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingJpg ? 'Memproses...' : 'Unduh Gambar JPG'}</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim WA + Ringkasan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

