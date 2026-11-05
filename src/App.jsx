import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import { AppLayout } from './layouts/AppLayout';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { TeamLayout } from './layouts/TeamLayout';
import { RoomLayout } from './layouts/RoomLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard & Personal Pages
import PersonalDashboard from './pages/dashboard/PersonalDashboard';
import MyTasksPage from './pages/tasks/MyTasksPage';
import PersonalCalendarPage from './pages/calendar/PersonalCalendarPage';
import DailyPlannerPage from './pages/planner/DailyPlannerPage';
import ProfileSettingsPage from './pages/settings/ProfileSettingsPage';
import OrgSettingsPage from './pages/settings/OrgSettingsPage';

// Workspace Pages
import WorkspaceListPage from './pages/workspaces/WorkspaceListPage';
import WorkspaceOverviewPage from './pages/workspaces/WorkspaceOverviewPage';
import WorkspaceAnnouncementsPage from './pages/workspaces/WorkspaceAnnouncementsPage';
import WorkspaceDailyStandupsPage from './pages/workspaces/WorkspaceDailyStandupsPage';
import WorkspaceCalendarPage from './pages/workspaces/WorkspaceCalendarPage';
import WorkspaceReportsPage from './pages/workspaces/WorkspaceReportsPage';
import WorkspaceMembersPage from './pages/workspaces/WorkspaceMembersPage';
import JoinWorkspacePage from './pages/workspaces/JoinWorkspacePage';

// Team Pages
import TeamListPage from './pages/teams/TeamListPage';
import TeamOverviewPage from './pages/teams/TeamOverviewPage';
import TeamRoomsPage from './pages/teams/TeamRoomsPage';
import TeamCalendarPage from './pages/teams/TeamCalendarPage';
import TeamDailyUpdatesPage from './pages/teams/TeamDailyUpdatesPage';
import TeamDiscussionsPage from './pages/teams/TeamDiscussionsPage';
import TeamMembersPage from './pages/teams/TeamMembersPage';

// Room Pages
import RoomOverviewPage from './pages/rooms/RoomOverviewPage';
import RoomKanbanBoardPage from './pages/rooms/RoomKanbanBoardPage';
import RoomTaskListPage from './pages/rooms/RoomTaskListPage';
import RoomCalendarPage from './pages/rooms/RoomCalendarPage';
import RoomMilestonesPage from './pages/rooms/RoomMilestonesPage';
import RoomDailyPlansPage from './pages/rooms/RoomDailyPlansPage';
import RoomDiscussionsPage from './pages/rooms/RoomDiscussionsPage';
import RoomActivityPage from './pages/rooms/RoomActivityPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/join-workspace/:codeOrId" element={<JoinWorkspacePage />} />

              {/* Protected Application Routes */}
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to="/app/dashboard" replace />} />
                <Route path="dashboard" element={<PersonalDashboard />} />
                <Route path="my-tasks" element={<MyTasksPage />} />
                <Route path="my-calendar" element={<PersonalCalendarPage />} />
                <Route path="daily-planner" element={<DailyPlannerPage />} />
                <Route path="settings" element={<ProfileSettingsPage />} />
                <Route path="org-settings" element={<OrgSettingsPage />} />

                {/* Workspace Routes */}
                <Route path="workspaces" element={<WorkspaceListPage />} />
                <Route path="workspaces/join/:codeOrId" element={<JoinWorkspacePage />} />
                <Route path="workspaces/:workspaceId" element={<WorkspaceLayout />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<WorkspaceOverviewPage />} />
                  <Route path="teams" element={<TeamListPage />} />
                  <Route path="announcements" element={<WorkspaceAnnouncementsPage />} />
                  <Route path="calendar" element={<WorkspaceCalendarPage />} />
                  <Route path="daily-standups" element={<WorkspaceDailyStandupsPage />} />
                  <Route path="reports" element={<WorkspaceReportsPage />} />
                  <Route path="members" element={<WorkspaceMembersPage />} />
                </Route>

                {/* Team Routes */}
                <Route
                  path="workspaces/:workspaceId/teams/:teamId"
                  element={<TeamLayout />}
                >
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<TeamOverviewPage />} />
                  <Route path="rooms" element={<TeamRoomsPage />} />
                  <Route path="calendar" element={<TeamCalendarPage />} />
                  <Route path="daily-updates" element={<TeamDailyUpdatesPage />} />
                  <Route path="discussions" element={<TeamDiscussionsPage />} />
                  <Route path="members" element={<TeamMembersPage />} />
                </Route>

                {/* Room Routes (Direct or under team) */}
                <Route
                  path="workspaces/:workspaceId/rooms/:roomId"
                  element={<RoomLayout />}
                >
                  <Route index element={<Navigate to="board" replace />} />
                  <Route path="overview" element={<RoomOverviewPage />} />
                  <Route path="board" element={<RoomKanbanBoardPage />} />
                  <Route path="list" element={<RoomTaskListPage />} />
                  <Route path="calendar" element={<RoomCalendarPage />} />
                  <Route path="milestones" element={<RoomMilestonesPage />} />
                  <Route path="daily-plans" element={<RoomDailyPlansPage />} />
                  <Route path="discussions" element={<RoomDiscussionsPage />} />
                  <Route path="activity" element={<RoomActivityPage />} />
                </Route>

                <Route
                  path="workspaces/:workspaceId/teams/:teamId/rooms/:roomId"
                  element={<RoomLayout />}
                >
                  <Route index element={<Navigate to="board" replace />} />
                  <Route path="overview" element={<RoomOverviewPage />} />
                  <Route path="board" element={<RoomKanbanBoardPage />} />
                  <Route path="list" element={<RoomTaskListPage />} />
                  <Route path="calendar" element={<RoomCalendarPage />} />
                  <Route path="milestones" element={<RoomMilestonesPage />} />
                  <Route path="daily-plans" element={<RoomDailyPlansPage />} />
                  <Route path="discussions" element={<RoomDiscussionsPage />} />
                  <Route path="activity" element={<RoomActivityPage />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
