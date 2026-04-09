import React, { useState, useEffect } from 'react'
import {
    Users, Calendar, ClipboardCheck, FilePlus, LogOut, CheckCircle, XCircle, Search,
    ArrowRight, Activity, Thermometer, User, Clock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, appointmentsAPI, leavesAPI, recordsAPI, prescriptionsAPI } from '../api/client'

function DoctorDashboard() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState('schedule')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadDashboard() }, [])

    const loadDashboard = async () => {
        setLoading(true)
        try {
            const { data: d } = await dashboardAPI.doctor()
            setData(d)
        } finally { setLoading(false) }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'schedule': return <ScheduleTab data={data} onRefresh={loadDashboard} />
            case 'patients': return <PatientsTab />
            case 'leaves': return <LeavesTab onRefresh={loadDashboard} />
            default: return <ScheduleTab data={data} />
        }
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="nav-logo"><div className="nav-logo-icon">⚕️</div><div className="nav-logo-text">CampusCare V2</div></div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="nav-section-label">Medical</div>
                    <button className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                        <Calendar size={18} /> Daily Schedule
                    </button>
                    <button className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
                        <Users size={18} /> Patient Records
                    </button>
                    <div className="nav-section-label" style={{ marginTop: 12 }}>Approvals</div>
                    <button className={`nav-item ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
                        <ClipboardCheck size={18} /> Medical Leaves
                    </button>
                </nav>
                <div className="nav-user"><div className="nav-user-name">{user?.name}</div><div className="nav-user-role">Doctor · {user?.specialization}</div>
                    <button className="nav-item" style={{ marginTop: 12, paddingLeft: 0, color: 'var(--red)' }} onClick={logout}><LogOut size={18} /> Sign Out</button>
                </div>
            </aside>
            <main className="main-content">
                {loading && !data ? <div className="empty-state">Loading...</div> : renderContent()}
            </main>
        </div>
    )
}

const ScheduleTab = ({ data, onRefresh }) => {
    const [selectedAppt, setSelectedAppt] = useState(null)
    const [noteForm, setNoteForm] = useState({ diagnosis: '', symptoms: '', notes: '' })
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration_days: 1, quantity: 1 }])

    const handleUpdateStatus = async (id, status) => {
        try { await appointmentsAPI.updateStatus(id, status); toast.success('Status updated'); onRefresh(); } catch (err) { toast.error('Error') }
    }

    const handleSaveNotes = async (e) => {
        e.preventDefault()
        try {
            await appointmentsAPI.addNotes(selectedAppt.id, noteForm)
            // Also create prescription
            await prescriptionsAPI.create({
                patient_id: selectedAppt.student_id, appointment_id: selectedAppt.id,
                diagnosis: noteForm.diagnosis, medicines: medicines
            })
            toast.success('Consultation completed!')
            setSelectedAppt(null)
            onRefresh()
        } catch (err) { toast.error('Failed to save') }
    }

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Today's Schedule</h1><p className="page-subtitle">Manage your appointments and consultation notes.</p></div>
            <div className="stat-grid">
                <div className="glass-card stat-card"><div className="stat-label">Today's Appts</div><div className="stat-value" style={{ color: 'var(--blue)' }}>{data?.appointments_today}</div></div>
                <div className="glass-card stat-card"><div className="stat-label">Completed</div><div className="stat-value" style={{ color: 'var(--green)' }}>{data?.completed_all_time}</div></div>
                <div className="glass-card stat-card"><div className="stat-label">Pending Reviews</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{data?.pending_leave_reviews}</div></div>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Time</th><th>Patient</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {data?.today_schedule?.map(a => (
                            <tr key={a.id}>
                                <td style={{ fontWeight: 600 }}>{new Date(a.slot_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td><div style={{ fontWeight: 600 }}>{a.student_name}</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Reason: {a.reason}</div></td>
                                <td><span className="tag tag-blue">{a.appointment_type}</span></td>
                                <td><span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {a.status === 'SCHEDULED' && <button className="btn btn-primary btn-xs" onClick={() => handleUpdateStatus(a.id, 'IN_PROGRESS')}>Start Visit</button>}
                                        {a.status === 'IN_PROGRESS' && <button className="btn btn-success btn-xs" onClick={() => setSelectedAppt(a)}>Add Notes</button>}
                                        {a.status === 'COMPLETED' && <button className="btn btn-ghost btn-xs" disabled>Completed</button>}
                                        {['SCHEDULED', 'IN_PROGRESS'].includes(a.status) && <button className="btn btn-danger btn-xs" onClick={() => handleUpdateStatus(a.id, 'NO_SHOW')}>No Show</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedAppt && (
                <div className="modal-backdrop"><div className="modal-box" style={{ maxWidth: 640 }}>
                    <h3>Consultation: {selectedAppt.student_name}</h3>
                    <form onSubmit={handleSaveNotes} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-row">
                            <div className="input-group"><label className="input-label">Symptoms</label><input className="input" placeholder="e.g. Cough, Fever" required onChange={e => setNoteForm({ ...noteForm, symptoms: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">Diagnosis</label><input className="input" placeholder="e.g. Viral Infection" required onChange={e => setNoteForm({ ...noteForm, diagnosis: e.target.value })} /></div>
                        </div>
                        <div className="input-group"><label className="input-label">Clinical Notes</label><textarea className="input" placeholder="Detailed notes..." onChange={e => setNoteForm({ ...noteForm, notes: e.target.value })} /></div>

                        <div className="divider"></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label">Prescription</label>
                            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration_days: 1, quantity: 1 }])}>+ Add Medicine</button>
                        </div>

                        {medicines.map((m, i) => (
                            <div key={i} className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                                <input className="input" placeholder="Medicine" value={m.name} onChange={e => { const x = [...medicines]; x[i].name = e.target.value; setMedicines(x) }} required />
                                <input className="input" placeholder="Dosage" value={m.dosage} onChange={e => { const x = [...medicines]; x[i].dosage = e.target.value; setMedicines(x) }} required />
                                <input className="input" placeholder="Freq" value={m.frequency} onChange={e => { const x = [...medicines]; x[i].frequency = e.target.value; setMedicines(x) }} required />
                                <input type="number" className="input" value={m.duration_days} onChange={e => { const x = [...medicines]; x[i].duration_days = parseInt(e.target.value); setMedicines(x) }} required />
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                            <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>Complete & Sign</button>
                            <button type="button" className="btn btn-ghost" onClick={() => setSelectedAppt(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                        </div>
                    </form>
                </div></div>
            )}
        </div>
    )
}

const PatientsTab = () => {
    const [search, setSearch] = useState('')
    const [history, setHistory] = useState(null)

    const handleSearch = async (e) => {
        e.preventDefault()
        // For demo simplicity, patients are lookup by ID (in a real app, uses a proper search endpoint)
        try {
            const { data } = await recordsAPI.getPatientHistory(search)
            setHistory(data)
        } catch (err) { toast.error('Patient not found or invalid ID') }
    }

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Patient Record Lookup</h1></div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <input className="input" placeholder="Enter Patient ID (e.g. ST2024001 or MongoDB ID)" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
                <button className="btn btn-primary"><Search size={16} /> Search Records</button>
            </form>
            {history && (
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3>History for Patient ID: {history.patient_id}</h3>
                    <div className="timeline" style={{ marginTop: 20 }}>
                        {history.history.map((h, i) => (
                            <div className="timeline-item" key={i}>
                                <div className="timeline-dot">{h.type === 'CONSULTATION' ? 'C' : 'P'}</div>
                                <div className="timeline-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ fontWeight: 600 }}>{h.type} on {new Date(h.date).toLocaleDateString()}</div>
                                        <div className="timeline-meta">Dr. {h.doctor}</div>
                                    </div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {h.data.diagnosis && <div><strong>Diagnosis:</strong> {h.data.diagnosis}</div>}
                                        {h.data.medicines && <div><strong>Medicines:</strong> {h.data.medicines.map(m => m.name).join(', ')}</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

const LeavesTab = ({ onRefresh }) => {
    const [leaves, setLeaves] = useState([])
    useEffect(() => { leavesAPI.list().then(r => setLeaves(r.data)) }, [])

    const handleAction = async (id, action) => {
        try { await leavesAPI.action(id, { action, notes: 'Dr. Review Complete' }); toast.success('Action recorded'); onRefresh(); } catch (err) { toast.error('Error') }
    }

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Medical Leave Reviews</h1></div>
            <div className="table-container">
                <table>
                    <thead><tr><th>Patient</th><th>Period</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {leaves.map(l => (
                            <tr key={l.id}>
                                <td>{l.student_name}</td>
                                <td>{l.leave_from} - {l.leave_to} ({l.total_days} days)</td>
                                <td>{l.medical_condition}</td>
                                <td><span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-success btn-xs" onClick={() => handleAction(l.id, 'approve')}>Approve</button>
                                        <button className="btn btn-danger btn-xs" onClick={() => handleAction(l.id, 'reject')}>Reject</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DoctorDashboard
