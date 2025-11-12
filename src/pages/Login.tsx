import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserCog, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState("student");

  const handleLogin = (e: React.FormEvent, role: string) => {
    e.preventDefault();
    toast({
      title: "Login Successful",
      description: `Welcome to your ${role} dashboard`,
    });
    
    // Navigate to appropriate dashboard
    navigate(`/dashboard/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-primary to-accent p-3 rounded-2xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Student Analytics Platform</h1>
          </div>
          <p className="text-muted-foreground">Select your role and sign in to continue</p>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Choose your role to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeRole} onValueChange={setActiveRole} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1">
                <TabsTrigger 
                  value="student" 
                  className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="text-sm font-medium">Student</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="teacher"
                  className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Teacher</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="hod"
                  className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <UserCog className="w-5 h-5" />
                  <span className="text-sm font-medium">HOD</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <LoginForm role="student" onSubmit={handleLogin} />
              </TabsContent>

              <TabsContent value="teacher">
                <LoginForm role="teacher" onSubmit={handleLogin} />
              </TabsContent>

              <TabsContent value="hod">
                <LoginForm role="hod" onSubmit={handleLogin} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          Need help? Contact your administrator
        </div>
      </div>
    </div>
  );
};

const LoginForm = ({ 
  role, 
  onSubmit 
}: { 
  role: string; 
  onSubmit: (e: React.FormEvent, role: string) => void 
}) => {
  return (
    <form onSubmit={(e) => onSubmit(e, role)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${role}-email`}>Email or ID</Label>
        <Input
          id={`${role}-email`}
          type="text"
          placeholder={role === "student" ? "Enter your ERP number" : "Enter your email"}
          className="h-11"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${role}-password`}>Password</Label>
        <Input
          id={`${role}-password`}
          type="password"
          placeholder="Enter your password"
          className="h-11"
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90"
      >
        Sign In as {role.toUpperCase()}
      </Button>
      <div className="text-center">
        <Button variant="link" className="text-sm text-muted-foreground">
          Forgot password?
        </Button>
      </div>
    </form>
  );
};

export default Login;
