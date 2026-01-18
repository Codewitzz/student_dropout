import { Button } from "@/components/ui/button";
import { GraduationCap, TrendingUp, Users, Brain, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-6 pt-20 pb-32 relative">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-6 py-2 shadow-sm">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Student Analytics</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Predict & Prevent
              </span>
              <br />
              Student Dropouts
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Advanced AI-driven system that analyzes academic performance, attendance, and engagement 
              to identify at-risk students and provide personalized counseling recommendations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14 shadow-lg shadow-primary/25"
                onClick={() => navigate('/login')}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 h-14 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => navigate('/learn-more')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Risk Management</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to support student success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Risk Prediction"
              description="AI analyzes marks, attendance, and backlogs to predict dropout risk with high accuracy"
              gradient="from-danger/10 to-warning/10"
              iconBg="bg-gradient-to-br from-danger to-warning"
            />
            
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Role-Based Dashboards"
              description="Custom views for HODs, teachers, and students with relevant insights and actions"
              gradient="from-primary/10 to-accent/10"
              iconBg="bg-gradient-to-br from-primary to-accent"
            />
            
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="AI Counseling"
              description="Personalized guidance and recommendations powered by advanced AI models"
              gradient="from-success/10 to-accent/10"
              iconBg="bg-gradient-to-br from-success to-accent"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-card rounded-3xl p-12 shadow-lg border border-border">
            <div className="grid md:grid-cols-3 gap-12">
              <StatCard number="85%" label="Prediction Accuracy" />
              <StatCard number="3x" label="Faster Intervention" />
              <StatCard number="92%" label="Student Satisfaction" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary via-accent to-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto px-6 text-center relative">
          <GraduationCap className="w-16 h-16 mx-auto mb-6 text-white" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Student Success?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join educational institutions using AI to identify and support at-risk students
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 h-14"
            onClick={() => navigate('/login')}
          >
            Access Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card/50">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 Student Dropout Prevention System. Powered by Codwitzz team.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  gradient, 
  iconBg 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  gradient: string;
  iconBg: string;
}) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-8 border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
    <div className={`${iconBg} w-16 h-16 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center">
    <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
      {number}
    </div>
    <div className="text-muted-foreground text-lg">{label}</div>
  </div>
);

export default Index;
