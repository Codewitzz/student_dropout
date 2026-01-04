import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCog, Users, TrendingUp, AlertTriangle, LogOut, PieChart, UserPlus, BookOpen, FileText, Loader2, Calendar, Edit2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { teacherService, studentService, riskService, counselingService, authService, timetableService, hodService } from "@/lib/database";
import type { TimetableEntry, HOD } from "@/types/database";
import { CSVImport } from "@/components/CSVImport";
import { DatabaseDiagnostic } from "@/components/DatabaseDiagnostic";
import { StudentList } from "@/components/StudentList";
import { StudentProfileModal } from "@/components/StudentProfileModal";
import { TeacherProfileModal } from "@/components/TeacherProfileModal";
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
  const [userProfile, setUserProfile] = useState<{ name?: string; department?: string } | null>(null);
  const [hodProfile, setHodProfile] = useState<HOD | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [editingTimetable, setEditingTimetable] = useState<{ [key: string]: string }>({});
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'High' | 'Medium' | 'Low' | null>(null);
  const [filteredStudentsByRisk, setFilteredStudentsByRisk] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  // Form state
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    phone: "",
    subjects: "",
    department: "",
    password: "",
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    department: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user's profile (name and department)
      const profile = await authService.getCurrentUserProfile();
      if (profile) {
        setUserProfile(profile);
      }
      
      // Get full HOD profile
      const userRole = await authService.getCurrentUserRole();
      if (userRole?.user_id && userRole.role === 'hod') {
        try {
          const hodData = await hodService.getById(userRole.user_id);
          setHodProfile(hodData);
          setProfileForm({
            name: hodData.name,
            email: hodData.email,
            department: hodData.department,
          });
        } catch (error) {
          console.error('Error loading HOD profile:', error);
        }
      }
      
      // Get department for filtering
      const department = profile?.department;
      
      const [teachersData, studentsData, riskData, counselingData, timetableData] = await Promise.all([
        teacherService.getAll(department),
        studentService.getAll(department),
        riskService.getRiskSummary(department),
        counselingService.getAll(department),
        department ? timetableService.getByDepartment(department).catch(() => []) : Promise.resolve([]),
      ]);

      setTeachers(teachersData);
      setStudents(studentsData);
      setTotalStudents(studentsData.length);
      setRiskSummary(riskData);
      setTimetable(timetableData || []);
      
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
        department: teacherForm.department || userProfile?.department || undefined,
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hodProfile) return;

    setIsSubmitting(true);
    try {
      const updateData: Partial<HOD> = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        department: profileForm.department.trim(),
      };

      const updatedHod = await hodService.update(hodProfile.id, updateData);
      setHodProfile(updatedHod);
      setUserProfile({
        name: updatedHod.name,
        department: updatedHod.department,
      });
      setIsEditingProfile(false);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      // Reload data to reflect changes
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error Updating Profile",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEditProfile = () => {
    if (hodProfile) {
      setProfileForm({
        name: hodProfile.name,
        email: hodProfile.email,
        department: hodProfile.department,
      });
    }
    setIsEditingProfile(false);
  };

  const handleRiskCardClick = async (riskLevel: 'High' | 'Medium' | 'Low') => {
    try {
      setSelectedRiskFilter(riskLevel);
      setActiveTab("students"); // Switch to students tab
      
      // Get all risk assessments for the department
      const department = userProfile?.department;
      const allRisks = await riskService.getAllRisks(department);
      
      // Filter by risk level
      const filtered = allRisks.filter((risk: any) => risk.risk_level === riskLevel);
      
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
                <p className="text-sm text-muted-foreground">
                  {userProfile?.name ? `${userProfile.name} - ` : ''}
                  {userProfile?.department || 'Department'}
                </p>
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
                  <div className="text-3xl font-bold text-destructive">{riskSummary.high}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalStudents > 0 ? ((riskSummary.high / totalStudents) * 100).toFixed(1) : 0}% of students
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
                  <div className="text-3xl font-bold text-warning">{riskSummary.medium}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalStudents > 0 ? ((riskSummary.medium / totalStudents) * 100).toFixed(1) : 0}% of students
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
                  <div className="text-3xl font-bold text-success">{riskSummary.low}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalStudents > 0 ? ((riskSummary.low / totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                  <p className="text-xs text-primary mt-2 font-medium">Click to view students</p>
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
              <div 
                className="text-center cursor-pointer transition-all hover:scale-110"
                onClick={() => handleRiskCardClick('High')}
              >
                <div className={`w-32 h-32 rounded-full bg-destructive/20 flex items-center justify-center mb-2 transition-all ${selectedRiskFilter === 'High' ? 'ring-4 ring-destructive' : ''}`}>
                  <span className="text-4xl font-bold text-destructive">{riskSummary.high}</span>
                </div>
                <p className="text-sm font-medium">High Risk</p>
                <p className="text-xs text-primary mt-1">Click to view</p>
              </div>
              <div 
                className="text-center cursor-pointer transition-all hover:scale-110"
                onClick={() => handleRiskCardClick('Medium')}
              >
                <div className={`w-32 h-32 rounded-full bg-warning/20 flex items-center justify-center mb-2 transition-all ${selectedRiskFilter === 'Medium' ? 'ring-4 ring-warning' : ''}`}>
                  <span className="text-4xl font-bold text-warning">{riskSummary.medium}</span>
                </div>
                <p className="text-sm font-medium">Medium Risk</p>
                <p className="text-xs text-primary mt-1">Click to view</p>
              </div>
              <div 
                className="text-center cursor-pointer transition-all hover:scale-110"
                onClick={() => handleRiskCardClick('Low')}
              >
                <div className={`w-32 h-32 rounded-full bg-success/20 flex items-center justify-center mb-2 transition-all ${selectedRiskFilter === 'Low' ? 'ring-4 ring-success' : ''}`}>
                  <span className="text-4xl font-bold text-success">{riskSummary.low}</span>
                </div>
                <p className="text-sm font-medium">Low Risk</p>
                <p className="text-xs text-primary mt-1">Click to view</p>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-8 max-w-7xl">
              <TabsTrigger value="profile">
                <Edit2 className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="students">
                <BookOpen className="w-4 h-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger value="teachers">
                <Users className="w-4 h-4 mr-2" />
                Teachers
              </TabsTrigger>
              <TabsTrigger value="timetable">
                <Calendar className="w-4 h-4 mr-2" />
                Timetable
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

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Profile</CardTitle>
                      <CardDescription>Manage your personal information</CardDescription>
                    </div>
                    {!isEditingProfile && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Name</Label>
                        <Input
                          id="profile-name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                          placeholder="Enter your name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-email">Email</Label>
                        <Input
                          id="profile-email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          required
                          placeholder="Enter your email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-department">Department</Label>
                        <Input
                          id="profile-department"
                          value={profileForm.department}
                          onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                          required
                          placeholder="Enter your department"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEditProfile}
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Name</Label>
                          <p className="text-lg font-medium">{hodProfile?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Email</Label>
                          <p className="text-lg font-medium">{hodProfile?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Department</Label>
                          <p className="text-lg font-medium">{hodProfile?.department || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Member Since</Label>
                          <p className="text-lg font-medium">
                            {hodProfile?.created_at 
                              ? new Date(hodProfile.created_at).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

           {/* Students List Tab */}
           <TabsContent value="students" className="space-y-6">
             {selectedRiskFilter && (
               <Card className="border-2 border-primary/20">
                 <CardHeader>
                   <div className="flex items-center justify-between">
                     <div>
                       <CardTitle className="flex items-center gap-2">
                         <AlertTriangle className={`w-5 h-5 ${
                           selectedRiskFilter === 'High' ? 'text-destructive' :
                           selectedRiskFilter === 'Medium' ? 'text-warning' : 'text-success'
                         }`} />
                         {selectedRiskFilter} Risk Students
                       </CardTitle>
                       <CardDescription>
                         Showing {filteredStudentsByRisk.length} student(s) with {selectedRiskFilter.toLowerCase()} risk level
                       </CardDescription>
                     </div>
                     <Button variant="outline" onClick={clearRiskFilter} size="sm">
                       <X className="w-4 h-4 mr-2" />
                       Clear Filter
                     </Button>
                   </div>
                 </CardHeader>
                 <CardContent>
                   {filteredStudentsByRisk.length > 0 ? (
                     <div className="overflow-x-auto">
                       <Table>
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
                   students={students} 
                   isLoading={isLoading}
                   onStudentClick={(studentId) => setSelectedStudentId(studentId)}
                 />
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
                             <div className="flex gap-2">
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={() => setSelectedTeacherId(teacher.id)}
                               >
                                 View Profile
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={() => handleEditTeacher(teacher)}
                               >
                                 Edit
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timetable Management Tab */}
          <TabsContent value="timetable" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Timetable</CardTitle>
                <CardDescription>Manage weekly class schedule for {userProfile?.department || 'your department'}</CardDescription>
              </CardHeader>
              <CardContent>
                <TimetableEditor
                  timetable={timetable}
                  department={userProfile?.department || ''}
                  teachers={teachers}
                  onSave={async (entries) => {
                    if (!userProfile?.department) return;
                    setIsSavingTimetable(true);
                    try {
                      await timetableService.bulkUpsert(entries);
                      toast({
                        title: "Timetable Updated",
                        description: "Timetable has been saved successfully",
                      });
                      await loadData();
                    } catch (error: any) {
                      toast({
                        title: "Error Saving Timetable",
                        description: error.message || "Failed to save timetable",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSavingTimetable(false);
                    }
                  }}
                  isSaving={isSavingTimetable}
                />
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
                        placeholder={userProfile?.department || "Enter department"} 
                        value={teacherForm.department || userProfile?.department || ""}
                        onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                      />
                      {userProfile?.department && (
                        <p className="text-xs text-muted-foreground">
                          Defaults to your department: {userProfile.department}
                        </p>
                      )}
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

        {/* Teacher Profile Modal */}
        <TeacherProfileModal
          teacherId={selectedTeacherId}
          open={!!selectedTeacherId}
          onOpenChange={(open) => {
            if (!open) setSelectedTeacherId(null);
          }}
          onUpdate={() => {
            loadData();
          }}
        />
       </div>
     </div>
   );
 };

// Timetable Editor Component
const TimetableEditor = ({ 
  timetable, 
  department, 
  teachers, 
  onSave, 
  isSaving 
}: { 
  timetable: TimetableEntry[]; 
  department: string;
  teachers: Teacher[];
  onSave: (entries: Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at'>[]) => void;
  isSaving: boolean;
}) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { time: '09:00 - 10:00', period: 1 },
    { time: '10:00 - 11:00', period: 2 },
    { time: '11:15 - 12:15', period: 3 },
    { time: '12:15 - 13:15', period: 4 },
    { time: '14:00 - 15:00', period: 5 },
    { time: '15:00 - 16:00', period: 6 },
  ];

  const [editingCells, setEditingCells] = useState<{ [key: string]: string }>({});
  const [isEditing, setIsEditing] = useState(false);

  // Initialize editing cells from existing timetable
  useEffect(() => {
    const initial: { [key: string]: string } = {};
    timetable.forEach(entry => {
      const key = `${entry.day}-${entry.period}`;
      initial[key] = entry.subject;
    });
    setEditingCells(initial);
  }, [timetable]);

  const getCellValue = (day: string, period: number) => {
    const key = `${day}-${period}`;
    return editingCells[key] || '';
  };

  const setCellValue = (day: string, period: number, value: string) => {
    const key = `${day}-${period}`;
    setEditingCells({ ...editingCells, [key]: value });
    setIsEditing(true);
  };

  const handleSave = () => {
    const entries: Omit<TimetableEntry, 'id' | 'created_at' | 'updated_at'>[] = [];
    
    days.forEach(day => {
      timeSlots.forEach(slot => {
        const value = getCellValue(day, slot.period);
        if (value && value.trim()) {
          entries.push({
            department,
            day,
            period: slot.period,
            time_slot: slot.time,
            subject: value.trim(),
            location: undefined,
            teacher_id: undefined,
          });
        }
      });
    });

    onSave(entries);
    setIsEditing(false);
  };

  const handleCancel = () => {
    const initial: { [key: string]: string } = {};
    timetable.forEach(entry => {
      const key = `${entry.day}-${entry.period}`;
      initial[key] = entry.subject;
    });
    setEditingCells(initial);
    setIsEditing(false);
  };

  // Get unique subjects from teachers
  const allSubjects = new Set<string>();
  teachers.forEach(teacher => {
    teacher.subjects?.forEach(subject => allSubjects.add(subject));
  });
  const subjectOptions = Array.from(allSubjects).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Click on any cell to edit. Enter subject name, "Break", or "Lab"
        </p>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="outline" onClick={handleCancel} size="sm">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !isEditing}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Timetable
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr>
              <th className="border border-border p-2 text-left text-sm font-medium bg-muted/50">Time</th>
              {days.map(day => (
                <th key={day} className="border border-border p-2 text-center text-sm font-medium bg-muted/50 min-w-[150px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot.period}>
                <td className="border border-border p-2 text-sm text-muted-foreground bg-muted/30">
                  {slot.time}
                </td>
                {days.map(day => {
                  const value = getCellValue(day, slot.period);
                  return (
                    <td key={`${day}-${slot.period}`} className="border border-border p-1">
                      <Input
                        value={value}
                        onChange={(e) => setCellValue(day, slot.period, e.target.value)}
                        placeholder="Subject / Break / Lab"
                        className="h-9 text-sm text-center"
                        list={`subjects-${day}-${slot.period}`}
                      />
                      <datalist id={`subjects-${day}-${slot.period}`}>
                        {subjectOptions.map(subject => (
                          <option key={subject} value={subject} />
                        ))}
                        <option value="Break" />
                        <option value="Lab" />
                      </datalist>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-muted-foreground">
          <strong>Tips:</strong> Enter subject names, "Break" for break time, or "Lab" for laboratory sessions. 
          You can use subject names from your teachers' assigned subjects or enter custom names.
        </p>
      </div>
    </div>
  );
};

export default HODDashboard;
