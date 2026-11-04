import api from './client';

export const roomApi = {
  create: (data) => api.post('/rooms', data),
  getAll: (workspaceId) => api.get(`/rooms?workspaceId=${workspaceId}`),
  getById: (roomId) => api.get(`/rooms/${roomId}`),
  update: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  getMembers: (roomId) => api.get(`/rooms/${roomId}/members`),
  addMember: (roomId, data) => api.post(`/rooms/${roomId}/members`, data),
  removeMember: (roomId, userId) => api.delete(`/rooms/${roomId}/members/${userId}`),
  getCalendar: (roomId) => api.get(`/rooms/${roomId}/calendar`),
};

