import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { TaskDetail } from "./pages/TaskDetail";
import { Team } from "./pages/Team";
import { Activity } from "./pages/Activity";
import { CreateTask } from "./pages/CreateTask";
import { AddIntern } from "./pages/AddIntern";
import  Assistant  from "./pages/Assistant";
import { useAuth } from "./state/auth";

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>

        }
      >
        <Route index element={<Dashboard />} />

        <Route path="tasks/new" element={<CreateTask />} />

        <Route path="tasks/:id" element={<TaskDetail />} />

        <Route path="team" element={<Team />} />

        <Route path="interns/new" element={<AddIntern />} />

        <Route path="activity" element={<Activity />} />
        
        <Route path="/assistant" element={<Assistant />} />

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );



}
