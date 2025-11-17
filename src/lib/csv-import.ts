import Papa from 'papaparse';
import { studentService, teacherService, authService } from './database';
import type { Student, Teacher } from '@/types/database';

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
};

