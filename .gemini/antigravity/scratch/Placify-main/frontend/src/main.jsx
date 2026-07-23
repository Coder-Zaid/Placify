import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import InterviewStudio from './components/interview-studio/InterviewStudio.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import AdminPortal from './components/AdminPortal.jsx'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/interview-studio" element={<InterviewStudio />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPortal />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
