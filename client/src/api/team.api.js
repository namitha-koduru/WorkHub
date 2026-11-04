import api from './client';

export const teamApi = {
  create: (data) => api.post('/teams', data),
  getAll: (workspaceId) => api.get(`/teams?workspaceId=${workspaceId}`),
  getById: (teamId) => api.get(`/teams/${teamId}`),
  update: (teamId, data) => api.put(`/teams/${teamId}`, data),
  getMembers: (teamId) => api.get(`/teams/${teamId}/members`),
  addMember: (teamId, data) => api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
  getCalendar: (teamId) => api.get(`/teams/${teamId}/calendar`),
};

