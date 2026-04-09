import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('v2_user')))
    const [loading, setLoading] = useState(false)

    const login = async (email, password) => {
        setLoading(true)
        try {
            const { data } = await authAPI.login({ email, password })
            const userData = {
                id: data.user_id,
                name: data.name,
                role: data.role,
                specialization: data.specialization,
                student_id: data.student_id
            }
            localStorage.setItem('v2_token', data.access_token)
            localStorage.setItem('v2_user', JSON.stringify(userData))
            setUser(userData)
            return userData
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('v2_token')
        localStorage.removeItem('v2_user')
        setUser(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
