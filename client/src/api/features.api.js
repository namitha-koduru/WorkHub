import api from './client';

export const scheduleApi = {
  create: (data) => api.post('/schedules', data),
  getPersonal: () => api.get('/schedules/personal'),
  update: (scheduleId, data) => api.put(`/schedules/${scheduleId}`, data),
  delete: (scheduleId) => api.delete(`/schedules/${scheduleId}`),
};

export const dailyPlanApi = {
  save: (data) => api.post('/daily-plans', data),
  getMyPlan: (date) => api.get(`/daily-plans/me${date ? `?date=${date}` : ''}`),
  getRoomPlans: (roomId, date) =>
    api.get(`/daily-plans/room/${roomId}${date ? `?date=${date}` : ''}`),
  getHistory: (limit = 14) => api.get(`/daily-plans/history?limit=${limit}`),
};

export const commentApi = {
  create: (data) => api.post('/comments', data),
  get: (targetId, targetType) =>
    api.get(`/comments?targetId=${targetId}${targetType ? `&targetType=${targetType}` : ''}`),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};

export const suggestionApi = {
  create: (data) => api.post('/suggestions', data),
  getByRoom: (roomId, status) =>
    api.get(`/suggestions?roomId=${roomId}${status ? `&status=${status}` : ''}`),
  decide: (suggestionId, data) => api.patch(`/suggestions/${suggestionId}/status`, data),
};

export const approvalApi = {
  submit: (data) => api.post('/approvals/submit', data),
  decide: (approvalId, data) => api.post(`/approvals/${approvalId}/decide`, data),
  getHistory: (taskId) => api.get(`/approvals/task/${taskId}`),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const activityApi = {
  get: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/activities?${query}`);
  },
};

export const reportApi = {
  getPersonal: () => api.get('/reports/personal'),
  getWorkspace: (workspaceId) => api.get(`/reports/workspace/${workspaceId}`),
  getRoom: (roomId) => api.get(`/reports/room/${roomId}`),
  getOrg: (orgId) => api.get(`/reports/organization/${orgId}`),
};

