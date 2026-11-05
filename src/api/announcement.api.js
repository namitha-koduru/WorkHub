import api from './client';

export const announcementApi = {
  create: (data) => api.post('/announcements', data),
  getAll: (workspaceId, teamId, scope) => {
    let url = `/announcements?workspaceId=${workspaceId}`;
    if (teamId) url += `&teamId=${teamId}`;
    if (scope) url += `&scope=${scope}`;
    return api.get(url);
  },
  delete: (announcementId) => api.delete(`/announcements/${announcementId}`),
};

