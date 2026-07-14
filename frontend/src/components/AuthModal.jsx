/* eslint-disable react/prop-types */
import { useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import axios from 'axios'

export default function AuthModal({ isOpen, onClose, onAuthSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      addToast('Please enter your email and password credentials.', {
        type: 'error',
        title: 'Credentials Required'
      })
      return
    }

    setIsLoading(true)
    const endpoint = isLogin ? '/auth/login' : '/auth/signup'
    const payload = isLogin ? { email, password } : { email, password, role }

    try {
      const response = await axios.post(endpoint, payload)
      const data = response.data
      
      // Store token in local storage
      localStorage.setItem('placify_auth_token', data.access_token)
      localStorage.setItem('placify_user_email', data.email)
      localStorage.setItem('placify_user_role', data.role)
      
      addToast(
        isLogin ? 'Successfully logged in.' : 'Account registered successfully.',
        { type: 'success', title: isLogin ? 'Welcome Back' : 'Registered' }
      )
      
      onAuthSuccess({
        email: data.email,
        role: data.role,
        token: data.access_token
      })
      onClose()
    } catch (err) {
      console.error('[Auth] Error:', err)
      const errorMsg = err.response?.data?.detail || 'Authentication failed. Please verify configurations.'
      addToast(errorMsg, {
        type: 'error',
        title: 'Authentication Error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0F0F11]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white border border-[#0F0F11]/10 rounded-[16px] max-w-md w-full p-8 space-y-6 shadow-2xl relative"
        style={{ animation: 'slideIn 0.24s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-[#6F6F75] hover:text-[#0F0F11] transition-colors"
        >
          <X className="h-5 w-5 stroke-[1.5]" />
        </button>
        
        <div className="space-y-1">
          <h3 className="text-xl font-medium tracking-tight">
            {isLogin ? 'Access Placify Platform' : 'Create Platform Account'}
          </h3>
          <p className="text-sm text-[#6F6F75]">
            {isLogin ? 'Sign in to access B2B and B2C modules.' : 'Register institutional or student access keys.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[#6F6F75] uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institution.edu"
              className="w-full bg-[#FAFAF8] border border-[#A8A8AE] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:border-[#0F0F11]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[#6F6F75] uppercase tracking-wider">Security Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAFAF8] border border-[#A8A8AE] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:border-[#0F0F11]"
            />
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#6F6F75] uppercase tracking-wider">Access Tier Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-[#A8A8AE] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F0F11]"
              >
                <option value="student">Student (Screen Resume)</option>
                <option value="admin">University Administrator (Batch Engine)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 hover-scale"
          >
            {isLoading ? 'Processing Authentications...' : isLogin ? 'Authenticate Access' : 'Create Access License'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[#6F6F75] hover:text-[#0F0F11] transition-colors underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already configured? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
