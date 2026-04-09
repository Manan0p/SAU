import axios from 'axios'

const api = axios.create({ baseURL: '/' })

api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('v2_token')
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
})

api.interceptors.response.use(r => r, err => {
    if (err.response?.status === 401) {
        localStorage.removeItem('v2_token')
        localStorage.removeItem('v2_user')
        window.location.href = '/login'
    }
    return Promise.reject(err)
})

// ── Auth ────────────────────────────────────────────────────────────────
export const authAPI = {
    register: d => api.post('/auth/register', d),
    login: d => api.post('/auth/login', d),
    me: () => api.get('/auth/me'),
}

// ── Appointments ─────────────────────────────────────────────────────────
export const appointmentsAPI = {
    doctors: (spec) => api.get('/appointments/doctors', { params: spec ? { specialization: spec } : {} }),
    slots: (doctorId, date) => api.get(`/appointments/slots/${doctorId}`, { params: { date } }),
    book: d => api.post('/appointments/', d),
    list: () => api.get('/appointments/'),
    cancel: id => api.delete(`/appointments/${id}`),
    updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, null, { params: { new_status: status } }),
    addNotes: (id, data) => api.post(`/appointments/${id}/notes`, data),
}

// ── Prescriptions ────────────────────────────────────────────────────────
export const prescriptionsAPI = {
    list: () => api.get('/prescriptions/'),
    get: id => api.get(`/prescriptions/${id}`),
    create: d => api.post('/prescriptions/', d),
    dispense: id => api.patch(`/prescriptions/${id}/dispense`),
}

// ── Pharmacy ─────────────────────────────────────────────────────────────
export const pharmacyAPI = {
    inventory: () => api.get('/pharmacy/inventory'),
    addItem: d => api.post('/pharmacy/inventory', d),
    updateItem: (id, d) => api.patch(`/pharmacy/inventory/${id}`, d),
    lowStock: () => api.get('/pharmacy/low-stock'),
    queue: () => api.get('/pharmacy/dispense-queue'),
    dispense: d => api.post('/pharmacy/dispense', d),
    checkStock: (name, qty) => api.get(`/pharmacy/check/${name}`, { params: { quantity: qty } }),
}

// ── Claims ────────────────────────────────────────────────────────────────
export const claimsAPI = {
    submit: d => api.post('/claims/', d),
    list: (params) => api.get('/claims/', { params }),
    get: id => api.get(`/claims/${id}`),
    status: (id, d) => api.patch(`/claims/${id}/status`, d),
    calculate: id => api.post(`/claims/${id}/calculate`),
    action: (id, action, notes) => api.patch(`/claims/${id}/action`, null, { params: { action, notes } }),
    process: id => api.post(`/claims/${id}/process`),
}

// ── Leaves ────────────────────────────────────────────────────────────────
export const leavesAPI = {
    apply: d => api.post('/leaves/', d),
    list: () => api.get('/leaves/'),
    action: (id, d) => api.patch(`/leaves/${id}/action`, d),
}

// ── Dashboard ────────────────────────────────────────────────────────────
export const dashboardAPI = {
    student: () => api.get('/dashboard/student'),
    doctor: () => api.get('/dashboard/doctor'),
    admin: () => api.get('/dashboard/admin'),
    pharmacy: () => api.get('/dashboard/pharmacy'),
    finance: () => api.get('/dashboard/finance'),
}

// ── Records ──────────────────────────────────────────────────────────────
export const recordsAPI = {
    getPatientHistory: (id) => api.get(`/records/patient/${id}`),
    getSummary: (id) => api.get(`/records/summary/${id}`),
    uploadReport: (patient_id, data) => api.post(`/records/reports/upload`, data, { params: { patient_id, report_type: data.report_type, file_path: data.file_path } }),
}
