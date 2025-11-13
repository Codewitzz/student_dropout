import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Users, AlertTriangle, LogOut, TrendingDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { performanceService, counselingService, authService, teacherService, riskService, studentService } from "@/lib/database";
import type { StudentPerformance } from "@/types/database";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    highRisk: 0,
    avgAttendance: 0,
  });

  // Form state for data entry
  const [entryForm, setEntryForm] = useState({
    subject: "",
    studentERP: "",
    marks: "",
    attendance: "",
    backlogs: "",
    internalMarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadStudentsBySubject(selectedSubject);
    }
  }, [selectedSubject]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Get current teacher's subjects
      const userRole = await authService.getCurrentUserRole();
      if (userRole?.user_id) {
        const teacher = await teacherService.getById(userRole.user_id);
        const teacherSubjects = teacher.subjects || [];
        setSubjects(teacherSubjects);
        if (teacherSubjects.length > 0 && !selectedSubject) {
          setSelectedSubject(teacherSubjects[0]);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error Loading Data",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentsBySubject = async (subject: string) => {
    try {
      const performanceData = await performanceService.getBySubject(subject);
      
      // Calculate stats
      const totalStudents = performanceData.length;
      let highRiskCount = 0;
      let totalAttendance = 0;

      const studentsWithRisk = await Promise.all(
        performanceData.map(async (perf: any) => {
          const risk = await riskService.calculateRisk(perf.student_id);
          if (risk.risk_level === "High") highRiskCount++;
          totalAttendance += perf.attendance;
          
          return {
            id: perf.id,
            studentId: perf.student_id,
            name: perf.students?.name || "Unknown",
            erp: perf.students?.erp_number || "N/A",
            marks: perf.marks,
            attendance: perf.attendance,
            backlogs: perf.backlogs,
            riskLevel: risk.risk_level,
          };
        })
      );

      setStudents(studentsWithRisk);
      setStats({
        totalStudents,
        highRisk: highRiskCount,
        avgAttendance: totalStudents > 0 ? Math.round(totalAttendance / totalStudents) : 0,
      });
    } catch (error: any) {
      toast({
        title: "Error Loading Students",
        description: error.message || "Failed to load student data",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Logout Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const handleCounselingRequest = async (studentId: string, studentName: string) => {
    try {
      const userRole = await authService.getCurrentUserRole();
      if (!userRole?.user_id) {
        throw new Error("Teacher not found");
      }

      // Get current risk level
      const risk = await riskService.calculateRisk(studentId);

      await counselingService.create({
        student_id: studentId,
        teacher_id: userRole.user_id,
        before_risk_level: risk.risk_level,
        status: "Scheduled",
      });

      toast({
        title: "Counseling Request Initiated",
        description: `Counseling request sent for ${studentName}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate counseling",
        variant: "destructive",
      });
    }
  };

  const handleSubmitPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get student by ERP
      const student = await studentService.getByERP(entryForm.studentERP);
      
      if (!student) {
        throw new Error("Student not found with this ERP number");
      }

      const performanceData: Omit<StudentPerformance, 'id' | 'created_at' | 'updated_at'> = {
        student_id: student.id,
        subject: entryForm.subject,
        marks: parseFloat(entryForm.marks),
        attendance: parseFloat(entryForm.attendance),
        backlogs: parseInt(entryForm.backlogs) || 0,
        internal_marks: entryForm.internalMarks ? parseFloat(entryForm.internalMarks) : undefined,
      };

      // Check if performance record exists
      const existingPerf = await performanceService.getByStudent(student.id);
      const existing = existingPerf.find((p: any) => p.subject === entryForm.subject);

      if (existing) {
        await performanceService.update(existing.id, performanceData);
      } else {
        await performanceService.create(performanceData);
      }

      // Recalculate risk
      await riskService.calculateRisk(student.id);

      toast({
        title: "Performance Data Saved",
        description: "Student performance data has been updated successfully",
      });

      // Reset form
      setEntryForm({
        subject: entryForm.subject,
        studentERP: "",
        marks: "",
        attendance: "",
        backlogs: "",
        internalMarks: "",
      });

      // Reload data
      if (selectedSubject) {
        await loadStudentsBySubject(selectedSubject);
      }
    } catch (error: any) {
      toast({
        title: "Error Saving Data",
        description: error.message || "Failed to save performance data",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      High: "bg-destructive text-destructive-foreground",
      Medium: "bg-warning text-warning-foreground",
      Low: "bg-success text-success-foreground",
    };
    return <Badge className={colors[risk as keyof typeof colors]}>{risk} Risk</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
                <p className="text-sm text-muted-foreground">Prof. Teaching Staff</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Subjects Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{subjects.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats.totalStudents}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    {stats.highRisk}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{stats.avgAttendance}%</div>
                </CardContent>
              </Card>
            </div>

        {/* Main Content */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              My Students
            </TabsTrigger>
            <TabsTrigger value="entry">
              <BookOpen className="w-4 h-4 mr-2" />
              Data Entry
            </TabsTrigger>
          </TabsList>

          {/* Students List Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Students by Subject</CardTitle>
                <CardDescription>View and manage student performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label>Select Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ERP No.</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Backlogs</TableHead>
                        <TableHead>Risk Level</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.erp}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.marks}%</TableCell>
                          <TableCell>{student.attendance}%</TableCell>
                          <TableCell>{student.backlogs}</TableCell>
                          <TableCell>{getRiskBadge(student.riskLevel)}</TableCell>
                          <TableCell>
                            {student.riskLevel === "High" && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleCounselingRequest(student.studentId, student.name)}
                              >
                                <TrendingDown className="w-4 h-4 mr-1" />
                                Counseling
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Entry Tab */}
          <TabsContent value="entry" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enter Student Performance Data</CardTitle>
                <CardDescription>Add marks, attendance, and backlog information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPerformance} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select 
                        value={entryForm.subject}
                        onValueChange={(value) => setEntryForm({ ...entryForm, subject: value })}
                      >
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student">Student ERP</Label>
                      <Input 
                        id="student" 
                        placeholder="Enter ERP number" 
                        value={entryForm.studentERP}
                        onChange={(e) => setEntryForm({ ...entryForm, studentERP: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marks">Marks (%)</Label>
                      <Input 
                        id="marks" 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="Enter marks" 
                        value={entryForm.marks}
                        onChange={(e) => setEntryForm({ ...entryForm, marks: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attendance">Attendance (%)</Label>
                      <Input 
                        id="attendance" 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="Enter attendance" 
                        value={entryForm.attendance}
                        onChange={(e) => setEntryForm({ ...entryForm, attendance: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backlogs">Number of Backlogs</Label>
                      <Input 
                        id="backlogs" 
                        type="number" 
                        min="0" 
                        placeholder="Enter backlogs" 
                        value={entryForm.backlogs}
                        onChange={(e) => setEntryForm({ ...entryForm, backlogs: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="internal">Internal Marks</Label>
                      <Input 
                        id="internal" 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="Enter internal marks" 
                        value={entryForm.internalMarks}
                        onChange={(e) => setEntryForm({ ...entryForm, internalMarks: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-accent"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Performance Data"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
