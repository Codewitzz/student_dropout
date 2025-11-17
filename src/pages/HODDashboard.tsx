import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, Users, TrendingUp, AlertTriangle, LogOut, PieChart, UserPlus, BookOpen, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { teacherService, studentService, riskService, counselingService, authService } from "@/lib/database";
import { CSVImport } from "@/components/CSVImport";
import { DatabaseDiagnostic } from "@/components/DatabaseDiagnostic";
import { StudentList } from "@/components/StudentList";
import type { Teacher, Student } from "@/types/database";

const HODDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [riskSummary, setRiskSummary] = useState({ high: 0, medium: 0, low: 0 });
  const [totalStudents, setTotalStudents] = useState(0);
  const [counselingProgress, setCounselingProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState("teachers");

  // Form state
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    phone: "",
    subjects: "",
    department: "",
    password: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [teachersData, studentsData, riskData, counselingData] = await Promise.all([
        teacherService.getAll(),
        studentService.getAll(),
        riskService.getRiskSummary(),
        counselingService.getAll(),
      ]);

      setTeachers(teachersData);
      setStudents(studentsData);
      setTotalStudents(studentsData.length);
      setRiskSummary(riskData);
      
      // Format counseling data
      const formattedCounseling = counselingData.map((c: any) => ({
        id: c.id,
        studentName: c.students?.name || "Unknown",
        status: c.status === "Improved" ? "Improved" : c.status === "Not Improved" ? "Not Improved" : "Completed",
        beforeRisk: c.before_risk_level,
        afterRisk: c.after_risk_level || c.before_risk_level,
      }));
      setCounselingProgress(formattedCounseling);
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

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const subjectsArray = teacherForm.subjects
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const teacher = await teacherService.create({
        name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone || undefined,
        department: teacherForm.department || undefined,
        subjects: subjectsArray,
      });

      // Create auth user for teacher
      if (teacherForm.password) {
        try {
          await authService.signUp(teacherForm.email, teacherForm.password, "teacher", teacher);
          toast({
            title: "Teacher Added",
            description: "New teacher has been added successfully with login account",
          });
        } catch (authError: any) {
          // Show error but keep the teacher record
          console.error("Failed to create auth user:", authError);
          toast({
            title: "Teacher Added (Login Account Failed)",
            description: `Teacher record created but login account creation failed: ${authError.message || 'Unknown error'}. Please create login account manually.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Teacher Added",
          description: "New teacher has been added. Note: No password provided, login account not created.",
        });
      }

      // Reset form and editing state
      setEditingTeacher(null);
      setTeacherForm({
        name: "",
        email: "",
        phone: "",
        subjects: "",
        department: "",
        password: "",
      });

      // Reload data
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error Adding Teacher",
        description: error.message || "Failed to add teacher",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || "",
      subjects: teacher.subjects?.join(", ") || "",
      department: teacher.department || "",
      password: "", // Don't pre-fill password
    });
    // Switch to add-teacher tab to show the form
    setActiveTab("add-teacher");
  };

  const handleCancelEdit = () => {
    setEditingTeacher(null);
    setTeacherForm({
      name: "",
      email: "",
      phone: "",
      subjects: "",
      department: "",
      password: "",
    });
    setActiveTab("teachers");
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setIsSubmitting(true);

    try {
      const subjectsArray = teacherForm.subjects
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updateData: Partial<Teacher> = {
        name: teacherForm.name,
        phone: teacherForm.phone || undefined,
        department: teacherForm.department || undefined,
        subjects: subjectsArray,
      };

      // Only update email if it changed
      if (teacherForm.email !== editingTeacher.email) {
        updateData.email = teacherForm.email;
      }

      await teacherService.update(editingTeacher.id, updateData);

      // Update password if provided
      if (teacherForm.password.trim()) {
        // Note: Password update would require Supabase auth admin API
        // For now, we'll just show a message
        toast({
          title: "Teacher Updated",
          description: "Teacher information updated. Note: Password changes require admin access.",
        });
      } else {
        toast({
          title: "Teacher Updated",
          description: "Teacher information has been updated successfully",
        });
      }

      // Reset form and editing state
      handleCancelEdit();

      // Reload data
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error Updating Teacher",
        description: error.message || "Failed to update teacher",
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
    return <Badge className={colors[risk as keyof typeof colors]}>{risk}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === "Improved" 
      ? <Badge className="bg-success text-success-foreground">Improved</Badge>
      : <Badge className="bg-destructive text-destructive-foreground">Not Improved</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-xl">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">HOD Dashboard</h1>
                <p className="text-sm text-muted-foreground">Computer Science Department</p>
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{totalStudents}</div>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    High Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{riskSummary.high}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalStudents > 0 ? ((riskSummary.high / totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                </CardContent>
              </Card>

              <Card className="border-warning/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Medium Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">{riskSummary.medium}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalStudents > 0 ? ((riskSummary.medium / totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                </CardContent>
              </Card>

              <Card className="border-success/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Low Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{riskSummary.low}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalStudents > 0 ? ((riskSummary.low / totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                </CardContent>
              </Card>
            </div>

        {/* Risk Distribution Visualization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Department Risk Distribution
            </CardTitle>
            <CardDescription>Overall risk assessment of all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 py-8">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-destructive">{riskSummary.high}</span>
                </div>
                <p className="text-sm font-medium">High Risk</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-warning/20 flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-warning">{riskSummary.medium}</span>
                </div>
                <p className="text-sm font-medium">Medium Risk</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-success/20 flex items-center justify-center mb-2">
                  <span className="text-4xl font-bold text-success">{riskSummary.low}</span>
                </div>
                <p className="text-sm font-medium">Low Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 max-w-5xl">
              <TabsTrigger value="students">
                <BookOpen className="w-4 h-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger value="teachers">
                <Users className="w-4 h-4 mr-2" />
                Teachers
              </TabsTrigger>
              <TabsTrigger value="counseling">
                <TrendingUp className="w-4 h-4 mr-2" />
                Counseling Progress
              </TabsTrigger>
              <TabsTrigger value="add-teacher">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Teacher
              </TabsTrigger>
              <TabsTrigger value="import">
                <FileText className="w-4 h-4 mr-2" />
                Import CSV
              </TabsTrigger>
              <TabsTrigger value="diagnostic">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Diagnostic
              </TabsTrigger>
            </TabsList>

          {/* Students List Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Enrolled Students</CardTitle>
                <CardDescription>View and search all students in the department</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentList students={students} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teachers Management Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Teachers</CardTitle>
                <CardDescription>Manage teachers and their subject assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Assigned Subjects</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {teacher.subjects.map((subject) => (
                                <Badge key={subject} variant="secondary">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {subject}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditTeacher(teacher)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Counseling Progress Tab */}
          <TabsContent value="counseling" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Counseling Outcomes</CardTitle>
                <CardDescription>Track student improvement after counseling sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Before Counseling</TableHead>
                        <TableHead>After Counseling</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {counselingProgress.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.studentName}</TableCell>
                          <TableCell>{getRiskBadge(record.beforeRisk)}</TableCell>
                          <TableCell>{getRiskBadge(record.afterRisk)}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add/Edit Teacher Tab */}
          <TabsContent value="add-teacher" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</CardTitle>
                <CardDescription>
                  {editingTeacher 
                    ? "Update teacher information and subject assignments" 
                    : "Register a new teacher and assign subjects"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingTeacher ? handleUpdateTeacher : handleAddTeacher} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher-name">Full Name</Label>
                      <Input 
                        id="teacher-name" 
                        placeholder="Enter teacher's full name" 
                        required
                        value={teacherForm.name}
                        onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher-email">Email</Label>
                      <Input 
                        id="teacher-email" 
                        type="email" 
                        placeholder="Enter email address" 
                        required
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        disabled={!!editingTeacher}
                      />
                      {editingTeacher && (
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher-phone">Phone Number</Label>
                      <Input 
                        id="teacher-phone" 
                        type="tel" 
                        placeholder="Enter phone number"
                        value={teacherForm.phone}
                        onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher-subjects">Assign Subjects</Label>
                      <Input 
                        id="teacher-subjects" 
                        placeholder="e.g., DBMS, Networks" 
                        value={teacherForm.subjects}
                        onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher-department">Department</Label>
                      <Input 
                        id="teacher-department" 
                        placeholder="Enter department" 
                        value={teacherForm.department}
                        onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="teacher-password">
                        {editingTeacher ? "New Password (Optional - Leave blank to keep current)" : "Initial Password (Optional)"}
                      </Label>
                      <Input 
                        id="teacher-password" 
                        type="password" 
                        placeholder={editingTeacher ? "Enter new password to change" : "Set initial password for login"} 
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-primary to-accent"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {editingTeacher ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        <>
                          {editingTeacher ? (
                            <>
                              <UserCog className="w-4 h-4 mr-2" />
                              Update Teacher
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Add Teacher
                            </>
                          )}
                        </>
                      )}
                    </Button>
                    {editingTeacher && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CSV Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Tabs defaultValue="students" className="space-y-4">
              <TabsList>
                <TabsTrigger value="students">Import Students</TabsTrigger>
                <TabsTrigger value="teachers">Import Teachers</TabsTrigger>
              </TabsList>
              <TabsContent value="students">
                <CSVImport 
                  type="student" 
                  onImportComplete={() => {
                    loadData();
                  }}
                />
              </TabsContent>
              <TabsContent value="teachers">
                <CSVImport 
                  type="teacher" 
                  onImportComplete={() => {
                    loadData();
                  }}
                />
              </TabsContent>
            </Tabs>
              </TabsContent>

              {/* Database Diagnostic Tab */}
              <TabsContent value="diagnostic" className="space-y-6">
                <DatabaseDiagnostic />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;
