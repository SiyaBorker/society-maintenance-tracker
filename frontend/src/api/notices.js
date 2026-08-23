import client from './client';

export const listNotices = () => client.get('/notices').then((r) => r.data);
export const createNotice = (data) => client.post('/notices', data).then((r) => r.data);
