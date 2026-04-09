import React, { useState, useEffect } from 'react'
import { IndianRupee, CreditCard, CheckCircle, LogOut, Search, Clock, History, BarChart2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, claimsAPI } from '../api/client'

function FinanceDashboard() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState('pending')
    const [data, setData] = useState(null)

    useEffect(() => { loadDashboard() }, [])
    const loadDashboard = async () => { const { data: d } = await dashboardAPI.finance(); setData(d); }

    const renderContent = () => (
        <div>
            <div className="page-header"><h1 className="page-title">Reimbursement Queue</h1></div>
            <div className="stat-grid">
                <div className="glass-card stat-card"><div className="stat-label">Pending Payouts</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{data?.pending_payment_count}</div></div>
                <div className="glass-card stat-card"><div className="stat-label">Total Outflow</div><div className="stat-value">₹{data?.pending_payment_total?.toLocaleString()}</div></div>
                <div className="glass-card stat-card"><div className="stat-label">Processed (Total)</div><div className="stat-value" style={{ color: 'var(--green)' }}>₹{data?.processed_total?.toLocaleString()}</div></div>
            </div>

            <div className="table-container" style={{ marginTop: 24 }}>
                <table>
                    <thead><tr><th>Student</th><th>Hospital</th><th>Claimed</th><th>Calculated Payable</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {(activeTab === 'pending' ? data?.pending_claims : []).map(c => (
                            <tr key={c.id}>
                                <td>{c.student_name}</td>
                                <td>{c.hospital_name}</td>
                                <td>₹{c.amount.toLocaleString()}</td>
                                <td style={{ fontWeight: 800, color: 'var(--green)' }}>₹{c.reimbursement?.final_payable?.toLocaleString() || 'N/A'}</td>
                                <td><span className="badge badge-approved">APPROVED</span></td>
                                <td>
                                    <button className="btn btn-primary btn-xs" onClick={async () => {
                                        await claimsAPI.process(c.id); toast.success('Payment disbursed'); loadDashboard();
                                    }}><CreditCard size={12} /> Pay Now</button>
                                </td>
                            </tr>
                        ))}
                        {(!data?.pending_claims?.length) && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>All payments processed!</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="nav-logo"><div className="nav-logo-icon">🏦</div><div className="nav-logo-text">CampusCare V2</div></div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button className={`nav-item active`} onClick={() => setActiveTab('pending')}><IndianRupee size={18} /> Payout Queue</button>
                    <button className={`nav-item`} onClick={() => setActiveTab('processed')}><History size={18} /> Payout History</button>
                </nav>
                <div className="nav-user"><div className="nav-user-name">{user?.name}</div><div className="nav-user-role">Finance Controller</div>
                    <button className="nav-item" style={{ marginTop: 12, paddingLeft: 0, color: 'var(--red)' }} onClick={logout}><LogOut size={18} /> Sign Out</button>
                </div>
            </aside>
            <main className="main-content">{renderContent()}</main>
        </div>
    )
}

export default FinanceDashboard
