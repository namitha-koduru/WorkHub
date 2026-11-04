import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../../api/workspace.api';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceModal } from '../../components/modals/WorkspaceModal';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Layers,
  Plus,
  DoorOpen,
  CheckCircle2,
  ChevronRight,
  Archive,
  Search,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WorkspaceListPage() {
  const { activeOrg } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: workspacesRes, isLoading } = useQuery({
    queryKey: ['workspaces', activeOrg?._id],
    queryFn: () => workspaceApi.getAll(activeOrg?._id),
    enabled: !!activeOrg?._id,
  });

  const workspaces = workspacesRes?.data || [];

  const filtered = workspaces.filter((ws) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ws.name.toLowerCase().includes(q) ||
      ws.category?.toLowerCase().includes(q) ||
      ws.description?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-indigo-600" />
            Workspaces & Event Portfolios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Independent projects, festivals, and operational departments under {activeOrg?.name}
          </p>
        </div>

        <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Workspace
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter workspaces by name, category..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Grid of Workspaces */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No workspaces found"
          description="Create your first event or department workspace to organize teams and tasks."
          actionLabel="Create Workspace"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ws) => (
            <div
              key={ws._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    {ws.category || 'Event Operations'}
                  </span>
                  {ws.status === 'ARCHIVED' && (
                    <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Archived
                    </span>
                  )}
                </div>

                <Link
                  to={`/app/workspaces/${ws._id}/overview`}
                  className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block"
                >
                  {ws.name}
                </Link>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {ws.description || 'No description provided.'}
                </p>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                    <span className="font-medium">Operational Progress</span>
                    <span className="font-bold text-slate-800">{ws.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${ws.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                    <span>{ws.roomCount || 0} Rooms</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {ws.completedTaskCount || 0}/{ws.taskCount || 0} Tasks
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Managers:</span>
                  <div className="flex -space-x-1.5">
                    {ws.managers?.map((m) => (
                      <Avatar key={m._id} user={m} size="xs" className="ring-1 ring-white" />
                    ))}
                  </div>
                </div>

                <Link
                  to={`/app/workspaces/${ws._id}/overview`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <span>Open</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <WorkspaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          organizationId={activeOrg?._id}
        />
      )}
    </div>
  );
}

