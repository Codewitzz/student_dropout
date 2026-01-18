import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  UserCog, 
  Users, 
  BookOpen, 
  Brain, 
  TrendingUp, 
  FileText, 
  Search, 
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  Info,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LearnMore = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Animated Header */}
      <div className="relative p-8 bg-gradient-to-br from-primary via-accent to-primary text-white">
        <div className="absolute inset-0 opacity-20 overflow-hidden">
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '30px 30px',
              animation: 'float 20s infinite linear'
            }} 
          />
        </div>
        <div className="relative z-10 container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl animate-pulse">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Student Dropout Prevention System</h1>
                <p className="text-white/90 mt-1">
                  Complete Guide to Using the AI-Powered Analytics Platform
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-0 bg-transparent h-auto p-4 gap-2">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Info className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="how-it-works"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                How It Works
              </TabsTrigger>
              <TabsTrigger 
                value="hod-guide"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <UserCog className="w-4 h-4 mr-2" />
                HOD Guide
              </TabsTrigger>
              <TabsTrigger 
                value="teacher-guide"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <Users className="w-4 h-4 mr-2" />
                Teacher Guide
              </TabsTrigger>
              <TabsTrigger 
                value="student-guide"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Student Guide
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="container mx-auto p-8 space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
              <div className="grid md:grid-cols-2 gap-6">
                <FeatureCard
                  icon={<Brain className="w-6 h-6" />}
                  title="AI-Powered Analysis"
                  description="Advanced machine learning algorithms analyze 7+ data points to predict dropout risk with 85%+ accuracy"
                  gradient="from-purple-500/10 to-pink-500/10"
                  delay="0s"
                />
                <FeatureCard
                  icon={<BarChart3 className="w-6 h-6" />}
                  title="Real-Time Monitoring"
                  description="Track student performance, attendance, and engagement metrics in real-time across all subjects"
                  gradient="from-blue-500/10 to-cyan-500/10"
                  delay="0.1s"
                />
                <FeatureCard
                  icon={<Shield className="w-6 h-6" />}
                  title="Early Intervention"
                  description="Identify at-risk students before it's too late and provide timely counseling and support"
                  gradient="from-green-500/10 to-emerald-500/10"
                  delay="0.2s"
                />
                <FeatureCard
                  icon={<Zap className="w-6 h-6" />}
                  title="Automated Insights"
                  description="Get personalized improvement suggestions and action plans generated by AI for each student"
                  gradient="from-orange-500/10 to-yellow-500/10"
                  delay="0.3s"
                />
              </div>

              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "7-Point AI Risk Assessment",
                      "CSV Bulk Import",
                      "Role-Based Dashboards",
                      "Search & Filter Students",
                      "Automated Counseling Sessions",
                      "Performance Tracking",
                      "Weak Subject Identification",
                      "Personalized Recommendations"
                    ].map((feature, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* How It Works Tab */}
            <TabsContent value="how-it-works" className="container mx-auto p-8 space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
              <div className="space-y-6">
                <StepCard
                  number={1}
                  title="Data Collection"
                  description="Teachers enter student performance data including marks, attendance, assignments, participation, and more"
                  icon={<FileText className="w-6 h-6" />}
                  color="from-blue-500 to-cyan-500"
                />
                <StepCard
                  number={2}
                  title="AI Analysis"
                  description="The system analyzes 7 key data points using advanced algorithms to calculate risk scores and identify patterns"
                  icon={<Brain className="w-6 h-6" />}
                  color="from-purple-500 to-pink-500"
                />
                <StepCard
                  number={3}
                  title="Risk Assessment"
                  description="Students are categorized into High, Medium, or Low risk groups based on comprehensive analysis"
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="from-orange-500 to-red-500"
                />
                <StepCard
                  number={4}
                  title="Action & Intervention"
                  description="Teachers and HODs receive alerts, detailed reports, and AI-generated improvement suggestions for at-risk students"
                  icon={<Zap className="w-6 h-6" />}
                  color="from-green-500 to-emerald-500"
                />
              </div>

              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2">
                <CardHeader>
                  <CardTitle>7-Point AI Prediction System</CardTitle>
                  <CardDescription>The system analyzes these key metrics for accurate risk prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      "Academic Performance (Marks)",
                      "Attendance Percentage",
                      "Assignment Completion",
                      "Class Participation",
                      "Motivation Level",
                      "Teacher Remarks",
                      "Past Failures History"
                    ].map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-card border">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HOD Guide Tab */}
            <TabsContent value="hod-guide" className="container mx-auto p-8 space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <GuideSection
                  title="Getting Started"
                  steps={[
                    "Register as HOD using 'First Time HOD Registration' on login page",
                    "Enter your name, department, email, and create a password",
                    "Access your dashboard to manage teachers and view department analytics"
                  ]}
                  icon={<UserCog className="w-5 h-5" />}
                />
                <GuideSection
                  title="Managing Teachers"
                  steps={[
                    "Go to 'Teachers' tab to view all department teachers",
                    "Click 'Add Teacher' to add new teachers with subject assignments",
                    "Use 'Edit' button to update teacher information",
                    "Import teachers in bulk using CSV upload in 'Import CSV' tab"
                  ]}
                  icon={<Users className="w-5 h-5" />}
                />
                <GuideSection
                  title="Viewing Students"
                  steps={[
                    "Navigate to 'Students' tab to see all enrolled students",
                    "Use search bar to find students by name, ERP, email, or phone",
                    "Filter by Department or Year using dropdown menus",
                    "Sort by clicking column headers (Name, ERP, Department, Year)"
                  ]}
                  icon={<Search className="w-5 h-5" />}
                />
                <GuideSection
                  title="Monitoring Risk"
                  steps={[
                    "View risk distribution in the dashboard overview cards",
                    "Check 'Counseling Progress' tab to track intervention outcomes",
                    "Use 'Diagnostic' tab to verify database connectivity and data"
                  ]}
                  icon={<BarChart3 className="w-5 h-5" />}
                />
              </div>
            </TabsContent>

            {/* Teacher Guide Tab */}
            <TabsContent value="teacher-guide" className="container mx-auto p-8 space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <GuideSection
                  title="Login & Dashboard"
                  steps={[
                    "Login with your email and password provided by HOD",
                    "View your assigned subjects and student statistics",
                    "Check high-risk students count and average attendance"
                  ]}
                  icon={<BookOpen className="w-5 h-5" />}
                />
                <GuideSection
                  title="Viewing All Students"
                  steps={[
                    "Go to 'All Students' tab to see complete student directory",
                    "Search students by name, ERP number, email, or phone",
                    "Filter by department or year for targeted views",
                    "Click column headers to sort students"
                  ]}
                  icon={<Users className="w-5 h-5" />}
                />
                <GuideSection
                  title="Entering Performance Data"
                  steps={[
                    "Navigate to 'Data Entry' tab",
                    "Select subject and enter student ERP number",
                    "Fill all 7 data points: Marks, Attendance, Assignments, Participation, Motivation, Remarks, Past Failures",
                    "Submit to automatically calculate risk assessment"
                  ]}
                  icon={<FileText className="w-5 h-5" />}
                />
                <GuideSection
                  title="Viewing AI Reports"
                  steps={[
                    "Go to 'My Students' tab and select a subject",
                    "Click 'View AI Report' button for any student",
                    "Review detailed risk analysis, weak subjects, and improvement suggestions",
                    "Use insights to provide targeted support to students"
                  ]}
                  icon={<Brain className="w-5 h-5" />}
                />
                <GuideSection
                  title="Adding Students"
                  steps={[
                    "Use 'Add Students' tab to add students one-by-one or via CSV",
                    "ERP number is auto-generated sequentially",
                    "Include email and password to create login accounts automatically",
                    "Download CSV template for bulk import"
                  ]}
                  icon={<GraduationCap className="w-5 h-5" />}
                />
              </div>
            </TabsContent>

            {/* Student Guide Tab */}
            <TabsContent value="student-guide" className="container mx-auto p-8 space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <GuideSection
                  title="Login"
                  steps={[
                    "Use your ERP number and password to login",
                    "If you don't have login credentials, contact your teacher or HOD",
                    "Your email must be registered in the system for login access"
                  ]}
                  icon={<Shield className="w-5 h-5" />}
                />
                <GuideSection
                  title="Viewing Your Dashboard"
                  steps={[
                    "See your academic performance across all subjects",
                    "View your attendance percentage and marks",
                    "Check your current risk level (High/Medium/Low)"
                  ]}
                  icon={<BarChart3 className="w-5 h-5" />}
                />
                <GuideSection
                  title="AI Counseling Insights"
                  steps={[
                    "Scroll to 'AI Counseling Insights' section",
                    "Review your weak subjects identified by AI",
                    "Read personalized improvement suggestions",
                    "Follow the recommendations to improve your performance"
                  ]}
                  icon={<Brain className="w-5 h-5" />}
                />
                <GuideSection
                  title="Understanding Risk Levels"
                  steps={[
                    "Low Risk: Good performance, keep up the excellent work!",
                    "Medium Risk: Some areas need attention, follow AI suggestions",
                    "High Risk: Immediate action needed, consult with teachers and counselors"
                  ]}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t bg-gradient-to-r from-primary/5 to-accent/5 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <p className="font-semibold">Ready to get started?</p>
            <p className="text-sm text-muted-foreground">Access your dashboard and start managing student success</p>
          </div>
          <Button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Go to Login
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  gradient,
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  gradient: string;
  delay: string;
}) => (
  <Card 
    className={`bg-gradient-to-br ${gradient} border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up`}
    style={{ animationDelay: delay }}
  >
    <CardHeader>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const StepCard = ({
  number,
  title,
  description,
  icon,
  color
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="flex gap-4 p-6 rounded-xl border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card">
    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg`}>
      {number}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

const GuideSection = ({
  title,
  steps,
  icon
}: {
  title: string;
  steps: string[];
  icon: React.ReactNode;
}) => (
  <Card className="border-2 hover:shadow-md transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <div className="text-primary">{icon}</div>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ol className="space-y-2">
        {steps.map((step, idx) => (
          <li key={idx} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <span className="text-sm text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </CardContent>
  </Card>
);

export default LearnMore;

