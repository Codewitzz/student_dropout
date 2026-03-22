import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Users, AlertTriangle, LogOut, TrendingDown, Loader2, FileText, Brain, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { performanceService, counselingService, authService, teacherService, riskService, studentService } from "@/lib/database";
import { CSVImport } from "@/components/CSVImport";
import { StudentList } from "@/components/StudentList";
import { StudentProfileModal } from "@/components/StudentProfileModal";
import type { StudentPerformance, Student } from "@/types/database";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    avgAttendance: 0,
  });
  const [departmentRiskSummary, setDepartmentRiskSummary] = useState({ high: 0, medium: 0, low: 0 });
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'High' | 'Medium' | 'Low' | null>(null);
  const [filteredStudentsByRisk, setFilteredStudentsByRisk] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null);
  const [detailedReport, setDetailedReport] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name?: string; department?: string } | null>(null);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("all-students");
  const filteredListRef = useRef<HTMLDivElement>(null);
  const [fetchedStudentName, setFetchedStudentName] = useState<string>("");
  const [isFetchingStudent, setIsFetchingStudent] = useState(false);
  
  // Student addition form state
  const [studentForm, setStudentForm] = useState({
    erp_number: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    password: "", // For login account creation
  });
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Form state for data entry (7 Minimum Data Points for AI Prediction)
  const [entryForm, setEntryForm] = useState({
    subject: "",
    studentERP: "",
    marks: "",
    attendance: "",
    backlogs: "",
    internalMarks: "",
    // Additional AI Prediction Fields
    assignmentCompletion: "",
    classParticipation: "" as "" | "Low" | "Medium" | "High",
    motivationLevel: "" as "" | "Low" | "Medium" | "High",
    stressLevel: "" as "" | "Low" | "Medium" | "High",
    teacherRemark: "",
    pastFailures: "",
  });

  useEffect(() => {
    loadData();
    loadNextERPNumber();
  }, []);

  const loadNextERPNumber = async () => {
    try {
      const nextERP = await studentService.getNextERPNumber();
      setStudentForm(prev => ({
        ...prev,
        erp_number: nextERP,
      }));
    } catch (error: any) {
      console.error('Error loading next ERP number:', error);
      // Set default if error
      setStudentForm(prev => ({
        ...prev,
        erp_number: '2021001',
      }));
    }
  };

  useEffect(() => {
    if (selectedSubject && userProfile?.department) {
      loadStudentsBySubject(selectedSubject);
    }
  }, [selectedSubject, userProfile?.department]);

  // Auto-fetch student name when ERP number is entered
  useEffect(() => {
    const fetchStudentName = async () => {
      if (entryForm.studentERP.trim().length >= 3) {
        setIsFetchingStudent(true);
        try {
          const student = await studentService.getByERP(entryForm.studentERP.trim());
          if (student) {
            setFetchedStudentName(student.name);
          } else {
            setFetchedStudentName("");
          }
        } catch (error) {
          setFetchedStudentName("");
        } finally {
          setIsFetchingStudent(false);
        }
      } else {
        setFetchedStudentName("");
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchStudentName();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [entryForm.studentERP]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user's profile (name and department)
      const profile = await authService.getCurrentUserProfile();
      if (profile) {
        setUserProfile(profile);
      }
      
      // Get current teacher's subjects
      const userRole = await authService.getCurrentUserRole();
      if (userRole?.user_id) {
        setCurrentTeacherId(userRole.user_id);
        try {
          const teacher = await teacherService.getById(userRole.user_id);
          const teacherSubjects = teacher.subjects || [];
          setSubjects(teacherSubjects);
          if (teacherSubjects.length > 0 && !selectedSubject) {
            setSelectedSubject(teacherSubjects[0]);
          }
        } catch (teacherError: any) {
          console.error('Error loading teacher data:', teacherError);
          toast({
            title: "Warning",
            description: "Could not load teacher subjects. Some features may be limited.",
            variant: "destructive",
          });
        }
      }
      
      // Load all students for the "All Students" tab - filtered by department
      const department = profile?.department;
      try {
        const allStudentsData = await studentService.getAll(department);
        setAllStudents(allStudentsData || []);
        
        // Load department-wide risk summary (like HOD dashboard)
        if (department) {
          const riskSummary = await riskService.getRiskSummary(department);
          setDepartmentRiskSummary(riskSummary);
        }
      } catch (studentError: any) {
        console.error('Error loading students:', studentError);
        setAllStudents([]);
      }
    } catch (error: any) {
      console.error('Error in loadData:', error);
      toast({
        title: "Error Loading Data",
        description: error.message || "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentsBySubject = async (subject: string) => {
    try {
      const performanceData = await performanceService.getBySubject(subject);
      
      // Filter by department if user profile is available
      const department = userProfile?.department;
      let filteredData = performanceData;
      if (department) {
        filteredData = performanceData.filter((perf: any) => perf.students?.department === department);
      }
      
      // Calculate stats
      const totalStudents = filteredData.length;
      let highRiskCount = 0;
      let totalAttendance = 0;

      const studentsWithRisk = await Promise.all(
        filteredData.map(async (perf: any) => {
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

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingStudent(true);

    try {
      // Validate email and password if password is provided
      if (studentForm.password && !studentForm.email) {
        throw new Error("Email is required when setting a password for login account");
      }

      const studentData: Omit<Student, 'id' | 'created_at' | 'updated_at'> = {
        erp_number: studentForm.erp_number.trim(),
        name: studentForm.name.trim(),
        email: studentForm.email.trim() || undefined,
        phone: studentForm.phone.trim() || undefined,
        department: studentForm.department.trim() || userProfile?.department || undefined,
        year: studentForm.year ? parseInt(studentForm.year) : undefined,
      };

      const createdStudent = await studentService.create(studentData);

      // Create auth user if email and password are provided
      if (studentForm.email.trim() && studentForm.password.trim()) {
        try {
          await authService.signUp(
            studentForm.email.trim(), 
            studentForm.password.trim(), 
            "student", 
            createdStudent
          );
          toast({
            title: "Student Added with Login Account",
            description: `Student added successfully! Login account created. Student can login using ERP: ${studentForm.erp_number.trim()} and the password you provided.`,
          });
        } catch (authError: any) {
          // Student created but auth failed
          console.error("Failed to create auth user:", authError);
          toast({
            title: "Student Added (Login Account Failed)",
            description: `Student record created but login account creation failed: ${authError.message}. Please create login account manually.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Student Added",
          description: "New student has been added. Note: No login account created (email and password required).",
        });
      }

      // Reset form and load next ERP number
      await loadNextERPNumber();
      setStudentForm(prev => ({
        ...prev,
        name: "",
        email: "",
        phone: "",
        department: "",
        year: "",
        password: "",
      }));

      // Reload data if needed
      if (selectedSubject) {
        await loadStudentsBySubject(selectedSubject);
      }
    } catch (error: any) {
      toast({
        title: "Error Adding Student",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setIsAddingStudent(false);
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
        // AI Prediction Fields (7 Minimum Data Points)
        assignment_completion: entryForm.assignmentCompletion ? parseFloat(entryForm.assignmentCompletion) : undefined,
        class_participation: entryForm.classParticipation || undefined,
        motivation_level: entryForm.motivationLevel || undefined,
        stress_level: entryForm.stressLevel || undefined,
        teacher_remark: entryForm.teacherRemark || undefined,
        past_failures: entryForm.pastFailures ? parseInt(entryForm.pastFailures) : undefined,
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
        assignmentCompletion: "",
        classParticipation: "",
        motivationLevel: "",
        stressLevel: "",
        teacherRemark: "",
        pastFailures: "",
      });
      setFetchedStudentName("");

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

  const handleRiskCardClick = async (riskLevel: 'High' | 'Medium' | 'Low') => {
    try {
      setSelectedRiskFilter(riskLevel);
      setActiveTab("all-students"); // Switch to all-students tab
      
      // Get all risk assessments for the department
      const department = userProfile?.department;
      const allRisks = await riskService.getAllRisks(department);
      
      // Filter by risk level and exclude risks with missing student data
      const filtered = allRisks.filter((risk: any) => 
        risk.risk_level === riskLevel && risk.students?.id
      );
      
      // Format the data for display
      const formattedStudents = filtered.map((risk: any) => ({
        id: risk.students?.id || '',
        name: risk.students?.name || 'Unknown',
        erp_number: risk.students?.erp_number || 'N/A',
        email: risk.students?.email || '',
        department: risk.students?.department || '',
        year: risk.students?.year || null,
        risk_level: risk.risk_level,
        risk_score: risk.risk_score,
        factors: risk.factors || [],
      }));
      
      setFilteredStudentsByRisk(formattedStudents);
    } catch (error: any) {
      toast({
        title: "Error Loading Students",
        description: error.message || "Failed to load students by risk level",
        variant: "destructive",
      });
    }
  };

  const clearRiskFilter = () => {
    setSelectedRiskFilter(null);
    setFilteredStudentsByRisk([]);
  };

  // Scroll to filtered list when risk filter is applied
  useEffect(() => {
    if (selectedRiskFilter && activeTab === "all-students") {
      // Small delay to allow tab content to render
      const timer = setTimeout(() => {
        filteredListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedRiskFilter, activeTab, filteredStudentsByRisk]);

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
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">Teacher Dashboard</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                  {userProfile?.name ? `${userProfile.name} · ` : ''}
                  {userProfile?.department || 'Department'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-lg border-border/60 hover:bg-muted/50 transition-colors flex-shrink-0 px-3 sm:px-4">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                  <div className="text-3xl font-bold text-foreground">{allStudents.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">In department</p>
                </CardContent>
              </Card>

              <Card 
                className={`border-destructive/50 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${selectedRiskFilter === 'High' ? 'ring-2 ring-destructive' : ''}`}
                onClick={() => handleRiskCardClick('High')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    High Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{departmentRiskSummary.high}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allStudents.length > 0 ? ((departmentRiskSummary.high / allStudents.length) * 100).toFixed(1) : 0}% of department
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">Click to view students</p>
                </CardContent>
              </Card>

              <Card 
                className={`border-warning/50 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${selectedRiskFilter === 'Medium' ? 'ring-2 ring-warning' : ''}`}
                onClick={() => handleRiskCardClick('Medium')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Medium Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">{departmentRiskSummary.medium}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allStudents.length > 0 ? ((departmentRiskSummary.medium / allStudents.length) * 100).toFixed(1) : 0}% of department
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">Click to view students</p>
                </CardContent>
              </Card>

              <Card 
                className={`border-success/50 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${selectedRiskFilter === 'Low' ? 'ring-2 ring-success' : ''}`}
                onClick={() => handleRiskCardClick('Low')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Low Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{departmentRiskSummary.low}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allStudents.length > 0 ? ((departmentRiskSummary.low / allStudents.length) * 100).toFixed(1) : 0}% of department
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">Click to view students</p>
                </CardContent>
              </Card>
            </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Clear filter when switching tabs
          if (value !== 'all-students' && selectedRiskFilter) {
            clearRiskFilter();
          }
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-3xl bg-card/60 border-border/50 shadow-sm gap-1.5 p-1.5">
            <TabsTrigger value="all-students" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
              <span className="truncate">All Students</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
              <span className="truncate">My Students</span>
            </TabsTrigger>
            <TabsTrigger value="entry" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Data Entry</span>
            </TabsTrigger>
            <TabsTrigger value="add-students" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 flex-shrink-0" />
              <span className="truncate">Add Students</span>
            </TabsTrigger>
          </TabsList>

          {/* All Students List Tab */}
          <TabsContent value="all-students" className="space-y-6">
            {selectedRiskFilter && (
              <Card ref={filteredListRef} className="border-2 border-primary/20">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${
                          selectedRiskFilter === 'High' ? 'text-destructive' :
                          selectedRiskFilter === 'Medium' ? 'text-warning' : 'text-success'
                        }`} />
                        {selectedRiskFilter} Risk Students
                      </CardTitle>
                      <CardDescription>
                        Showing {filteredStudentsByRisk.length} student(s) with {selectedRiskFilter.toLowerCase()} risk level
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={clearRiskFilter} size="sm" className="w-full sm:w-auto">
                      <X className="w-4 h-4 sm:mr-2" />
                      Clear Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredStudentsByRisk.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <Table className="min-w-[600px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>ERP Number</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Risk Level</TableHead>
                            <TableHead>Risk Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudentsByRisk.map((student) => (
                            <TableRow 
                              key={student.id}
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => setSelectedStudentId(student.id)}
                            >
                              <TableCell className="font-medium">{student.erp_number}</TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.email || 'N/A'}</TableCell>
                              <TableCell>{student.department || 'N/A'}</TableCell>
                              <TableCell>{student.year || 'N/A'}</TableCell>
                              <TableCell>{getRiskBadge(student.risk_level)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{student.risk_score}/100</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No students found with {selectedRiskFilter.toLowerCase()} risk level.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>All Enrolled Students</CardTitle>
                <CardDescription>View and search all students in the department</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentList 
                  students={allStudents} 
                  isLoading={isLoading}
                  onStudentClick={(studentId) => setSelectedStudentId(studentId)}
                />
              </CardContent>
            </Card>
          </TabsContent>

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

                <div className="rounded-md border overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <Table className="min-w-[600px]">
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
            {/* CSV Import for Performance Data */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Bulk Import Performance Data via CSV
                </CardTitle>
                <CardDescription>
                  Upload CSV file to import student performance data for multiple students at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVImport 
                  type="performance"
                  teacherId={currentTeacherId}
                  teacherDepartment={userProfile?.department}
                  onImportComplete={async () => {
                    if (selectedSubject) {
                      await loadStudentsBySubject(selectedSubject);
                    }
                    await loadData();
                    toast({
                      title: "Performance Data Imported",
                      description: "Student performance data has been imported successfully. Risk assessments will be recalculated.",
                    });
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enter Student Performance Data (AI Prediction)</CardTitle>
                <CardDescription>Add all 7 data points for accurate AI dropout risk prediction</CardDescription>
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
                      {isFetchingStudent && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Looking up student...
                        </p>
                      )}
                      {!isFetchingStudent && fetchedStudentName && (
                        <p className="text-sm text-primary font-medium flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Student: {fetchedStudentName}
                        </p>
                      )}
                      {!isFetchingStudent && entryForm.studentERP.trim().length >= 3 && !fetchedStudentName && (
                        <p className="text-xs text-destructive">Student not found with this ERP number</p>
                      )}
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

                    {/* AI Prediction Fields - 7 Minimum Data Points */}
                    <div className="md:col-span-2">
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-semibold mb-4">AI Prediction Data (7 Minimum Points)</h3>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignmentCompletion">3. Assignment Completion (%)</Label>
                      <Input 
                        id="assignmentCompletion" 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="Enter assignment completion %" 
                        value={entryForm.assignmentCompletion}
                        onChange={(e) => setEntryForm({ ...entryForm, assignmentCompletion: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="classParticipation">4. Class Participation</Label>
                      <Select 
                        value={entryForm.classParticipation}
                        onValueChange={(value: "Low" | "Medium" | "High") => setEntryForm({ ...entryForm, classParticipation: value })}
                      >
                        <SelectTrigger id="classParticipation">
                          <SelectValue placeholder="Select participation level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivationLevel">5. Motivation Level</Label>
                      <Select 
                        value={entryForm.motivationLevel}
                        onValueChange={(value: "Low" | "Medium" | "High") => setEntryForm({ ...entryForm, motivationLevel: value })}
                      >
                        <SelectTrigger id="motivationLevel">
                          <SelectValue placeholder="Select motivation level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stressLevel">5. Stress Level</Label>
                      <Select 
                        value={entryForm.stressLevel}
                        onValueChange={(value: "Low" | "Medium" | "High") => setEntryForm({ ...entryForm, stressLevel: value })}
                      >
                        <SelectTrigger id="stressLevel">
                          <SelectValue placeholder="Select stress level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="teacherRemark">6. Teacher Remark</Label>
                      <Input 
                        id="teacherRemark" 
                        placeholder="Enter teacher feedback/remarks" 
                        value={entryForm.teacherRemark}
                        onChange={(e) => setEntryForm({ ...entryForm, teacherRemark: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pastFailures">7. Past Failures</Label>
                      <Input 
                        id="pastFailures" 
                        type="number" 
                        min="0" 
                        placeholder="Enter number of past failures" 
                        value={entryForm.pastFailures}
                        onChange={(e) => setEntryForm({ ...entryForm, pastFailures: e.target.value })}
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

          {/* Add Students Tab */}
          <TabsContent value="add-students" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Student One by One */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Student (One by One)</CardTitle>
                  <CardDescription>Manually add a new student to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="erp_number">ERP Number * (Auto-generated)</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="erp_number" 
                          placeholder="Auto-generated ERP number" 
                          value={studentForm.erp_number}
                          onChange={(e) => setStudentForm({ ...studentForm, erp_number: e.target.value })}
                          required
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={loadNextERPNumber}
                          title="Generate next sequential ERP number"
                        >
                          <BookOpen className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Auto-generated sequentially. You can edit if needed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_name">Student Name *</Label>
                      <Input 
                        id="student_name" 
                        placeholder="Enter student name" 
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_email">Email</Label>
                      <Input 
                        id="student_email" 
                        type="email"
                        placeholder="Enter email (required for login)" 
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Required if you want to create a login account</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_password">Password (for Login Account)</Label>
                      <Input 
                        id="student_password" 
                        type="password"
                        placeholder="Enter password (optional, min 6 characters)" 
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        If provided with email, a login account will be created automatically. Student can login using ERP number and this password.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_phone">Phone</Label>
                      <Input 
                        id="student_phone" 
                        type="tel"
                        placeholder="Enter phone number (optional)" 
                        value={studentForm.phone}
                        onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_department">Department</Label>
                      <Input 
                        id="student_department" 
                        placeholder={userProfile?.department || "Enter department (optional)"} 
                        value={studentForm.department || userProfile?.department || ""}
                        onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      />
                      {userProfile?.department && (
                        <p className="text-xs text-muted-foreground">
                          Defaults to your department: {userProfile.department}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="student_year">Year</Label>
                      <Input 
                        id="student_year" 
                        type="number"
                        min="1"
                        max="4"
                        placeholder="Enter year (optional)" 
                        value={studentForm.year}
                        onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-accent"
                      disabled={isAddingStudent}
                    >
                      {isAddingStudent ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Student
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* CSV Import */}
              <Card>
                <CardHeader>
                  <CardTitle>Import Students from CSV</CardTitle>
                  <CardDescription>Bulk import students with login accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVImport 
                    type="student" 
                    onImportComplete={() => {
                      if (selectedSubject) {
                        loadStudentsBySubject(selectedSubject);
                      }
                      toast({
                        title: "Import Complete",
                        description: "Students imported successfully. Include 'email' and 'password' columns in CSV to create login accounts.",
                      });
                    }}
                  />
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Login Account Setup:</p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Include <strong>email</strong> and <strong>password</strong> columns in CSV to create login accounts</li>
                      <li>Students can login using their <strong>ERP number</strong> and <strong>password</strong></li>
                      <li>CSV format: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">erp_number, name, email, password, phone, department, year</code></li>
                      <li>Password must be at least 6 characters long</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Detailed AI Report Dialog */}
        {detailedReport && (
          <Card className="mt-6 border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  <CardTitle>AI Dropout Risk Report</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDetailedReport(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className={`text-2xl font-bold ${
                    detailedReport.risk_level === 'High' ? 'text-destructive' :
                    detailedReport.risk_level === 'Medium' ? 'text-warning' : 'text-success'
                  }`}>
                    {detailedReport.risk_level}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <p className="text-2xl font-bold">{detailedReport.risk_score}/100</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Weak Subjects</p>
                  <p className="text-2xl font-bold">{detailedReport.weak_subjects.length}</p>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h3 className="font-semibold mb-2">Risk Factors</h3>
                <div className="flex flex-wrap gap-2">
                  {detailedReport.factors.map((factor: string, idx: number) => (
                    <Badge key={idx} variant="destructive">{factor}</Badge>
                  ))}
                </div>
              </div>

              {/* Detailed Analysis */}
              <div>
                <h3 className="font-semibold mb-3">Detailed Analysis</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">1. Marks Analysis</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.marks_analysis}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">2. Attendance Analysis</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.attendance_analysis}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">3. Assignment Analysis</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.assignment_analysis}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">4. Behavior Analysis</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.behavior_analysis}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">5. Motivation Analysis</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.motivation_analysis}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">6. Stress Analysis</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.stress_analysis}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">7. Teacher Feedback</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.teacher_feedback_summary}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-1">8. Failure History</p>
                    <p className="text-sm text-muted-foreground">{detailedReport.detailed_report.failure_history_analysis}</p>
                  </div>
                </div>
              </div>

              {/* Weak Subjects */}
              {detailedReport.weak_subjects.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Weak Subjects Identified</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailedReport.weak_subjects.map((subject: string, idx: number) => (
                      <Badge key={idx} variant="destructive">{subject}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Improvement Suggestions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Improvement Suggestions
                </h3>
                <div className="space-y-2">
                  {detailedReport.improvement_suggestions.map((suggestion: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}

        {/* Student Profile Modal */}
        <StudentProfileModal
          studentId={selectedStudentId}
          open={!!selectedStudentId}
          onOpenChange={(open) => {
            if (!open) setSelectedStudentId(null);
          }}
          onUpdate={() => {
            loadData();
          }}
        />
      </div>
    </div>
  );
};

export default TeacherDashboard;
