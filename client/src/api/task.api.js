import api from './client';

export const taskApi = {
  create: (data) => api.post('/tasks', data),
  getByRoom: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/tasks?${query}`);
  },
  getMyTasks: () => api.get('/tasks/my-tasks'),
  getById: (taskId) => api.get(`/tasks/${taskId}`),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  updateStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status }),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
  createCheckpoint: (data) => api.post('/checkpoints', data),
  updateCheckpoint: (checkpointId, data) => api.patch(`/checkpoints/${checkpointId}`, data),
  deleteCheckpoint: (checkpointId) => api.delete(`/checkpoints/${checkpointId}`),
};

