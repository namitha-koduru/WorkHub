import api from './client';

export const orgApi = {
  create: (data) => api.post('/organizations', data),
  getMyOrgs: () => api.get('/organizations'),
  getById: (orgId) => api.get(`/organizations/${orgId}`),
  update: (orgId, data) => api.put(`/organizations/${orgId}`, data),
  getMembers: (orgId) => api.get(`/organizations/${orgId}/members`),
  addMember: (orgId, data) => api.post(`/organizations/${orgId}/members`, data),
  updateMemberRole: (orgId, userId, role) =>
    api.put(`/organizations/${orgId}/members/${userId}`, { role }),
  removeMember: (orgId, userId) => api.delete(`/organizations/${orgId}/members/${userId}`),
};

