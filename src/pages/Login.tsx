import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, UserCog, Users, BookOpen, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authService, hodService, studentService } from "@/lib/database";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeRole, setActiveRole] = useState("student");
  const [isFirstTimeHOD, setIsFirstTimeHOD] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent, role: string) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const emailInput = form.querySelector(`input[type="text"], input[type="email"]`) as HTMLInputElement;
    const passwordInput = form.querySelector(`input[type="password"]`) as HTMLInputElement;

    const emailOrId = emailInput?.value || "";
    const password = passwordInput?.value || "";

    try {
      // For students, emailOrId is ERP number, need to find email
      let email = emailOrId;
      if (role === "student") {
        try {
          const student = await studentService.getByERP(emailOrId);
          // For students, we might need a different auth approach
          // For now, using ERP as email if no email is set
          email = student.email || `${emailOrId}@student.local`;
        } catch {
          // If student not found, try direct login
        }
      }

      await authService.signIn(email, password);
      const userRole = await authService.getCurrentUserRole();
      
      if (userRole?.role !== role) {
        throw new Error(`Invalid role. Expected ${role}, got ${userRole?.role}`);
      }

      toast({
        title: "Login Successful",
        description: `Welcome to your ${role} dashboard`,
      });
      
      navigate(`/dashboard/${role}`);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or user not found",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const nameInput = form.querySelector("#hod-name") as HTMLInputElement;
    const departmentInput = form.querySelector("#hod-department") as HTMLInputElement;
    const emailInput = form.querySelector("#hod-reg-email") as HTMLInputElement;
    const passwordInput = form.querySelector("#hod-reg-password") as HTMLInputElement;
    const confirmPasswordInput = form.querySelector("#hod-confirm-password") as HTMLInputElement;

    const name = nameInput?.value || "";
    const department = departmentInput?.value || "";
    const email = emailInput?.value || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Create HOD record
      const hod = await hodService.create({
        name,
        email,
        department,
      });

      // Create auth user
      await authService.signUp(email, password, "hod", hod);

      toast({
        title: "HOD Account Created",
        description: "Your account has been created successfully",
      });
      setIsFirstTimeHOD(false);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create HOD account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                <LoginForm role="student" onSubmit={handleLogin} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="teacher">
                <LoginForm role="teacher" onSubmit={handleLogin} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="hod">
                {isFirstTimeHOD ? (
                  <FirstTimeHODForm onSubmit={handleFirstTimeSetup} onBack={() => setIsFirstTimeHOD(false)} isLoading={isLoading} />
                ) : (
                  <>
                    <LoginForm role="hod" onSubmit={handleLogin} isLoading={isLoading} />
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsFirstTimeHOD(true)}
                        className="w-full"
                      >
                        First Time HOD Registration
                      </Button>
                    </div>
                  </>
                )}
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
  onSubmit,
  isLoading = false
}: { 
  role: string; 
  onSubmit: (e: React.FormEvent, role: string) => void;
  isLoading?: boolean;
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
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          `Sign In as ${role.toUpperCase()}`
        )}
      </Button>
      <div className="text-center">
        <Button variant="link" className="text-sm text-muted-foreground">
          Forgot password?
        </Button>
      </div>
    </form>
  );
};

const FirstTimeHODForm = ({ 
  onSubmit,
  onBack,
  isLoading = false
}: { 
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading?: boolean;
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hod-name">Full Name</Label>
        <Input
          id="hod-name"
          type="text"
          placeholder="Enter your full name"
          className="h-11"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hod-department">Department</Label>
        <Input
          id="hod-department"
          type="text"
          placeholder="Enter your department"
          className="h-11"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hod-reg-email">Email</Label>
        <Input
          id="hod-reg-email"
          type="email"
          placeholder="Enter your email"
          className="h-11"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hod-reg-password">Password</Label>
        <Input
          id="hod-reg-password"
          type="password"
          placeholder="Create a password"
          className="h-11"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hod-confirm-password">Confirm Password</Label>
        <Input
          id="hod-confirm-password"
          type="password"
          placeholder="Confirm your password"
          className="h-11"
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Account...
          </>
        ) : (
          "Create HOD Account"
        )}
      </Button>
      <Button 
        type="button"
        variant="outline"
        onClick={onBack}
        className="w-full h-11"
      >
        Back to Login
      </Button>
    </form>
  );
};

export default Login;
