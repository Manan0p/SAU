import React, { useState, useEffect } from 'react'
import {
    Shield, FileText, Activity, LogOut, CheckCircle, XCircle, Search,
    AlertTriangle, CreditCard, Layers, BarChart3, User, History
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, claimsAPI, leavesAPI } from '../api/client'

function AdminDashboard() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState('overview')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadDashboard() }, [])

    const loadDashboard = async () => {
        setLoading(true)
        try {
            const { data: d } = await dashboardAPI.admin()
            setData(d)
        } finally { setLoading(false) }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab data={data} setActiveTab={setActiveTab} />
            case 'claims': return <ClaimsTab onRefresh={loadDashboard} />
            case 'leaves': return <LeavesTab onRefresh={loadDashboard} />
            default: return <OverviewTab data={data} />
        }
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="nav-logo"><div className="nav-logo-icon">🛡️</div><div className="nav-logo-text">CampusCare V2</div></div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="nav-section-label">Admin Control</div>
                    <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <BarChart3 size={18} /> Global Overview
                    </button>
                    <button className={`nav-item ${activeTab === 'claims' ? 'active' : ''}`} onClick={() => setActiveTab('claims')}>
                        <Shield size={18} /> All Claims
                    </button>
                    <button className={`nav-item ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
                        <History size={18} /> All Leaves
                    </button>
                </nav>
                <div className="nav-user"><div className="nav-user-name">{user?.name}</div><div className="nav-user-role">System Admin</div>
                    <button className="nav-item" style={{ marginTop: 12, paddingLeft: 0, color: 'var(--red)' }} onClick={logout}><LogOut size={18} /> Sign Out</button>
                </div>
            </aside>
            <main className="main-content">
                {loading && !data ? <div className="empty-state">Loading...</div> : renderContent()}
            </main>
        </div>
    )
}

const OverviewTab = ({ data, setActiveTab }) => (
    <div>
        <div className="page-header"><h1 className="page-title">Global Control Center</h1><p className="page-subtitle">Real-time system metrics and audit alerts.</p></div>
        <div className="stat-grid">
            <div className="glass-card stat-card"><div className="stat-label">Total Claims</div><div className="stat-value">{data?.total_claims}</div></div>
            <div className="glass-card stat-card"><div className="stat-label">Fraud Flagged</div><div className="stat-value" style={{ color: 'var(--red)' }}>{data?.fraud_flagged}</div></div>
            <div className="glass-card stat-card"><div className="stat-label">Pending Reviews</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{data?.pending_claims}</div></div>
            <div className="glass-card stat-card"><div className="stat-label">Active Users</div><div className="stat-value">{data?.total_users}</div></div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>High Risk Alerts</h3>
        <div className="table-container">
            <table>
                <thead><tr><th>Patient</th><th>Claim Amount</th><th>Risk Score</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    {data?.flagged_claims?.map(c => (
                        <tr key={c.id}>
                            <td>{c.student_name}</td>
                            <td style={{ fontWeight: 600 }}>₹{c.amount.toLocaleString()}</td>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${c.fraud_risk_score * 100}%`, height: '100%', background: c.fraud_risk_score > 0.6 ? 'var(--red)' : 'var(--amber)' }}></div>
                                </div>
                                <span>{(c.fraud_risk_score * 100).toFixed(0)}%</span>
                            </div></td>
                            <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                            <td><button className="btn btn-ghost btn-xs" onClick={() => setActiveTab('claims')}>Audit</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)

const fmtDate = (s) => {
    if (!s) return '—'
    const safe = String(s).replace(/(\.(\d{3}))\d+/, '$1')
    const d = new Date(safe)
    return isNaN(d) ? s : d.toLocaleDateString()
}

const ClaimsTab = ({ onRefresh }) => {
    const [claims, setClaims] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [actioning, setActioning] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await claimsAPI.list()
            setClaims(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to load claims')
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const handleAction = async (id, action) => {
        setActioning(true)
        try {
            await claimsAPI.action(id, action, 'Admin verified')
            toast.success(`Claim ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
            setSelected(null)
            load()
            onRefresh()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Action failed — check claim status workflow')
        } finally { setActioning(false) }
    }

    const eligStatus = (c) => c?.eligibility?.status || 'UNKNOWN'

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Insurance Claim Management</h1></div>
            {loading ? (
                <div className="empty-state">Loading claims...</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Submitted</th><th>Student</th><th>Hospital</th><th>Amount</th><th>Eligibility</th><th>Risk</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {claims.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No claims submitted yet.</td></tr>
                            ) : claims.map(c => (
                                <tr key={c.id}>
                                    <td>{fmtDate(c.created_at)}</td>
                                    <td>{c.student_name}</td>
                                    <td style={{ fontSize: 12 }}>{c.hospital_name}</td>
                                    <td>₹{(c.amount || 0).toLocaleString()}</td>
                                    <td><span className={`badge badge-${eligStatus(c).toLowerCase()}`}>{eligStatus(c)}</span></td>
                                    <td>{c.is_fraud_flagged ? <AlertTriangle size={14} color="var(--red)" /> : <CheckCircle size={14} color="var(--green)" />}</td>
                                    <td><span className={`badge badge-${(c.status || '').toLowerCase()}`}>{c.status}</span></td>
                                    <td>
                                        <button className="btn btn-primary btn-xs" onClick={() => setSelected(c)}
                                            disabled={!['SUBMITTED', 'UNDER_REVIEW', 'AUTO_VALIDATED'].includes(c.status)}>
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <div className="modal-backdrop"><div className="modal-box" style={{ maxWidth: 500 }}>
                    <h3>Review Claim — {selected.student_name}</h3>
                    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Amount:</span><strong>₹{(selected.amount || 0).toLocaleString()}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>Hospital:</span><strong>{selected.hospital_name}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>Diagnosis:</span><strong>{selected.diagnosis || '—'}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>Eligibility:</span><strong>{eligStatus(selected)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>Current Status:</span><strong>{selected.status}</strong></div>
                        </div>
                        {selected.is_fraud_flagged && (
                            <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--red)' }}>
                                ⚠️ <strong>Fraud Warning:</strong> {selected.fraud_flags?.[0]?.description || 'Flagged for review'}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                            <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleAction(selected.id, 'approve')} disabled={actioning}>
                                {actioning ? '...' : '✓ Approve'}
                            </button>
                            <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleAction(selected.id, 'reject')} disabled={actioning}>
                                {actioning ? '...' : '✗ Reject'}
                            </button>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 16 }} onClick={() => setSelected(null)} disabled={actioning}>Close</button>
                </div></div>
            )}
        </div>
    )
}

const LeavesTab = ({ onRefresh }) => {
    const [leaves, setLeaves] = useState([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await leavesAPI.list()
            setLeaves(Array.isArray(data) ? data : [])
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to load leaves')
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const handleAction = async (id, action) => {
        try {
            await leavesAPI.action(id, { action, notes: 'Admin Review' })
            toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'}`)
            load()
            onRefresh()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Action failed')
        }
    }

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Medical Leave Auditing</h1></div>
            {loading ? (
                <div className="empty-state">Loading leaves...</div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Student</th><th>Period</th><th>Days</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {leaves.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No leave applications pending.</td></tr>
                            ) : leaves.map(l => (
                                <tr key={l.id}>
                                    <td>{l.student_name}</td>
                                    <td style={{ fontSize: 12 }}>{l.leave_from} → {l.leave_to}</td>
                                    <td style={{ fontWeight: 600 }}>{l.total_days}d</td>
                                    <td>{l.medical_condition}</td>
                                    <td><span className={`badge badge-${(l.status || '').toLowerCase()}`}>{(l.status || '').replaceAll('_', ' ')}</span></td>
                                    <td>
                                        {l.status === 'DOCTOR_APPROVED' && (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-success btn-xs" onClick={() => handleAction(l.id, 'approve')}>✓ Approve</button>
                                                <button className="btn btn-danger btn-xs" onClick={() => handleAction(l.id, 'reject')}>✗ Reject</button>
                                            </div>
                                        )}
                                        {l.status === 'PENDING' && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Awaiting doctor</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard
