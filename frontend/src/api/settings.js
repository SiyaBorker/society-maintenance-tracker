import client from './client';

export const fetchSettings = () => client.get('/settings').then((r) => r.data);
export const updateSettings = (data) => client.patch('/settings', data).then((r) => r.data);
