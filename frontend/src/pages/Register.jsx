import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { UserPlus } from 'lucide-react'
import { authAPI } from '../api/client'
import { useAuth } from '../context/AuthContext'

function Register() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'student', student_id: '', specialization: '', department: ''
    })

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await authAPI.register(formData)
            toast.success('Registration successful! Please login.')
            navigate('/login')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-box" style={{ maxWidth: 480 }}>
                <div className="auth-logo">
                    <h1 className="auth-logo-title">Join CampusCare</h1>
                    <p className="auth-logo-sub">Create your healthcare account</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input className="input" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label className="input-label">Role</label>
                            <select className="select" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="student">Student</option>
                                <option value="doctor">Doctor</option>
                                <option value="pharmacy">Pharmacy Staff</option>
                                <option value="finance">Finance Officer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-label">Campus Email</label>
                            <input type="email" className="input" placeholder="john@demo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input type="password" className="input" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>

                    {formData.role === 'student' && (
                        <div className="input-group">
                            <label className="input-label">Student ID</label>
                            <input className="input" placeholder="ST2024001" value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} required />
                        </div>
                    )}

                    {formData.role === 'doctor' && (
                        <div className="input-group">
                            <label className="input-label">Specialization</label>
                            <input className="input" placeholder="Cardiologist" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} required />
                        </div>
                    )}

                    {(formData.role === 'admin' || formData.role === 'pharmacy' || formData.role === 'finance') && (
                        <div className="input-group">
                            <label className="input-label">Department</label>
                            <input className="input" placeholder="Administration" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ height: 48, justifyContent: 'center', marginTop: 10 }} disabled={loading}>
                        <UserPlus size={18} /> {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
                </div>
            </div>
        </div>
    )
}

export default Register
