export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  totalLectures: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface OverallAttendance {
  totalLectures: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface AttendanceSnapshot {
  id: string;
  timestamp: number; // epoch ms
  formattedDate: string;
  semester?: string;
  studentName?: string;
  studentRollNumber?: string;
  subjects: SubjectAttendance[];
  overall: OverallAttendance;
  source: 'auto_sync' | 'manual_sync' | 'mock_demo';
}

export interface AttendanceStoreData {
  latest: AttendanceSnapshot | null;
  history: AttendanceSnapshot[];
  lastSyncTime: number | null;
  erpConnected: boolean;
  erpSessionExpired: boolean;
  erpLastCheckedUrl?: string;
  keepAliveEnabled: boolean;
}

export interface AttendanceThresholds {
  classesTo75: number;
  classesTo80: number;
  classesTo85: number;
  bunkableFor75: number; // Max classes you can miss while keeping percentage >= 75%
  status: 'good' | 'warning' | 'danger';
}

export interface ProjectedAttendance {
  delta: number;
  projectedAttended: number; // percentage if next N are attended
  projectedMissed: number;   // percentage if next N are missed
}

// Extension message exchange contracts
export type ExtensionMessage =
  | { type: 'ATTENDANCE_PARSED'; payload: AttendanceSnapshot }
  | { type: 'SESSION_EXPIRED'; payload: { url: string; timestamp: number } }
  | { type: 'GET_ATTENDANCE_STATUS' }
  | { type: 'TRIGGER_MANUAL_SYNC' }
  | { type: 'TOGGLE_KEEP_ALIVE'; payload: { enabled: boolean } }
  | { type: 'CLEAR_LOCAL_DATA' };

export type ExtensionResponse =
  | { success: true; data?: any }
  | { success: false; error: string };
