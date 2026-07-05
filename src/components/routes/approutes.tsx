import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../login";
import Signup from "../signup";
import HomePage from "../home";
import RouteGuard from "../guard/guard";
import Profile from "../profile";
import Dashboard from "../kanban/dashboard";
import UsersPage from "../users";
import AdminGuard from "../guard/adminguard";
import TeamsPage from "../teams";
import TeamMembersPage from "../teamMembers";
import MyTasks from "../kanban/mytasks";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/home"
          element={
            <RouteGuard>
              <HomePage />
            </RouteGuard>
          }
        />
        <Route
          path="/dashboard/:projectId"
          element={
            <RouteGuard>
              <Dashboard />
            </RouteGuard>
          }
        />
        <Route
          path="/users"
          element={
            <RouteGuard>
              <AdminGuard>
                <UsersPage />
              </AdminGuard>
            </RouteGuard>
          }
        />
        <Route
          path="/teams"
          element={
            <RouteGuard>
              <TeamsPage />
            </RouteGuard>
          }
        />
        <Route
          path="/team-members"
          element={
            <RouteGuard>
              <TeamMembersPage />
            </RouteGuard>
          }
        />
         <Route
          path="/my-tasks"
          element={
            <RouteGuard>
              <MyTasks />
            </RouteGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <RouteGuard>
              <Profile />
            </RouteGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
