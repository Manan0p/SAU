import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: {
            '/auth': 'http://localhost:8000',
            '/appointments': 'http://localhost:8000',
            '/prescriptions': 'http://localhost:8000',
            '/pharmacy': 'http://localhost:8000',
            '/claims': 'http://localhost:8000',
            '/leaves': 'http://localhost:8000',
            '/dashboard': 'http://localhost:8000',
            '/records': 'http://localhost:8000',
            '/health': 'http://localhost:8000',
        }
    }
})
