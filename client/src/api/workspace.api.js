import api from './client';

export const workspaceApi = {
  create: (data) => api.post('/workspaces', data),
  getAll: (orgId) => api.get(`/workspaces?orgId=${orgId}`),
  getById: (workspaceId) => api.get(`/workspaces/${workspaceId}`),
  update: (workspaceId, data) => api.put(`/workspaces/${workspaceId}`, data),
  toggleArchive: (workspaceId) => api.put(`/workspaces/${workspaceId}/archive`),
  getMembers: (workspaceId) => api.get(`/workspaces/${workspaceId}/members`),
  addMember: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/members`, data),
  removeMember: (workspaceId, userId) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),
  getCalendar: (workspaceId) => api.get(`/workspaces/${workspaceId}/calendar`),
};

