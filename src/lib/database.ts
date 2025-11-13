import { supabase } from './supabase';
import type { Student, Teacher, HOD, StudentPerformance, RiskAssessment, CounselingSession, UserRole } from '@/types/database';
import { handleDatabaseError, getErrorMessage } from './database-utils';

// ==================== Authentication ====================

export const authService = {
  async signUp(email: string, password: string, role: UserRole, userData: any) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role,
        user_id: userData.id,
      });

    if (userError) throw userError;
    return authData;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getCurrentUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('role, user_id')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== Students ====================

export const studentService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        const errorInfo = handleDatabaseError(error, 'getAll students');
        console.error('Failed to fetch students:', errorInfo);
        throw new Error(errorInfo.message);
      }
      
      return (data || []) as Student[];
    } catch (error: any) {
      console.error('Error in studentService.getAll:', error);
      throw error;
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Student;
  },

  async getByERP(erp: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('erp_number', erp)
        .single();
      
      if (error) {
        // If no rows found, that's okay - return null instead of throwing
        if (error.code === 'PGRST116') {
          return null;
        }
        const errorInfo = handleDatabaseError(error, 'getByERP');
        throw new Error(errorInfo.message);
      }
      
      return data as Student;
    } catch (error: any) {
      console.error('Error in studentService.getByERP:', error);
      throw error;
    }
  },

  async create(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        ...student,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as Student;
  },

  async update(id: string, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Student;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async bulkCreate(students: Omit<Student, 'id' | 'created_at' | 'updated_at'>[]) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('students')
      .insert(
        students.map(s => ({
          ...s,
          created_at: now,
          updated_at: now,
        }))
      )
      .select();
    if (error) throw error;
    return data as Student[];
  },
};

// ==================== Teachers ====================

export const teacherService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        const errorInfo = handleDatabaseError(error, 'getAll teachers');
        console.error('Failed to fetch teachers:', errorInfo);
        throw new Error(errorInfo.message);
      }
      
      return (data || []) as Teacher[];
    } catch (error: any) {
      console.error('Error in teacherService.getAll:', error);
      throw error;
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Teacher;
  },

  async create(teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('teachers')
      .insert({
        ...teacher,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as Teacher;
  },

  async update(id: string, updates: Partial<Teacher>) {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Teacher;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async bulkCreate(teachers: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>[]) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('teachers')
      .insert(
        teachers.map(t => ({
          ...t,
          created_at: now,
          updated_at: now,
        }))
      )
      .select();
    if (error) throw error;
    return data as Teacher[];
  },
};

// ==================== HODs ====================

export const hodService = {
  async getAll() {
    const { data, error } = await supabase
      .from('hods')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as HOD[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('hods')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as HOD;
  },

  async create(hod: Omit<HOD, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('hods')
      .insert({
        ...hod,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as HOD;
  },
};

// ==================== Student Performance ====================

export const performanceService = {
  async getByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('student_performance')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as StudentPerformance[];
  },

  async getBySubject(subject: string) {
    const { data, error } = await supabase
      .from('student_performance')
      .select('*, students(*)')
      .eq('subject', subject)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(performance: Omit<StudentPerformance, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('student_performance')
      .insert({
        ...performance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as StudentPerformance;
  },

  async update(id: string, updates: Partial<StudentPerformance>) {
    const { data, error } = await supabase
      .from('student_performance')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as StudentPerformance;
  },
};

// ==================== Risk Assessment ====================

export const riskService = {
  async calculateRisk(studentId: string) {
    // Get all performance data for student
    const performances = await performanceService.getByStudent(studentId);
    
    if (performances.length === 0) {
      return { risk_level: 'Low' as const, risk_score: 0, factors: [] };
    }

    // Calculate average marks and attendance
    const avgMarks = performances.reduce((sum, p) => sum + p.marks, 0) / performances.length;
    const avgAttendance = performances.reduce((sum, p) => sum + p.attendance, 0) / performances.length;
    const totalBacklogs = performances.reduce((sum, p) => sum + p.backlogs, 0);

    // Risk calculation logic
    let riskScore = 0;
    const factors: string[] = [];

    if (avgMarks < 50) {
      riskScore += 40;
      factors.push('Low marks');
    } else if (avgMarks < 60) {
      riskScore += 20;
      factors.push('Below average marks');
    }

    if (avgAttendance < 75) {
      riskScore += 30;
      factors.push('Low attendance');
    } else if (avgAttendance < 85) {
      riskScore += 15;
      factors.push('Below average attendance');
    }

    if (totalBacklogs > 0) {
      riskScore += totalBacklogs * 10;
      factors.push(`${totalBacklogs} backlog(s)`);
    }

    let risk_level: 'High' | 'Medium' | 'Low';
    if (riskScore >= 60) {
      risk_level = 'High';
    } else if (riskScore >= 30) {
      risk_level = 'Medium';
    } else {
      risk_level = 'Low';
    }

    // Save or update risk assessment
    const existing = await supabase
      .from('risk_assessments')
      .select('id')
      .eq('student_id', studentId)
      .single();

    const riskData = {
      student_id: studentId,
      risk_level,
      risk_score: riskScore,
      factors,
      updated_at: new Date().toISOString(),
    };

    if (existing.data) {
      await supabase
        .from('risk_assessments')
        .update(riskData)
        .eq('id', existing.data.id);
    } else {
      await supabase
        .from('risk_assessments')
        .insert({
          ...riskData,
          created_at: new Date().toISOString(),
        });
    }

    return { risk_level, risk_score: riskScore, factors };
  },

  async getAllRisks() {
    try {
      const { data, error } = await supabase
        .from('risk_assessments')
        .select('*, students(*)')
        .order('risk_score', { ascending: false });
      
      if (error) {
        const errorInfo = handleDatabaseError(error, 'getAllRisks');
        console.error('Failed to fetch risks:', errorInfo);
        // Return empty array instead of throwing to prevent dashboard crash
        return [];
      }
      
      return data || [];
    } catch (error: any) {
      console.error('Error in riskService.getAllRisks:', error);
      return [];
    }
  },

  async getRiskSummary() {
    try {
      const risks = await this.getAllRisks();
      return {
        high: risks.filter((r: any) => r.risk_level === 'High').length,
        medium: risks.filter((r: any) => r.risk_level === 'Medium').length,
        low: risks.filter((r: any) => r.risk_level === 'Low').length,
      };
    } catch (error: any) {
      console.error('Error in getRiskSummary:', error);
      // Return empty summary if there's an error
      return {
        high: 0,
        medium: 0,
        low: 0,
      };
    }
  },
};

// ==================== Counseling ====================

export const counselingService = {
  async getAll() {
    const { data, error } = await supabase
      .from('counseling_sessions')
      .select('*, students(*), teachers(*), hods(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(session: Omit<CounselingSession, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('counseling_sessions')
      .insert({
        ...session,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as CounselingSession;
  },

  async update(id: string, updates: Partial<CounselingSession>) {
    const { data, error } = await supabase
      .from('counseling_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as CounselingSession;
  },
};

