import { Attendance, Tutor } from '../types';

export interface TutorSessionBreakdown {
  tutorId: string;
  tutorName: string;
  sessionCount: number;
  dates: string[];
  materials: string[];
  subtotal: number;
}

export function getStudentTutorBreakdown(
  studentId: string,
  attendances: Attendance[],
  tutors: Tutor[],
  ratePerSession: number
): TutorSessionBreakdown[] {
  const tutorMap = new Map(tutors.map(t => [t.id, t.name]));
  const studentAttendances = attendances.filter(
    a => a.studentId === studentId && a.status === 'Hadir'
  );

  if (studentAttendances.length === 0) {
    return [];
  }

  const grouped = new Map<string, { count: number; dates: string[]; materials: string[] }>();

  for (const att of studentAttendances) {
    const tId = att.tutorId || 'unknown';
    if (!grouped.has(tId)) {
      grouped.set(tId, { count: 0, dates: [], materials: [] });
    }
    const item = grouped.get(tId)!;
    item.count += 1;
    if (att.date) item.dates.push(att.date);
    if (att.materialCovered) item.materials.push(att.materialCovered);
  }

  const result: TutorSessionBreakdown[] = [];
  grouped.forEach((data, tId) => {
    const tutorName = tutorMap.get(tId) || 'Tentor Utama';
    result.push({
      tutorId: tId,
      tutorName,
      sessionCount: data.count,
      dates: data.dates,
      materials: data.materials,
      subtotal: data.count * ratePerSession
    });
  });

  return result;
}
