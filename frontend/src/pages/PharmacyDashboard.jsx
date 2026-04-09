import React, { useState, useEffect } from 'react'
import { Pill, Boxes, Plus, AlertCircle, LogOut, CheckCircle, Search, ShoppingBag, Package } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, pharmacyAPI, prescriptionsAPI } from '../api/client'

function PharmacyDashboard() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState('inventory')
    const [data, setData] = useState(null)

    useEffect(() => { loadDashboard() }, [])
    const loadDashboard = async () => { const { data: d } = await dashboardAPI.pharmacy(); setData(d); }

    const renderContent = () => {
        switch (activeTab) {
            case 'inventory': return <InventoryTab onRefresh={loadDashboard} />
            case 'queue': return <QueueTab onRefresh={loadDashboard} />
            default: return <InventoryTab onRefresh={loadDashboard} />
        }
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="nav-logo"><div className="nav-logo-icon">💊</div><div className="nav-logo-text">CampusCare V2</div></div>
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="nav-section-label">Inventory</div>
                    <button className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}><Boxes size={18} /> Medicine Stock</button>
                    <div className="nav-section-label" style={{ marginTop: 12 }}>Workflow</div>
                    <button className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}><ShoppingBag size={18} /> Dispense Queue</button>
                </nav>
                <div className="nav-user"><div className="nav-user-name">{user?.name}</div><div className="nav-user-role">Pharmacy Division</div>
                    <button className="nav-item" style={{ marginTop: 12, paddingLeft: 0, color: 'var(--red)' }} onClick={logout}><LogOut size={18} /> Sign Out</button>
                </div>
            </aside>
            <main className="main-content">
                {data && (
                    <div className="stat-grid">
                        <div className="glass-card stat-card"><div className="stat-label">Stock Items</div><div className="stat-value">{data.total_inventory_items}</div></div>
                        <div className="glass-card stat-card"><div className="stat-label">Pending Rx</div><div className="stat-value" style={{ color: 'var(--blue)' }}>{data.dispense_queue_count}</div></div>
                        <div className="glass-card stat-card"><div className="stat-label">Low Stock</div><div className="stat-value" style={{ color: 'var(--red)' }}>{data.low_stock_count}</div></div>
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    )
}

const InventoryTab = ({ onRefresh }) => {
    const [items, setItems] = useState([])
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ medicine_name: '', category: '', current_stock: '', min_stock_threshold: 20, unit: 'tablets', price_per_unit: 0 })

    const load = () => pharmacyAPI.inventory().then(r => setItems(r.data))
    useEffect(load, [])

    const handleAdd = async (e) => {
        e.preventDefault()
        try { await pharmacyAPI.addItem(form); toast.success('Added to stock'); setShowAdd(false); load(); onRefresh(); } catch (err) { toast.error('Error adding') }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h1 className="page-title">Medicine Inventory</h1>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Stock</button>
            </div>
            <div className="table-container">
                <table>
                    <thead><tr><th>Medicine</th><th>Category</th><th>In Stock</th><th>Unit</th><th>Price</th><th>Action</th></tr></thead>
                    <tbody>
                        {items.map(i => (
                            <tr key={i.id}>
                                <td><div style={{ fontWeight: 600 }}>{i.medicine_name}</div></td>
                                <td><span className="tag tag-blue">{i.category}</span></td>
                                <td><span style={{ fontWeight: 700, color: i.current_stock <= i.min_stock_threshold ? 'var(--red)' : 'var(--green)' }}>{i.current_stock}</span></td>
                                <td>{i.unit}</td>
                                <td>₹{i.price_per_unit}</td>
                                <td><button className="btn btn-ghost btn-xs">Restock</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <div className="modal-backdrop"><div className="modal-box">
                    <h3>Add New Medicine</h3>
                    <form onSubmit={handleAdd} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="input-group"><label className="input-label">Medicine Name</label><input className="input" required onChange={e => setForm({ ...form, medicine_name: e.target.value })} /></div>
                        <div className="form-row">
                            <div className="input-group"><label className="input-label">Stock Level</label><input type="number" className="input" required onChange={e => setForm({ ...form, current_stock: parseInt(e.target.value) })} /></div>
                            <div className="input-group"><label className="input-label">Category</label><input className="input" placeholder="e.g. Antibiotic" onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Medicine</button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                        </div>
                    </form>
                </div></div>
            )}
        </div>
    )
}

const QueueTab = ({ onRefresh }) => {
    const [list, setList] = useState([])
    useEffect(() => { pharmacyAPI.queue().then(r => setList(r.data.prescriptions)) }, [])

    const handleDispense = async (rx) => {
        try {
            await pharmacyAPI.dispense({
                prescription_id: rx.id, patient_id: rx.patient_id,
                medicines_dispensed: rx.medicines.map(m => ({ name: m.name, quantity: m.quantity }))
            })
            toast.success('Prescription dispensed');
            onRefresh();
            pharmacyAPI.queue().then(r => setList(r.data.prescriptions))
        } catch (err) { toast.error('Check inventory levels') }
    }

    return (
        <div>
            <div className="page-header"><h1 className="page-title">Dispense Queue</h1></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {list.map(rx => (
                    <div key={rx.id} className="glass-card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>{rx.patient_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Prescribed by Dr. {rx.doctor_name} · {new Date(rx.created_at).toLocaleString()}</div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                {rx.medicines.map((m, mi) => <span key={mi} className="tag tag-amber">{m.name} ({m.quantity})</span>)}
                            </div>
                        </div>
                        <button className="btn btn-success" onClick={() => handleDispense(rx)}><ShoppingBag size={16} /> Dispense All</button>
                    </div>
                ))}
                {list.length === 0 && <div className="empty-state">No pending prescriptions.</div>}
            </div>
        </div>
    )
}

export default PharmacyDashboard
