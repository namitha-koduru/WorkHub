import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { approvalApi } from '../../api/features.api';
import { CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

export function ApprovalDecisionModal({ isOpen, onClose, approval, taskTitle }) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState('APPROVED');
  const [comments, setComments] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const decideMutation = useMutation({
    mutationFn: (payload) => approvalApi.decide(approval._id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      onClose();
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to record approval decision'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    decideMutation.mutate({ decision, comments });
  };

  if (!approval) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Task Submission">
      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Task Title</span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{taskTitle}</p>
          {approval.comments && (
            <p className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border border-slate-200/60 italic">
              "{approval.comments}"
            </p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-2">Review Decision</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('APPROVED')}
              className={`p-3 rounded-xl border text-center transition-all ${
                decision === 'APPROVED'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
              Approve & Complete
            </button>

            <button
              type="button"
              onClick={() => setDecision('CHANGES_REQUESTED')}
              className={`p-3 rounded-xl border text-center transition-all ${
                decision === 'CHANGES_REQUESTED'
                  ? 'border-pink-500 bg-pink-50 text-pink-800 ring-2 ring-pink-500/20 font-bold'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <RotateCcw className="h-5 w-5 mx-auto mb-1 text-pink-600" />
              Request Changes
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Reviewer Feedback / Comments
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={
              decision === 'APPROVED'
                ? 'Great work, everything meets quality criteria!'
                : 'Please fix the issues noted before resubmitting...'
            }
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant={decision === 'APPROVED' ? 'success' : 'danger'}
            isLoading={decideMutation.isPending}
          >
            Submit Decision
          </Button>
        </div>
      </form>
    </Modal>
  );
}

