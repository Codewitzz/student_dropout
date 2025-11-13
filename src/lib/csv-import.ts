import Papa from 'papaparse';
import { studentService, teacherService } from './database';
import type { Student, Teacher } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

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
              try {
                await studentService.getByERP(row.erp_number);
                failed++;
                errors.push(`Row ${results.data.indexOf(row) + 1}: Student with ERP ${row.erp_number} already exists`);
                continue;
              } catch {
                // Student doesn't exist, proceed with creation
              }

              const student: Omit<Student, 'id' | 'created_at' | 'updated_at'> = {
                erp_number: row.erp_number.trim(),
                name: row.name.trim(),
                email: row.email?.trim() || undefined,
                phone: row.phone?.trim() || undefined,
                department: row.department?.trim() || undefined,
                year: row.year ? parseInt(row.year) : undefined,
              };

              await studentService.create(student);
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
              try {
                const existing = await teacherService.getAll();
                const found = existing.find(t => t.email === row.email.trim());
                if (found) {
                  failed++;
                  errors.push(`Row ${results.data.indexOf(row) + 1}: Teacher with email ${row.email} already exists`);
                  continue;
                }
              } catch {
                // Continue if check fails
              }

              const teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'> = {
                name: row.name.trim(),
                email: row.email.trim(),
                phone: row.phone?.trim() || undefined,
                department: row.department?.trim() || undefined,
                subjects: row.subjects ? row.subjects.split(',').map((s: string) => s.trim()) : [],
              };

              await teacherService.create(teacher);
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

  generateStudentTemplate(): string {
    const headers = ['erp_number', 'name', 'email', 'phone', 'department', 'year'];
    const example = ['2021001', 'John Doe', 'john@example.com', '1234567890', 'Computer Science', '3'];
    return [headers.join(','), example.join(',')].join('\n');
  },

  generateTeacherTemplate(): string {
    const headers = ['name', 'email', 'phone', 'department', 'subjects'];
    const example = ['Dr. Jane Smith', 'jane@example.com', '1234567890', 'Computer Science', 'DBMS,Networks'];
    return [headers.join(','), example.join(',')].join('\n');
  },
};

