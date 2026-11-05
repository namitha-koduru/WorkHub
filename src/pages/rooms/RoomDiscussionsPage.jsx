import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi, suggestionApi } from '../../api/features.api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import {
  MessageSquare,
  Lightbulb,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Loader2,
} from 'lucide-react';

export default function RoomDiscussionsPage() {
  const { workspaceId, roomId } = useParams();
  const { user, activeOrg } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('discussions'); // 'discussions' | 'suggestions'

  // Comments State
  const [commentText, setCommentText] = useState('');

  // Suggestions State
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDesc, setSuggestionDesc] = useState('');
  const [isSuggestionFormOpen, setIsSuggestionFormOpen] = useState(false);

  // Fetch Room Discussion Thread
  const { data: commentsRes, isLoading: commentsLoading } = useQuery({
    queryKey: ['room-comments', roomId],
    queryFn: () => commentApi.get(roomId, 'ROOM_DISCUSSION'),
  });

  // Fetch Room Suggestions
  const { data: suggestionsRes, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['room-suggestions', roomId],
    queryFn: () => suggestionApi.getByRoom(roomId),
  });

  const comments = commentsRes?.data || [];
  const suggestions = suggestionsRes?.data || [];

  // Post Comment Mutation
  const postCommentMutation = useMutation({
    mutationFn: (content) =>
      commentApi.create({
        targetType: 'ROOM_DISCUSSION',
        targetId: roomId,
        organizationId: activeOrg?._id,
        workspaceId,
        roomId,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-comments', roomId] });
      setCommentText('');
    },
  });

  // Post Suggestion Mutation
  const postSuggestionMutation = useMutation({
    mutationFn: (data) =>
      suggestionApi.create({
        ...data,
        roomId,
        workspaceId,
        organizationId: activeOrg?._id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-suggestions', roomId] });
      setSuggestionTitle('');
      setSuggestionDesc('');
      setIsSuggestionFormOpen(false);
    },
  });

  // Decide Suggestion Mutation (Accept/Reject)
  const decideSuggestionMutation = useMutation({
    mutationFn: ({ id, status, resolutionNotes }) =>
      suggestionApi.decide(id, { status, resolutionNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-suggestions', roomId] });
    },
  });

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    postCommentMutation.mutate(commentText);
  };

  const handlePostSuggestion = (e) => {
    e.preventDefault();
    if (!suggestionTitle.trim() || !suggestionDesc.trim()) return;
    postSuggestionMutation.mutate({ title: suggestionTitle, description: suggestionDesc });
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'discussions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Discussion Thread ({comments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Suggestions & Ideas ({suggestions.length})</span>
          </button>
        </div>

        {activeTab === 'suggestions' && (
          <Button
            size="sm"
            icon={Plus}
            onClick={() => setIsSuggestionFormOpen(!isSuggestionFormOpen)}
          >
            Submit Suggestion
          </Button>
        )}
      </div>

      {/* DISCUSSIONS TAB */}
      {activeTab === 'discussions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-100">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No discussion messages yet. Start collaborating with your team!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c._id} className="pt-3 first:pt-0 flex items-start gap-3">
                  <Avatar user={c.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{c.author?.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handlePostComment} className="flex gap-2 pt-4 border-t border-slate-100">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post a message to room members..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              size="sm"
              icon={Send}
              isLoading={postCommentMutation.isPending}
              disabled={!commentText.trim()}
            >
              Post
            </Button>
          </form>
        </div>
      )}

      {/* SUGGESTIONS TAB */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          {/* New Suggestion Form */}
          {isSuggestionFormOpen && (
            <form
              onSubmit={handlePostSuggestion}
              className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm space-y-4 animate-in fade-in"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Submit New Suggestion or Operational Optimization
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={suggestionTitle}
                  onChange={(e) => setSuggestionTitle(e.target.value)}
                  placeholder="e.g. Deploy battery backup for audio sound mixer"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Justification
                </label>
                <textarea
                  rows={3}
                  required
                  value={suggestionDesc}
                  onChange={(e) => setSuggestionDesc(e.target.value)}
                  placeholder="Explain why this suggestion improves event reliability or workflow..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSuggestionFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={postSuggestionMutation.isPending}>
                  Submit Suggestion
                </Button>
              </div>
            </form>
          )}

          {/* Suggestions List */}
          <div className="space-y-4">
            {suggestions.map((s) => (
              <div
                key={s._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar user={s.author} size="xs" />
                    <span className="text-xs font-semibold text-slate-700">{s.author?.name}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      s.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : s.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>

                {s.resolutionNotes && (
                  <p className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 italic">
                    Leader Note: "{s.resolutionNotes}"
                  </p>
                )}

                {/* Leader Actions */}
                {s.status === 'OPEN' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      icon={XCircle}
                      onClick={() =>
                        decideSuggestionMutation.mutate({
                          id: s._id,
                          status: 'REJECTED',
                          resolutionNotes: 'Declined by leadership.',
                        })
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() =>
                        decideSuggestionMutation.mutate({
                          id: s._id,
                          status: 'ACCEPTED',
                          resolutionNotes: 'Approved for implementation.',
                        })
                      }
                    >
                      Accept Suggestion
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

