import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { LogIn, ShieldCheck, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function Login() {
    const { login, loading } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
            const user = await login(email, password)
            toast.success(`Welcome back, ${user.name}!`)
            navigate('/')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed')
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-box">
                <div className="auth-logo">
                    <div className="auth-logo-icon">💙</div>
                    <h1 className="auth-logo-title">CampusCare V2</h1>
                    <p className="auth-logo-sub">Healthcare & Insurance Portal</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="input-group">
                        <label className="input-label">Campus Email</label>
                        <input
                            type="email" className="input" placeholder="student@demo.com"
                            value={email} onChange={e => setEmail(e.target.value)} required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password" className="input" placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)} required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ height: 48, justifyContent: 'center' }} disabled={loading}>
                        <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>Register</Link>
                </div>

                <div style={{ marginTop: 32, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Demo Credentials</div>
                    <div>Student: student@demo.com / pass123</div>
                    <div>Doctor: doctor@demo.com / pass123</div>
                    <div>Admin: admin@demo.com / pass123</div>
                </div>
            </div>
        </div>
    )
}

export default Login
