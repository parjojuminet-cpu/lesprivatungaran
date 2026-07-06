import { getAccessToken } from './googleAuth';

export interface SheetSyncStatus {
  syncStatus: 'Synced' | 'Syncing' | 'Error' | 'NotConnected';
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastSyncTime?: string;
  errorMessage?: string;
}

async function parseResponseJson(res: Response, fallbackErrorMessage: string): Promise<any> {
  const text = await res.text();
  let json: any = null;
  
  if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const apiError = json?.error?.message || json?.message || (text.length < 200 && text ? text : null);
    if (res.status === 401) {
      throw new Error('Akses Google Sheets ditolak (401 Unauthorized). Silakan klik tombol "Login Google Workspace" ulang.');
    } else if (res.status === 403) {
      throw new Error('Izin Spreadsheet ditolak (403 Forbidden). Pastikan akun Google Anda memiliki akses edit ke file Spreadsheet tersebut.');
    } else if (res.status === 404) {
      throw new Error('Spreadsheet tidak ditemukan (404 Not Found). Periksa kembali Spreadsheet ID atau URL yang Anda masukkan.');
    }
    throw new Error(apiError || `${fallbackErrorMessage} (HTTP ${res.status})`);
  }

  if (!json) {
    throw new Error(`Respon server tidak valid atau bukan format JSON.`);
  }

  return json;
}

export const createErpSpreadsheet = async (accessToken: string): Promise<{ id: string; url: string }> => {
  const body = {
    properties: {
      title: 'ERP Bimbel Privat - Database Live Cloud'
    },
    sheets: [
      { properties: { title: 'Siswa' } },
      { properties: { title: 'Tentor' } },
      { properties: { title: 'Jadwal' } },
      { properties: { title: 'Absensi' } },
      { properties: { title: 'Tagihan_SPP' } },
      { properties: { title: 'Keuangan' } },
      { properties: { title: 'Gaji_Tentor' } },
      { properties: { title: 'Persetujuan' } },
      { properties: { title: 'Audit_Log' } },
      { properties: { title: 'Modul' } }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await parseResponseJson(res, 'Gagal membuat Google Spreadsheet baru');
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`
  };
};

export const syncErpDataToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  appData: {
    students: any[];
    tutors: any[];
    schedules: any[];
    attendances: any[];
    invoices: any[];
    finances: any[];
    tutorSalaries: any[];
    approvals: any[];
    auditLogs: any[];
    modules: any[];
  }
) => {
  const studentsList = appData.students || [];
  const tutorsList = appData.tutors || [];
  const schedulesList = appData.schedules || [];
  const attendancesList = appData.attendances || [];
  const invoicesList = appData.invoices || [];
  const financesList = appData.finances || [];
  const tutorSalariesList = appData.tutorSalaries || [];
  const approvalsList = appData.approvals || [];
  const auditLogsList = appData.auditLogs || [];
  const modulesList = appData.modules || [];

  const prepareSheetValueData = () => {
    return [
      {
        range: 'Siswa!A1',
        values: [
          ['ID', 'Nama Siswa', 'Jenis Kelamin', 'Kelas', 'Sekolah', 'Wali', 'HP Wali (WA)', 'Mata Pelajaran', 'Tarif/Sesi (Rp)', 'Status Paket', 'Sisa Sesi', 'Status'],
          ...studentsList.map(s => [
            s.id || '',
            s.name || '',
            s.gender || '-',
            s.grade || '-',
            s.school || '-',
            s.parentName || '-',
            s.parentWA || '-',
            Array.isArray(s.subjects) ? s.subjects.join(', ') : (s.subjects || '-'),
            s.ratePerSession || 0,
            s.packageStatus || 'Aktif',
            s.remainingSessions ?? 0,
            s.status || 'Aktif'
          ])
        ]
      },
      {
        range: 'Tentor!A1',
        values: [
          ['ID', 'Nama Tentor', 'Mata Pelajaran', 'HP / WA', 'Area Kerja', 'Sistem Gaji', 'Tarif/Sesi (Rp)', 'Rating', 'Status'],
          ...tutorsList.map(t => [
            t.id || '',
            t.name || '',
            Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subjects || '-'),
            t.wa || '-',
            Array.isArray(t.workingArea) ? t.workingArea.join(', ') : (t.workingArea || '-'),
            t.salarySystem || 'Per Pertemuan',
            t.ratePerSession || 0,
            t.averageRating || 5,
            t.status || 'Aktif'
          ])
        ]
      },
      {
        range: 'Jadwal!A1',
        values: [
          ['ID', 'Siswa', 'Tentor', 'Mapel', 'Hari', 'Jam', 'Jenis Jadwal', 'Status'],
          ...schedulesList.map(sch => [
            sch.id || '',
            sch.studentName || sch.studentId || '',
            sch.tutorName || sch.tutorId || '',
            sch.subject || '-',
            sch.dayOfWeek || '-',
            sch.timeSlot || '-',
            sch.type || 'Jadwal Tetap',
            sch.status || 'Aktif'
          ])
        ]
      },
      {
        range: 'Absensi!A1',
        values: [
          ['ID', 'Tanggal', 'Tentor', 'Siswa', 'Mapel / Materi', 'Status Presensi', 'Catatan Progres', 'Foto Selfie', 'Waktu Server'],
          ...attendancesList.map(a => [
            a.id || '',
            a.date || '-',
            a.tutorName || a.tutorId || '',
            a.studentName || a.studentId || '',
            a.materialCovered || a.subject || '-',
            a.status || 'Hadir',
            a.progressNotes || '-',
            a.selfieUrl ? 'Ada Selfie Foto' : 'Tanpa Selfie',
            a.serverTime || '-'
          ])
        ]
      },
      {
        range: 'Tagihan_SPP!A1',
        values: [
          ['Nomor Tagihan', 'Siswa', 'Bulan / Periode', 'Total Tagihan (Rp)', 'Sudah Dibayar (Rp)', 'Jatuh Tempo', 'Status Tagihan'],
          ...invoicesList.map(inv => [
            inv.invoiceNumber || '',
            inv.studentName || inv.studentId || '',
            inv.monthPeriod || 'Juli 2026',
            inv.amount || 0,
            inv.amountPaid || 0,
            inv.dueDate || '-',
            inv.status || 'Belum Lunas'
          ])
        ]
      },
      {
        range: 'Keuangan!A1',
        values: [
          ['ID', 'Tanggal', 'Jenis Mutasi', 'Kategori', 'Jumlah (Rp)', 'Keterangan', 'Pencatat'],
          ...financesList.map(f => [
            f.id || '',
            f.date || '-',
            f.type || '-',
            f.category || '-',
            f.amount || 0,
            f.description || '-',
            f.createdBy || 'SYSTEM'
          ])
        ]
      },
      {
        range: 'Gaji_Tentor!A1',
        values: [
          ['ID', 'Tentor', 'Periode', 'Total Sesi', 'Total Honor (Rp)', 'Status Bayar', 'Tanggal Bayar'],
          ...tutorSalariesList.map(sal => [
            sal.id || '',
            sal.tutorName || sal.tutorId || '',
            sal.period || sal.monthYear || '-',
            sal.totalSessions || sal.totalAttendanceRate || 0,
            sal.totalAmount || sal.totalSalary || 0,
            sal.status || sal.paymentStatus || 'Pending',
            sal.paidAt || sal.paymentDate || '-'
          ])
        ]
      },
      {
        range: 'Persetujuan!A1',
        values: [
          ['ID', 'Jenis Pengajuan', 'Pemohon', 'Alasan', 'Catatan / Keputusan', 'Status', 'Disetujui Oleh'],
          ...approvalsList.map(appr => [
            appr.id || '',
            appr.type || '-',
            appr.requestedBy || '-',
            appr.reason || '-',
            appr.remarks || '-',
            appr.status || 'Pending',
            appr.approvedBy || '-'
          ])
        ]
      },
      {
        range: 'Audit_Log!A1',
        values: [
          ['Waktu', 'User', 'Aktivitas / Modul'],
          ...auditLogsList.map(log => [
            log.time || '-',
            log.user || 'SYSTEM',
            log.activity || log.details || '-'
          ])
        ]
      },
      {
        range: 'Modul!A1',
        values: [
          ['ID', 'Judul Modul', 'Mata Pelajaran', 'Jenjang', 'Link Google Drive', 'Pengunggah', 'Tanggal Upload'],
          ...modulesList.map(m => [
            m.id || '',
            m.title || '-',
            m.subject || '-',
            m.grade || '-',
            m.driveFileUrl || '-',
            m.uploadedBy || '-',
            m.uploadedAt || '-'
          ])
        ]
      }
    ];
  };

  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: prepareSheetValueData()
  };

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return await parseResponseJson(res, 'Gagal sinkronkan data ke Google Sheets');
};

export const pullErpDataFromSheet = async (accessToken: string, spreadsheetId: string) => {
  const ranges = [
    'Siswa!A2:L500',
    'Tentor!A2:I500',
    'Jadwal!A2:H500',
    'Absensi!A2:I500',
    'Tagihan_SPP!A2:G500',
    'Keuangan!A2:G500'
  ];

  const queryParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await parseResponseJson(res, 'Gagal menarik data dari Google Sheets');
  const valueRanges = data.valueRanges || [];

  const parseSheetRows = (rangeIndex: number) => {
    return valueRanges[rangeIndex]?.values || [];
  };

  const studentsRows = parseSheetRows(0);
  const tutorsRows = parseSheetRows(1);
  const schedulesRows = parseSheetRows(2);
  const attendancesRows = parseSheetRows(3);
  const invoicesRows = parseSheetRows(4);
  const financeRows = parseSheetRows(5);

  const students = studentsRows.map((r: any[], idx: number) => ({
    id: r[0] || `std-${idx + 1}`,
    name: r[1] || 'Siswa Tanpa Nama',
    gender: r[2] || 'Laki-laki',
    grade: r[3] || 'SMA',
    school: r[4] || '-',
    parentName: r[5] || '-',
    parentWA: r[6] || '-',
    subjects: r[7] ? String(r[7]).split(',').map(s => s.trim()) : [],
    ratePerSession: parseInt(String(r[8] || '0').replace(/[^0-9]/g, ''), 10) || 0,
    packageStatus: r[9] || 'Aktif',
    remainingSessions: parseInt(String(r[10] || '0').replace(/[^0-9]/g, ''), 10) || 0,
    status: r[11] || 'Aktif'
  }));

  const tutors = tutorsRows.map((r: any[], idx: number) => ({
    id: r[0] || `tut-${idx + 1}`,
    name: r[1] || 'Tentor Tanpa Nama',
    subjects: r[2] ? String(r[2]).split(',').map(s => s.trim()) : [],
    wa: r[3] || '-',
    workingArea: r[4] ? String(r[4]).split(',').map(s => s.trim()) : [],
    salarySystem: r[5] || 'Per Pertemuan',
    ratePerSession: parseInt(String(r[6] || '0').replace(/[^0-9]/g, ''), 10) || 0,
    averageRating: parseFloat(r[7]) || 5,
    status: r[8] || 'Aktif'
  }));

  const schedules = schedulesRows.map((r: any[], idx: number) => ({
    id: r[0] || `sch-${idx + 1}`,
    studentName: r[1] || '-',
    tutorName: r[2] || '-',
    subject: r[3] || '-',
    dayOfWeek: r[4] || 'Senin',
    timeSlot: r[5] || '16:00',
    type: r[6] || 'Jadwal Tetap',
    status: r[7] || 'Aktif'
  }));

  const attendances = attendancesRows.map((r: any[], idx: number) => ({
    id: r[0] || `att-${idx + 1}`,
    date: r[1] || new Date().toISOString().substring(0, 10),
    tutorName: r[2] || '-',
    studentName: r[3] || '-',
    materialCovered: r[4] || '-',
    status: r[5] || 'Hadir',
    progressNotes: r[6] || '-',
    selfieUrl: r[7] === 'Ada Selfie Foto' ? 'https://images.unsplash.com/photo-1544717305-2782549b5136' : '',
    serverTime: r[8] || '-'
  }));

  const invoices = invoicesRows.map((r: any[], idx: number) => ({
    id: r[0] || `inv-${idx + 1}`,
    invoiceNumber: r[0] || `INV-${Date.now()}`,
    studentName: r[1] || '-',
    monthPeriod: r[2] || 'Juli 2026',
    amount: parseInt(String(r[3] || '0').replace(/[^0-9]/g, ''), 10) || 0,
    amountPaid: parseInt(String(r[4] || '0').replace(/[^0-9]/g, ''), 10) || 0,
    dueDate: r[5] || '-',
    status: r[6] || 'Belum Lunas'
  }));

  const finance = financeRows.map((r: any[], idx: number) => ({
    id: r[0] || `fin-${idx + 1}`,
    date: r[1] || new Date().toISOString().substring(0, 10),
    type: r[2] || 'Pemasukan',
    category: r[3] || 'Lainnya',
    amount: parseInt(String(r[4] || '0').replace(/[^0-9]/g, ''), 10) || 0,
    description: r[5] || '-',
    createdBy: r[6] || 'SYSTEM'
  }));

  return {
    students,
    tutors,
    schedules,
    attendances,
    invoices,
    finance
  };
};

