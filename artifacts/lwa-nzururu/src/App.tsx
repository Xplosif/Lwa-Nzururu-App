import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import SetupAccount from "@/pages/SetupAccount";
import Dashboard from "@/pages/Dashboard";
import ClassStats from "@/pages/ClassStats";
import Students from "@/pages/Students";
import StudentNew from "@/pages/StudentNew";
import StudentDetail from "@/pages/StudentDetail";
import Teachers from "@/pages/Teachers";
import Classes from "@/pages/Classes";
import Subjects from "@/pages/Subjects";
import Grades from "@/pages/Grades";
import Archives from "@/pages/Archives";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType; roles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Acces non autorise.</p>
      </div>
    );
  }

  return <Component />;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Institut Lwa-Nzururu...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/setup-account" component={SetupAccount} />
        <Route><Redirect to="/login" /></Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/stats/:classId" component={ClassStats} />
        <Route path="/students/new" component={StudentNew} />
        <Route path="/students/:id" component={StudentDetail} />
        <Route path="/students" component={Students} />
        <Route path="/teachers">
          <ProtectedRoute component={Teachers} roles={["proviseur"]} />
        </Route>
        <Route path="/classes" component={Classes} />
        <Route path="/subjects">
          <ProtectedRoute component={Subjects} roles={["proviseur"]} />
        </Route>
        <Route path="/grades" component={Grades} />
        <Route path="/archives">
          <ProtectedRoute component={Archives} roles={["proviseur"]} />
        </Route>
        <Route path="/reports" component={Reports} />
        <Route path="/settings">
          <ProtectedRoute component={Settings} roles={["proviseur"]} />
        </Route>
        <Route path="/login"><Redirect to="/" /></Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
