import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, AlertTriangle, BookOpen, Calendar, Target, Brain, LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService, studentService, performanceService, riskService } from "@/lib/database";
import type { Student } from "@/types/database";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [performances, setPerformances] = useState<any[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const userRole = await authService.getCurrentUserRole();
      if (!userRole?.user_id) {
        throw new Error("Student not found");
      }

      const studentData = await studentService.getById(userRole.user_id);
      setStudent(studentData);

      const performanceData = await performanceService.getByStudent(userRole.user_id);
      setPerformances(performanceData);

      const risk = await riskService.calculateRisk(userRole.user_id);
      setRiskAssessment(risk);
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

        {/* Subject Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Your performance across all subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                return (
                  <SubjectRow 
                    key={perf.id}
                    name={perf.subject} 
                    marks={perf.marks} 
                    attendance={perf.attendance} 
                    status={status} 
                  />
                );
              })
            )}
          </CardContent>
        </Card>

        {/* AI Counseling */}
        <Card className="border-2 border-accent/50 bg-gradient-to-br from-accent/5 to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-accent to-primary p-3 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>AI Counseling Insights</CardTitle>
                <CardDescription>Personalized recommendations for improvement</CardDescription>
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
              </>
            )}
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

const SubjectRow = ({ name, marks, attendance, status }: any) => {
  const statusConfig = {
    critical: { color: "danger", label: "Critical" },
    warning: { color: "warning", label: "Needs Attention" },
    good: { color: "success", label: "Good" }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">{name}</p>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>Marks: {marks}%</span>
            <span>Attendance: {attendance}%</span>
          </div>
        </div>
        <Badge className={`bg-${config.color} text-${config.color}-foreground`}>
          {config.label}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Progress value={marks} className="h-2" />
        <Progress value={attendance} className="h-2" />
      </div>
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

export default StudentDashboard;
