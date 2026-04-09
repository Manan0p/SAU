import React, { useState, useEffect } from 'react'
import {
    LayoutDashboard, Calendar, ClipboardList, Pill, FileText,
    History, LogOut, Plus, Search, ChevronRight, Clock, MapPin,
    CheckCircle, XCircle, AlertCircle, IndianRupee, Thermometer
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, appointmentsAPI, prescriptionsAPI, claimsAPI, leavesAPI, recordsAPI } from '../api/client'

function StudentDashboard() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        setLoading(true)
        try {
            const { data: dashData } = await dashboardAPI.student()
            setData(dashData)
        } catch (err) {
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab data={data} setActiveTab={setActiveTab} />
            case 'appointments': return <AppointmentsTab />
            case 'records': return <RecordsTab studentId={user.id} />
            case 'prescriptions': return <PrescriptionsTab />
            case 'claims': return <ClaimsTab />
            case 'leave': return <LeaveTab />
            default: return <OverviewTab data={data} />
        }
    }

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="nav-logo">
                    <div className="nav-logo-icon">💙</div>
                    <div className="nav-logo-text">CampusCare V2</div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="nav-section-label">Medical</div>
                    <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <LayoutDashboard size={18} /> Overview
                    </button>
                    <button className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
                        <Calendar size={18} /> Appointments
                    </button>
                    <button className={`nav-item ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
                        <ClipboardList size={18} /> Medical History
                    </button>
                    <button className={`nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
                        <Pill size={18} /> Prescriptions
                    </button>

                    <div className="nav-section-label" style={{ marginTop: 12 }}>Insurance & Admin</div>
                    <button className={`nav-item ${activeTab === 'claims' ? 'active' : ''}`} onClick={() => setActiveTab('claims')}>
                        <FileText size={18} /> My Claims
                    </button>
                    <button className={`nav-item ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')}>
                        <History size={18} /> Medical Leave
                    </button>
                </nav>

                <div className="nav-user">
                    <div className="nav-user-name">{user?.name}</div>
                    <div className="nav-user-role">Student · {user?.student_id}</div>
                    <button className="nav-item" style={{ marginTop: 12, paddingLeft: 0, color: 'var(--red)' }} onClick={logout}>
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {loading && !data ? (
                    <div className="empty-state"><div className="nav-logo-icon" style={{ animation: 'pulse 2s infinite' }}>💙</div> Loading...</div>
                ) : renderContent()}
            </main>
        </div>
    )
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ data, setActiveTab }) => {
    if (!data) return null
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Welcome back, {data.student_name}</h1>
                <p className="page-subtitle">Here is a quick look at your health and insurance status.</p>
            </div>

            <div className="stat-grid">
                <div className="glass-card stat-card">
                    <div className="stat-label">Active Prescriptions</div>
                    <div className="stat-value" style={{ color: 'var(--blue)' }}>{data.active_prescriptions}</div>
                    <div className="stat-sub">Ready to dispense</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-label">Upcoming Visits</div>
                    <div className="stat-value" style={{ color: 'var(--purple)' }}>{data.upcoming_count}</div>
                    <div className="stat-sub">Confirmed appointments</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-label">Annual Claimed</div>
                    <div className="stat-value">₹{data.annual_claimed.toLocaleString()}</div>
                    <div className="stat-sub">FY 2024-25</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-label">Annual Payouts</div>
                    <div className="stat-value" style={{ color: 'var(--green)' }}>₹{data.annual_reimbursed.toLocaleString()}</div>
                    <div className="stat-sub">Total reimbursed</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                {/* Appointments column */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Upcoming Appointments</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('appointments')}><Plus size={14} /> Book New</button>
                    </div>
                    {data.upcoming_appointments?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data.upcoming_appointments.map(a => (
                                <div key={a.id} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{a.doctor_name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.doctor_specialization}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{new Date(a.slot_datetime).toLocaleDateString()}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(a.slot_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-muted)" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card empty-state" style={{ padding: 32 }}>
                            <div className="empty-state-icon">📅</div>
                            <p className="empty-state-text">No upcoming appointments found.</p>
                        </div>
                    )}
                </section>

                {/* Claim status column */}
                <section>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Claims</h3>
                    <div className="glass-card" style={{ padding: 20 }}>
                        {data.recent_claims?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {data.recent_claims.map(c => (
                                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.hospital_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>₹{c.amount.toLocaleString()} · {new Date(c.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                                    </div>
                                ))}
                                <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('claims')}>View All Claims</button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>No claims yet.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}

// ── Medical History / Records Tab ─────────────────────────────────────────────
const RecordsTab = ({ studentId }) => {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadHistory()
    }, [])

    const loadHistory = async () => {
        try {
            const { data } = await recordsAPI.getPatientHistory(studentId)
            setHistory(data.history)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Medical Records</h1>
                <p className="page-subtitle">Your comprehensive visit history and diagnoses.</p>
            </div>

            <div className="timeline">
                {history.length > 0 ? history.map((h, i) => (
                    <div className="timeline-item" key={h.id || i}>
                        <div className="timeline-dot">
                            {h.type === 'CONSULTATION' ? <Thermometer size={14} /> : <Pill size={14} />}
                        </div>
                        <div className="timeline-content glass-card" style={{ padding: 16, marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div className="timeline-action">{h.type === 'CONSULTATION' ? 'Consultation with' : 'Prescription from'} {h.doctor}</div>
                                    <div className="timeline-meta">{new Date(h.date).toLocaleString()}</div>
                                </div>
                                <div className={`badge ${h.type === 'CONSULTATION' ? 'badge-confirmed' : 'badge-active'}`}>{h.type}</div>
                            </div>

                            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                                {h.data?.diagnosis && <div><strong>Diagnosis:</strong> {h.data.diagnosis}</div>}
                                {h.data?.notes && <div style={{ marginTop: 4 }}><strong>Dr. Notes:</strong> {h.data.notes}</div>}
                                {h.data?.medicines && (
                                    <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                        <strong>Medicines:</strong>
                                        <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                                            {h.data.medicines.map((m, mi) => <li key={mi}>{m.name} ({m.dosage}) - {m.duration_days} days</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state">No records found.</div>
                )}
            </div>
        </div>
    )
}

// Placeholder for other tabs (implementation follows)
const AppointmentsTab = () => (
    <div>
        <div className="page-header">
            <h1 className="page-title">Book an Appointment</h1>
            <p className="page-subtitle">Schedule a visit with our campus doctors.</p>
        </div>
        <DoctorList />
    </div>
)

const PrescriptionsTab = () => {
    const [list, setList] = useState([])
    useEffect(() => { prescriptionsAPI.list().then(r => setList(r.data)) }, [])
    return (
        <div>
            <div className="page-header"><h1 className="page-title">Prescriptions</h1></div>
            <div className="table-container">
                <table>
                    <thead><tr><th>Date</th><th>Doctor</th><th>Diagnosis</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {list.map(r => (
                            <tr key={r.id}>
                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                <td>{r.doctor_name}</td>
                                <td>{r.diagnosis}</td>
                                <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                                <td><button className="btn btn-ghost btn-xs">View PDF</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const fmtDate = (s) => {
    if (!s) return '—'
    // MongoDB returns microseconds (6 decimals); Date() needs max 3
    const safe = String(s).replace(/(\.(\d{3}))\d+/, '$1')
    const d = new Date(safe)
    return isNaN(d) ? s : d.toLocaleDateString()
}

const ClaimsTab = () => {
    const [claims, setClaims] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showSubmit, setShowSubmit] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ hospital_name: '', treatment_date: '', amount: '', diagnosis: '' })

    const loadClaims = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await claimsAPI.list()
            setClaims(Array.isArray(data) ? data : [])
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Failed to load claims'
            setError(msg)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { loadClaims() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await claimsAPI.submit({ ...form, amount: parseFloat(form.amount) })
            toast.success('Claim submitted successfully!')
            setShowSubmit(false)
            setForm({ hospital_name: '', treatment_date: '', amount: '', diagnosis: '' })
            loadClaims()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit claim')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h1 className="page-title">Insurance Claims</h1></div>
                <button className="btn btn-primary" onClick={() => setShowSubmit(true)}><Plus size={16} /> Submit New Claim</button>
            </div>

            {showSubmit && (
                <div className="modal-backdrop">
                    <div className="modal-box">
                        <h2>Submit Insurance Claim</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Hospital Name</label>
                                <input className="input" placeholder="Apollo Hospital" required onChange={e => setForm({ ...form, hospital_name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="input-group"><label className="input-label">Treatment Date</label><input type="date" className="input" required onChange={e => setForm({ ...form, treatment_date: e.target.value })} /></div>
                                <div className="input-group"><label className="input-label">Amount (₹)</label><input type="number" className="input" placeholder="0.00" required onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })} /></div>
                            </div>
                            <div className="input-group"><label className="input-label">Diagnosis/Reason</label><textarea className="input" placeholder="Details of treatment..." onChange={e => setForm({ ...form, diagnosis: e.target.value })} /></div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Claim'}
                                </button>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowSubmit(false)} disabled={submitting}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="empty-state">Loading claims...</div>
            ) : error ? (
                <div className="empty-state" style={{ color: 'var(--red)' }}>{error}</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Submitted</th><th>Hospital</th><th>Amount</th><th>Status</th><th>Eligibility</th><th>Ref</th></tr></thead>
                        <tbody>
                            {claims.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No claims yet. Submit your first claim above.</td></tr>
                            ) : claims.map(c => (
                                <tr key={c.id}>
                                    <td>{fmtDate(c.created_at)}</td>
                                    <td>{c.hospital_name}</td>
                                    <td style={{ fontWeight: 600 }}>₹{(c.amount || 0).toLocaleString()}</td>
                                    <td><span className={`badge badge-${(c.status || '').toLowerCase()}`}>{c.status}</span></td>
                                    <td><span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.eligibility?.status || '—'}</span></td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{(c.id || '').slice(-8).toUpperCase()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

const LeaveTab = () => {
    const [leaves, setLeaves] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showApply, setShowApply] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ leave_from: '', leave_to: '', reason: '', medical_condition: '' })

    const loadLeaves = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data } = await leavesAPI.list()
            setLeaves(Array.isArray(data) ? data : [])
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Failed to load leaves'
            setError(msg)
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { loadLeaves() }, [])

    const handleApply = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await leavesAPI.apply(form)
            toast.success('Leave application submitted!')
            setShowApply(false)
            setForm({ leave_from: '', leave_to: '', reason: '', medical_condition: '' })
            loadLeaves()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit application')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><h1 className="page-title">Medical Leaves</h1><p className="page-subtitle">Manage your medical leave applications.</p></div>
                <button className="btn btn-primary" onClick={() => setShowApply(true)}><Plus size={16} /> Apply for Leave</button>
            </div>

            {showApply && (
                <div className="modal-backdrop"><div className="modal-box">
                    <h2>Apply for Medical Leave</h2>
                    <form onSubmit={handleApply} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-row">
                            <div className="input-group"><label className="input-label">From Date</label><input type="date" className="input" required onChange={e => setForm({ ...form, leave_from: e.target.value })} /></div>
                            <div className="input-group"><label className="input-label">To Date</label><input type="date" className="input" required onChange={e => setForm({ ...form, leave_to: e.target.value })} /></div>
                        </div>
                        <div className="input-group"><label className="input-label">Medical Condition</label><input className="input" placeholder="Fever, Injury, etc." required onChange={e => setForm({ ...form, medical_condition: e.target.value })} /></div>
                        <div className="input-group"><label className="input-label">Detailed Reason</label><textarea className="input" placeholder="Briefly explain..." required onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowApply(false)} style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>Cancel</button>
                        </div>
                    </form>
                </div></div>
            )}

            {loading ? (
                <div className="empty-state">Loading leave applications...</div>
            ) : error ? (
                <div className="empty-state" style={{ color: 'var(--red)' }}>{error}</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Period</th><th>Days</th><th>Condition</th><th>Reason</th><th>Status</th></tr></thead>
                        <tbody>
                            {leaves.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No leave applications yet.</td></tr>
                            ) : leaves.map(l => (
                                <tr key={l.id}>
                                    <td>{l.leave_from} → {l.leave_to}</td>
                                    <td style={{ fontWeight: 600 }}>{l.total_days}</td>
                                    <td>{l.medical_condition}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{l.reason}</td>
                                    <td><span className={`badge badge-${(l.status || '').toLowerCase()}`}>{(l.status || '').replaceAll('_', ' ')}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

const DoctorList = () => {
    const [docs, setDocs] = useState([])
    const [selectedDoc, setSelectedDoc] = useState(null)
    const [slots, setSlots] = useState([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [booking, setBooking] = useState({ reason: '' })

    useEffect(() => { appointmentsAPI.doctors().then(r => setDocs(r.data)) }, [])
    useEffect(() => { if (selectedDoc) appointmentsAPI.slots(selectedDoc.id, date).then(r => setSlots(r.data.slots)) }, [selectedDoc, date])

    const handleBook = async (slot) => {
        try {
            await appointmentsAPI.book({ doctor_id: selectedDoc.id, slot_datetime: slot.datetime, reason: booking.reason })
            toast.success('Appointment booked!')
            setSelectedDoc(null)
        } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {docs.map(d => (
                <div key={d.id} className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue-dim)', color: 'var(--blue)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        👨‍⚕️
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{d.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{d.specialization}</p>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} onClick={() => setSelectedDoc(d)}>Check Slots</button>
                </div>
            ))}

            {selectedDoc && (
                <div className="modal-backdrop">
                    <div className="modal-box" style={{ maxWidth: 460 }}>
                        <h3>{selectedDoc.name}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{selectedDoc.specialization}</p>

                        <div className="input-group" style={{ marginBottom: 20 }}>
                            <label className="input-label">Appointment Date</label>
                            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                        </div>

                        <div className="input-group" style={{ marginBottom: 20 }}>
                            <label className="input-label">Reason for Visit</label>
                            <input className="input" placeholder="e.g. Regular checkup, headache" value={booking.reason} onChange={e => setBooking({ reason: e.target.value })} />
                        </div>

                        <label className="input-label">Available Slots</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                            {slots.map(s => (
                                <button key={s.datetime} className={`btn btn-sm ${s.available ? 'btn-ghost' : 'btn-disabled'}`}
                                    disabled={!s.available || !booking.reason} onClick={() => handleBook(s)} style={{ textDecoration: s.available ? 'none' : 'line-through' }}>
                                    {s.display} {s.available ? '' : '(Booked)'}
                                </button>
                            ))}
                        </div>

                        <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 20, justifyContent: 'center' }} onClick={() => setSelectedDoc(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StudentDashboard
