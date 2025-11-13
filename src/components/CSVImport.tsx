import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { csvImportService, type CSVImportResult } from '@/lib/csv-import';
import { useToast } from '@/hooks/use-toast';

interface CSVImportProps {
  type: 'student' | 'teacher';
  onImportComplete?: () => void;
}

export const CSVImport = ({ type, onImportComplete }: CSVImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const importResult = type === 'student'
        ? await csvImportService.importStudents(file)
        : await csvImportService.importTeachers(file);

      setResult(importResult);

      if (importResult.failed === 0) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${importResult.success} ${type}(s)`,
        });
        onImportComplete?.();
      } else {
        toast({
          title: 'Import Completed with Errors',
          description: `Imported ${importResult.success} ${type}(s), ${importResult.failed} failed`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'An error occurred during import',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = type === 'student'
      ? csvImportService.generateStudentTemplate()
      : csvImportService.generateTeacherTemplate();

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: `CSV template for ${type}s has been downloaded`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Import {type === 'student' ? 'Students' : 'Teachers'} from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import {type === 'student' ? 'students' : 'teachers'} into the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isImporting}
          />
          {file && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {file.name}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={isImporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-semibold">Import Results</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Successfully imported: {result.success}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="w-4 h-4 text-destructive" />
                <span>Failed: {result.failed}</span>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Errors:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <p key={index} className="text-xs text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">CSV Format Requirements:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            {type === 'student' ? (
              <>
                <li>Required columns: erp_number, name</li>
                <li>Optional columns: email, phone, department, year</li>
                <li>First row should contain column headers</li>
              </>
            ) : (
              <>
                <li>Required columns: name, email</li>
                <li>Optional columns: phone, department, subjects (comma-separated)</li>
                <li>First row should contain column headers</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

