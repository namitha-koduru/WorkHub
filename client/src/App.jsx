import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import api from './api/client';
import {
  Layers,
  Activity,
  Server,
  Database,
  Wifi,
  CheckCircle2,
  Calendar,
  Kanban,
  Users,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function HealthCheckPanel() {
  const { isConnected: socketConnected } = useSocket();
  const { data: health, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/health'),
    refetchInterval: 10000,
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">System Infrastructure Health</h2>
            <p className="text-sm text-slate-500">Live monitoring of WorkHub Phase 1 Core Stack</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        >
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {/* Backend API */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Backend API</span>
            <Server className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                health?.success ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-base font-semibold text-slate-800">
              {isLoading ? 'Checking...' : isError ? 'Offline' : 'Operational (v1.0)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {health?.data?.uptime ? `Uptime: ${health.data.uptime}` : 'Connecting to Express server...'}
          </p>
        </div>

        {/* Database Layer */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Database Engine</span>
            <Database className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                health?.data?.database?.connected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-base font-semibold text-slate-800">
              {health?.data?.database?.status ? health.data.database.status.toUpperCase() : 'PENDING'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Mongoose ODM & 17 Schema Specifications</p>
        </div>

        {/* Socket.IO Realtime */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Real-Time Engine</span>
            <Wifi className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="text-base font-semibold text-slate-800">
              {socketConnected ? 'Socket Active' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Bi-directional event channels ready</p>
        </div>

        {/* Client Layer */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Frontend Client</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-base font-semibold text-slate-800">Vite 6 + React 18</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Tailwind CSS + TanStack Query</p>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const architecturalFeatures = [
    {
      title: '5-Tier Role-Based Security',
      desc: 'Owner, Admin, Workspace Manager, Room Leader, and Team Member with isolated room scopes.',
      icon: ShieldCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Multi-Workspace & Room Hierarchy',
      desc: 'Complete isolation: Organizations → Workspaces (events/projects) → Rooms (departments) → Tasks.',
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Kanban & Approval Workflows',
      desc: 'To Do → In Progress → Under Review → Changes Requested → Completed with change logs.',
      icon: Kanban,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Multi-Scope Interactive Calendar',
      desc: 'FullCalendar integration with Personal, Room, and Workspace aggregation scopes.',
      icon: Calendar,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          Phase 1 Architecture & Project Setup Completed
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          WorkHub Platform
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-3xl">
          Collaborative team workflow, project organization, and event operations management platform.
          Engineered according to the Master Specification without AI dependencies.
        </p>
      </div>

      {/* Live System Health */}
      <HealthCheckPanel />

      {/* Architecture Highlights */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Core Architectural Foundations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {architecturalFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex items-start gap-4"
              >
                <div
                  className={`h-11 w-11 rounded-lg border flex items-center justify-center shrink-0 ${feat.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">{feat.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap Phasing Status */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-indigo-400 font-semibold text-xs tracking-wider uppercase">Execution Roadmap</span>
            <h3 className="text-xl font-bold mt-1">Incremental Phase Progression</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Phase 1 Setup Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
            <span className="text-xs font-mono text-emerald-400">PHASE 1 (COMPLETED)</span>
            <h4 className="font-semibold text-white mt-1">Requirements & Project Setup</h4>
            <p className="text-xs text-slate-400 mt-2">
              Architecture documentation, 17 schema blueprints, Express + Socket.IO server, Vite React frontend & Tailwind configuration.
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
            <span className="text-xs font-mono text-indigo-400">PHASE 2 (NEXT)</span>
            <h4 className="font-semibold text-white mt-1">Database Models & Auth</h4>
            <p className="text-xs text-slate-400 mt-2">
              User & Organization Mongoose schemas, JWT HttpOnly authentication, password hashing, and user profile management.
            </p>
          </div>
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60">
            <span className="text-xs font-mono text-slate-400">PHASES 3 - 12</span>
            <h4 className="font-semibold text-white mt-1">Full Operations Lifecycle</h4>
            <p className="text-xs text-slate-400 mt-2">
              Workspaces, Rooms, Kanban, FullCalendar, Daily Plans, Discussions, Approvals, Socket Alerts & Dashboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
              {/* Navigation Header */}
              <nav className="sticky top-0 z-30 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        W
                      </div>
                      <span className="text-xl font-bold tracking-tight text-slate-900">
                        Work<span className="text-indigo-600">Hub</span>
                      </span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ml-2">
                        Platform v1.0
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                        Team Workflow & Operations Management
                      </span>
                    </div>
                  </div>
                </div>
              </nav>

              {/* Main Page Content */}
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                </Routes>
              </main>

              {/* Footer */}
              <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
                WorkHub &copy; {new Date().getFullYear()} – Enterprise Workflow & Event Management Architecture.
              </footer>
            </div>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

