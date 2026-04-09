import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import PharmacyDashboard from './pages/PharmacyDashboard'
import FinanceDashboard from './pages/FinanceDashboard'

const PrivateRoute = ({ children, roles }) => {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" />
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />
    return children
}

const DashboardRedirect = () => {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" />

    switch (user.role) {
        case 'student': return <Navigate to="/student" />
        case 'doctor': return <Navigate to="/doctor" />
        case 'admin': return <Navigate to="/admin" />
        case 'pharmacy': return <Navigate to="/pharmacy" />
        case 'finance': return <Navigate to="/finance" />
        default: return <Navigate to="/login" />
    }
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/student/*" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
                    <Route path="/doctor/*" element={<PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
                    <Route path="/admin/*" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
                    <Route path="/pharmacy/*" element={<PrivateRoute roles={['pharmacy']}><PharmacyDashboard /></PrivateRoute>} />
                    <Route path="/finance/*" element={<PrivateRoute roles={['finance']}><FinanceDashboard /></PrivateRoute>} />

                    <Route path="/" element={<DashboardRedirect />} />
                </Routes>
                <Toaster position="top-right" toastOptions={{
                    style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
                }} />
            </AuthProvider>
        </Router>
    )
}

export default App
