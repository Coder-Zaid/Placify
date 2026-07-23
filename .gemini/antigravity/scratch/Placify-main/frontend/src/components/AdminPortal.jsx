import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  ClipboardList,
  Calendar,
  Database,
  ScanEye,
  FileCode2,
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  Network,
  Tag,
  ShieldAlert,
  Fingerprint,
  Mail,
  Settings,
  HelpCircle,
  History,
  Shield,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Download,
  Eye,
  Trash2
} from 'lucide-react'

// Dummy Data
const INITIAL_STUDENTS = [
  { id: 1, name: 'Aarav Mehta', regNo: '2026CSE0042', email: 'aarav.mehta@university.edu', assessment: 'Data Structures & Algorithms Midterm', attempt: 1, score: 92, warnings: 0, status: 'Completed', submittedAt: '2026-07-23 14:32', dept: 'CSE' },
  { id: 2, name: 'Ananya Iyer', regNo: '2026CSE0118', email: 'ananya.iyer@university.edu', assessment: 'System Design Mock Test', attempt: 2, score: 78, warnings: 2, status: 'Completed', submittedAt: '2026-07-23 15:10', dept: 'CSE' },
  { id: 3, name: 'Kabir Sharma', regNo: '2026ECE0029', email: 'kabir.sharma@university.edu', assessment: 'Data Structures & Algorithms Midterm', attempt: 1, score: 0, warnings: 5, status: 'Terminated', submittedAt: '2026-07-23 11:15', dept: 'ECE', reason: 'Browser switching violation threshold exceeded' },
  { id: 4, name: 'Diya Patel', regNo: '2026EE0081', email: 'diya.patel@university.edu', assessment: 'Full-Stack JavaScript Quiz', attempt: 1, score: 85, warnings: 1, status: 'Completed', submittedAt: '2026-07-23 16:04', dept: 'EE' },
  { id: 5, name: 'Rohan Verma', regNo: '2026CSE0210', email: 'rohan.verma@university.edu', assessment: 'System Design Mock Test', attempt: 1, score: 45, warnings: 0, status: 'In Progress', submittedAt: '-', dept: 'CSE' },
  { id: 6, name: 'Meera Nair', regNo: '2026CSE0095', email: 'meera.nair@university.edu', assessment: 'Data Structures & Algorithms Midterm', attempt: 1, score: 96, warnings: 0, status: 'Completed', submittedAt: '2026-07-23 12:44', dept: 'CSE' },
  { id: 7, name: 'Dev Bajwa', regNo: '2026ME0053', email: 'dev.bajwa@university.edu', assessment: 'Full-Stack JavaScript Quiz', attempt: 1, score: 0, warnings: 6, status: 'Terminated', submittedAt: '2026-07-23 10:30', dept: 'ME', reason: 'Secondary device / face detection failed repeatedly' }
]

const QUESTIONS_BANK = [
  { id: 'Q-101', title: 'Implement Least Recently Used (LRU) Cache', type: 'Code', difficulty: 'Hard', category: 'Data Structures' },
  { id: 'Q-102', title: 'Design Rate Limiter for SaaS API Gateway', type: 'System Design', difficulty: 'Medium', category: 'System Design' },
  { id: 'Q-103', title: 'Explain ACID Properties in DBMS', type: 'Subjective', difficulty: 'Easy', category: 'Database' },
  { id: 'Q-104', title: 'Find Longest Palindromic Substring', type: 'Code', difficulty: 'Medium', category: 'Algorithms' }
]

const DEPARTMENTS = ['All', 'CSE', 'ECE', 'EE', 'ME']
const ASSESSMENTS = ['All', 'Data Structures & Algorithms Midterm', 'System Design Mock Test', 'Full-Stack JavaScript Quiz']
const STATUS_OPTIONS = ['All', 'Completed', 'In Progress', 'Terminated']

export default function AdminPortal() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('Student Attempts') // "Create Assessment" | "Question Bank" | "Assignments" | "Student Attempts" | "Analytics"
  const [darkMode, setDarkMode] = useState(false)
  
  // Table state
  const [students, setStudents] = useState(INITIAL_STUDENTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState('All')
  const [selectedAssessment, setSelectedAssessment] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortField, setSortField] = useState('submittedAt')
  const [sortAsc, setSortAsc] = useState(false)
  
  // Selected attempt detail modal state
  const [selectedAttempt, setSelectedAttempt] = useState(null)

  // Create assessment form state
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    duration: '',
    department: 'CSE',
    questionsCount: '',
    secureMode: true
  })
  
  // Custom Toast State
  const [toastMessage, setToastMessage] = useState(null)
  
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleCreateAssessment = (e) => {
    e.preventDefault()
    if (!newAssessment.title || !newAssessment.duration) {
      showToast('Fill required fields')
      return
    }
    showToast(`Created Assessment: ${newAssessment.title}`)
    setNewAssessment({
      title: '',
      duration: '',
      department: 'CSE',
      questionsCount: '',
      secureMode: true
    })
  }

  // Filter & Sort Logic
  const filteredStudents = useMemo(() => {
    let result = [...students]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        s => s.name.toLowerCase().includes(term) || 
             s.regNo.toLowerCase().includes(term) || 
             s.email.toLowerCase().includes(term)
      )
    }

    if (selectedDept !== 'All') {
      result = result.filter(s => s.dept === selectedDept)
    }

    if (selectedAssessment !== 'All') {
      result = result.filter(s => s.assessment === selectedAssessment)
    }

    if (selectedStatus !== 'All') {
      result = result.filter(s => s.status === selectedStatus)
    }

    result.sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      } else {
        return sortAsc ? aVal - bVal : bVal - aVal
      }
    })

    return result
  }, [students, searchTerm, selectedDept, selectedAssessment, selectedStatus, sortField, sortAsc])

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  // Live aggregated counts
  const stats = useMemo(() => {
    const total = students.length
    const attempted = students.filter(s => s.status !== 'In Progress').length
    const completed = students.filter(s => s.status === 'Completed').length
    const terminated = students.filter(s => s.status === 'Terminated').length
    const averageScore = Math.round(
      students.filter(s => s.status === 'Completed').reduce((acc, curr) => acc + curr.score, 0) / (completed || 1)
    )

    return { total, attempted, completed, terminated, averageScore }
  }, [students])

  // Navigation Links definition
  const navigationItems = {
    Main: [
      { name: 'Dashboard', icon: LayoutDashboard },
      { name: 'Students', icon: Users },
      { name: 'Companies', icon: Building2 },
      { name: 'Recruiters', icon: UserCheck },
      { name: 'Assessments', icon: ClipboardList },
      { name: 'Interview Management', icon: Calendar },
      { name: 'Question Bank', icon: Database },
      { name: 'Resume Screening', icon: ScanEye },
      { name: 'Code Tests', icon: FileCode2 },
      { name: 'Analytics', icon: BarChart3 },
      { name: 'Reports', icon: FileSpreadsheet }
    ],
    Management: [
      { name: 'Programs', icon: FolderKanban },
      { name: 'Departments', icon: Network },
      { name: 'Categories', icon: Tag },
      { name: 'Permissions', icon: ShieldAlert },
      { name: 'Roles', icon: UserCheck },
      { name: 'Invitations', icon: Mail }
    ],
    System: [
      { name: 'Settings', icon: Settings },
      { name: 'Support', icon: HelpCircle },
      { name: 'Logs', icon: History },
      { name: 'Secure Extension', icon: Shield }
    ]
  }

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${darkMode ? 'bg-[#0E0E0E] text-[#E0E0E0]' : 'bg-[#FAF7F0] text-[#111111]'}`}
         style={{
           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
           backgroundAttachment: 'fixed'
         }}>
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C] text-[#E0E0E0]' : 'bg-white border-[#EBEBEB] text-[#111111]'}`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Component */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? '72px' : '280px' }}
        className={`shrink-0 sticky top-0 h-screen border-r flex flex-col justify-between overflow-y-auto select-none ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'}`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="h-[72px] flex items-center justify-between px-5 border-b border-[#EBEBEB]/10">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${darkMode ? 'bg-[#E0E0E0] text-black' : 'bg-black text-white'}`}>P</div>
              {!sidebarCollapsed && <span className="font-heading font-bold text-lg tracking-tight">Placify Admin</span>}
            </div>
            {!sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(true)}
                className={`p-1.5 rounded-lg border hover:bg-black/5 transition-all ${darkMode ? 'border-[#2D2D2D]' : 'border-[#EAEAEA]'}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="py-4 space-y-6">
            {Object.entries(navigationItems).map(([section, items]) => (
              <div key={section} className="px-4">
                {!sidebarCollapsed && (
                  <h3 className={`text-[10px] font-semibold tracking-wider uppercase mb-2 ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {section}
                  </h3>
                )}
                <ul className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon
                    const isSelected = item.name === 'Assessments'
                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => {
                            if (item.name === 'Assessments') {
                              setActiveTab('Student Attempts')
                            } else {
                              showToast(`Navigated to: ${item.name}`)
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-sm font-medium ${
                            isSelected 
                              ? darkMode 
                                ? 'bg-white/10 text-white' 
                                : 'bg-black text-white' 
                              : darkMode
                                ? 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-[#111111]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {!sidebarCollapsed && <span>{item.name}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#EBEBEB]/10">
          {sidebarCollapsed ? (
            <button 
              onClick={() => setSidebarCollapsed(false)}
              className={`w-full flex items-center justify-center p-2 rounded-xl border hover:bg-black/5 ${darkMode ? 'border-[#2C2C2C]' : 'border-[#EAEAEA]'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${darkMode ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-[#FAF7F0] border-[#EBEBEB]'}`}>
              <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center font-bold text-xs text-neutral-800">
                AD
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate">Admin User</p>
                <p className="text-[10px] text-neutral-500 truncate">admin@placify.com</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar Component */}
        <header className={`h-[72px] sticky top-0 z-40 border-b flex items-center justify-between px-8 ${darkMode ? 'bg-[#0E0E0E]/80 border-[#202020]' : 'bg-[#FAF7F0]/80 border-[#EBEBEB]'} backdrop-blur-md`}>
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <span>Admin</span>
            <span>/</span>
            <span className={darkMode ? 'text-[#E0E0E0]' : 'text-[#111111]'}>Assessments</span>
          </div>

          {/* Center: Global Search Bar */}
          <div className="relative w-96 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Quick search student, company, config..."
              className={`w-full text-xs pl-10 pr-4 py-2 rounded-xl border focus:outline-none transition-all ${
                darkMode
                  ? 'bg-[#1C1C1C] border-[#2E2E2E] focus:border-neutral-500'
                  : 'bg-white border-[#E0E0E0] focus:border-neutral-800'
              }`}
            />
          </div>

          {/* Right: Quick actions menu */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border hover:bg-black/5 transition-all ${darkMode ? 'border-[#2C2C2C]' : 'border-[#EAEAEA]'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification bell */}
            <button
              onClick={() => showToast('No new notifications')}
              className={`p-2 rounded-xl border hover:bg-black/5 transition-all relative ${darkMode ? 'border-[#2C2C2C]' : 'border-[#EAEAEA]'}`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#16A34A] rounded-full" />
            </button>

            {/* User Profile */}
            <div className="w-8 h-8 rounded-full bg-neutral-300 border overflow-hidden flex items-center justify-center font-bold text-xs select-none">
              A
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="max-w-[1600px] w-full mx-auto p-10 flex-1 flex flex-col gap-8">
          
          {/* Hero Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#EBEBEB]/10 pb-6">
            <div>
              <h1 className="font-heading font-extrabold text-3xl tracking-tight">Assessment Management</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage secure assessments, monitor attempts and analyze performance.</p>
            </div>
            
            {/* Quick Actions Action bar */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setActiveTab('Create Assessment')
                  showToast('Fill details to create assessment')
                }}
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
                  darkMode ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Create Assessment
              </button>
              <button 
                onClick={() => showToast('Invitation code generated')}
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border hover:bg-black/5 transition-all ${
                  darkMode ? 'border-[#2C2C2C] text-white' : 'border-[#EAEAEA] text-[#111111]'
                }`}
              >
                Invite Students
              </button>
            </div>
          </div>

          {/* Interactive Statistics Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Total Students', value: stats.total, icon: Users, desc: 'Registered in database' },
              { title: 'Assessments', value: stats.attempted, icon: ClipboardList, desc: 'Active & evaluated attempts' },
              { title: 'Completed Attempts', value: stats.completed, icon: CheckCircle2, desc: 'Submissions successfully reviewed' },
              { title: 'Average Score', value: `${stats.averageScore}%`, icon: BarChart3, desc: 'Across all completed exams' }
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`p-6 rounded-2xl border transition-all ${
                    darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'
                  }`}
                  style={{ boxShadow: '0 4px 20px -8px rgba(17, 17, 17, 0.05)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">{stat.title}</span>
                    <Icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-heading font-extrabold text-3xl tracking-tight">{stat.value}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-2">{stat.desc}</p>
                </motion.div>
              )
            })}
          </section>

          {/* Navigation Sub-Tabs bar */}
          <nav className="flex border-b border-[#EBEBEB]/10">
            {['Create Assessment', 'Question Bank', 'Assignments', 'Student Attempts', 'Analytics'].map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-semibold relative transition-all border-b-2 -mb-[2px] ${
                    isActive 
                      ? darkMode 
                        ? 'text-white border-white' 
                        : 'text-black border-black font-bold'
                      : 'text-neutral-400 border-transparent hover:text-neutral-600'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </nav>

          {/* Tabs Content Switching Area */}
          <section className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'Student Attempts' && (
                <motion.div
                  key="attempts-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Enrolled', count: stats.total },
                      { label: 'Total Attempted', count: stats.attempted },
                      { label: 'Completed Exam', count: stats.completed },
                      { label: 'Terminated / Suspended', count: stats.terminated, alert: stats.terminated > 0 }
                    ].map((card) => (
                      <div key={card.label} className={`p-4 rounded-xl border flex items-center justify-between ${
                        card.alert 
                          ? 'border-red-900/30 bg-red-950/5 text-red-600' 
                          : darkMode ? 'bg-[#151515] border-[#2A2A2A]' : 'bg-[#FAF7F0] border-[#EBEBEB]'
                      }`}>
                        <span className="text-xs font-semibold">{card.label}</span>
                        <span className="font-heading font-bold text-lg">{card.count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Filters Header toolbar */}
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-4 ${
                    darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'
                  }`}>
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search student name, email, reg no..."
                        className={`w-full text-xs pl-9 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-neutral-400 ${
                          darkMode ? 'bg-[#1A1A1A] border-[#2C2C2C]' : 'bg-white border-[#E0E0E0]'
                        }`}
                      />
                    </div>

                    {/* Department Dropdown Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-3.5 h-3.5 text-neutral-400" />
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className={`text-xs p-2 rounded-lg border focus:outline-none ${
                          darkMode ? 'bg-[#1A1A1A] border-[#2C2C2C]' : 'bg-white border-[#E0E0E0]'
                        }`}
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d} value={d}>Dept: {d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Assessment Dropdown Filter */}
                    <div>
                      <select
                        value={selectedAssessment}
                        onChange={(e) => setSelectedAssessment(e.target.value)}
                        className={`text-xs p-2 rounded-lg border focus:outline-none max-w-[200px] truncate ${
                          darkMode ? 'bg-[#1A1A1A] border-[#2C2C2C]' : 'bg-white border-[#E0E0E0]'
                        }`}
                      >
                        {ASSESSMENTS.map(a => (
                          <option key={a} value={a}>{a === 'All' ? 'All Assessments' : a}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Dropdown Filter */}
                    <div>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className={`text-xs p-2 rounded-lg border focus:outline-none ${
                          darkMode ? 'bg-[#1A1A1A] border-[#2C2C2C]' : 'bg-white border-[#E0E0E0]'
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>Status: {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Student Attempt Table list */}
                  <div className={`rounded-xl border overflow-hidden ${
                    darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'
                  }`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`border-b font-semibold ${darkMode ? 'bg-[#1A1A1A] border-[#2D2D2D] text-neutral-400' : 'bg-neutral-50 border-[#EAEAEA] text-neutral-500'}`}>
                            <th className="p-4 cursor-pointer" onClick={() => toggleSort('name')}>
                              <span className="flex items-center gap-1">Student <ArrowUpDown className="w-3 h-3" /></span>
                            </th>
                            <th className="p-4">Reg No</th>
                            <th className="p-4">Email</th>
                            <th className="p-4 cursor-pointer" onClick={() => toggleSort('assessment')}>
                              <span className="flex items-center gap-1">Assessment <ArrowUpDown className="w-3 h-3" /></span>
                            </th>
                            <th className="p-4 text-center">Attempt</th>
                            <th className="p-4 text-center cursor-pointer" onClick={() => toggleSort('score')}>
                              <span className="flex items-center justify-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></span>
                            </th>
                            <th className="p-4 text-center">Warnings</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 cursor-pointer" onClick={() => toggleSort('submittedAt')}>
                              <span className="flex items-center gap-1">Submitted At <ArrowUpDown className="w-3 h-3" /></span>
                            </th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan="10" className="p-8 text-center text-neutral-500">No matching student logs found.</td>
                            </tr>
                          ) : (
                            filteredStudents.map((student) => (
                              <tr key={student.id} className={`border-b transition-colors ${
                                darkMode ? 'border-[#202020] hover:bg-[#1A1A1A]' : 'border-[#EAEAEA] hover:bg-neutral-50'
                              }`}>
                                <td className="p-4 font-semibold">{student.name}</td>
                                <td className="p-4 text-neutral-500">{student.regNo}</td>
                                <td className="p-4 text-neutral-500">{student.email}</td>
                                <td className="p-4 truncate max-w-[180px] font-medium">{student.assessment}</td>
                                <td className="p-4 text-center font-mono">{student.attempt}</td>
                                <td className="p-4 text-center font-bold">
                                  {student.status === 'Terminated' ? (
                                    <span className="text-red-500">0</span>
                                  ) : student.status === 'In Progress' ? (
                                    <span className="text-neutral-400">-</span>
                                  ) : (
                                    <span className={student.score >= 80 ? 'text-[#16A34A]' : 'text-amber-600'}>{student.score}</span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  {student.warnings > 0 ? (
                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-950/10 text-amber-500 border border-amber-900/10">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>{student.warnings}</span>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-500">0</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                    student.status === 'Completed' 
                                      ? 'bg-emerald-950/10 text-emerald-600 border-emerald-900/10'
                                      : student.status === 'In Progress'
                                        ? 'bg-neutral-900/10 text-neutral-400 border-neutral-800'
                                        : 'bg-red-950/10 text-red-500 border-red-900/10'
                                  }`}>
                                    {student.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                                    {student.status === 'In Progress' && <History className="w-3 h-3" />}
                                    {student.status === 'Terminated' && <XCircle className="w-3 h-3" />}
                                    {student.status}
                                  </span>
                                </td>
                                <td className="p-4 text-neutral-500 font-mono">{student.submittedAt}</td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button 
                                      onClick={() => setSelectedAttempt(student)}
                                      className={`p-1.5 rounded-lg border hover:bg-black/5 transition-all ${
                                        darkMode ? 'border-[#2C2C2C] text-neutral-300' : 'border-[#EAEAEA] text-neutral-700'
                                      }`}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setStudents(students.filter(s => s.id !== student.id))
                                        showToast('Removed log attempt')
                                      }}
                                      className="p-1.5 rounded-lg border border-red-900/20 text-red-500 hover:bg-red-950/5 transition-all"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'Create Assessment' && (
                <motion.div
                  key="create-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className={`p-8 rounded-2xl border ${
                    darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'
                  }`} style={{ boxShadow: '0 4px 20px -8px rgba(17, 17, 17, 0.05)' }}>
                    <h2 className="font-heading font-bold text-xl mb-6">Define Assessment Setup</h2>
                    <form onSubmit={handleCreateAssessment} className="space-y-5 text-xs">
                      <div>
                        <label className="block font-semibold mb-2 text-neutral-400">ASSESSMENT TITLE *</label>
                        <input
                          type="text"
                          required
                          value={newAssessment.title}
                          onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                          placeholder="e.g. Algorithms Term 2 Practice"
                          className={`w-full p-3 rounded-xl border focus:outline-none ${
                            darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C]' : 'bg-[#FAF7F0] border-[#EBEBEB]'
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold mb-2 text-neutral-400">DURATION (MINUTES) *</label>
                          <input
                            type="number"
                            required
                            value={newAssessment.duration}
                            onChange={(e) => setNewAssessment({...newAssessment, duration: e.target.value})}
                            placeholder="e.g. 90"
                            className={`w-full p-3 rounded-xl border focus:outline-none ${
                              darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C]' : 'bg-[#FAF7F0] border-[#EBEBEB]'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-2 text-neutral-400">DEPARTMENT *</label>
                          <select
                            value={newAssessment.department}
                            onChange={(e) => setNewAssessment({...newAssessment, department: e.target.value})}
                            className={`w-full p-3 rounded-xl border focus:outline-none ${
                              darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C]' : 'bg-[#FAF7F0] border-[#EBEBEB]'
                            }`}
                          >
                            <option value="CSE">Computer Science (CSE)</option>
                            <option value="ECE">Electronics (ECE)</option>
                            <option value="EE">Electrical (EE)</option>
                            <option value="ME">Mechanical (ME)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold mb-2 text-neutral-400">QUESTION COUNT</label>
                        <input
                          type="number"
                          value={newAssessment.questionsCount}
                          onChange={(e) => setNewAssessment({...newAssessment, questionsCount: e.target.value})}
                          placeholder="e.g. 15"
                          className={`w-full p-3 rounded-xl border focus:outline-none ${
                            darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C]' : 'bg-[#FAF7F0] border-[#EBEBEB]'
                          }`}
                        />
                      </div>

                      <div className={`p-4 rounded-xl border flex items-center justify-between ${
                        darkMode ? 'bg-[#1B1B1B] border-[#2C2C2C]' : 'bg-[#FAF7F0] border-[#EBEBEB]'
                      }`}>
                        <div>
                          <span className="font-semibold block">Enable Secure Exam Mode</span>
                          <span className="text-[10px] text-neutral-500">Require browser monitoring extension & block multiple devices.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={newAssessment.secureMode}
                          onChange={(e) => setNewAssessment({...newAssessment, secureMode: e.target.checked})}
                          className="w-4 h-4 accent-black"
                        />
                      </div>

                      <button
                        type="submit"
                        className={`w-full p-3.5 rounded-xl font-bold transition-all text-center select-none ${
                          darkMode ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                        }`}
                      >
                        Publish Assessment
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'Question Bank' && (
                <motion.div
                  key="questions-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="font-heading font-bold text-lg">Central Question Repository</h2>
                    <button 
                      onClick={() => showToast('Question creator opened')}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl border ${darkMode ? 'border-[#2C2C2C]' : 'border-[#EAEAEA]'}`}
                    >
                      Add Question
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {QUESTIONS_BANK.map(q => (
                      <div key={q.id} className={`p-5 rounded-xl border text-xs flex justify-between items-start ${
                        darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'
                      }`}>
                        <div>
                          <span className="font-mono text-neutral-400 block mb-1">{q.id}</span>
                          <span className="font-semibold text-sm block">{q.title}</span>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="px-2 py-0.5 rounded bg-neutral-200/50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{q.type}</span>
                            <span className="px-2 py-0.5 rounded bg-neutral-200/50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{q.category}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                          q.difficulty === 'Easy' ? 'text-green-500 bg-green-500/10' :
                          q.difficulty === 'Medium' ? 'text-amber-500 bg-amber-500/10' : 'text-red-500 bg-red-500/10'
                        }`}>{q.difficulty}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'Assignments' && (
                <motion.div
                  key="assignments-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-8 text-center text-xs text-neutral-500"
                >
                  <p>Assign assessments dynamically to departments, cohorts, or specific enrollment pools.</p>
                  <button 
                    onClick={() => showToast('Assign dialog launched')}
                    className={`mt-4 px-4 py-2 font-semibold rounded-xl border ${darkMode ? 'border-[#2C2C2C] text-white' : 'border-[#EAEAEA]'}`}
                  >
                    Create Assignment Rule
                  </button>
                </motion.div>
              )}

              {activeTab === 'Analytics' && (
                <motion.div
                  key="analytics-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <h2 className="font-heading font-bold text-lg">Evaluation Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SVG Chart 1: Average Score Trend */}
                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'}`}>
                      <h3 className="text-xs font-semibold text-neutral-400 mb-4 uppercase">Submission Pass rates (by Category)</h3>
                      <div className="h-64 flex items-end justify-between px-6 pt-4 relative">
                        {/* Horizontal guide lines */}
                        <div className="absolute inset-x-0 bottom-4 border-b border-neutral-500/10" />
                        <div className="absolute inset-x-0 bottom-20 border-b border-neutral-500/10" />
                        <div className="absolute inset-x-0 bottom-36 border-b border-neutral-500/10" />
                        <div className="absolute inset-x-0 bottom-52 border-b border-neutral-500/10" />

                        {/* Custom SVG bars */}
                        {[
                          { category: 'Data Structures', rate: 90, height: 160 },
                          { category: 'Web Dev', rate: 75, height: 130 },
                          { category: 'System Design', rate: 65, height: 110 },
                          { category: 'Database', rate: 85, height: 150 }
                        ].map((bar, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2 z-10">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: bar.height }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`w-12 rounded-t-lg ${darkMode ? 'bg-neutral-300' : 'bg-black'}`}
                            />
                            <span className="text-[10px] font-semibold">{bar.rate}%</span>
                            <span className="text-[9px] text-neutral-500">{bar.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SVG Chart 2: Security Violations Trend */}
                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'}`}>
                      <h3 className="text-xs font-semibold text-neutral-400 mb-4 uppercase">Cheating/Violation warnings triggered</h3>
                      <div className="h-64 flex items-center justify-center">
                        <svg className="w-full h-full max-h-56" viewBox="0 0 300 120">
                          {/* Animated line representing warning count */}
                          <motion.path
                            d="M 20,80 L 80,60 L 140,95 L 200,40 L 260,25"
                            fill="none"
                            stroke={darkMode ? '#FFFFFF' : '#111111'}
                            strokeWidth="3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, ease: 'easeInOut' }}
                          />
                          {/* Circles on dots */}
                          {[
                            { cx: 20, cy: 80, label: 'Mon' },
                            { cx: 80, cy: 60, label: 'Tue' },
                            { cx: 140, cy: 95, label: 'Wed' },
                            { cx: 200, cy: 40, label: 'Thu' },
                            { cx: 260, cy: 25, label: 'Fri' }
                          ].map((pt, index) => (
                            <g key={index}>
                              <circle cx={pt.cx} cy={pt.cy} r="4" fill="#16A34A" />
                              <text x={pt.cx} y="115" textAnchor="middle" fill="#888888" fontSize="8" fontFamily="sans-serif">{pt.label}</text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </main>
      </div>

      {/* Slideout Side Modal: Secure Assessment Attempt Details */}
      <AnimatePresence>
        {selectedAttempt && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAttempt(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Modal Body Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative w-full max-w-lg h-full shadow-2xl p-8 overflow-y-auto flex flex-col justify-between ${
                darkMode ? 'bg-[#121212] border-l border-[#202020]' : 'bg-[#FAF7F0] border-l border-[#EBEBEB]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-[#EBEBEB]/10">
                  <h3 className="font-heading font-bold text-lg">Attempt Log Details</h3>
                  <button 
                    onClick={() => setSelectedAttempt(null)}
                    className="p-1 rounded-full hover:bg-black/5"
                  >
                    <Plus className="w-4 h-4 transform rotate-45" />
                  </button>
                </div>

                <div className="py-6 space-y-6 text-xs">
                  {/* Student Profile Info */}
                  <div>
                    <h4 className="font-semibold text-neutral-400 uppercase tracking-wide mb-2">Student Profiles</h4>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold">{selectedAttempt.name}</p>
                      <p className="text-neutral-500">ID: {selectedAttempt.regNo}</p>
                      <p className="text-neutral-500">Email: {selectedAttempt.email}</p>
                    </div>
                  </div>

                  {/* Assessment Info */}
                  <div>
                    <h4 className="font-semibold text-neutral-400 uppercase tracking-wide mb-2">Assessment Details</h4>
                    <p className="font-medium text-sm">{selectedAttempt.assessment}</p>
                    <p className="text-neutral-500 mt-1">Submitted at: {selectedAttempt.submittedAt}</p>
                  </div>

                  {/* Anti-Cheat/Secure Logs Monitoring */}
                  <div className={`p-4 rounded-xl border ${
                    selectedAttempt.status === 'Terminated' 
                      ? 'bg-red-950/5 border-red-900/20' 
                      : darkMode ? 'bg-white/5 border-white/5' : 'bg-white border-[#EBEBEB]'
                  }`}>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Secure Exam Extension Logs
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Extension status:</span>
                        <span className="font-semibold text-emerald-500">Active / Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Tab switches / window refocus:</span>
                        <span className={`font-semibold ${selectedAttempt.warnings > 3 ? 'text-red-500' : 'text-neutral-400'}`}>
                          {selectedAttempt.warnings} Warning(s)
                        </span>
                      </div>
                      {selectedAttempt.status === 'Terminated' && (
                        <div className="pt-2 border-t border-neutral-500/10">
                          <span className="text-red-500 font-bold block">Violation Event Triggered</span>
                          <p className="text-[11px] text-neutral-500 mt-1">{selectedAttempt.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-6 border-t border-[#EBEBEB]/10 flex gap-2">
                <button
                  onClick={() => {
                    showToast('Log downloaded')
                    setSelectedAttempt(null)}
                  }
                  className={`flex-1 p-2.5 rounded-xl font-bold text-center border text-xs flex items-center justify-center gap-2 ${
                    darkMode ? 'border-[#2C2C2C] hover:bg-neutral-900' : 'border-[#EAEAEA] hover:bg-neutral-50'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Log
                </button>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className={`flex-1 p-2.5 rounded-xl font-bold text-center text-xs ${
                    darkMode ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
