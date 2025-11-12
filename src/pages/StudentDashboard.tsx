import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, AlertTriangle, BookOpen, Calendar, Target, Brain } from "lucide-react";

const StudentDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, John Doe</p>
            </div>
            <Button variant="outline">Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Risk Alert */}
        <Card className="mb-8 border-2 border-warning bg-gradient-to-r from-warning/10 to-warning/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-warning text-warning-foreground p-3 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Medium Risk Level</CardTitle>
                  <CardDescription>Your performance needs attention</CardDescription>
                </div>
              </div>
              <Badge className="bg-warning text-warning-foreground">68% Risk</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Based on your recent performance, attendance, and backlog status, 
              our AI system recommends immediate attention to improve your academic standing.
            </p>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Brain className="w-4 h-4 mr-2" />
              View AI Recommendations
            </Button>
          </CardContent>
        </Card>

        {/* Academic Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Overall GPA"
            value="6.8"
            max="10.0"
            percentage={68}
            trend="down"
            color="warning"
          />
          <MetricCard
            icon={<Calendar className="w-5 h-5" />}
            title="Attendance"
            value="72%"
            percentage={72}
            trend="down"
            color="danger"
          />
          <MetricCard
            icon={<Target className="w-5 h-5" />}
            title="Backlogs"
            value="2"
            subtext="Active"
            color="danger"
          />
        </div>

        {/* Subject Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Your performance across all subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SubjectRow name="Database Management Systems" marks={45} attendance={62} status="critical" />
            <SubjectRow name="Data Structures & Algorithms" marks={68} attendance={78} status="warning" />
            <SubjectRow name="Operating Systems" marks={72} attendance={85} status="good" />
            <SubjectRow name="Computer Networks" marks={58} attendance={70} status="warning" />
            <SubjectRow name="Software Engineering" marks={80} attendance={90} status="good" />
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
            <RecommendationItem
              priority="high"
              text="Improve DBMS attendance immediately - currently at 62% (minimum required: 75%)"
            />
            <RecommendationItem
              priority="high"
              text="Clear 2 active backlogs before end of semester to avoid year drop"
            />
            <RecommendationItem
              priority="medium"
              text="Focus on practical lab work in Computer Networks - marks are below class average"
            />
            <RecommendationItem
              priority="medium"
              text="Schedule counseling session with academic advisor for study plan revision"
            />
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
