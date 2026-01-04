import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, AlertTriangle, BookOpen, Calendar, Target, Brain, LogOut, Loader2, Clock, MapPin, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService, studentService, performanceService, riskService, timetableService } from "@/lib/database";
import type { TimetableEntry } from "@/types/database";
import type { AIRiskPrediction } from "@/types/database";
import type { Student } from "@/types/database";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [performances, setPerformances] = useState<any[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<AIRiskPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get current authenticated user
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error("Not authenticated. Please login again.");
      }

      // Get user role and mapping
      const userRole = await authService.getCurrentUserRole();
      if (!userRole) {
        throw new Error("User role not found. Please contact administrator.");
      }

      if (!userRole.user_id) {
        throw new Error("Student ID not found in user record. Please contact administrator to link your account.");
      }

      // Fetch student data using the user_id from users table
      const studentData = await studentService.getById(userRole.user_id);
      if (!studentData) {
        throw new Error(`Student record not found with ID: ${userRole.user_id}`);
      }
      setStudent(studentData);

      // Fetch performance data
      const performanceData = await performanceService.getByStudent(userRole.user_id);
      setPerformances(performanceData || []);

      // Calculate risk assessment
      const risk = await riskService.calculateRisk(userRole.user_id);
      setRiskAssessment(risk);

      // Fetch timetable for student's department
      if (studentData.department) {
        try {
          const timetableData = await timetableService.getByDepartment(studentData.department);
          setTimetable(timetableData || []);
        } catch (error) {
          console.warn('Failed to load timetable:', error);
          // Continue without timetable if it fails
        }
      }
    } catch (error: any) {
      console.error("Error loading student data:", error);
      toast({
        title: "Error Loading Data",
        description: error.message || "Failed to load dashboard data. Please check your account setup.",
        variant: "destructive",
      });
      // Redirect to login if authentication fails
      if (error.message?.includes("Not authenticated") || error.message?.includes("User role not found")) {
        setTimeout(() => navigate("/login"), 2000);
      }
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

  const calculateOverallGPA = () => {
    if (performances.length === 0) return 0;
    const totalMarks = performances.reduce((sum, p) => sum + p.marks, 0);
    return (totalMarks / performances.length / 10).toFixed(1);
  };

  const calculateAvgAttendance = () => {
    if (performances.length === 0) return 0;
    const total = performances.reduce((sum, p) => sum + p.attendance, 0);
    return Math.round(total / performances.length);
  };

  const getTotalBacklogs = () => {
    return performances.reduce((sum, p) => sum + (p.backlogs || 0), 0);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "danger";
      case "Medium":
        return "warning";
      default:
        return "success";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const riskLevel = riskAssessment?.risk_level || "Low";
  const riskScore = riskAssessment?.risk_score || 0;
  const riskColor = getRiskColor(riskLevel);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {student?.name || "Student"}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Risk Alert */}
        {riskLevel !== "Low" && (
          <Card className={`mb-8 border-2 border-${riskColor}/50 bg-gradient-to-r from-${riskColor}/10 to-${riskColor}/5`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`bg-${riskColor} text-${riskColor}-foreground p-3 rounded-xl`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{riskLevel} Risk Level</CardTitle>
                    <CardDescription>
                      {riskLevel === "High" 
                        ? "Your performance needs immediate attention"
                        : "Your performance needs attention"}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`bg-${riskColor} text-${riskColor}-foreground`}>
                  {riskScore}% Risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Based on your recent performance, attendance, and backlog status, 
                our AI system recommends immediate attention to improve your academic standing.
              </p>
              {riskAssessment?.factors && riskAssessment.factors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Risk Factors:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {riskAssessment.factors.map((factor: string, index: number) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Brain className="w-4 h-4 mr-2" />
                View AI Recommendations
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Academic Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Overall GPA"
            value={calculateOverallGPA()}
            max="10.0"
            percentage={parseFloat(calculateOverallGPA()) * 10}
            trend={parseFloat(calculateOverallGPA()) < 7 ? "down" : undefined}
            color={parseFloat(calculateOverallGPA()) < 6 ? "danger" : parseFloat(calculateOverallGPA()) < 7 ? "warning" : "success"}
          />
          <MetricCard
            icon={<Calendar className="w-5 h-5" />}
            title="Attendance"
            value={`${calculateAvgAttendance()}%`}
            percentage={calculateAvgAttendance()}
            trend={calculateAvgAttendance() < 75 ? "down" : undefined}
            color={calculateAvgAttendance() < 75 ? "danger" : calculateAvgAttendance() < 85 ? "warning" : "success"}
          />
          <MetricCard
            icon={<Target className="w-5 h-5" />}
            title="Backlogs"
            value={getTotalBacklogs().toString()}
            subtext="Active"
            color={getTotalBacklogs() > 0 ? "danger" : "success"}
          />
        </div>

        {/* Subject Performance - Detailed View */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subject Performance & Progress</CardTitle>
            <CardDescription>Click on any subject to view detailed progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performances.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No performance data available yet. Please contact your teacher.
              </p>
            ) : (
              performances.map((perf) => {
                const status = perf.marks < 50 || perf.attendance < 75 
                  ? "critical" 
                  : perf.marks < 60 || perf.attendance < 85 
                  ? "warning" 
                  : "good";
                const isExpanded = expandedSubject === perf.id;
                return (
                  <SubjectProgressCard
                    key={perf.id}
                    performance={perf}
                    status={status}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedSubject(isExpanded ? null : perf.id)}
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Timetable Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Weekly Timetable</CardTitle>
                <CardDescription>Your class schedule for the week</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TimetableView student={student} timetable={timetable} />
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Important dates and events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UpcomingEventsView />
          </CardContent>
        </Card>

        {/* AI Counseling */}
        <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5 mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-accent to-primary p-3 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Counseling Insights</CardTitle>
                <CardDescription>Personalized AI-powered recommendations for improvement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {performances.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recommendations available. Performance data will generate personalized insights.
              </p>
            ) : (
              <>
                {/* AI-Generated Suggestions from Gemini */}
                {riskAssessment?.improvement_suggestions && riskAssessment.improvement_suggestions.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">AI-Powered Suggestions</h3>
                    </div>
                    {riskAssessment.improvement_suggestions.map((suggestion: string, idx: number) => (
                      <div key={idx} className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 text-primary p-1.5 rounded-full mt-0.5">
                            <Target className="w-4 h-4" />
                          </div>
                          <p className="text-sm leading-relaxed flex-1">{suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Specific Recommendations */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-3">Priority Actions</h3>
                  {performances.filter((p) => p.attendance < 75).map((perf) => (
                    <RecommendationItem
                      key={perf.id}
                      priority="high"
                      text={`Improve ${perf.subject} attendance immediately - currently at ${perf.attendance}% (minimum required: 75%)`}
                    />
                  ))}
                  {getTotalBacklogs() > 0 && (
                    <RecommendationItem
                      priority="high"
                      text={`Clear ${getTotalBacklogs()} active backlog(s) before end of semester to avoid year drop`}
                    />
                  )}
                  {performances.filter((p) => p.marks < 50).map((perf) => (
                    <RecommendationItem
                      key={perf.id}
                      priority="high"
                      text={`Focus on ${perf.subject} - marks are critically low at ${perf.marks}%`}
                    />
                  ))}
                  {riskLevel === "High" && (
                    <RecommendationItem
                      priority="high"
                      text="Schedule counseling session with academic advisor for study plan revision"
                    />
                  )}
                  {performances.filter((p) => p.marks >= 50 && p.marks < 60).map((perf) => (
                    <RecommendationItem
                      key={perf.id}
                      priority="medium"
                      text={`Focus on ${perf.subject} - marks are below average at ${perf.marks}%`}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Improvement Tips Section */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-xl">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Tips to Improve Your Performance</CardTitle>
                <CardDescription>Actionable guidance to help you succeed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Attendance Tips */}
              {calculateAvgAttendance() < 85 && (
                <TipCard
                  icon={<Calendar className="w-5 h-5" />}
                  title="Improve Attendance"
                  tips={[
                    "Set daily alarms 30 minutes before class",
                    "Prepare your bag and materials the night before",
                    "Join a study group to stay motivated",
                    "Track your attendance weekly and set goals",
                    "Communicate with teachers if you must miss class"
                  ]}
                  color="warning"
                />
              )}

              {/* Marks Improvement Tips */}
              {parseFloat(calculateOverallGPA()) < 7 && (
                <TipCard
                  icon={<Target className="w-5 h-5" />}
                  title="Boost Your Marks"
                  tips={[
                    "Review class notes daily, don't wait for exams",
                    "Practice previous year question papers",
                    "Focus on understanding concepts, not memorization",
                    "Ask teachers for clarification on difficult topics",
                    "Form study groups for peer learning"
                  ]}
                  color="danger"
                />
              )}

              {/* Backlog Management */}
              {getTotalBacklogs() > 0 && (
                <TipCard
                  icon={<AlertTriangle className="w-5 h-5" />}
                  title="Clear Backlogs"
                  tips={[
                    "Prioritize backlogs over new subjects",
                    "Create a study schedule with specific backlog subjects",
                    "Attend extra classes or tutorials if available",
                    "Focus on one backlog at a time",
                    "Seek help from teachers and classmates"
                  ]}
                  color="danger"
                />
              )}

              {/* Study Habits */}
              <TipCard
                icon={<Brain className="w-5 h-5" />}
                title="Effective Study Habits"
                tips={[
                  "Study in 25-30 minute blocks with 5-minute breaks",
                  "Create a dedicated study space free from distractions",
                  "Use active recall: test yourself instead of just reading",
                  "Teach concepts to others to reinforce learning",
                  "Get 7-8 hours of sleep for better memory retention"
                ]}
                color="success"
              />

              {/* Time Management */}
              <TipCard
                icon={<Calendar className="w-5 h-5" />}
                title="Time Management"
                tips={[
                  "Use a planner or app to schedule study time",
                  "Break large tasks into smaller, manageable chunks",
                  "Prioritize tasks by importance and deadline",
                  "Avoid procrastination - start with hardest subjects first",
                  "Review and adjust your schedule weekly"
                ]}
                color="success"
              />

              {/* Stress Management */}
              {riskLevel !== "Low" && (
                <TipCard
                  icon={<TrendingDown className="w-5 h-5" />}
                  title="Manage Stress"
                  tips={[
                    "Practice deep breathing exercises daily",
                    "Take regular breaks during study sessions",
                    "Exercise or walk for 20-30 minutes daily",
                    "Talk to counselors, teachers, or family about concerns",
                    "Maintain a healthy work-life balance"
                  ]}
                  color="warning"
                />
              )}
            </div>

            {/* General Success Tips */}
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                General Success Tips
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong>Stay organized:</strong> Keep notes, assignments, and study materials well-organized</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong>Active participation:</strong> Engage in class discussions and ask questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong>Regular revision:</strong> Review material weekly, not just before exams</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong>Seek help early:</strong> Don't wait until exams to ask for assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span><strong>Stay motivated:</strong> Set small achievable goals and celebrate progress</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const MetricCard = ({ 
  icon, 
  title, 
  value, 
  max, 
  percentage, 
  trend, 
  color, 
  subtext 
}: any) => {
  const colorClasses = {
    success: "from-success/10 to-success/5 border-success/50",
    warning: "from-warning/10 to-warning/5 border-warning/50",
    danger: "from-danger/10 to-danger/5 border-danger/50"
  };

  return (
    <Card className={`border-2 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={`bg-${color} text-${color}-foreground p-2 rounded-lg`}>
            {icon}
          </div>
          {trend && (
            <TrendingDown className={`w-4 h-4 text-${color}`} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">
            {value}
            {max && <span className="text-lg text-muted-foreground"> / {max}</span>}
          </p>
          {subtext && <p className="text-sm text-muted-foreground">{subtext}</p>}
          {percentage !== undefined && (
            <Progress value={percentage} className="h-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SubjectProgressCard = ({ performance, status, isExpanded, onToggle }: any) => {
  const statusConfig = {
    critical: { color: "danger", label: "Critical" },
    warning: { color: "warning", label: "Needs Attention" },
    good: { color: "success", label: "Good" }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  const { subject, marks, attendance, internal_marks, backlogs, assignment_completion, class_participation, motivation_level, stress_level, teacher_remark } = performance;

  return (
    <div className={`border-2 rounded-lg transition-all ${isExpanded ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <p className="font-semibold text-lg">{subject}</p>
              <Badge className={`bg-${config.color} text-${config.color}-foreground`}>
                {config.label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Marks</p>
                <div className="flex items-center gap-2">
                  <Progress value={marks} className="h-2 flex-1" />
                  <span className="text-sm font-medium w-12 text-right">{marks}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                <div className="flex items-center gap-2">
                  <Progress value={attendance} className="h-2 flex-1" />
                  <span className="text-sm font-medium w-12 text-right">{attendance}%</span>
                </div>
              </div>
              {internal_marks && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Internal</p>
                  <p className="text-sm font-medium">{internal_marks}%</p>
                </div>
              )}
              {backlogs > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Backlogs</p>
                  <p className="text-sm font-medium text-danger">{backlogs}</p>
                </div>
              )}
            </div>
          </div>
          <div className="ml-4">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 border-t space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Marks Analysis */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="font-medium text-sm">Marks Analysis</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Final Marks:</span>
                  <span className="font-medium">{marks}%</span>
                </div>
                {internal_marks && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Internal Marks:</span>
                    <span className="font-medium">{internal_marks}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`bg-${marks >= 60 ? 'success' : marks >= 50 ? 'warning' : 'danger'} text-${marks >= 60 ? 'success' : marks >= 50 ? 'warning' : 'danger'}-foreground text-xs`}>
                    {marks >= 60 ? 'Pass' : marks >= 50 ? 'Borderline' : 'Fail'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Attendance Analysis */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <p className="font-medium text-sm">Attendance Analysis</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">{attendance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required:</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`bg-${attendance >= 85 ? 'success' : attendance >= 75 ? 'warning' : 'danger'} text-${attendance >= 85 ? 'success' : attendance >= 75 ? 'warning' : 'danger'}-foreground text-xs`}>
                    {attendance >= 85 ? 'Excellent' : attendance >= 75 ? 'Adequate' : 'Low'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            {(assignment_completion !== undefined || class_participation || motivation_level || stress_level) && (
              <div className="p-3 bg-muted/50 rounded-lg md:col-span-2">
                <p className="font-medium text-sm mb-3">Additional Metrics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {assignment_completion !== undefined && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Assignment Completion</p>
                      <p className="font-medium">{assignment_completion}%</p>
                    </div>
                  )}
                  {class_participation && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Class Participation</p>
                      <Badge variant="outline" className="text-xs">{class_participation}</Badge>
                    </div>
                  )}
                  {motivation_level && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Motivation</p>
                      <Badge variant="outline" className="text-xs">{motivation_level}</Badge>
                    </div>
                  )}
                  {stress_level && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Stress Level</p>
                      <Badge variant="outline" className="text-xs">{stress_level}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Teacher Remarks */}
            {teacher_remark && (
              <div className="p-3 bg-primary/5 rounded-lg md:col-span-2 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <p className="font-medium text-sm">Teacher's Remark</p>
                </div>
                <p className="text-sm text-muted-foreground italic">"{teacher_remark}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RecommendationItem = ({ priority, text }: { priority: string; text: string }) => {
  const priorityConfig = {
    high: { color: "danger", label: "High Priority" },
    medium: { color: "warning", label: "Medium Priority" }
  };

  const config = priorityConfig[priority as keyof typeof priorityConfig];

  return (
    <div className="flex gap-3 p-4 bg-card rounded-xl border border-border">
      <AlertTriangle className={`w-5 h-5 text-${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <Badge className={`bg-${config.color} text-${config.color}-foreground mb-2 text-xs`}>
          {config.label}
        </Badge>
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

const TipCard = ({ icon, title, tips, color }: { icon: React.ReactNode; title: string; tips: string[]; color: string }) => {
  const colorClasses = {
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-danger/30 bg-danger/5"
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`text-${color}`}>
          {icon}
        </div>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <ul className="space-y-2 text-sm">
        {tips.map((tip, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className={`text-${color} mt-1`}>•</span>
            <span className="text-muted-foreground">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TimetableView = ({ student, timetable }: { student: Student | null; timetable: TimetableEntry[] }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Build timetable map from database entries
  const timetableMap: { [key: string]: { [key: number]: TimetableEntry } } = {};
  timetable.forEach(entry => {
    if (!timetableMap[entry.day]) {
      timetableMap[entry.day] = {};
    }
    timetableMap[entry.day][entry.period] = entry;
  });

  // Get all unique time slots from timetable
  const allTimeSlots = new Map<string, number>();
  timetable.forEach(entry => {
    if (!allTimeSlots.has(entry.time_slot)) {
      allTimeSlots.set(entry.time_slot, entry.period);
    }
  });
  
  // Sort time slots by period
  const sortedTimeSlots = Array.from(allTimeSlots.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([time, period]) => ({ time, period }));

  // If no timetable data, show empty state
  if (timetable.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No timetable available yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Please contact your HOD to set up the timetable.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-border p-2 text-left text-sm font-medium bg-muted/50">Time</th>
              {days.map(day => (
                <th key={day} className="border border-border p-2 text-center text-sm font-medium bg-muted/50">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTimeSlots.map((slot) => (
              <tr key={slot.period}>
                <td className="border border-border p-2 text-sm text-muted-foreground bg-muted/30">
                  {slot.time}
                </td>
                {days.map(day => {
                  const entry = timetableMap[day]?.[slot.period];
                  const subject = entry?.subject || '-';
                  const isBreak = subject === 'Break';
                  const isLab = subject === 'Lab';
                  return (
                    <td 
                      key={`${day}-${slot.period}`} 
                      className={`border border-border p-3 text-center text-sm ${
                        isBreak ? 'bg-muted/30 text-muted-foreground italic' :
                        isLab ? 'bg-primary/10 text-primary font-medium' :
                        'bg-card hover:bg-muted/50 transition-colors'
                      }`}
                    >
                      {subject}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-4 italic">
        * Timetable is subject to change. Please check with your department for updates.
      </p>
    </div>
  );
};

const UpcomingEventsView = () => {
  // Sample events - in production, fetch from database
  const events = [
    { 
      id: 1, 
      title: 'Mid-Semester Examinations', 
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      type: 'exam',
      location: 'Main Campus',
      description: 'All subjects mid-semester exams'
    },
    { 
      id: 2, 
      title: 'Assignment Submission Deadline', 
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      type: 'assignment',
      location: 'Online',
      description: 'Submit all pending assignments'
    },
    { 
      id: 3, 
      title: 'Department Seminar', 
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      type: 'event',
      location: 'Auditorium',
      description: 'Guest lecture on Industry Trends'
    },
    { 
      id: 4, 
      title: 'Final Examinations', 
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      type: 'exam',
      location: 'Main Campus',
      description: 'End semester final examinations'
    },
  ];

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'exam':
        return <BookOpen className="w-4 h-4" />;
      case 'assignment':
        return <Target className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'exam':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'assignment':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const daysUntil = getDaysUntil(event.date);
        const isUpcoming = daysUntil <= 7;
        
        return (
          <div 
            key={event.id} 
            className={`p-4 rounded-lg border-2 ${getEventColor(event.type)} ${isUpcoming ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{event.title}</h4>
                    {isUpcoming && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{daysUntil > 0 ? `${daysUntil} days away` : daysUntil === 0 ? 'Today' : 'Past'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {events.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No upcoming events scheduled.
        </p>
      )}
    </div>
  );
};

export default StudentDashboard;
