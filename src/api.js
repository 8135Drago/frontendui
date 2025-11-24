import axios from 'axios';
const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export const interpret = (command, dryRun=false) => axios.post(`${BASE}/api/interpret`, { command, dryRun }).then(r => r.data);
export const getJob = (id) => axios.get(`${BASE}/api/job/${id}`).then(r => r.data);
export const getServers = () => axios.get(`${BASE}/api/servers`).then(r => r.data);
