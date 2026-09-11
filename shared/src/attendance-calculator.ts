import { AttendanceThresholds, ProjectedAttendance, SubjectAttendance } from './types.js';

/**
 * Calculates accurate attendance percentage
 */
export function calculatePercentage(present: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((present / total) * 100).toFixed(2));
}

/**
 * Calculates how many consecutive classes must be attended to reach a target percentage (e.g. 75%, 80%, 85%)
 * Formula: (P + x) / (T + x) >= target
 * x * (1 - target) >= target * T - P
 * x = ceil((target * T - P) / (1 - target))
 */
export function calculateClassesToReachTarget(present: number, total: number, targetPercentage: number): number {
  if (total <= 0) return 0;
  const currentPct = (present / total) * 100;
  if (currentPct >= targetPercentage) return 0;

  const target = targetPercentage / 100;
  if (target >= 1) return 0;

  const numerator = (target * total) - present;
  const denominator = 1 - target;
  const required = Math.ceil(numerator / denominator);
  return Math.max(0, required);
}

/**
 * Calculates maximum classes that can be missed (bunked) while staying >= targetPercentage (default 75%)
 * Formula: P / (T + y) >= target
 * 0.75 * y <= P - 0.75 * T
 * y = floor((P - target * T) / target)
 */
export function calculateBunkCapacity(present: number, total: number, targetPercentage: number = 75): number {
  if (total <= 0) return 0;
  const target = targetPercentage / 100;
  const currentPct = (present / total) * 100;

  if (currentPct < targetPercentage) return 0;

  const numerator = present - (target * total);
  const bunkable = Math.floor(numerator / target);
  return Math.max(0, bunkable);
}

/**
 * Derives comprehensive attendance thresholds and status
 */
export function getAttendanceThresholds(present: number, total: number): AttendanceThresholds {
  const percentage = calculatePercentage(present, total);

  let status: 'good' | 'warning' | 'danger' = 'good';
  if (percentage < 75) {
    status = 'danger';
  } else if (percentage < 85) {
    status = 'warning';
  }

  return {
    classesTo75: calculateClassesToReachTarget(present, total, 75),
    classesTo80: calculateClassesToReachTarget(present, total, 80),
    classesTo85: calculateClassesToReachTarget(present, total, 85),
    bunkableFor75: calculateBunkCapacity(present, total, 75),
    status,
  };
}

/**
 * Projections if next N classes are attended vs missed
 */
export function projectAttendance(present: number, total: number, deltaClasses: number): ProjectedAttendance {
  if (deltaClasses <= 0) {
    const cur = calculatePercentage(present, total);
    return {
      delta: 0,
      projectedAttended: cur,
      projectedMissed: cur,
    };
  }

  const projectedAttended = calculatePercentage(present + deltaClasses, total + deltaClasses);
  const projectedMissed = calculatePercentage(present, total + deltaClasses);

  return {
    delta: deltaClasses,
    projectedAttended,
    projectedMissed,
  };
}

/**
 * Computes overall totals from a list of subjects
 */
export function aggregateAttendance(subjects: SubjectAttendance[]): {
  totalLectures: number;
  present: number;
  absent: number;
  percentage: number;
} {
  let totalLectures = 0;
  let present = 0;
  let absent = 0;

  for (const s of subjects) {
    totalLectures += s.totalLectures;
    present += s.present;
    absent += s.absent;
  }

  const percentage = calculatePercentage(present, totalLectures);
  return {
    totalLectures,
    present,
    absent,
    percentage,
  };
}
