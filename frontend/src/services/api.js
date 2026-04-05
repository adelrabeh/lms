import axios from 'axios'

const API = axios.create({
  baseURL: 'https://lms-production-c5de.up.railway.app',
  headers: { 'Content-Type': 'application/json' }
})

// ── Licenses ──────────────────────────────────────
export const getLicenses = (params = {}) =>
  API.get('/api/licenses', { params }).then(r => r.data)

export const getLicense = (id) =>
  API.get(`/api/licenses/${id}`).then(r => r.data)

export const createLicense = (data) =>
  API.post('/api/licenses', data).then(r => r.data)

export const updateLicense = (id, data) =>
  API.put(`/api/licenses/${id}`, data).then(r => r.data)

export const deleteLicense = (id) =>
  API.delete(`/api/licenses/${id}`)

export const getDashboard = () =>
  API.get('/api/licenses/dashboard').then(r => r.data)

export const getExpiring = (days = 90) =>
  API.get('/api/licenses/expiring', { params: { days } }).then(r => r.data)

// ── Vendors ───────────────────────────────────────
export const getVendors = () =>
  API.get('/api/vendors').then(r => r.data)

export const createVendor = (data) =>
  API.post('/api/vendors', data).then(r => r.data)

// ── Departments ───────────────────────────────────
export const getDepartments = () =>
  API.get('/api/departments').then(r => r.data)

// ── Employees ─────────────────────────────────────
export const getEmployees = (departmentId) =>
  API.get('/api/employees', departmentId ? { params: { departmentId } } : {}).then(r => r.data)

export const createEmployee = (data) =>
  API.post('/api/employees', data).then(r => r.data)

export default API
