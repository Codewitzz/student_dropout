import Papa from 'papaparse';
import { studentService, teacherService, authService, performanceService, riskService } from './database';
import type { Student, Teacher, StudentPerformance } from '@/types/database';

export interface CSVImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export const csvImportService = {
  async importStudents(file: File): Promise<CSVImportResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const errors: string[] = [];
          let success = 0;
          let failed = 0;

          for (const row of results.data as any[]) {
            try {
              // Validate required fields
              if (!row.erp_number || !row.name) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Missing required fields (erp_number, name)`);
                continue;
              }

              // Check if student already exists
              const existingStudent = await studentService.getByERP(row.erp_number);
              if (existingStudent) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Student with ERP ${row.erp_number} already exists`);
                continue;
              }

              const student: Omit<Student, 'id' | 'created_at' | 'updated_at'> = {
                erp_number: row.erp_number.trim(),
                name: row.name.trim(),
                email: row.email?.trim() || undefined,
                phone: row.phone?.trim() || undefined,
                department: row.department?.trim() || undefined,
                year: row.year ? parseInt(row.year) : undefined,
              };

              const createdStudent = await studentService.create(student);
              
              // Create auth user if email and password are provided
              if (row.email?.trim() && row.password?.trim()) {
                try {
                  await authService.signUp(
                    row.email.trim(), 
                    row.password.trim(), 
                    "student", 
                    createdStudent
                  );
                  success++;
                } catch (authError: any) {
                  // Student created but auth failed
                  console.warn(`Failed to create auth user for student ${row.erp_number}:`, authError.message);
                  errors.push(`Row ${results.data.indexOf(row) + 1}: Student created but auth account failed - ${authError.message}`);
                  success++; // Still count as success since student was created
                }
              } else {
                // Student created without auth account
                if (!row.email?.trim()) {
                  errors.push(`Row ${results.data.indexOf(row) + 1}: Student created but no email provided for login account`);
                } else if (!row.password?.trim()) {
                  errors.push(`Row ${results.data.indexOf(row) + 1}: Student created but no password provided for login account`);
                }
                success++;
              }
            } catch (error: any) {
              failed++;
              errors.push(`Row ${results.data.indexOf(row) + 1}: ${error.message || 'Unknown error'}`);
            }
          }

          resolve({ success, failed, errors });
        },
        error: (error) => {
          resolve({
            success: 0,
            failed: 0,
            errors: [`CSV parsing error: ${error.message}`],
          });
        },
      });
    });
  },

  async importTeachers(file: File): Promise<CSVImportResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const errors: string[] = [];
          let success = 0;
          let failed = 0;

          for (const row of results.data as any[]) {
            try {
              // Validate required fields
              if (!row.name || !row.email) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Missing required fields (name, email)`);
                continue;
              }

              // Check if teacher already exists
              const existingTeacher = await teacherService.getByEmail(row.email.trim());
              if (existingTeacher) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Teacher with email ${row.email} already exists`);
                continue;
              }

              const teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'> = {
                name: row.name.trim(),
                email: row.email.trim(),
                phone: row.phone?.trim() || undefined,
                department: row.department?.trim() || undefined,
                subjects: row.subjects ? row.subjects.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
              };

              const createdTeacher = await teacherService.create(teacher);
              
              // Create auth user if password is provided
              if (row.password?.trim()) {
                try {
                  await authService.signUp(
                    row.email.trim(), 
                    row.password.trim(), 
                    "teacher", 
                    createdTeacher
                  );
                  success++;
                } catch (authError: any) {
                  // Teacher created but auth failed
                  console.warn(`Failed to create auth user for teacher ${row.email}:`, authError.message);
                  errors.push(`Row ${results.data.indexOf(row) + 1}: Teacher created but auth account failed - ${authError.message}`);
                  success++; // Still count as success since teacher was created
                }
              } else {
                // Teacher created without auth account
                errors.push(`Row ${results.data.indexOf(row) + 1}: Teacher created but no password provided for login account`);
                success++;
              }
            } catch (error: any) {
              failed++;
              errors.push(`Row ${results.data.indexOf(row) + 1}: ${error.message || 'Unknown error'}`);
            }
          }

          resolve({ success, failed, errors });
        },
        error: (error) => {
          resolve({
            success: 0,
            failed: 0,
            errors: [`CSV parsing error: ${error.message}`],
          });
        },
      });
    });
  },

  generateStudentTemplate(): string {
    const headers = ['erp_number', 'name', 'email', 'password', 'phone', 'department', 'year'];
    const example = ['2021001', 'John Doe', 'john@example.com', 'password123', '1234567890', 'Computer Science', '3'];
    return [headers.join(','), example.join(',')].join('\n');
  },

  generateTeacherTemplate(): string {
    const headers = ['name', 'email', 'password', 'phone', 'department', 'subjects'];
    const example = ['Dr. Jane Smith', 'jane@example.com', 'password123', '1234567890', 'Computer Science', 'DBMS,Networks'];
    return [headers.join(','), example.join(',')].join('\n');
  },

  async importStudentPerformance(file: File, teacherId?: string, teacherDepartment?: string): Promise<CSVImportResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const errors: string[] = [];
          let success = 0;
          let failed = 0;

          // Get teacher's department if teacherId is provided
          let teacherDept = teacherDepartment;
          if (teacherId && !teacherDept) {
            try {
              const teacher = await teacherService.getById(teacherId);
              teacherDept = teacher.department;
            } catch (error) {
              console.warn('Could not fetch teacher department:', error);
            }
          }

          for (const row of results.data as any[]) {
            try {
              // Validate required fields
              if (!row.erp_number || !row.subject || row.marks === undefined || row.attendance === undefined) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Missing required fields (erp_number, subject, marks, attendance)`);
                continue;
              }

              // Get student by ERP number
              const student = await studentService.getByERP(row.erp_number.trim());
              if (!student) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Student with ERP ${row.erp_number} not found`);
                continue;
              }

              // Check department match if teacher department is known
              if (teacherDept && student.department && student.department !== teacherDept) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Student ${row.erp_number} belongs to ${student.department}, not your department (${teacherDept})`);
                continue;
              }

              // Parse numeric values
              const marks = parseFloat(row.marks);
              const attendance = parseFloat(row.attendance);
              
              if (isNaN(marks) || marks < 0 || marks > 100) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Invalid marks value (must be 0-100)`);
                continue;
              }

              if (isNaN(attendance) || attendance < 0 || attendance > 100) {
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Invalid attendance value (must be 0-100)`);
                continue;
              }

              const performanceData: Omit<StudentPerformance, 'id' | 'created_at' | 'updated_at'> = {
                student_id: student.id,
                subject: row.subject.trim(),
                marks,
                attendance,
                backlogs: row.backlogs ? parseInt(row.backlogs) || 0 : 0,
                internal_marks: row.internal_marks ? parseFloat(row.internal_marks) : undefined,
                semester: row.semester ? parseInt(row.semester) : undefined,
                teacher_id: teacherId,
                // AI Prediction Fields
                assignment_completion: row.assignment_completion ? parseFloat(row.assignment_completion) : undefined,
                class_participation: row.class_participation && ['Low', 'Medium', 'High'].includes(row.class_participation) 
                  ? row.class_participation as 'Low' | 'Medium' | 'High' 
                  : undefined,
                motivation_level: row.motivation_level && ['Low', 'Medium', 'High'].includes(row.motivation_level)
                  ? row.motivation_level as 'Low' | 'Medium' | 'High'
                  : undefined,
                stress_level: row.stress_level && ['Low', 'Medium', 'High'].includes(row.stress_level)
                  ? row.stress_level as 'Low' | 'Medium' | 'High'
                  : undefined,
                teacher_remark: row.teacher_remark?.trim() || undefined,
                past_failures: row.past_failures ? parseInt(row.past_failures) || 0 : undefined,
              };

              // Check if performance record exists for this student and subject
              const existingPerf = await performanceService.getByStudent(student.id);
              const existing = existingPerf.find((p: any) => p.subject === performanceData.subject);

              if (existing) {
                // Update existing record
                await performanceService.update(existing.id, performanceData);
              } else {
                // Create new record
                await performanceService.create(performanceData);
              }

              // Recalculate risk assessment for the student
              try {
                await riskService.calculateRisk(student.id);
              } catch (riskError) {
                console.warn(`Failed to recalculate risk for student ${row.erp_number}:`, riskError);
              }

              success++;
            } catch (error: any) {
              failed++;
              errors.push(`Row ${results.data.indexOf(row) + 1}: ${error.message || 'Unknown error'}`);
            }
          }

          resolve({ success, failed, errors });
        },
        error: (error) => {
          resolve({
            success: 0,
            failed: 0,
            errors: [`CSV parsing error: ${error.message}`],
          });
        },
      });
    });
  },

  generatePerformanceTemplate(): string {
    const headers = [
      'erp_number',
      'subject',
      'marks',
      'attendance',
      'backlogs',
      'internal_marks',
      'semester',
      'assignment_completion',
      'class_participation',
      'motivation_level',
      'stress_level',
      'teacher_remark',
      'past_failures'
    ];
    const example = [
      '2021001',
      'DBMS',
      '75.5',
      '85.0',
      '0',
      '80',
      '3',
      '90',
      'High',
      'Medium',
      'Low',
      'Good performance',
      '0'
    ];
    return [headers.join(','), example.join(',')].join('\n');
  },
};

