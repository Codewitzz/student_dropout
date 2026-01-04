import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Save, X, Loader2, User, Mail, Phone, GraduationCap, Calendar, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { studentService, performanceService, riskService } from "@/lib/database";
import type { Student, StudentPerformance, AIRiskPrediction } from "@/types/database";

interface StudentProfileModalProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export const StudentProfileModal = ({ studentId, open, onOpenChange, onUpdate }: StudentProfileModalProps) => {
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [performances, setPerformances] = useState<StudentPerformance[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<AIRiskPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    erp_number: "",
  });

  useEffect(() => {
    if (open && studentId) {
      loadStudentData();
    } else {
      // Reset state when modal closes
      setStudent(null);
      setPerformances([]);
      setRiskAssessment(null);
      setIsEditing(false);
    }
  }, [open, studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;
    
    try {
      setIsLoading(true);
      
      // Load student data
      const studentData = await studentService.getById(studentId);
      setStudent(studentData);
      setEditForm({
        name: studentData.name,
        email: studentData.email || "",
        phone: studentData.phone || "",
        department: studentData.department || "",
        year: studentData.year?.toString() || "",
        erp_number: studentData.erp_number,
      });

      // Load performance data
      const performanceData = await performanceService.getByStudent(studentId);
      setPerformances(performanceData || []);

      // Load risk assessment
      const risk = await riskService.calculateRisk(studentId);
      setRiskAssessment(risk);
    } catch (error: any) {
      toast({
        title: "Error Loading Student Data",
        description: error.message || "Failed to load student profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!student) return;

    setIsSaving(true);
    try {
      const updateData: Partial<Student> = {
        name: editForm.name.trim(),
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        department: editForm.department.trim() || undefined,
        year: editForm.year ? parseInt(editForm.year) : undefined,
      };

      const updated = await studentService.update(student.id, updateData);
      setStudent(updated);
      setIsEditing(false);

      toast({
        title: "Student Updated",
        description: "Student information has been updated successfully",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      toast({
        title: "Error Updating Student",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (student) {
      setEditForm({
        name: student.name,
        email: student.email || "",
        phone: student.phone || "",
        department: student.department || "",
        year: student.year?.toString() || "",
        erp_number: student.erp_number,
      });
    }
    setIsEditing(false);
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      High: "bg-destructive text-destructive-foreground",
      Medium: "bg-warning text-warning-foreground",
      Low: "bg-success text-success-foreground",
    };
    return <Badge className={colors[risk as keyof typeof colors]}>{risk} Risk</Badge>;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Student Profile</DialogTitle>
              <DialogDescription>
                {student ? `Complete profile information for ${student.name}` : "Loading..."}
              </DialogDescription>
            </div>
            {!isEditing && student && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : student ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Student Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                          id="edit-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-erp">ERP Number</Label>
                        <Input
                          id="edit-erp"
                          value={editForm.erp_number}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">ERP number cannot be changed</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-department">Department</Label>
                        <Input
                          id="edit-department"
                          value={editForm.department}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-year">Year</Label>
                        <Input
                          id="edit-year"
                          type="number"
                          min="1"
                          max="4"
                          value={editForm.year}
                          onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Name</Label>
                        <p className="text-lg font-medium">{student.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">ERP Number</Label>
                        <p className="text-lg font-medium">
                          <Badge variant="outline">{student.erp_number}</Badge>
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </Label>
                        <p className="text-lg font-medium">{student.email || "N/A"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone
                        </Label>
                        <p className="text-lg font-medium">{student.phone || "N/A"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Academic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground">Department</Label>
                        <p className="text-lg font-medium">
                          {student.department ? (
                            <Badge variant="secondary">{student.department}</Badge>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Year</Label>
                        <p className="text-lg font-medium">
                          {student.year ? (
                            <Badge variant="outline">Year {student.year}</Badge>
                          ) : (
                            "N/A"
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Enrolled Since
                        </Label>
                        <p className="text-lg font-medium">
                          {new Date(student.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Performance data across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  {performances.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Attendance %</TableHead>
                            <TableHead>Backlogs</TableHead>
                            <TableHead>Internal Marks</TableHead>
                            <TableHead>Semester</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {performances.map((perf) => (
                            <TableRow key={perf.id}>
                              <TableCell className="font-medium">{perf.subject}</TableCell>
                              <TableCell>{perf.marks}</TableCell>
                              <TableCell>{perf.attendance}%</TableCell>
                              <TableCell>{perf.backlogs}</TableCell>
                              <TableCell>{perf.internal_marks || "N/A"}</TableCell>
                              <TableCell>{perf.semester || "N/A"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No performance data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk Assessment Tab */}
            <TabsContent value="risk" className="space-y-4">
              {riskAssessment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Risk Assessment
                    </CardTitle>
                    <CardDescription>Current risk level and assessment details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Risk Level</Label>
                        <div className="mt-2">
                          {getRiskBadge(riskAssessment.risk_level)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Risk Score</Label>
                        <p className="text-lg font-medium mt-2">
                          <Badge variant="outline">{riskAssessment.risk_score}/100</Badge>
                        </p>
                      </div>
                    </div>
                    {riskAssessment.factors && riskAssessment.factors.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Risk Factors</Label>
                        <ul className="mt-2 space-y-1">
                          {riskAssessment.factors.map((factor, index) => (
                            <li key={index} className="text-sm">• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {riskAssessment.improvement_suggestions && riskAssessment.improvement_suggestions.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Improvement Suggestions</Label>
                        <ul className="mt-2 space-y-1">
                          {riskAssessment.improvement_suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm">• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Student not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

