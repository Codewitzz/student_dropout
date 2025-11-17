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
  // AI Prediction Fields (7 Minimum Data Points)
  assignment_completion?: number; // 0-100%
  class_participation?: 'Low' | 'Medium' | 'High';
  motivation_level?: 'Low' | 'Medium' | 'High';
  stress_level?: 'Low' | 'Medium' | 'High';
  teacher_remark?: string;
  past_failures?: number;
  created_at: string;
  updated_at: string;
}

export interface AIRiskPrediction {
  risk_level: 'High' | 'Medium' | 'Low';
  risk_score: number; // 0-100
  factors: string[];
  weak_subjects: string[];
  improvement_suggestions: string[];
  detailed_report: {
    marks_analysis: string;
    attendance_analysis: string;
    assignment_analysis: string;
    behavior_analysis: string;
    motivation_analysis: string;
    stress_analysis: string;
    teacher_feedback_summary: string;
    failure_history_analysis: string;
  };
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

