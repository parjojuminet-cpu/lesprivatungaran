import {
  User, Student, Tutor, Parent, Subject, WorkingArea, Schedule,
  Attendance, Invoice, Finance, TutorSalary, Module, Approval,
  Setting, AuditLog
} from '../types';

export const DEFAULT_JSON_USERS: User[] = [
  {
    "id": "usr-admin",
    "username": "admin",
    "passwordHash": "admin123",
    "name": "Administrator",
    "role": "SUPER_ADMIN",
    "status": "Aktif",
    "desc": "Akses penuh ke seluruh modul ERP.",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_001",
    "username": "desti",
    "passwordHash": "desti111",
    "name": "Desti Ayu R.",
    "role": "TENTOR",
    "tutorId": "ttr_001",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar All Mapel (Kecuali english)",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_002",
    "username": "zeni",
    "passwordHash": "zeni111",
    "name": "Zeni Mei Sari",
    "role": "TENTOR",
    "tutorId": "ttr_002",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar Hafalan & Ngaji Iqro",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_003",
    "username": "emie",
    "passwordHash": "emie111",
    "name": "Emie Zulianingsih R.",
    "role": "TENTOR",
    "tutorId": "ttr_003",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar Hafalan & Ngaji Iqro",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_004",
    "username": "yuni",
    "passwordHash": "yuni111",
    "name": "Yuni Nurtiyas",
    "role": "TENTOR",
    "tutorId": "ttr_004",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar All Mapel ",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_005",
    "username": "dila",
    "passwordHash": "dila111",
    "name": "Azizah Naufal Adila (Dila)",
    "role": "TENTOR",
    "tutorId": "ttr_005",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar All Mapel ",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_006",
    "username": "dwi",
    "passwordHash": "dwi111",
    "name": "Dwi Nur Lestari",
    "role": "TENTOR",
    "tutorId": "ttr_006",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar Matematika",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_007",
    "username": "ulfah",
    "passwordHash": "ulfah111",
    "name": "Ulfah Rohmawati",
    "role": "TENTOR",
    "tutorId": "ttr_007",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar Calistung (Belum lancar)",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_008",
    "username": "muspiroh",
    "passwordHash": "muspiroh111",
    "name": "Muspiroh",
    "role": "TENTOR",
    "tutorId": "ttr_008",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar All Mapel & Ngaji Iqro",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_009",
    "username": "eka",
    "passwordHash": "eka111",
    "name": "Eka Rahmasari",
    "role": "TENTOR",
    "tutorId": "ttr_009",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar Calistung, Hafalan, Ngaji Iqro",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_010",
    "username": "santika",
    "passwordHash": "santika111",
    "name": "Santika Lestari",
    "role": "TENTOR",
    "tutorId": "ttr_010",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar Calistung",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_011",
    "username": "wiwid",
    "passwordHash": "wiwid111",
    "name": "Tri Widarti (Wiwid)",
    "role": "TENTOR",
    "tutorId": "ttr_011",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar Ngaji Qiroati",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_012",
    "username": "fina",
    "passwordHash": "fina111",
    "name": "Siti Safinatun N. (Fina)",
    "role": "TENTOR",
    "tutorId": "ttr_012",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar English & Math",
    "createdAt": "2026-07-08"
  },
  {
    "id": "usr_ttr_013",
    "username": "salsabila",
    "passwordHash": "salsabila111",
    "name": "Salsabila Malika P.",
    "role": "TENTOR",
    "tutorId": "ttr_013",
    "status": "Aktif",
    "desc": "Akun tentor resmi untuk mengajar All Mapel & Ngaji Iqro",
    "createdAt": "2026-07-08"
  }
];

export const DEFAULT_JSON_TUTORS: Tutor[] = [
  {
    "id": "ttr_001",
    "name": "Desti Ayu R.",
    "gender": "Perempuan",
    "address": "Griya Ungaran Residence, Jl. Mentawai 1 No. 45 Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "All Mapel (Kecuali english)",
      "Calistung (Persiapan SD)",
      "All Mapel "
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 20000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_002",
    "name": "Zeni Mei Sari",
    "gender": "Perempuan",
    "address": "Griya Ungaran Residence, Jl. Mentawai 1 No. 45 Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "Hafalan & Ngaji Iqro",
      "English, Hafalan & Ngaji Iqro"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 30000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_003",
    "name": "Emie Zulianingsih R.",
    "gender": "Perempuan",
    "address": "Perum Ungaran Indah, Jl. Handayani V No. 21 Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "Hafalan & Ngaji Iqro",
      "Calistung & Ngaji Iqro",
      "All Mapel ",
      "Calistung (Belum lancar)",
      "Calistung",
      "Calistung (Persiapan SD)"
    ],
    "gradesMastered": [
      "SD",
      "TK Besar"
    ],
    "ratePerSession": 23000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_004",
    "name": "Yuni Nurtiyas",
    "gender": "Perempuan",
    "address": "Puri Delta Asri 5 Tahap 2 Blok B3 No.6, Kalongan Ungaran Timur",
    "wa": "0812-3456-7890",
    "subjects": [
      "All Mapel ",
      "Calistung (Persiapan SD)"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 33000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_005",
    "name": "Azizah Naufal Adila (Dila)",
    "gender": "Perempuan",
    "address": "Perum Gedang Asri, Jl. Sumbawa V, TPA Nastiti Siwi Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "All Mapel "
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 33000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_006",
    "name": "Dwi Nur Lestari",
    "gender": "Perempuan",
    "address": "Jl. Parasamya 7 No. H18A Pundung Putih Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "Matematika"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 30000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_007",
    "name": "Ulfah Rohmawati",
    "gender": "Perempuan",
    "address": "Karangsari Rt:3 Rw:6 Gunungpati Kota Semarang",
    "wa": "0812-3456-7890",
    "subjects": [
      "Calistung (Belum lancar)",
      "Matematika",
      "Calistung",
      "All Mapel"
    ],
    "gradesMastered": [
      "SD",
      "TK Besar"
    ],
    "ratePerSession": 32000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_008",
    "name": "Muspiroh",
    "gender": "Perempuan",
    "address": "Griya Jannatin Leyangan Blok G4 Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "All Mapel & Ngaji Iqro"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 38500,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_009",
    "name": "Eka Rahmasari",
    "gender": "Perempuan",
    "address": "Jl. Kenanga baru 2,RT.11,RW.02 Rejosari - Genuk Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "Calistung, Hafalan, Ngaji Iqro"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 30000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_010",
    "name": "Santika Lestari",
    "gender": "Perempuan",
    "address": "Jl. Merapi Dalam No. 1 Rt: 02 Rw: 07, Suwakul Ungaran Barat",
    "wa": "0812-3456-7890",
    "subjects": [
      "Calistung"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 32000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_011",
    "name": "Tri Widarti (Wiwid)",
    "gender": "Perempuan",
    "address": "Gg. Melati 1/78 A Pudung Putih Ungaran",
    "wa": "0812-3456-7890",
    "subjects": [
      "Ngaji Qiroati"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 28000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_012",
    "name": "Siti Safinatun N. (Fina)",
    "gender": "Perempuan",
    "address": "Jl Patimura, Perum Bukit Permata Regency A6 Lerep",
    "wa": "0812-3456-7890",
    "subjects": [
      "English & Math"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 33000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  },
  {
    "id": "ttr_013",
    "name": "Salsabila Malika P.",
    "gender": "Perempuan",
    "address": "Perumahan Grand My Home No. C2, Leyangan Ungaran Timur",
    "wa": "0812-3456-7890",
    "subjects": [
      "All Mapel & Ngaji Iqro"
    ],
    "gradesMastered": [
      "SD"
    ],
    "ratePerSession": 38000,
    "workingArea": [
      "Ungaran"
    ],
    "workingHours": [
      "15:00 - 19:30"
    ],
    "salarySystem": "Per Pertemuan",
    "status": "Aktif",
    "averageRating": 5,
    "totalRatings": 1,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "maxStudents": 10,
    "createdAt": "2026-07-08"
  }
];

export const DEFAULT_JSON_STUDENTS: Student[] = [
  {
    "id": "std_001",
    "name": "Amara Queen",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "3 SD",
    "school": "SD Islam Al Azhar 14 Semarang",
    "address": "Griya Ungaran Residence, Jl. Mentawai 1 No. 45 Ungaran",
    "parentName": "Anisa Ismawati",
    "parentWA": "0811-2994-444",
    "subjects": [
      "All Mapel (Kecuali english)",
      "Hafalan & Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 25000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_002",
    "name": "Arshaka Reynand Zio P.",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "1 SD",
    "school": "SD Islam Al Azhar 14 Semarang",
    "address": "Griya Ungaran Residence, Jl. Mentawai 1 No. 45 Ungaran",
    "parentName": "Anisa Ismawati",
    "parentWA": "0811-2994-444",
    "subjects": [
      "Calistung (Persiapan SD)",
      "English, Hafalan & Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 30000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_003",
    "name": "Radeva Alfian Sanjaya",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "2 SD",
    "school": "SD Negeri 3 Gedanganak Ungaran",
    "address": "Perum Citra Asri 3 Blok K.14 Rt: 02 Rw: 03, Beji leyangan, Ungaran Timur",
    "parentName": "Novita",
    "parentWA": "0877-6067-1085",
    "subjects": [
      "All Mapel "
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 30000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_004",
    "name": "Naufal Myzaz",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "3 SD",
    "school": "SD Negeri Leyangan Ungaran",
    "address": "Perum Citra Asri Blok J No.4 Ungaran",
    "parentName": "Mala",
    "parentWA": "0821-3806-0115",
    "subjects": [
      "All Mapel "
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 40000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_005",
    "name": "Almeera Qirani A.",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "3 SD",
    "school": "SD Istiqomah Ungaran",
    "address": "Perum Ungaran Indah, Jl. Handayani V No. 21 Ungaran",
    "parentName": "Indri Hapsari",
    "parentWA": "0857-2704-9903",
    "subjects": [
      "All Mapel ",
      "Hafalan & Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 30000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_006",
    "name": "Razqa Shandy Pradita",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "2 SD",
    "school": "SD Istiqomah Ungaran",
    "address": "Puri Delta Asri 5 Tahap 2 Blok B3 No.6, Kalongan Ungaran Timur",
    "parentName": "Luh Putu Shanti K.",
    "parentWA": "0817-9564-216",
    "subjects": [
      "All Mapel "
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 40000,
    "managementMarginNominal": 7000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_007",
    "name": "Sandriavolo Estevania",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "1 SD",
    "school": "SD Mardi Rahayu Ungaran",
    "address": "Leyangan Mansion Blok Athena No. 7 Ungaran",
    "parentName": "Yosefine Christin",
    "parentWA": "0856-4019-9327",
    "subjects": [
      "Calistung (Persiapan SD)"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 30000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_008",
    "name": "Philips",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "1 SD",
    "school": "SD Mardi Rahayu Ungaran",
    "address": "Leyangan Mansion Blok Athena No. 7 Ungaran",
    "parentName": "Yosefine Christin",
    "parentWA": "0856-4019-9327",
    "subjects": [
      "Calistung (Persiapan SD)"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 30000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_009",
    "name": "Wimala Hafiz",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "4 SD",
    "school": "SD Istiqomah Ungaran",
    "address": "Perum Gedang Asri, Jl. Sumbawa V, TPA Nastiti Siwi Ungaran",
    "parentName": "Eka",
    "parentWA": "0813-2733-7882",
    "subjects": [
      "All Mapel "
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 40000,
    "managementMarginNominal": 7000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_010",
    "name": "Syarinta Kara Mahardhika",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "5 SD",
    "school": "SD Hj. Istriati Moenadi Ungaran",
    "address": "Jl. Parasamya 7 No. H18A Pundung Putih Ungaran",
    "parentName": "Mayang",
    "parentWA": "0813-2565-4678",
    "subjects": [
      "Matematika"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 35000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_011",
    "name": "Raphaela Renata",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "2 SD",
    "school": "SD Mardi Rahayu Ungaran",
    "address": "Karangsari Rt:3 Rw:6 Gunungpati Kota Semarang",
    "parentName": "Ibu Katrin",
    "parentWA": "0857-4204-6029",
    "subjects": [
      "Calistung (Belum lancar)"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 38000,
    "managementMarginNominal": 6000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_012",
    "name": "M.Raja Arshaka",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "5 SD",
    "school": "Bukit Aksara Creative School",
    "address": "Jl.KS.Tubun No.25, Bandarjo Ungaran",
    "parentName": "Ibu Citra",
    "parentWA": "0813-2517-9615",
    "subjects": [
      "Matematika"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 38000,
    "managementMarginNominal": 6000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_013",
    "name": "Mirza Alby Kavindra",
    "gender": "Laki-laki",
    "grade": "TK Besar",
    "className": "TK-B",
    "school": "TK An-Nahl Ungaran",
    "address": "Susukan Sipenggung 3/8 Ungaran Timur",
    "parentName": "Marlina",
    "parentWA": "0895-4115-41195",
    "subjects": [
      "Calistung"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 42000,
    "managementMarginNominal": 9000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_014",
    "name": "Hilarion Gavyn Fernanda I.",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "2 SD",
    "school": "SD Mardi Rahayu Ungaran",
    "address": "Jl. Urip Sumoharjo No.13 RT: 003/ 002, Bandarjo Ungaran Barat",
    "parentName": "Ferry Irawan",
    "parentWA": "0857-4030-1804",
    "subjects": [
      "All Mapel"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 40000,
    "managementMarginNominal": 8000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_015",
    "name": "Nurazeta Ibrahim Azzaky",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "4 SD",
    "school": "MI Kalirejo Ungaran Timur",
    "address": "Griya Jannatin Leyangan Blok G4 Ungaran",
    "parentName": "Okfita Dian",
    "parentWA": "0857-2371-1935",
    "subjects": [
      "All Mapel & Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 45000,
    "managementMarginNominal": 6500,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_016",
    "name": "Akira Emran Mandhala",
    "gender": "Laki-laki",
    "grade": "TK Besar",
    "className": "TK-B",
    "school": "TK IT Assalamah Ungaran",
    "address": "Jl. Graha Yasa I No A9 Bandarjo Ungaran",
    "parentName": "Sarah Basbeth",
    "parentWA": "0822-2627-2812",
    "subjects": [
      "Calistung & Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 38000,
    "managementMarginNominal": 7000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_017",
    "name": "Muhammad Al Fatih",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "1 SD",
    "school": "SD Istiqomah Ungaran",
    "address": "Jl. Kutilang Raya Kuncen Rt:4/Rw:1",
    "parentName": "Yaninda Ratnasari",
    "parentWA": "0882-0084-12704",
    "subjects": [
      "Calistung & Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 40000,
    "managementMarginNominal": 8000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_018",
    "name": "Nazifa Nur Fatima Zahara",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "4 SD",
    "school": "SD Istiqomah Ungaran",
    "address": "Jl. Kutilang Raya Kuncen Rt:4/Rw:1",
    "parentName": "Yaninda Ratnasari",
    "parentWA": "0882-0084-12704",
    "subjects": [
      "All Mapel "
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 48000,
    "managementMarginNominal": 10000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_019",
    "name": "Afiqa Rheva Safitri",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "2 SD",
    "school": "SD Negeri 02 Ungaran",
    "address": "Perum Griya Sinar Mutiara Blok E No.5 RT:06 RW:02, Bandarjo",
    "parentName": "Sulistyo Budi",
    "parentWA": "0858-9167-2272",
    "subjects": [
      "Calistung (Belum lancar)"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 42000,
    "managementMarginNominal": 7000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_020",
    "name": "Fatimah Yumna Qirani",
    "gender": "Laki-laki",
    "grade": "TK Besar",
    "className": "TK-B",
    "school": "TK IT Assalamah Ungaran",
    "address": "Branggah RT: 02 RW: 08, Nyatnyono Ungaran Barat",
    "parentName": "Farida",
    "parentWA": "0877-2234-4898",
    "subjects": [
      "Calistung"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 37500,
    "managementMarginNominal": 7500,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_021",
    "name": "Saquena Shakira Rachman",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "1 SD",
    "school": "SD Negeri 05 Ungaran",
    "address": "Jl. Muria II Bandaran Barat Rt: 2 / Rw: 05 Ungaran",
    "parentName": "Galeh Itamaji",
    "parentWA": "0822-6406-0529",
    "subjects": [
      "Calistung (Persiapan SD)"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 38000,
    "managementMarginNominal": 7000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_022",
    "name": "Rizqiano",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "1 SD",
    "school": "SD Istiqomah Ungaran",
    "address": "Jl. Kenanga baru 2,RT.11,RW.02 Rejosari - Genuk Ungaran",
    "parentName": "Irwan Cahyono",
    "parentWA": "0818-0242-6237",
    "subjects": [
      "Calistung, Hafalan, Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 37500,
    "managementMarginNominal": 7500,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_023",
    "name": "Keyna Faradina",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "1 SD",
    "school": "SD Istiqomah Ungaran",
    "address": "Jl. Merapi Dalam No. 1 Rt: 02 Rw: 07, Suwakul Ungaran Barat",
    "parentName": "Rochani Abdullah",
    "parentWA": "0856-0163-8688",
    "subjects": [
      "Calistung"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 37000,
    "managementMarginNominal": 5000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_024",
    "name": "Aushaf Sakha A.",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "5 SD",
    "school": "SD Hj. Istriati Moenadi Ungaran",
    "address": "Gg. Melati 1/78 A Pudung Putih Ungaran",
    "parentName": "Hapsari. E. P.",
    "parentWA": "0812-2600-7080",
    "subjects": [
      "Ngaji Qiroati"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 38000,
    "managementMarginNominal": 10000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_025",
    "name": "Alesha Safa A.",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "3 SD",
    "school": "SD Hj. Istriati Moenadi Ungaran",
    "address": "Gg. Melati 1/78 A Pudung Putih Ungaran",
    "parentName": "Hapsari. E. P.",
    "parentWA": "0812-2600-7080",
    "subjects": [
      "Ngaji Qiroati"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 38000,
    "managementMarginNominal": 10000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_026",
    "name": "M.Adam Al Fath",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "3 SD",
    "school": "SD Semesta Semarang",
    "address": "Jl Patimura, Perum Bukit Permata Regency A6 Lerep",
    "parentName": "Lyony",
    "parentWA": "0811-2804-010",
    "subjects": [
      "English & Math"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 42000,
    "managementMarginNominal": 9000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  },
  {
    "id": "std_027",
    "name": "Ryuga Abhinaya Zafar",
    "gender": "Laki-laki",
    "grade": "SD",
    "className": "5  SD",
    "school": "SD Hj. Istriati Moenadi Ungaran",
    "address": "Perumahan Grand My Home No. C2, Leyangan Ungaran Timur",
    "parentName": "Arga Rasita",
    "parentWA": "0822-2037-0080",
    "subjects": [
      "All Mapel & Ngaji Iqro"
    ],
    "totalPackageSessions": 10,
    "remainingSessions": 10,
    "packageStartDate": "2026-07-08",
    "packageEndDate": "2027-07-08",
    "packageStatus": "Aktif",
    "ratePerSession": 45000,
    "managementMarginNominal": 7000,
    "status": "Aktif",
    "createdAt": "2026-07-08"
  }
];

export const DEFAULT_JSON_SCHEDULES: Schedule[] = [
  {
    "id": "sch_d6vdra",
    "studentId": "std_001",
    "tutorId": "ttr_001",
    "subject": "All Mapel (Kecuali english)",
    "dayOfWeek": "Senin",
    "timeSlot": "17:30 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 20000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_hhvml2",
    "studentId": "std_002",
    "tutorId": "ttr_001",
    "subject": "Calistung (Persiapan SD)",
    "dayOfWeek": "Senin",
    "timeSlot": "17:00 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 25000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_w0wndz",
    "studentId": "std_001",
    "tutorId": "ttr_002",
    "subject": "Hafalan & Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "15:30 - 16:30",
    "type": "Jadwal Tetap",
    "sessionRate": 30000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_hp71ds",
    "studentId": "std_002",
    "tutorId": "ttr_002",
    "subject": "English, Hafalan & Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 20000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_kk4xot",
    "studentId": "std_003",
    "tutorId": "ttr_001",
    "subject": "All Mapel ",
    "dayOfWeek": "Senin",
    "timeSlot": "17:00 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 25000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_sx2rec",
    "studentId": "std_004",
    "tutorId": "ttr_001",
    "subject": "All Mapel ",
    "dayOfWeek": "Senin",
    "timeSlot": "18:00 - 19:30",
    "type": "Jadwal Tetap",
    "sessionRate": 35000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_m7dt8e",
    "studentId": "std_005",
    "tutorId": "ttr_001",
    "subject": "All Mapel ",
    "dayOfWeek": "Senin",
    "timeSlot": "19:00 - 20:30",
    "type": "Jadwal Tetap",
    "sessionRate": 25000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_8txbt2",
    "studentId": "std_005",
    "tutorId": "ttr_003",
    "subject": "Hafalan & Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "15:00 - 16:30",
    "type": "Jadwal Tetap",
    "sessionRate": 23000,
    "adminFee": 2000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_97erep",
    "studentId": "std_006",
    "tutorId": "ttr_004",
    "subject": "All Mapel ",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 33000,
    "adminFee": 7000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_v2z7yw",
    "studentId": "std_007",
    "tutorId": "ttr_004",
    "subject": "Calistung (Persiapan SD)",
    "dayOfWeek": "Senin",
    "timeSlot": "17:00 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 25000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_m5jxep",
    "studentId": "std_008",
    "tutorId": "ttr_004",
    "subject": "Calistung (Persiapan SD)",
    "dayOfWeek": "Senin",
    "timeSlot": "17:00 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 25000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_ju5cng",
    "studentId": "std_009",
    "tutorId": "ttr_005",
    "subject": "All Mapel ",
    "dayOfWeek": "Senin",
    "timeSlot": "15:00 - 16:30",
    "type": "Jadwal Tetap",
    "sessionRate": 33000,
    "adminFee": 7000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_v30bg4",
    "studentId": "std_010",
    "tutorId": "ttr_006",
    "subject": "Matematika",
    "dayOfWeek": "Senin",
    "timeSlot": "18:00 - 19:30",
    "type": "Jadwal Tetap",
    "sessionRate": 30000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_ioof8m",
    "studentId": "std_011",
    "tutorId": "ttr_007",
    "subject": "Calistung (Belum lancar)",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 32000,
    "adminFee": 6000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_6zfmly",
    "studentId": "std_012",
    "tutorId": "ttr_007",
    "subject": "Matematika",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 32000,
    "adminFee": 6000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_m73ip1",
    "studentId": "std_013",
    "tutorId": "ttr_007",
    "subject": "Calistung",
    "dayOfWeek": "Senin",
    "timeSlot": "17:00 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 33000,
    "adminFee": 9000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_xle6gg",
    "studentId": "std_014",
    "tutorId": "ttr_007",
    "subject": "All Mapel",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 32000,
    "adminFee": 8000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_3i582o",
    "studentId": "std_015",
    "tutorId": "ttr_008",
    "subject": "All Mapel & Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "15:30 - 16:30",
    "type": "Jadwal Tetap",
    "sessionRate": 38500,
    "adminFee": 6500,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_q80djo",
    "studentId": "std_016",
    "tutorId": "ttr_003",
    "subject": "Calistung & Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 31000,
    "adminFee": 7000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_2qagta",
    "studentId": "std_017",
    "tutorId": "ttr_003",
    "subject": "Calistung & Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 32000,
    "adminFee": 8000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_pmovci",
    "studentId": "std_018",
    "tutorId": "ttr_003",
    "subject": "All Mapel ",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 38000,
    "adminFee": 10000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_w8fh2z",
    "studentId": "std_019",
    "tutorId": "ttr_003",
    "subject": "Calistung (Belum lancar)",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 35000,
    "adminFee": 7000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_jmvmfm",
    "studentId": "std_020",
    "tutorId": "ttr_003",
    "subject": "Calistung",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 30000,
    "adminFee": 7500,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_zjaqat",
    "studentId": "std_021",
    "tutorId": "ttr_003",
    "subject": "Calistung (Persiapan SD)",
    "dayOfWeek": "Senin",
    "timeSlot": "18:00 - 19:30",
    "type": "Jadwal Tetap",
    "sessionRate": 31000,
    "adminFee": 7000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_u233fy",
    "studentId": "std_022",
    "tutorId": "ttr_009",
    "subject": "Calistung, Hafalan, Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "18:30 - 19:30",
    "type": "Jadwal Tetap",
    "sessionRate": 30000,
    "adminFee": 7500,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_jpkmj5",
    "studentId": "std_023",
    "tutorId": "ttr_010",
    "subject": "Calistung",
    "dayOfWeek": "Senin",
    "timeSlot": "16:00 - 17:30",
    "type": "Jadwal Tetap",
    "sessionRate": 32000,
    "adminFee": 5000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_yeli10",
    "studentId": "std_024",
    "tutorId": "ttr_011",
    "subject": "Ngaji Qiroati",
    "dayOfWeek": "Senin",
    "timeSlot": "17:30 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 28000,
    "adminFee": 10000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_roy30g",
    "studentId": "std_025",
    "tutorId": "ttr_011",
    "subject": "Ngaji Qiroati",
    "dayOfWeek": "Senin",
    "timeSlot": "17:30 - 18:30",
    "type": "Jadwal Tetap",
    "sessionRate": 28000,
    "adminFee": 10000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_byxfdo",
    "studentId": "std_026",
    "tutorId": "ttr_012",
    "subject": "English & Math",
    "dayOfWeek": "Senin",
    "timeSlot": "15:30 - 16:30",
    "type": "Jadwal Tetap",
    "sessionRate": 33000,
    "adminFee": 9000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  },
  {
    "id": "sch_fk55kr",
    "studentId": "std_027",
    "tutorId": "ttr_013",
    "subject": "All Mapel & Ngaji Iqro",
    "dayOfWeek": "Senin",
    "timeSlot": "15:00 - 16:30",
    "type": "Jadwal Tetap",
    "sessionRate": 38000,
    "adminFee": 7000,
    "status": "Aktif",
    "rescheduleCountThisMonth": 0,
    "createdAt": "2026-07-08"
  }
];

export const DEFAULT_JSON_PARENTS: Parent[] = [
  {
    "id": "prt_001",
    "name": "Anisa Ismawati",
    "wa": "0811-2994-444",
    "studentIds": [
      "std_001",
      "std_002"
    ],
    "address": "Griya Ungaran Residence, Jl. Mentawai 1 No. 45 Ungaran"
  },
  {
    "id": "prt_002",
    "name": "Novita",
    "wa": "0877-6067-1085",
    "studentIds": [
      "std_003"
    ],
    "address": "Perum Citra Asri 3 Blok K.14 Rt: 02 Rw: 03, Beji leyangan, Ungaran Timur"
  },
  {
    "id": "prt_003",
    "name": "Mala",
    "wa": "0821-3806-0115",
    "studentIds": [
      "std_004"
    ],
    "address": "Perum Citra Asri Blok J No.4 Ungaran"
  },
  {
    "id": "prt_004",
    "name": "Indri Hapsari",
    "wa": "0857-2704-9903",
    "studentIds": [
      "std_005"
    ],
    "address": "Perum Ungaran Indah, Jl. Handayani V No. 21 Ungaran"
  },
  {
    "id": "prt_005",
    "name": "Luh Putu Shanti K.",
    "wa": "0817-9564-216",
    "studentIds": [
      "std_006"
    ],
    "address": "Puri Delta Asri 5 Tahap 2 Blok B3 No.6, Kalongan Ungaran Timur"
  },
  {
    "id": "prt_006",
    "name": "Yosefine Christin",
    "wa": "0856-4019-9327",
    "studentIds": [
      "std_007",
      "std_008"
    ],
    "address": "Leyangan Mansion Blok Athena No. 7 Ungaran"
  },
  {
    "id": "prt_007",
    "name": "Eka",
    "wa": "0813-2733-7882",
    "studentIds": [
      "std_009"
    ],
    "address": "Perum Gedang Asri, Jl. Sumbawa V, TPA Nastiti Siwi Ungaran"
  },
  {
    "id": "prt_008",
    "name": "Mayang",
    "wa": "0813-2565-4678",
    "studentIds": [
      "std_010"
    ],
    "address": "Jl. Parasamya 7 No. H18A Pundung Putih Ungaran"
  },
  {
    "id": "prt_009",
    "name": "Ibu Katrin",
    "wa": "0857-4204-6029",
    "studentIds": [
      "std_011"
    ],
    "address": "Karangsari Rt:3 Rw:6 Gunungpati Kota Semarang"
  },
  {
    "id": "prt_010",
    "name": "Ibu Citra",
    "wa": "0813-2517-9615",
    "studentIds": [
      "std_012"
    ],
    "address": "Jl.KS.Tubun No.25, Bandarjo Ungaran"
  },
  {
    "id": "prt_011",
    "name": "Marlina",
    "wa": "0895-4115-41195",
    "studentIds": [
      "std_013"
    ],
    "address": "Susukan Sipenggung 3/8 Ungaran Timur"
  },
  {
    "id": "prt_012",
    "name": "Ferry Irawan",
    "wa": "0857-4030-1804",
    "studentIds": [
      "std_014"
    ],
    "address": "Jl. Urip Sumoharjo No.13 RT: 003/ 002, Bandarjo Ungaran Barat"
  },
  {
    "id": "prt_013",
    "name": "Okfita Dian",
    "wa": "0857-2371-1935",
    "studentIds": [
      "std_015"
    ],
    "address": "Griya Jannatin Leyangan Blok G4 Ungaran"
  },
  {
    "id": "prt_014",
    "name": "Sarah Basbeth",
    "wa": "0822-2627-2812",
    "studentIds": [
      "std_016"
    ],
    "address": "Jl. Graha Yasa I No A9 Bandarjo Ungaran"
  },
  {
    "id": "prt_015",
    "name": "Yaninda Ratnasari",
    "wa": "0882-0084-12704",
    "studentIds": [
      "std_017",
      "std_018"
    ],
    "address": "Jl. Kutilang Raya Kuncen Rt:4/Rw:1"
  },
  {
    "id": "prt_016",
    "name": "Sulistyo Budi",
    "wa": "0858-9167-2272",
    "studentIds": [
      "std_019"
    ],
    "address": "Perum Griya Sinar Mutiara Blok E No.5 RT:06 RW:02, Bandarjo"
  },
  {
    "id": "prt_017",
    "name": "Farida",
    "wa": "0877-2234-4898",
    "studentIds": [
      "std_020"
    ],
    "address": "Branggah RT: 02 RW: 08, Nyatnyono Ungaran Barat"
  },
  {
    "id": "prt_018",
    "name": "Galeh Itamaji",
    "wa": "0822-6406-0529",
    "studentIds": [
      "std_021"
    ],
    "address": "Jl. Muria II Bandaran Barat Rt: 2 / Rw: 05 Ungaran"
  },
  {
    "id": "prt_019",
    "name": "Irwan Cahyono",
    "wa": "0818-0242-6237",
    "studentIds": [
      "std_022"
    ],
    "address": "Jl. Kenanga baru 2,RT.11,RW.02 Rejosari - Genuk Ungaran"
  },
  {
    "id": "prt_020",
    "name": "Rochani Abdullah",
    "wa": "0856-0163-8688",
    "studentIds": [
      "std_023"
    ],
    "address": "Jl. Merapi Dalam No. 1 Rt: 02 Rw: 07, Suwakul Ungaran Barat"
  },
  {
    "id": "prt_021",
    "name": "Hapsari. E. P.",
    "wa": "0812-2600-7080",
    "studentIds": [
      "std_024",
      "std_025"
    ],
    "address": "Gg. Melati 1/78 A Pudung Putih Ungaran"
  },
  {
    "id": "prt_022",
    "name": "Lyony",
    "wa": "0811-2804-010",
    "studentIds": [
      "std_026"
    ],
    "address": "Jl Patimura, Perum Bukit Permata Regency A6 Lerep"
  },
  {
    "id": "prt_023",
    "name": "Arga Rasita",
    "wa": "0822-2037-0080",
    "studentIds": [
      "std_027"
    ],
    "address": "Perumahan Grand My Home No. C2, Leyangan Ungaran Timur"
  }
];

export const DEFAULT_JSON_SUBJECTS: Subject[] = [
  {
    "id": "sub_001",
    "name": "Calistung",
    "grade": "TK Besar"
  },
  {
    "id": "sub_002",
    "name": "Matematika",
    "grade": "SD"
  },
  {
    "id": "sub_003",
    "name": "English",
    "grade": "SD"
  },
  {
    "id": "sub_004",
    "name": "Ngaji Iqro",
    "grade": "SD"
  },
  {
    "id": "sub_005",
    "name": "Hafalan",
    "grade": "SD"
  },
  {
    "id": "sub_006",
    "name": "Ngaji Qiroati",
    "grade": "SD"
  }
];

export const DEFAULT_JSON_WORKING_AREAS: WorkingArea[] = [
  {
    "id": "area_001",
    "name": "Ungaran Timur",
    "postcode": "50514"
  },
  {
    "id": "area_002",
    "name": "Ungaran Barat",
    "postcode": "50511"
  }
];

export const DEFAULT_JSON_ATTENDANCES: Attendance[] = [];

export const DEFAULT_JSON_INVOICES: Invoice[] = [];

export const DEFAULT_JSON_FINANCE: Finance[] = [];

export const DEFAULT_JSON_SALARIES: TutorSalary[] = [];

export const DEFAULT_JSON_APPROVALS: Approval[] = [];

export const DEFAULT_JSON_MODULES: Module[] = [];

export const DEFAULT_JSON_SETTINGS: Setting[] = [
  {
    "key": "MARGIN_MANAGEMENT_NOMINAL",
    "value": 10000,
    "description": "Nominal Standar Fee/Potongan Manajemen (Rp per Sesi Pertemuan)",
    "category": "Keuangan"
  },
  {
    "key": "MAX_RESCHEDULE_PER_MONTH",
    "value": 2,
    "description": "Batas Maksimal Reschedule Gratis Per Bulan",
    "category": "Operasional"
  },
  {
    "key": "MIN_NOTICE_RESCHEDULE_DAYS",
    "value": 1,
    "description": "Minimal Pemberitahuan Reschedule Sebelum Hari Mengajar (Hari, misal 1 atau 2 hari)",
    "category": "Operasional"
  },
  {
    "key": "MAX_DEADLINE_RESCHEDULE_BEFORE_TEACHING_DAYS",
    "value": 1,
    "description": "Batas Maksimal Pengajuan Reschedule Sebelum Hari Mengajar (Hari, Standar: H-1)",
    "category": "Operasional"
  }
];

export const DEFAULT_JSON_AUDIT_LOGS: AuditLog[] = [];
