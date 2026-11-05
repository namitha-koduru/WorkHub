import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi, suggestionApi } from '../../api/features.api';
import { teamApi } from '../../api/team.api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import {
  MessageSquare,
  Lightbulb,
  Send,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ThumbsUp,
} from 'lucide-react';

export default function TeamDiscussionsPage() {
  const { workspaceId, teamId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('DISCUSSIONS'); // 'DISCUSSIONS' | 'SUGGESTIONS'

  // Comments state
  const [commentText, setCommentText] = useState('');

  // Suggestions state
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [sugTitle, setSugTitle] = useState('');
  const [sugDesc, setSugDesc] = useState('');

  const { data: teamRes } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.getById(teamId),
    enabled: !!teamId,
  });
  const team = teamRes?.data;
  const isLeader =
    String(team?.leader?._id || team?.leader) === String(user?._id) ||
    user?.role === 'ORGANIZATION_OWNER';

  // Fetch Team Comments
  const { data: commentsRes, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', teamId, 'TEAM_DISCUSSION'],
    queryFn: () => commentApi.get(teamId, 'TEAM_DISCUSSION'),
    enabled: !!teamId,
  });
  const comments = commentsRes?.data || [];

  // Fetch Team Suggestions
  const { data: suggestionsRes, isLoading: suggLoading } = useQuery({
    queryKey: ['suggestions', 'team', teamId],
    queryFn: () => suggestionApi.getByTarget({ teamId }),
    enabled: !!teamId,
  });
  const suggestions = suggestionsRes?.data || [];

  // Create Comment Mutation
  const commentMutation = useMutation({
    mutationFn: (content) =>
      commentApi.create({
        targetType: 'TEAM_DISCUSSION',
        targetId: teamId,
        organizationId: team.organizationId,
        workspaceId,
        teamId,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', teamId, 'TEAM_DISCUSSION'] });
      setCommentText('');
    },
  });

  // Create Suggestion Mutation
  const suggestionMutation = useMutation({
    mutationFn: (data) =>
      suggestionApi.create({
        teamId,
        workspaceId,
        organizationId: team.organizationId,
        title: data.title,
        description: data.description,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', 'team', teamId] });
      setSugTitle('');
      setSugDesc('');
      setIsSuggestModalOpen(false);
    },
  });

  // Decide Suggestion Mutation
  const decideMutation = useMutation({
    mutationFn: ({ id, status }) => suggestionApi.decide(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', 'team', teamId] });
    },
  });

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const handlePostSuggestion = (e) => {
    e.preventDefault();
    if (!sugTitle.trim() || !sugDesc.trim()) return;
    suggestionMutation.mutate({ title: sugTitle, description: sugDesc });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Team Coordination & Brainstorming
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Department forum for operational discussions, equipment queries, and innovative ideas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('DISCUSSIONS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'DISCUSSIONS'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Discussion Board ({comments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SUGGESTIONS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'SUGGESTIONS'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Suggestions & Ideas ({suggestions.length})</span>
            </button>
          </div>

          {activeTab === 'SUGGESTIONS' && (
            <Button size="sm" onClick={() => setIsSuggestModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Submit Idea
            </Button>
          )}
        </div>
      </div>

      {/* DISCUSSIONS TAB */}
      {activeTab === 'DISCUSSIONS' && (
        <div className="space-y-6">
          {/* Post Comment Input */}
          <form
            onSubmit={handlePostComment}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-start gap-3">
              <Avatar user={user} size="sm" />
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share a department update, coordinate logistics, or ask a question..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="xs" loading={commentMutation.isPending}>
                <Send className="h-3 w-3 mr-1.5" /> Post to Team
              </Button>
            </div>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 italic">
              No discussions initiated yet. Be the first to start a conversation!
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c._id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar user={c.author} size="xs" />
                      <span className="font-bold text-slate-900">{c.author?.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.author?.title || 'Team Member'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 pl-8 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUGGESTIONS TAB */}
      {activeTab === 'SUGGESTIONS' && (
        <div className="space-y-4">
          {/* Create Suggestion Modal / Drawer */}
          {isSuggestModalOpen && (
            <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200 space-y-3">
              <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-indigo-600" /> Pitch a Department Improvement / Suggestion
              </h4>
              <form onSubmit={handlePostSuggestion} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={sugTitle}
                    onChange={(e) => setSugTitle(e.target.value)}
                    placeholder="e.g. Deploy backup battery racks near stage sound console"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description & Expected Impact *</label>
                  <textarea
                    rows={3}
                    required
                    value={sugDesc}
                    onChange={(e) => setSugDesc(e.target.value)}
                    placeholder="Explain the problem and why this proposal mitigates operational risk..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setIsSuggestModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="xs" loading={suggestionMutation.isPending}>
                    Submit Proposal
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Suggestions List */}
          {suggLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 italic">
              No suggestions logged yet. Submit innovative ideas to optimize department operations!
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div
                  key={sug._id}
                  className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{sug.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {sug.description}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        sug.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sug.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sug.status === 'PENDING' ? 'Under Review' : sug.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Avatar user={sug.author} size="xs" />
                      <span>Proposed by <strong className="text-slate-700">{sug.author?.name}</strong></span>
                      <span>•</span>
                      <span>{new Date(sug.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Team Leader Decision Buttons */}
                    {isLeader && sug.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => decideMutation.mutate({ id: sug._id, status: 'ACCEPTED' })}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1" /> Accept
                        </Button>
                        <Button
                          size="xs"
                          variant="secondary"
                          onClick={() => decideMutation.mutate({ id: sug._id, status: 'REJECTED' })}
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-600 mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

