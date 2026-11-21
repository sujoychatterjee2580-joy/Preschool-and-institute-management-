export type Currency = 'INR' | 'BDT' | 'USD';

export interface DashboardMetrics {
  totalStudents: number;
  activeStudents: number;
  monthlyRevenue: number;
  totalCollected: number;
  totalPendingFees: number;
  todayAttendanceRate: number;
  presentCount: number;
  absentCount: number;
  highRiskStudentsCount: number;
  newInquiriesThisWeek: number;
}

export interface ChurnPredictionResult {
  score: number; // 0 to 100
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  suggestedAction: string;
}

export interface DiaryEntryInput {
  studentId: string;
  mood: 'HAPPY' | 'CALM' | 'PLAYFUL' | 'CRANKY' | 'TIRED';
  mealIntake: 'FINISHED_ALL' | 'ATE_HALF' | 'LITTLE' | 'SKIPPED';
  napMinutes: number;
  pottyCount: number;
  activities: string;
  notes?: string;
}

export interface AdmissionMessageInput {
  senderPhone: string;
  senderName?: string;
  incomingText: string;
}
