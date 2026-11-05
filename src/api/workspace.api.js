import api from './client';

export const workspaceApi = {
  create: (data) => api.post('/workspaces', data),
  getAll: (orgId) => api.get(`/workspaces${orgId ? `?orgId=${orgId}` : ''}`),
  getById: (workspaceId) => api.get(`/workspaces/${workspaceId}`),
  update: (workspaceId, data) => api.put(`/workspaces/${workspaceId}`, data),
  toggleArchive: (workspaceId) => api.put(`/workspaces/${workspaceId}/archive`),
  getMembers: (workspaceId) => api.get(`/workspaces/${workspaceId}/members`),
  addMember: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/members`, data),
  removeMember: (workspaceId, userId) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),
  getCalendar: (workspaceId) => api.get(`/workspaces/${workspaceId}/calendar`),

  // Search & Join Workflows
  search: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/workspaces/search?${query}`);
  },
  getByInvite: (codeOrId) => api.get(`/workspaces/invite/${codeOrId}`),
  submitJoinRequest: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/join-request`, data),
  getJoinRequests: (workspaceId, status) =>
    api.get(`/workspaces/${workspaceId}/join-requests${status ? `?status=${status}` : ''}`),
  decideJoinRequest: (workspaceId, requestId, data) =>
    api.patch(`/workspaces/${workspaceId}/join-requests/${requestId}`, data),
};
