import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Loader2, User, Mail, Phone, GraduationCap, Calendar, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { teacherService } from "@/lib/database";
import type { Teacher } from "@/types/database";

interface TeacherProfileModalProps {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export const TeacherProfileModal = ({ teacherId, open, onOpenChange, onUpdate }: TeacherProfileModalProps) => {
  const { toast } = useToast();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    subjects: "",
  });

  useEffect(() => {
    if (open && teacherId) {
      loadTeacherData();
    } else {
      // Reset state when modal closes
      setTeacher(null);
      setIsEditing(false);
    }
  }, [open, teacherId]);

  const loadTeacherData = async () => {
    if (!teacherId) return;
    
    try {
      setIsLoading(true);
      
      const teacherData = await teacherService.getById(teacherId);
      setTeacher(teacherData);
      setEditForm({
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone || "",
        department: teacherData.department || "",
        subjects: teacherData.subjects?.join(", ") || "",
      });
    } catch (error: any) {
      toast({
        title: "Error Loading Teacher Data",
        description: error.message || "Failed to load teacher profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teacher) return;

    setIsSaving(true);
    try {
      const subjectsArray = editForm.subjects
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const updateData: Partial<Teacher> = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        department: editForm.department.trim() || undefined,
        subjects: subjectsArray,
      };

      // Only update email if it changed
      if (editForm.email !== teacher.email) {
        updateData.email = editForm.email.trim();
      }

      const updated = await teacherService.update(teacher.id, updateData);
      setTeacher(updated);
      setIsEditing(false);

      toast({
        title: "Teacher Updated",
        description: "Teacher information has been updated successfully",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      toast({
        title: "Error Updating Teacher",
        description: error.message || "Failed to update teacher",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (teacher) {
      setEditForm({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone || "",
        department: teacher.department || "",
        subjects: teacher.subjects?.join(", ") || "",
      });
    }
    setIsEditing(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Teacher Profile</DialogTitle>
              <DialogDescription>
                {teacher ? `Complete profile information for ${teacher.name}` : "Loading..."}
              </DialogDescription>
            </div>
            {!isEditing && teacher && (
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
        ) : teacher ? (
          <div className="space-y-4">
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Teacher Information</CardTitle>
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
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        required
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-subjects">Subjects (comma-separated)</Label>
                      <Input
                        id="edit-subjects"
                        value={editForm.subjects}
                        onChange={(e) => setEditForm({ ...editForm, subjects: e.target.value })}
                        placeholder="e.g., DBMS, Networks, Data Structures"
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
                      <p className="text-lg font-medium">{teacher.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <p className="text-lg font-medium">{teacher.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </Label>
                      <p className="text-lg font-medium">{teacher.phone || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="text-lg font-medium">
                        {teacher.department ? (
                          <Badge variant="secondary">{teacher.department}</Badge>
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Assigned Subjects
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          teacher.subjects.map((subject) => (
                            <Badge key={subject} variant="outline">
                              {subject}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No subjects assigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Member Since
                      </Label>
                      <p className="text-lg font-medium">
                        {new Date(teacher.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Teacher not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

