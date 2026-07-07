import { loadErpJsonDatabase, ErpDatabaseJson } from './jsonStorage';

// Helper to sanitize cell values for CSV / Excel HTML
function escapeCell(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
  return String(val).replace(/"/g, '""');
}

// Export as HTML Excel (.xls) file which opens natively as formatted tables in MS Excel / Calc
export function exportDatabaseToExcelXls(dbData?: ErpDatabaseJson): void {
  const db = dbData || loadErpJsonDatabase();
  const dateStr = new Date().toISOString().substring(0, 10);

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Data Siswa</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
            <x:ExcelWorksheet>
              <x:Name>Data Tentor</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
            <x:ExcelWorksheet>
              <x:Name>Keuangan & SPP</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
            <x:ExcelWorksheet>
              <x:Name>Presensi & Mengajar</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; }
        h2 { color: #1e293b; font-size: 16px; margin-top: 20px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 30px; font-size: 12px; }
        th { background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #1d4ed8; text-align: left; }
        td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .number { text-align: right; }
        .badge { font-weight: bold; color: #047857; }
      </style>
    </head>
    <body>
      <div style="background-color: #0f172a; color: #ffffff; padding: 15px; border-radius: 8px;">
        <h1 style="margin:0; font-size: 20px;">Laporan Ringkasan Database ERP Bimbel Privat</h1>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #cbd5e1;">Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}</p>
      </div>

      <!-- TABLE 1: DATA SISWA -->
      <h2>1. DATA SISWA & PAKET SPP</h2>
      <table>
        <thead>
          <tr>
            <th>ID Siswa</th>
            <th>Nama Siswa</th>
            <th>Jenjang</th>
            <th>Kelas</th>
            <th>Sekolah</th>
            <th>Wali Murid</th>
            <th>No. WA Wali</th>
            <th>Mata Pelajaran</th>
            <th>Sisa Sesi</th>
            <th>Tarif Per Sesi (Rp)</th>
            <th>Status Paket</th>
          </tr>
        </thead>
        <tbody>
          ${db.students.map(s => `
            <tr>
              <td>${s.id}</td>
              <td><b>${s.name}</b></td>
              <td>${s.grade}</td>
              <td>${s.className || '-'}</td>
              <td>${s.school || '-'}</td>
              <td>${s.parentName || '-'}</td>
              <td>'${s.parentWA || '-'}</td>
              <td>${Array.isArray(s.subjects) ? s.subjects.join(', ') : '-'}</td>
              <td class="number">${s.remainingSessions} / ${s.totalPackageSessions}</td>
              <td class="number">${(s.ratePerSession || 0).toLocaleString('id-ID')}</td>
              <td class="badge">${s.packageStatus || 'Aktif'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TABLE 2: DATA TENTOR -->
      <h2>2. DATA TENTOR & PENGAJAR</h2>
      <table>
        <thead>
          <tr>
            <th>ID Tentor</th>
            <th>Nama Tentor</th>
            <th>No. WA</th>
            <th>Sistem Gaji</th>
            <th>Honor Per Sesi (Rp)</th>
            <th>Mata Pelajaran Master</th>
            <th>Wilayah Kerja</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${db.tutors.map(t => `
            <tr>
              <td>${t.id}</td>
              <td><b>${t.name}</b></td>
              <td>'${t.wa || '-'}</td>
              <td>${t.salarySystem || 'Per Pertemuan'}</td>
              <td class="number">${(t.ratePerSession || 0).toLocaleString('id-ID')}</td>
              <td>${Array.isArray(t.subjects) ? t.subjects.join(', ') : '-'}</td>
              <td>${Array.isArray(t.workingArea) ? t.workingArea.join(', ') : '-'}</td>
              <td>${t.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TABLE 3: KEUANGAN -->
      <h2>3. LAPORAN TRANSAKSI KEUANGAN & PEMBAYARAN</h2>
      <table>
        <thead>
          <tr>
            <th>ID Transaksi</th>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Kategori</th>
            <th>Keterangan</th>
            <th>Nominal (Rp)</th>
            <th>Dibuat Oleh</th>
          </tr>
        </thead>
        <tbody>
          ${db.finance.map(f => `
            <tr>
              <td>${f.id}</td>
              <td>${f.date}</td>
              <td><b>${f.type}</b></td>
              <td>${f.category}</td>
              <td>${f.description}</td>
              <td class="number">${(f.amount || 0).toLocaleString('id-ID')}</td>
              <td>${f.createdBy}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TABLE 4: PRESENSI -->
      <h2>4. CATATAN PRESENSI & JURNAL MENGAJAR</h2>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>ID Tentor</th>
            <th>ID Siswa</th>
            <th>Materi Diberikan</th>
            <th>Catatan Perkembangan</th>
            <th>Status Presensi</th>
          </tr>
        </thead>
        <tbody>
          ${db.attendances.map(a => `
            <tr>
              <td>${a.date}</td>
              <td>${a.tutorId}</td>
              <td>${a.studentId}</td>
              <td>${a.materialCovered || '-'}</td>
              <td>${a.progressNotes || '-'}</td>
              <td class="badge">${a.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ERP_Bimbel_Tabel_Laporan_${dateStr}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export specific table module as CSV
export function exportTableToCSV(tableName: string, data: any[]): void {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const keys = Object.keys(data[0]);
  const csvRows = [];

  // Header row
  csvRows.push(keys.map(k => `"${escapeCell(k)}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = keys.map(k => `"${escapeCell(row[k])}"`);
    csvRows.push(values.join(','));
  }

  const csvString = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().substring(0, 10);
  a.download = `ERP_Bimbel_${tableName}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate Printable Document (PDF ready via browser Print to PDF)
export function exportPrintablePDFReport(title: string = 'Laporan Lengkap ERP Bimbel Privat', dbData?: ErpDatabaseJson): void {
  const db = dbData || loadErpJsonDatabase();
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Mohon izinkan pop-up browser untuk mencetak atau menyimpan dokumen PDF.');
    return;
  }

  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
        .brand-title { font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 0; }
        .brand-sub { font-size: 11px; color: #64748b; margin: 2px 0 0 0; }
        .doc-meta { text-align: right; font-size: 10px; color: #475569; }
        
        .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; }
        .card-label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: bold; }
        .card-val { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 4px; }

        h2 { font-size: 13px; color: #1e3a8a; border-left: 4px solid #2563eb; padding-left: 8px; margin: 20px 0 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th { background: #1e293b; color: #ffffff; font-weight: bold; text-align: left; padding: 6px 8px; font-size: 10px; border: 1px solid #0f172a; }
        td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 15px; border-top: 1px solid #e2e8f0; }
        .signature-box { text-align: center; width: 180px; }
        .signature-space { height: 50px; }
        
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background: #eff6ff; padding: 12px; border: 1px solid #bfdbfe; border-radius: 6px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; color: #1e40af;">Gunakan opsi "Save as PDF" (Simpan sebagai PDF) di jendela dialog cetak browser Anda.</span>
        <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">Cetak / Simpan PDF</button>
      </div>

      <div class="header">
        <div>
          <h1 class="brand-title">ERP BIMBEL PRIVAT</h1>
          <p class="brand-sub">Sistem Operasional, Presensi & Manajemen Keuangan Bimbel</p>
        </div>
        <div class="doc-meta">
          <div><strong>Laporan Resmi Manajemen</strong></div>
          <div>Tanggal: ${dateStr}</div>
          <div>Dokumen: Digital PDF Table</div>
        </div>
      </div>

      <div class="summary-cards">
        <div class="card">
          <div class="card-label">Total Siswa Aktif</div>
          <div class="card-val">${db.students.length} Siswa</div>
        </div>
        <div class="card">
          <div class="card-label">Total Tentor</div>
          <div class="card-val">${db.tutors.length} Pengajar</div>
        </div>
        <div class="card">
          <div class="card-label">Total Transaksi</div>
          <div class="card-val">${db.finance.length} Catatan</div>
        </div>
        <div class="card">
          <div class="card-label">Presensi Selesai</div>
          <div class="card-val">${db.attendances.length} Pertemuan</div>
        </div>
      </div>

      <h2>1. REKAPITULASI DATA SISWA & PAKET BELAJAR</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Nama Siswa</th>
            <th>Jenjang & Kelas</th>
            <th>Wali Murid & Kontak</th>
            <th class="text-center">Sisa Sesi</th>
            <th class="text-right">Tarif / Sesi</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${db.students.map((s, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${s.name}</strong></td>
              <td>${s.grade} - ${s.className || 'Reguler'}</td>
              <td>${s.parentName || '-'} (${s.parentWA || '-'})</td>
              <td class="text-center">${s.remainingSessions} / ${s.totalPackageSessions}</td>
              <td class="text-right">Rp ${(s.ratePerSession || 0).toLocaleString('id-ID')}</td>
              <td class="text-center">${s.packageStatus || 'Aktif'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>2. DAFTAR TENTOR & TARIF PENGAJARAN</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Nama Tentor</th>
            <th>No. Whatsapp</th>
            <th>Mata Pelajaran Master</th>
            <th>Sistem Gaji</th>
            <th class="text-right">Honor / Sesi</th>
          </tr>
        </thead>
        <tbody>
          ${db.tutors.map((t, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${t.name}</strong></td>
              <td>${t.wa || '-'}</td>
              <td>${Array.isArray(t.subjects) ? t.subjects.join(', ') : '-'}</td>
              <td>${t.salarySystem || 'Per Pertemuan'}</td>
              <td class="text-right">Rp ${(t.ratePerSession || 0).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>3. RINGKASAN REKAPITULASI KEUANGAN</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Kategori</th>
            <th>Uraian Transaksi</th>
            <th class="text-right">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${db.finance.map((f, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td>${f.date}</td>
              <td><strong>${f.type}</strong></td>
              <td>${f.category}</td>
              <td>${f.description}</td>
              <td class="text-right">Rp ${(f.amount || 0).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>
          <p style="margin: 0; font-size: 9px; color: #94a3b8;">Diunduh & Dicetak Otomatis dari ERP Bimbel Privat v2.5 (JSON DB)</p>
        </div>
        <div class="signature-box">
          <p style="margin: 0;">Super Administrator / Manajemen</p>
          <div class="signature-space"></div>
          <p style="margin: 0; font-weight: bold; border-top: 1px solid #94a3b8; padding-top: 4px;">( Administrator / Manajemen )</p>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
}
