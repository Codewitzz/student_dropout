export type UserRole = 'student' | 'teacher' | 'hod';

export interface Student {
  id: string;
  erp_number: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: number;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  subjects?: string[];
  created_at: string;
  updated_at: string;
}

export interface HOD {
  id: string;
  name: string;
  email: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  user_id: string; // Reference to student/teacher/hod id
  created_at: string;
}

export interface StudentPerformance {
  id: string;
  student_id: string;
  subject: string;
  marks: number;
  attendance: number;
  backlogs: number;
  internal_marks?: number;
  semester?: number;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  student_id: string;
  risk_level: 'High' | 'Medium' | 'Low';
  risk_score: number;
  factors: string[];
  created_at: string;
  updated_at: string;
}

export interface CounselingSession {
  id: string;
  student_id: string;
  teacher_id?: string;
  hod_id?: string;
  before_risk_level: 'High' | 'Medium' | 'Low';
  after_risk_level?: 'High' | 'Medium' | 'Low';
  status: 'Scheduled' | 'Completed' | 'Improved' | 'Not Improved';
  notes?: string;
  created_at: string;
  updated_at: string;
}

