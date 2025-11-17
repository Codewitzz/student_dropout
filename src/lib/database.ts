import { supabase } from './supabase';
import type { Student, Teacher, HOD, StudentPerformance, RiskAssessment, CounselingSession, UserRole, AIRiskPrediction } from '@/types/database';
import { handleDatabaseError, getErrorMessage } from './database-utils';

// ==================== Authentication ====================

export const authService = {
  async signUp(email: string, password: string, role: UserRole, userData: any) {
    try {
      // Validate inputs
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (!userData || !userData.id) {
        throw new Error('User data is required');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Disable email confirmation if you want users to be immediately available
          // Note: You may need to configure this in Supabase Dashboard > Authentication > Settings
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new Error(authError.message || 'Failed to create authentication account');
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user - no user data returned');
      }

      // Wait a bit to ensure auth user is fully created in database
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user record already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (existingUser) {
        // User record already exists, update it instead
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: email.trim(),
            role,
            user_id: userData.id,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('User record update error:', updateError);
          throw new Error(`Failed to update user record: ${updateError.message || 'Unknown error'}`);
        }
      } else {
        // Create user record in users table with retry logic
        let retries = 3;
        let userError: any = null;
        
        while (retries > 0) {
          const { error } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: email.trim(),
              role,
              user_id: userData.id,
            });

          if (!error) {
            userError = null;
            break;
          }

          // If it's a foreign key constraint error, wait and retry
          if (error.code === '23503' && retries > 1) {
            console.log(`Retrying user record creation (${retries} attempts left)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
            userError = error;
          } else {
            userError = error;
            break;
          }
        }

        if (userError) {
          console.error('User record creation error:', userError);
          throw new Error(`Failed to create user record: ${userError.message || 'Unknown error'}`);
        }
      }
      
      return authData;
    } catch (error: any) {
      console.error('Error in authService.signUp:', error);
      throw error;
    }
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

  async getNextERPNumber(): Promise<string> {
    try {
      // Get all students to find the highest ERP number
      const { data, error } = await supabase
        .from('students')
        .select('erp_number');
      
      if (error) {
        console.error('Error fetching ERP numbers:', error);
        // Default to starting number if error
        return '2021001';
      }
      
      if (!data || data.length === 0) {
        // No students exist, start with default format: 2021001
        return '2021001';
      }
      
      // Extract all numeric parts and find the maximum
      let maxNumber = 2021000; // Start from base to handle default format
      let prefix = '';
      let numberLength = 7; // Default length for format like 2021001
      
      for (const student of data) {
        const erp = student.erp_number;
        // Extract numeric part from end (handles formats like "2021001", "ERP2021001", etc.)
        const numericMatch = erp.match(/(\d+)$/);
        if (numericMatch) {
          const number = parseInt(numericMatch[1]);
          if (number > maxNumber) {
            maxNumber = number;
            // Preserve prefix if exists
            prefix = erp.replace(/\d+$/, '');
            // Preserve number length for padding
            numberLength = numericMatch[1].length;
          }
        }
      }
      
      // Generate next sequential number
      const nextNumber = maxNumber + 1;
      
      // Format the number with proper padding
      const paddedNumber = nextNumber.toString().padStart(numberLength, '0');
      
      // If we found a prefix, use it; otherwise return just the number
      if (prefix) {
        return `${prefix}${paddedNumber}`;
      } else {
        return paddedNumber;
      }
    } catch (error: any) {
      console.error('Error generating next ERP number:', error);
      // Default fallback
      return '2021001';
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        const errorInfo = handleDatabaseError(error, 'getById student');
        throw new Error(errorInfo.message);
      }
      
      if (!data) {
        throw new Error(`Student with ID ${id} not found`);
      }
      
      return data as Student;
    } catch (error: any) {
      console.error('Error in studentService.getById:', error);
      throw error;
    }
  },

  async getByERP(erp: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('erp_number', erp)
        .maybeSingle(); // Use maybeSingle() instead of single() to return null if not found
      
      if (error) {
        const errorInfo = handleDatabaseError(error, 'getByERP');
        throw new Error(errorInfo.message);
      }
      
      return data as Student | null;
    } catch (error: any) {
      console.error('Error in studentService.getByERP:', error);
      // Return null on error instead of throwing to allow graceful handling
      return null;
    }
  },

  async create(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert({
          ...student,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        const errorInfo = handleDatabaseError(error, 'create student');
        throw new Error(errorInfo.message);
      }
      
      return data as Student;
    } catch (error: any) {
      console.error('Error in studentService.create:', error);
      throw error;
    }
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

  async getByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        // If no rows found, that's okay - return null instead of throwing
        if (error.code === 'PGRST116') {
          return null;
        }
        const errorInfo = handleDatabaseError(error, 'getByEmail');
        throw new Error(errorInfo.message);
      }
      
      return data as Teacher;
    } catch (error: any) {
      console.error('Error in teacherService.getByEmail:', error);
      throw error;
    }
  },

  async create(teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .insert({
          ...teacher,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        const errorInfo = handleDatabaseError(error, 'create teacher');
        throw new Error(errorInfo.message);
      }
      
      return data as Teacher;
    } catch (error: any) {
      console.error('Error in teacherService.create:', error);
      throw error;
    }
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
  // AI-Based Risk Prediction using 7 Minimum Data Points
  async calculateRisk(studentId: string): Promise<AIRiskPrediction> {
    // Get all performance data for student
    const performances = await performanceService.getByStudent(studentId);
    
    if (performances.length === 0) {
      return {
        risk_level: 'Low',
        risk_score: 0,
        factors: [],
        weak_subjects: [],
        improvement_suggestions: ['No performance data available. Please add student performance data.'],
        detailed_report: {
          marks_analysis: 'No marks data available.',
          attendance_analysis: 'No attendance data available.',
          assignment_analysis: 'No assignment data available.',
          behavior_analysis: 'No behavior data available.',
          motivation_analysis: 'No motivation data available.',
          stress_analysis: 'No stress data available.',
          teacher_feedback_summary: 'No teacher feedback available.',
          failure_history_analysis: 'No failure history available.',
        },
      };
    }

    // Calculate averages and collect data
    const avgMarks = performances.reduce((sum, p) => sum + p.marks, 0) / performances.length;
    const avgAttendance = performances.reduce((sum, p) => sum + p.attendance, 0) / performances.length;
    const avgAssignmentCompletion = performances
      .filter(p => p.assignment_completion !== undefined)
      .reduce((sum, p) => sum + (p.assignment_completion || 0), 0) / 
      (performances.filter(p => p.assignment_completion !== undefined).length || 1);
    
    const totalBacklogs = performances.reduce((sum, p) => sum + (p.backlogs || 0), 0);
    const totalPastFailures = performances.reduce((sum, p) => sum + (p.past_failures || 0), 0);
    
    // Get latest performance data for detailed analysis
    const latestPerf = performances[0];
    
    // Identify weak subjects (marks < 50)
    const weakSubjects = performances
      .filter(p => p.marks < 50)
      .map(p => p.subject);

    // Risk calculation using 7 data points
    let riskScore = 0;
    const factors: string[] = [];

    // 1. MARKS (Latest exam score)
    if (latestPerf.marks < 50) {
      riskScore += 25;
      factors.push(`Low marks (${latestPerf.marks}%)`);
    } else if (latestPerf.marks < 60) {
      riskScore += 15;
      factors.push(`Below average marks (${latestPerf.marks}%)`);
    }

    // 2. ATTENDANCE (Below 75% = high risk)
    if (latestPerf.attendance < 75) {
      riskScore += 20;
      factors.push(`Low attendance (${latestPerf.attendance}%)`);
    } else if (latestPerf.attendance < 85) {
      riskScore += 10;
      factors.push(`Below average attendance (${latestPerf.attendance}%)`);
    }

    // 3. ASSIGNMENT COMPLETION
    if (latestPerf.assignment_completion !== undefined) {
      if (latestPerf.assignment_completion < 50) {
        riskScore += 15;
        factors.push(`Low assignment completion (${latestPerf.assignment_completion}%)`);
      } else if (latestPerf.assignment_completion < 70) {
        riskScore += 8;
        factors.push(`Below average assignment completion (${latestPerf.assignment_completion}%)`);
      }
    }

    // 4. CLASS PARTICIPATION (Behavior)
    if (latestPerf.class_participation === 'Low') {
      riskScore += 12;
      factors.push('Low class participation');
    } else if (latestPerf.class_participation === 'Medium') {
      riskScore += 6;
      factors.push('Medium class participation');
    }

    // 5. MOTIVATION LEVEL
    if (latestPerf.motivation_level === 'Low') {
      riskScore += 15;
      factors.push('Low motivation level');
    } else if (latestPerf.motivation_level === 'Medium') {
      riskScore += 7;
      factors.push('Medium motivation level');
    }

    // 6. STRESS LEVEL
    if (latestPerf.stress_level === 'High') {
      riskScore += 10;
      factors.push('High stress level');
    } else if (latestPerf.stress_level === 'Medium') {
      riskScore += 5;
      factors.push('Medium stress level');
    }

    // 7. PAST FAILURES
    if (totalPastFailures > 0 || totalBacklogs > 0) {
      const totalFailures = totalPastFailures + totalBacklogs;
      riskScore += Math.min(totalFailures * 8, 20); // Cap at 20 points
      factors.push(`${totalFailures} past failure(s)/backlog(s)`);
    }

    // Determine risk level
    let risk_level: 'High' | 'Medium' | 'Low';
    if (riskScore >= 60) {
      risk_level = 'High';
    } else if (riskScore >= 30) {
      risk_level = 'Medium';
    } else {
      risk_level = 'Low';
    }

    // Generate detailed analysis
    const detailed_report = {
      marks_analysis: latestPerf.marks < 50 
        ? `Critical: Latest marks are ${latestPerf.marks}%, which is below passing threshold. Immediate intervention needed.`
        : latestPerf.marks < 60
        ? `Warning: Latest marks are ${latestPerf.marks}%, below average. Needs improvement.`
        : `Good: Latest marks are ${latestPerf.marks}%, within acceptable range.`,
      
      attendance_analysis: latestPerf.attendance < 75
        ? `Critical: Attendance is ${latestPerf.attendance}%, below minimum requirement of 75%. High dropout risk.`
        : latestPerf.attendance < 85
        ? `Warning: Attendance is ${latestPerf.attendance}%, below recommended 85%.`
        : `Good: Attendance is ${latestPerf.attendance}%, maintaining good presence.`,
      
      assignment_analysis: latestPerf.assignment_completion !== undefined
        ? latestPerf.assignment_completion < 50
          ? `Critical: Assignment completion is ${latestPerf.assignment_completion}%. Student is not submitting work regularly.`
          : latestPerf.assignment_completion < 70
          ? `Warning: Assignment completion is ${latestPerf.assignment_completion}%, needs improvement.`
          : `Good: Assignment completion is ${latestPerf.assignment_completion}%, showing consistent work.`
        : 'No assignment completion data available.',
      
      behavior_analysis: latestPerf.class_participation === 'Low'
        ? 'Critical: Low class participation indicates disengagement. Student may be losing interest.'
        : latestPerf.class_participation === 'Medium'
        ? 'Warning: Medium class participation. Student needs encouragement to engage more.'
        : latestPerf.class_participation === 'High'
        ? 'Good: High class participation shows active engagement in learning.'
        : 'No class participation data available.',
      
      motivation_analysis: latestPerf.motivation_level === 'Low'
        ? 'Critical: Low motivation level is a major risk factor for dropout. Needs immediate counseling.'
        : latestPerf.motivation_level === 'Medium'
        ? 'Warning: Medium motivation. Student may need support and encouragement.'
        : latestPerf.motivation_level === 'High'
        ? 'Good: High motivation level indicates student is engaged and committed.'
        : 'No motivation data available.',
      
      stress_analysis: latestPerf.stress_level === 'High'
        ? 'Warning: High stress level may impact academic performance. Consider counseling support.'
        : latestPerf.stress_level === 'Medium'
        ? 'Moderate: Medium stress level. Monitor and provide support as needed.'
        : latestPerf.stress_level === 'Low'
        ? 'Good: Low stress level indicates healthy academic environment.'
        : 'No stress data available.',
      
      teacher_feedback_summary: latestPerf.teacher_remark
        ? `Teacher Feedback: "${latestPerf.teacher_remark}"`
        : 'No teacher feedback available. Please add teacher remarks for better assessment.',
      
      failure_history_analysis: totalPastFailures > 0 || totalBacklogs > 0
        ? `Warning: Student has ${totalPastFailures + totalBacklogs} past failure(s)/backlog(s). This indicates recurring academic difficulties.`
        : 'Good: No past failures or backlogs recorded. Student maintains clean academic record.',
    };

    // Generate AI-powered improvement suggestions
    const improvement_suggestions: string[] = [];
    
    if (latestPerf.marks < 50) {
      improvement_suggestions.push(`Focus on improving marks in ${latestPerf.subject}. Current score: ${latestPerf.marks}%. Target: 60%+.`);
    }
    if (latestPerf.attendance < 75) {
      improvement_suggestions.push(`Improve attendance immediately. Current: ${latestPerf.attendance}%. Minimum required: 75%.`);
    }
    if (latestPerf.assignment_completion !== undefined && latestPerf.assignment_completion < 70) {
      improvement_suggestions.push(`Complete all assignments on time. Current completion rate: ${latestPerf.assignment_completion}%.`);
    }
    if (latestPerf.class_participation === 'Low') {
      improvement_suggestions.push('Increase class participation. Ask questions, participate in discussions, and engage with teachers.');
    }
    if (latestPerf.motivation_level === 'Low') {
      improvement_suggestions.push('Seek counseling or mentorship to improve motivation. Connect with academic advisors.');
    }
    if (latestPerf.stress_level === 'High') {
      improvement_suggestions.push('Manage stress through time management, breaks, and seeking support from counselors.');
    }
    if (totalBacklogs > 0 || totalPastFailures > 0) {
      improvement_suggestions.push(`Clear ${totalBacklogs + totalPastFailures} backlog(s) before end of semester to avoid year drop.`);
    }
    if (weakSubjects.length > 0) {
      improvement_suggestions.push(`Focus on weak subjects: ${weakSubjects.join(', ')}. Seek extra help and practice regularly.`);
    }
    
    if (improvement_suggestions.length === 0) {
      improvement_suggestions.push('Continue maintaining current performance. Keep up the good work!');
    }

    // Save or update risk assessment
    const existing = await supabase
      .from('risk_assessments')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    const riskData = {
      student_id: studentId,
      risk_level,
      risk_score: Math.min(riskScore, 100), // Cap at 100
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

    return {
      risk_level,
      risk_score: Math.min(riskScore, 100),
      factors,
      weak_subjects: weakSubjects,
      improvement_suggestions,
      detailed_report,
    };
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

