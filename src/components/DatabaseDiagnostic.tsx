import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Database, Users, BookOpen, TrendingUp } from 'lucide-react';
import { testDatabaseConnection, verifyTable, checkAuthentication } from '@/lib/database-utils';
import { supabase } from '@/lib/supabase';

export const DatabaseDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const connectionTest = await testDatabaseConnection();
      const authCheck = await checkAuthentication();
      
      // Check all tables
      const tableChecks = await Promise.all([
        verifyTable('students'),
        verifyTable('teachers'),
        verifyTable('hods'),
        verifyTable('users'),
        verifyTable('student_performance'),
        verifyTable('risk_assessments'),
        verifyTable('counseling_sessions'),
      ]);

      // Get detailed statistics
      const [studentsData, teachersData, hodsData, usersData, performanceData, risksData, counselingData] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact' }),
        supabase.from('teachers').select('*', { count: 'exact' }),
        supabase.from('hods').select('*', { count: 'exact' }),
        supabase.from('users').select('*', { count: 'exact' }),
        supabase.from('student_performance').select('*', { count: 'exact' }),
        supabase.from('risk_assessments').select('*', { count: 'exact' }),
        supabase.from('counseling_sessions').select('*', { count: 'exact' }),
      ]);

      setResults({
        connection: connectionTest,
        authentication: authCheck,
        tables: {
          students: { ...tableChecks[0], data: studentsData.data || [], count: studentsData.count || 0 },
          teachers: { ...tableChecks[1], data: teachersData.data || [], count: teachersData.count || 0 },
          hods: { ...tableChecks[2], data: hodsData.data || [], count: hodsData.count || 0 },
          users: { ...tableChecks[3], data: usersData.data || [], count: usersData.count || 0 },
          student_performance: { ...tableChecks[4], data: performanceData.data || [], count: performanceData.count || 0 },
          risk_assessments: { ...tableChecks[5], data: risksData.data || [], count: risksData.count || 0 },
          counseling_sessions: { ...tableChecks[6], data: counselingData.data || [], count: counselingData.count || 0 },
        },
      });
    } catch (error: any) {
      setResults({
        error: error.message || 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Diagnostic Tool</CardTitle>
        <CardDescription>
          Test your database connection and verify table access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            'Run Diagnostics'
          )}
        </Button>

        {results && (
          <div className="space-y-4">
            {/* Connection Test */}
            {results.connection && (
              <Alert variant={results.connection.success ? 'default' : 'destructive'}>
                <div className="flex items-center gap-2">
                  {results.connection.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <AlertTitle>Connection Test</AlertTitle>
                </div>
                <AlertDescription>
                  {results.connection.success
                    ? 'Database connection successful'
                    : results.connection.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Authentication */}
            {results.authentication && (
              <Alert variant={results.authentication.authenticated ? 'default' : 'destructive'}>
                <div className="flex items-center gap-2">
                  {results.authentication.authenticated ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <AlertTitle>Authentication</AlertTitle>
                </div>
                <AlertDescription>
                  {results.authentication.authenticated
                    ? 'User is authenticated'
                    : 'Not authenticated - this may affect data access'}
                </AlertDescription>
              </Alert>
            )}

            {/* Tables Overview */}
            {results.tables && (
              <div className="space-y-4">
                <h4 className="font-semibold">Table Status & Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(results.tables).map(([tableName, check]: [string, any]) => (
                    <Card key={tableName} className={check.accessible ? 'border-success' : 'border-destructive'}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-mono">{tableName}</CardTitle>
                          {check.accessible ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {check.accessible ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Row Count:</span>
                              <Badge variant="secondary">{check.count || check.rowCount || 0}</Badge>
                            </div>
                            {check.error && (
                              <p className="text-xs text-destructive">{check.error}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-destructive">{check.error || 'Not accessible'}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Table Data */}
            {results.tables && (
              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="students" className="text-xs">
                    <Database className="w-3 h-3 mr-1" />
                    Students
                  </TabsTrigger>
                  <TabsTrigger value="teachers" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Teachers
                  </TabsTrigger>
                  <TabsTrigger value="hods" className="text-xs">HODs</TabsTrigger>
                  <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
                  <TabsTrigger value="performance" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="risks" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Risks
                  </TabsTrigger>
                  <TabsTrigger value="counseling" className="text-xs">Counseling</TabsTrigger>
                </TabsList>

                {Object.entries(results.tables).map(([tableName, tableInfo]: [string, any]) => {
                  const tabValue = tableName === 'student_performance' ? 'performance' 
                    : tableName === 'risk_assessments' ? 'risks'
                    : tableName === 'counseling_sessions' ? 'counseling'
                    : tableName;
                  
                  if (!tableInfo.accessible || !tableInfo.data || tableInfo.data.length === 0) {
                    return (
                      <TabsContent key={tableName} value={tabValue}>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                              {tableInfo.error ? `Error: ${tableInfo.error}` : 'No data available'}
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    );
                  }

                  const columns = Object.keys(tableInfo.data[0] || {});
                  
                  return (
                    <TabsContent key={tableName} value={tabValue}>
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{tableName}</CardTitle>
                            <Badge variant="secondary">{tableInfo.count || tableInfo.data.length} rows</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md border max-h-96 overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {columns.map((col) => (
                                    <TableHead key={col} className="text-xs">{col}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tableInfo.data.slice(0, 10).map((row: any, idx: number) => (
                                  <TableRow key={idx}>
                                    {columns.map((col) => (
                                      <TableCell key={col} className="text-xs">
                                        {typeof row[col] === 'object' 
                                          ? JSON.stringify(row[col]).substring(0, 50) + '...'
                                          : String(row[col] || '-').substring(0, 30)}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {tableInfo.data.length > 10 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Showing first 10 of {tableInfo.data.length} rows
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}

            {/* Error */}
            {results.error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{results.error}</AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {results.tables && Object.values(results.tables).some((t: any) => !t.accessible) && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Recommendations</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p>Some tables are not accessible. Common fixes:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Verify tables exist in Supabase Dashboard</li>
                    <li>Check Row Level Security (RLS) policies</li>
                    <li>Ensure you're authenticated if RLS requires it</li>
                    <li>Run the SQL schema in Supabase SQL Editor</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

