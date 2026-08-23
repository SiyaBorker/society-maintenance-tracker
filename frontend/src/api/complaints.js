import client from './client';

export const createComplaint = (formData) =>
  client
    .post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);

export const listComplaints = (params) => client.get('/complaints', { params }).then((r) => r.data);

export const getComplaint = (id) => client.get(`/complaints/${id}`).then((r) => r.data);

export const updateComplaintStatus = (id, data) =>
  client.patch(`/complaints/${id}/status`, data).then((r) => r.data);

export const updateComplaintPriority = (id, data) =>
  client.patch(`/complaints/${id}/priority`, data).then((r) => r.data);
