import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { testDatabaseConnection, verifyTable, checkAuthentication } from '@/lib/database-utils';

export const DatabaseDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const connectionTest = await testDatabaseConnection();
      const authCheck = await checkAuthentication();
      
      const tableChecks = await Promise.all([
        verifyTable('students'),
        verifyTable('teachers'),
        verifyTable('hods'),
        verifyTable('users'),
        verifyTable('student_performance'),
        verifyTable('risk_assessments'),
        verifyTable('counseling_sessions'),
      ]);

      setResults({
        connection: connectionTest,
        authentication: authCheck,
        tables: {
          students: tableChecks[0],
          teachers: tableChecks[1],
          hods: tableChecks[2],
          users: tableChecks[3],
          student_performance: tableChecks[4],
          risk_assessments: tableChecks[5],
          counseling_sessions: tableChecks[6],
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

            {/* Tables */}
            {results.tables && (
              <div className="space-y-2">
                <h4 className="font-semibold">Table Access</h4>
                {Object.entries(results.tables).map(([tableName, check]: [string, any]) => (
                  <div
                    key={tableName}
                    className={`flex items-center justify-between p-2 rounded ${
                      check.accessible ? 'bg-success/10' : 'bg-destructive/10'
                    }`}
                  >
                    <span className="font-mono text-sm">{tableName}</span>
                    {check.accessible ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-destructive">{check.error}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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

