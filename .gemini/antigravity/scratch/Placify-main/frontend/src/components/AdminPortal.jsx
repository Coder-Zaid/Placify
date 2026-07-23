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
  Trash2,
  BookOpen,
  Briefcase,
  Layers,
  LineChart,
  User,
  ExternalLink,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  MailWarning,
  BadgeCheck,
  FolderPlus,
  RefreshCcw,
  Upload,
  BookOpenCheck,
  Sparkles,
  HelpCircle as QuestionIcon,
  PlusCircle,
  RotateCcw,
  Globe,
  MapPin,
  DollarSign,
  GraduationCap,
  GitBranch,
  Activity,
  FileText,
  Clock,
  ArrowLeft,
  Play
} from 'lucide-react'

// Mock Data
const INITIAL_STUDENTS_ROSTER = [
  { id: 1, name: 'Aarav Mehta', prn: 'PRN2026CS0042', email: 'aarav.mehta@university.edu', dept: 'CSE', program: 'B.Tech', division: 'A', gradYear: '2026', cgpa: 9.2, readiness: '94%', assessmentsCount: 4, interviewScore: 88, status: 'Placed' },
  { id: 2, name: 'Ananya Iyer', prn: 'PRN2026CS0118', email: 'ananya.iyer@university.edu', dept: 'CSE', program: 'B.Tech', division: 'B', gradYear: '2026', cgpa: 8.8, readiness: '82%', assessmentsCount: 5, interviewScore: 78, status: 'Eligible' },
  { id: 3, name: 'Kabir Sharma', prn: 'PRN2026EC0029', email: 'kabir.sharma@university.edu', dept: 'ECE', program: 'B.Tech', division: 'A', gradYear: '2026', cgpa: 7.9, readiness: '68%', assessmentsCount: 3, interviewScore: 65, status: 'Pending' },
  { id: 4, name: 'Diya Patel', prn: 'PRN2026EE0081', email: 'diya.patel@university.edu', dept: 'EE', program: 'B.Tech', division: 'C', gradYear: '2026', cgpa: 8.5, readiness: '87%', assessmentsCount: 4, interviewScore: 80, status: 'Placed' },
  { id: 5, name: 'Rohan Verma', prn: 'PRN2026CS0210', email: 'rohan.verma@university.edu', dept: 'CSE', program: 'B.Tech', division: 'B', gradYear: '2026', cgpa: 8.1, readiness: '80%', assessmentsCount: 2, interviewScore: 70, status: 'Blocked' },
  { id: 6, name: 'Meera Nair', prn: 'PRN2026CS0095', email: 'meera.nair@university.edu', dept: 'CSE', program: 'M.Tech', division: 'A', gradYear: '2026', cgpa: 9.6, readiness: '97%', assessmentsCount: 6, interviewScore: 92, status: 'Placed' },
  { id: 7, name: 'Dev Bajwa', prn: 'PRN2026ME0053', email: 'dev.bajwa@university.edu', dept: 'ME', program: 'B.Tech', division: 'A', gradYear: '2026', cgpa: 7.2, readiness: '55%', assessmentsCount: 2, interviewScore: 50, status: 'Eligible' }
]

const INITIAL_ATTEMPTS_LOG = [
  { id: 1, name: 'Aarav Mehta', regNo: '2026CSE0042', email: 'aarav.mehta@university.edu', assessment: 'Data Structures & Algorithms Midterm', attempt: 1, score: 92, warnings: 0, status: 'Completed', submittedAt: '2026-07-23 14:32', dept: 'CSE' },
  { id: 2, name: 'Ananya Iyer', regNo: '2026CSE0118', email: 'ananya.iyer@university.edu', assessment: 'System Design Mock Test', attempt: 2, score: 78, warnings: 2, status: 'Completed', submittedAt: '2026-07-23 15:10', dept: 'CSE' },
  { id: 3, name: 'Kabir Sharma', regNo: '2026ECE0029', email: 'kabir.sharma@university.edu', assessment: 'Data Structures & Algorithms Midterm', attempt: 1, score: 0, warnings: 5, status: 'Terminated', submittedAt: '2026-07-23 11:15', dept: 'ECE', reason: 'Browser switching violation threshold exceeded' }
]

const INITIAL_QUESTIONS = [
  { id: 1, title: 'Implement Least Recently Used (LRU) Cache', statement: 'Design and implement a data structure for Least Recently Used (LRU) cache. It should support get and put operations in O(1) time complexity.', expectedAnswer: 'Use a doubly linked list combined with a hashmap.', hints: 'Keep track of node pointers in hashmap values. Move accessed nodes to the head.', tags: 'LRU, Cache, Linked List, Design', category: 'Data Structures', difficulty: 'Hard', type: 'Coding', timeLimit: 30, marks: 10, createdBy: 'Prof. Sharma' },
  { id: 2, title: 'Explain ACID Properties in DBMS', statement: 'Define and explain ACID properties in detail. Provide realistic examples of transaction violations.', expectedAnswer: 'Atomicity, Consistency, Isolation, Durability.', hints: 'Atomicity is all-or-nothing. Isolation requires locks.', tags: 'Database, ACID, Transactions', category: 'DBMS', difficulty: 'Easy', type: 'Long Answer', timeLimit: 15, marks: 5, createdBy: 'Dr. Mehta' },
  { id: 3, title: 'Design Rate Limiter for SaaS API Gateway', statement: 'Outline the design of a scalable rate limiter that restricts API requests per client identifier. Support distributed environments.', expectedAnswer: 'Token bucket or sliding window log in Redis.', hints: 'Use Redis for atomic increments. Sliding window provides accuracy.', tags: 'System Design, Redis, Rate Limiter', category: 'System Design', difficulty: 'Medium', type: 'Scenario Based', timeLimit: 45, marks: 15, createdBy: 'Admin' },
  { id: 4, title: 'Find Longest Palindromic Substring', statement: 'Given a string s, return the longest palindromic substring in s.', expectedAnswer: 'Expand around center or use Manachers algorithm.', hints: 'Iterate s treating each character index as center.', tags: 'Algorithms, String, Palindrome', category: 'Algorithms', difficulty: 'Medium', type: 'Coding', timeLimit: 20, marks: 8, createdBy: 'Prof. Sharma' }
]

const INITIAL_INTERVIEW_ASSIGNMENTS = [
  { id: 1, title: 'Google Software Engineering Round', company: 'Google', dept: 'CSE', program: 'B.Tech', assignedStudents: 45, startDate: '2026-07-25', endDate: '2026-07-28', duration: '60 Min', status: 'Upcoming', scoreVisibility: 'Visible', createdBy: 'Dr. Mehta' },
  { id: 2, title: 'Meta Front-End Engineering Quiz', company: 'Meta', dept: 'CSE', program: 'B.Tech', assignedStudents: 32, startDate: '2026-07-20', endDate: '2026-07-24', duration: '45 Min', status: 'Ongoing', scoreVisibility: 'Release After Deadline', createdBy: 'Prof. Sharma' },
  { id: 3, title: 'Stripe Technical Assessment Mock', company: 'Stripe', dept: 'ECE', program: 'B.Tech', assignedStudents: 15, startDate: '2026-07-10', endDate: '2026-07-12', duration: '90 Min', status: 'Completed', scoreVisibility: 'Manual Release', createdBy: 'Admin' },
  { id: 4, title: 'Amazon System Design Practice', company: 'Amazon', dept: 'CSE', program: 'M.Tech', assignedStudents: 20, startDate: '2026-06-01', endDate: '2026-06-05', duration: '95 Min', status: 'Expired', scoreVisibility: 'Hidden', createdBy: 'Dr. Mehta' }
]

const INITIAL_COMPANIES = [
  { id: 1, name: 'Google', industry: 'Technology', website: 'google.com', size: '100,000+', hq: 'Mountain View, CA', contact: 'Sundar Pichai', email: 'recruiting@google.com', phone: '+1-650-253-0000', hiringStatus: 'Active', partnershipStatus: 'Partnered', packageRange: '18 - 32 LPA', frequency: 'Annual', openRolesCount: 4, assignedStudentsCount: 45, avgScore: 88, placementRate: 15, upcomingInterviews: 2 },
  { id: 2, name: 'Meta', industry: 'Social Media', website: 'meta.com', size: '60,000+', hq: 'Menlo Park, CA', contact: 'Mark Zuckerberg', email: 'recruiting@meta.com', phone: '+1-650-543-4800', hiringStatus: 'Active', partnershipStatus: 'Partnered', packageRange: '20 - 35 LPA', frequency: 'Annual', openRolesCount: 2, assignedStudentsCount: 32, avgScore: 82, placementRate: 12, upcomingInterviews: 1 },
  { id: 3, name: 'Stripe', industry: 'Fintech', website: 'stripe.com', size: '8,000+', hq: 'San Francisco, CA', contact: 'John Collison', email: 'recruiting@stripe.com', phone: '+1-415-000-0000', hiringStatus: 'Paused', partnershipStatus: 'Pending', packageRange: '15 - 25 LPA', frequency: 'Bi-Annual', openRolesCount: 1, assignedStudentsCount: 15, avgScore: 85, placementRate: 8, upcomingInterviews: 0 }
]

const INITIAL_ROLES = [
  { id: 1, name: 'Software Engineer', dept: 'CSE', experience: 'Entry Level', location: 'Bengaluru, India', salary: '18 - 25 LPA', skills: 'DSA, Java, System Design', capacity: 10, duration: '60 Min' },
  { id: 2, name: 'Front-End Engineer', dept: 'CSE', experience: 'Entry Level', location: 'Remote', salary: '15 - 20 LPA', skills: 'React, JavaScript, CSS', capacity: 5, duration: '45 Min' },
  { id: 3, name: 'Hardware Engineer', dept: 'ECE', experience: 'Entry Level', location: 'Pune, India', salary: '12 - 16 LPA', skills: 'Verilog, VLSI, Embedded Systems', capacity: 3, duration: '60 Min' }
]

const INITIAL_PROGRAMS = [
  { id: 1, name: 'B.Tech', degree: 'Bachelor of Technology', duration: '4 Years', department: 'CSE', year: '2026' },
  { id: 2, name: 'M.Tech', degree: 'Master of Technology', duration: '2 Years', department: 'CSE', year: '2026' }
]

const INITIAL_LOGS = [
  { id: 1, type: 'info', msg: 'User admin@placify.com logged in successfully.', time: '2026-07-24 02:29:10' },
  { id: 2, type: 'warn', msg: 'Ad-blocker detected sending sentry requests.', time: '2026-07-24 02:29:15' },
  { id: 3, type: 'success', msg: 'Rebuilt production bundle assets successfully.', time: '2026-07-24 02:29:22' }
]

const DEPARTMENTS = ['All', 'CSE', 'ECE', 'EE', 'ME']
const DIVISIONS = ['All', 'A', 'B', 'C']
const PROGRAMS = ['All', 'B.Tech', 'M.Tech']
const GRAD_YEARS = ['All', '2025', '2026']
const STATUS_OPTIONS = ['All', 'Placed', 'Eligible', 'Pending', 'Blocked']
const COMPANIES_LIST = ['All', 'Google', 'Meta', 'Stripe', 'Amazon']
const ASSIGNMENT_STATUS_OPTIONS = ['All', 'Upcoming', 'Ongoing', 'Completed', 'Expired']
const SCORE_VISIBILITY_OPTIONS = ['Visible', 'Hidden', 'Release After Deadline', 'Manual Release']

const CATEGORIES_LIST = [
  'Algorithms', 'Data Structures', 'Operating Systems', 'DBMS', 'Networking', 
  'Object Oriented Programming', 'System Design', 'Java', 'Python', 'JavaScript', 
  'React', 'Node.js', 'SQL', 'Machine Learning', 'Artificial Intelligence', 
  'Cloud Computing', 'Cybersecurity', 'Behavioral', 'HR', 'Analytical', 'Aptitude'
]

const QUESTION_TYPES = [
  'Multiple Choice', 'True / False', 'Short Answer', 'Long Answer', 
  'Coding', 'Fill in the Blank', 'Scenario Based', 'Behavioral', 'Case Study'
]

const sidebarSections = [
  {
    section: 'Main',
    items: [
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
    ]
  },
  {
    section: 'Management',
    items: [
      { name: 'Programs', icon: FolderKanban },
      { name: 'Departments', icon: Network },
      { name: 'Categories', icon: Tag },
      { name: 'Permissions', icon: ShieldAlert },
      { name: 'Roles', icon: UserCheck },
      { name: 'Invitations', icon: Mail }
    ]
  },
  {
    section: 'System',
    items: [
      { name: 'Settings', icon: Settings },
      { name: 'Support', icon: HelpCircle },
      { name: 'Logs', icon: History },
      { name: 'Secure Extension', icon: Shield }
    ]
  }
]

export default function AdminPortal() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState('Dashboard')
  const [darkMode, setDarkMode] = useState(false)

  // Sub-tabs switcher states
  const [assessmentTab, setAssessmentTab] = useState('Student Attempts')
  const [dashboardTab, setDashboardTab] = useState('Assessment Stats')
  const [interviewAssignmentTab, setInterviewAssignmentTab] = useState('Assignments')
  const [companyTab, setCompanyTab] = useState('Companies')
  const [hierarchyTab, setHierarchyTab] = useState('Programs')
  const [programWorkspaceTab, setProgramWorkspaceTab] = useState('Students')

  // Selected Student Detail Workspace parameters
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null)
  const [studentDetailTab, setStudentDetailTab] = useState('Profile')

  // Global search terms
  const [searchTerm, setSearchTerm] = useState('')

  // Filter dropdown states
  const [filterCompany, setFilterCompany] = useState('All')
  const [filterDept, setFilterDept] = useState('All')
  const [filterAssessment, setFilterAssessment] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [filterDivision, setFilterDivision] = useState('All')
  const [filterProgram, setFilterProgram] = useState('All')
  const [filterGradYear, setFilterGradYear] = useState('All')

  // Dynamic Lists State
  const [studentsList, setStudentsList] = useState(INITIAL_STUDENTS_ROSTER)
  const [attemptsList, setAttemptsList] = useState(INITIAL_ATTEMPTS_LOG)
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS)
  const [assignments, setAssignments] = useState(INITIAL_INTERVIEW_ASSIGNMENTS)
  const [companies, setCompanies] = useState(INITIAL_COMPANIES)
  const [roles, setRoles] = useState(INITIAL_ROLES)
  const [programsList, setProgramsList] = useState(INITIAL_PROGRAMS)
  const [systemLogs, setSystemLogs] = useState(INITIAL_LOGS)
  const [supportTickets, setSupportTickets] = useState([])
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES_LIST)
  
  // Custom dialogs state
  const [ticketDescription, setTicketDescription] = useState('')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignStudentTarget, setAssignStudentTarget] = useState(null)
  const [assignAssessmentName, setAssignAssessmentName] = useState('Data Structures & Algorithms Midterm')

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleStudentTarget, setScheduleStudentTarget] = useState(null)
  const [scheduleCompanyName, setScheduleCompanyName] = useState('Google')
  const [scheduleInterviewTitle, setScheduleInterviewTitle] = useState('SE Technical Mock Interview')

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('INV-2026-PLACIFY')

  // Settings Toggles
  const [require2FA, setRequire2FA] = useState(true)
  const [autoProctoring, setAutoProctoring] = useState(true)

  // Student editor form modal state
  const [studentEditOpen, setStudentEditOpen] = useState(false)
  const [editingStudentData, setEditingStudentData] = useState(null)

  // Selection states
  const [selectedStudents, setSelectedStudents] = useState([])
  const [activeActionRowId, setActiveActionRowId] = useState(null)
  
  // Modals / slideouts
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState(null)
  const [activeAssignmentActionId, setActiveAssignmentActionId] = useState(null)

  // Question parameters
  const [difficultyFilter, setDifficultyFilter] = useState('Easy')
  const [toolbarCategory, setToolbarCategory] = useState('All')
  const [toolbarType, setToolbarType] = useState('All')
  
  // Question editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

  // Company parameters
  const [selectedCompanyId, setSelectedCompanyId] = useState(1)
  const [newCompanyFormOpen, setNewCompanyFormOpen] = useState(false)
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: 'Technology',
    website: '',
    size: '1000+',
    hq: '',
    contact: '',
    email: '',
    phone: '',
    packageRange: '10 - 20 LPA',
    frequency: 'Annual'
  })

  // Role creator
  const [newRoleFormOpen, setNewRoleFormOpen] = useState(false)
  const [newRole, setNewRole] = useState({
    name: '',
    dept: 'CSE',
    experience: 'Entry Level',
    location: '',
    salary: '10 - 15 LPA',
    skills: '',
    capacity: 5,
    duration: '60 Min'
  })

  // Stepper wizard state
  const [stepperStep, setStepperStep] = useState(1)
  const [stepperForm, setStepperForm] = useState({
    company: 'Google',
    role: 'Software Engineer',
    questionBank: 'Algorithms Set A',
    duration: '60 Min',
    passingScore: 70,
    attempts: 1,
    antiCheating: true,
    fullscreenRequired: true,
    scoreVisibility: 'Visible'
  })

  // Create Assignment Form State
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    company: 'Google',
    role: 'Software Engineer',
    experienceLevel: 'Entry Level',
    duration: '60 Min',
    questionSet: 'Algorithms Set A',
    division: 'All',
    department: 'CSE',
    program: 'B.Tech',
    batch: '2026',
    year: '2026',
    startDate: '',
    endDate: '',
    timeZone: 'UTC+5:30',
    attemptLimit: 1,
    autoSubmit: true,
    enableCamera: true,
    enableMicrophone: true,
    liveTranscript: true,
    antiCheating: true,
    fullscreenRequired: true,
    faceDetection: true,
    tabSwitchingDetection: true,
    scoreVisibility: 'Visible'
  })

  // Create Assessment form state
  const [newAssessment, setNewAssessment] = useState({
    title: ''
  })

  // Create Program Form State
  const [newProgram, setNewProgram] = useState({
    name: '',
    degree: 'Bachelor of Technology',
    duration: '4 Years',
    department: 'CSE',
    year: '2026'
  })

  // Role Suitability Checker States
  const [suitabilityRole, setSuitabilityRole] = useState('Software Engineer')
  const [suitabilityReport, setSuitabilityReport] = useState(null)

  // Toast notifier
  const [toastMessage, setToastMessage] = useState(null)
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Calculated Metrics
  const stats = useMemo(() => {
    const totalStudents = studentsList.length
    const eligibleCount = studentsList.filter(s => s.status === 'Eligible' || s.status === 'Placed').length
    const placedCount = studentsList.filter(s => s.status === 'Placed').length
    const averageScore = totalStudents > 0 ? Math.round(
      studentsList.reduce((acc, curr) => acc + (curr.interviewScore || 0), 0) / totalStudents
    ) : 0
    const activeAssessments = 3
    const completedAttempts = attemptsList.filter(a => a.status === 'Completed').length
    const interviewsConducted = 8

    return { totalStudents, eligibleCount, placedCount, averageScore, activeAssessments, completedAttempts, interviewsConducted }
  }, [studentsList, attemptsList])

  // Filter systems
  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.prn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchDept = filterDept === 'All' || s.dept === filterDept
      const matchDiv = filterDivision === 'All' || s.division === filterDivision
      const matchProg = filterProgram === 'All' || s.program === filterProgram
      const matchYear = filterGradYear === 'All' || s.gradYear === filterGradYear
      const matchStatus = selectedStatus === 'All' || s.status === selectedStatus
      return matchSearch && matchDept && matchDiv && matchProg && matchYear && matchStatus
    })
  }, [studentsList, searchTerm, filterDept, filterDivision, filterProgram, filterGradYear, selectedStatus])

  const filteredAttempts = useMemo(() => {
    return attemptsList.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.assessment.toLowerCase().includes(searchTerm.toLowerCase())
      const matchAssessment = filterAssessment === 'All' || a.assessment.includes(filterAssessment)
      const matchDept = filterDept === 'All' || a.dept === filterDept
      const matchStatus = selectedStatus === 'All' || a.status === selectedStatus
      return matchSearch && matchAssessment && matchDept && matchStatus
    })
  }, [attemptsList, searchTerm, filterAssessment, filterDept, selectedStatus])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchDifficulty = q.difficulty === difficultyFilter
      const matchSearch = searchTerm ? (
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        q.statement.toLowerCase().includes(searchTerm.toLowerCase())
      ) : true
      const matchCategory = toolbarCategory === 'All' || q.category === toolbarCategory
      const matchType = toolbarType === 'All' || q.type === toolbarType
      return matchDifficulty && matchSearch && matchCategory && matchType
    })
  }, [questions, difficultyFilter, searchTerm, toolbarCategory, toolbarType])

  const difficultyCounts = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 }
    questions.forEach(q => {
      if (counts[q.difficulty] !== undefined) counts[q.difficulty]++
    })
    return counts
  }, [questions])

  const selectedQuestionObj = useMemo(() => {
    return questions.find(q => q.id === selectedQuestionId) || null
  }, [questions, selectedQuestionId])

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.company.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCompany = filterCompany === 'All' || a.company === filterCompany
      const matchDept = filterDept === 'All' || a.dept === filterDept
      const matchProg = filterProgram === 'All' || a.program === filterProgram
      const matchStatus = selectedStatus === 'All' || a.status === selectedStatus
      return matchSearch && matchCompany && matchDept && matchProg && matchStatus
    })
  }, [assignments, searchTerm, filterCompany, filterDept, filterProgram, selectedStatus])

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             c.industry.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [companies, searchTerm])

  const selectedCompanyObj = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId) || companies[0] || null
  }, [companies, selectedCompanyId])

  // Select handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(filteredStudents.map(s => s.id))
    } else {
      setSelectedStudents([])
    }
  }

  const handleSelectRow = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id))
    } else {
      setSelectedStudents([...selectedStudents, id])
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setFilterDept('All')
    setFilterDivision('All')
    setFilterProgram('All')
    setFilterGradYear('All')
    setSelectedStatus('All')
    setFilterCompany('All')
    showToast('Filters cleared')
  }

  // Student record editor save
  const handleSaveEditedStudent = (e) => {
    e.preventDefault()
    setStudentsList(studentsList.map(s => s.id === editingStudentData.id ? editingStudentData : s))
    if (selectedStudentForDetail && selectedStudentForDetail.id === editingStudentData.id) {
      setSelectedStudentForDetail(editingStudentData)
    }
    setStudentEditOpen(false)
    showToast(`Successfully modified student profile: ${editingStudentData.name}`)
  }

  const handleSaveQuestion = (e) => {
    e.preventDefault()
    if (editingQuestion.id) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? editingQuestion : q))
      showToast('Question updated')
    } else {
      const newId = questions.length ? Math.max(...questions.map(q => q.id)) + 1 : 1
      const created = { ...editingQuestion, id: newId, createdBy: 'Admin' }
      setQuestions([...questions, created])
      setSelectedQuestionId(newId)
      showToast('New question added')
    }
    setEditorOpen(false)
  }

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id))
    if (selectedQuestionId === id) setSelectedQuestionId(null)
    showToast('Question deleted')
  }

  const handleSaveAssignment = (e) => {
    e.preventDefault()
    const newId = assignments.length ? Math.max(...assignments.map(a => a.id)) + 1 : 1
    const created = {
      id: newId,
      title: newAssignment.title,
      company: newAssignment.company,
      dept: newAssignment.department,
      program: newAssignment.program,
      assignedStudents: 25,
      startDate: newAssignment.startDate || '2026-07-24',
      endDate: newAssignment.endDate || '2026-07-28',
      duration: newAssignment.duration,
      status: 'Upcoming',
      scoreVisibility: newAssignment.scoreVisibility,
      createdBy: 'Admin'
    }
    setAssignments([...assignments, created])
    setInterviewAssignmentTab('Assignments')
    showToast(`Created Interview Assignment: ${newAssignment.title}`)
  }

  const handleDeleteAssignment = (id) => {
    setAssignments(assignments.filter(a => a.id !== id))
    showToast('Assignment deleted')
  }

  const handleCreateCompanySubmit = (e) => {
    e.preventDefault()
    const newId = companies.length ? Math.max(...companies.map(c => c.id)) + 1 : 1
    const created = {
      ...newCompany,
      id: newId,
      hiringStatus: 'Active',
      partnershipStatus: 'Partnered',
      openRolesCount: 1,
      assignedStudentsCount: 0,
      avgScore: 0,
      placementRate: 0,
      upcomingInterviews: 0
    }
    setCompanies([...companies, created])
    setSelectedCompanyId(newId)
    setNewCompanyFormOpen(false)
    showToast(`Added recruitment partner: ${newCompany.name}`)
  }

  const handleCreateRoleSubmit = (e) => {
    e.preventDefault()
    const newId = roles.length ? Math.max(...roles.map(r => r.id)) + 1 : 1
    const created = {
      ...newRole,
      id: newId
    }
    setRoles([...roles, created])
    setNewRoleFormOpen(false)
    showToast(`Created hiring role: ${newRole.name}`)
  }

  const handleCreateAssessment = (e) => {
    e.preventDefault()
    showToast(`Published Assessment: ${newAssessment.title}`)
    setNewAssessment({ title: '' })
    setAssessmentTab('Student Attempts')
  }

  const handleCreateProgramSubmit = (e) => {
    e.preventDefault()
    const newId = programsList.length ? Math.max(...programsList.map(p => p.id)) + 1 : 1
    const created = {
      ...newProgram,
      id: newId
    }
    setProgramsList([...programsList, created])
    setHierarchyTab('Programs')
    showToast(`Published Academic Program: ${newProgram.name}`)
  }

  // Simulated CSV Export
  const handleExportRosterCSV = () => {
    showToast('Preparing roster CSV sheet download...')
    const headers = 'Name,PRN,Email,Department,Program,CGPA,Status\n'
    const rows = studentsList.map(s => `"${s.name}","${s.prn}","${s.email}","${s.dept}","${s.program}",${s.cgpa},"${s.status}"`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Placify_Students_Roster_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Simulated PDF Academic Reports download
  const handleDownloadAcademicReport = () => {
    showToast('Generating Placify Cohort Academic Summary PDF...')
    const content = `Placify Admin Portal - Academic Performance Report\nDate: ${new Date().toLocaleDateString()}\n\nTotal Students Enrolled: ${stats.totalStudents}\nPlaced Students: ${stats.placedCount}\nOverall Passing Average Score: ${stats.averageScore}%\n`
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Placify_Cohort_Academic_Report.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Simulated Resume PDF file download
  const handleDownloadStudentResume = (student) => {
    showToast(`Generating resume PDF for ${student.name}...`)
    const content = `RESUME: ${student.name.toUpperCase()}\nPRN: ${student.prn}\nEmail: ${student.email}\nDepartment: ${student.dept} - B.Tech 2026\nCGPA: ${student.cgpa}\nStatus: ${student.status}\n`
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${student.name.replace(/\s+/g, '_')}_Resume.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Simulated CSV activity logs download
  const handleExportSystemLogs = () => {
    showToast('Downloading system logs CSV file...')
    const headers = 'Timestamp,Log Type,Message\n'
    const rows = systemLogs.map(l => `"${l.time}","${l.type}","${l.msg}"`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Placify_System_Logs_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Simulated drag and drop CSV file import
  const handleCsvImportSimulate = () => {
    showToast('Importing mock student data...')
    setTimeout(() => {
      const parsedMockStudents = [
        { id: studentsList.length + 1, name: 'Siddharth Sen', prn: 'PRN2026CS0991', email: 'siddharth.sen@university.edu', dept: 'CSE', program: 'B.Tech', division: 'C', gradYear: '2026', cgpa: 8.9, readiness: '85%', assessmentsCount: 3, interviewScore: 82, status: 'Eligible' },
        { id: studentsList.length + 2, name: 'Tanya Goel', prn: 'PRN2026CS1102', email: 'tanya.goel@university.edu', dept: 'CSE', program: 'B.Tech', division: 'A', gradYear: '2026', cgpa: 9.1, readiness: '90%', assessmentsCount: 4, interviewScore: 89, status: 'Placed' }
      ]
      setStudentsList([...studentsList, ...parsedMockStudents])
      showToast('Successfully parsed 2 students from CSV!')
    }, 1000)
  }

  // Configuration stepper builder action completion
  const handleStepperWizardNext = () => {
    if (stepperStep < 4) {
      setStepperStep(stepperStep + 1)
    } else {
      const newId = assignments.length ? Math.max(...assignments.map(a => a.id)) + 1 : 1
      const created = {
        id: newId,
        title: `${stepperForm.company} ${stepperForm.role} Assessment Drive`,
        company: stepperForm.company,
        dept: 'CSE',
        program: 'B.Tech',
        assignedStudents: 30,
        startDate: '2026-07-26',
        endDate: '2026-07-30',
        duration: stepperForm.duration,
        status: 'Ongoing',
        scoreVisibility: stepperForm.scoreVisibility,
        createdBy: 'Admin (Stepper Wizard)'
      }
      setAssignments([...assignments, created])
      setStepperStep(1)
      setActiveView('Assignments')
      setInterviewAssignmentTab('Assignments')
      showToast(`Created Interview assignment via configuration stepper wizard: ${created.title}`)
    }
  }

  // Auto generate random mock questions to Question Bank state list
  const handleGenerateQuestionsAuto = () => {
    showToast('AI generating 5 technical coding questions...')
    setTimeout(() => {
      const newGenerated = [
        { id: questions.length + 1, title: 'Implement Heap Sort Algorithm', statement: 'Implement a function to perform Heap Sort sorting algorithm on an unsorted array of size N in O(N log N) time.', expectedAnswer: 'Build max-heap and swap elements repeatedly.', hints: 'Build heap from bottom up first.', tags: 'Algorithms, Sorting, Heap', category: 'Algorithms', difficulty: 'Medium', type: 'Coding', timeLimit: 30, marks: 10, createdBy: 'AI Generator' },
        { id: questions.length + 2, title: 'Implement Binary Search Tree Traversal', statement: 'Implement iterative pre-order, in-order, and post-order traversals on a BST.', expectedAnswer: 'Use stack data structure iteratively.', hints: 'Use stack to simulate call stack frames.', tags: 'Data Structures, BST, Tree', category: 'Data Structures', difficulty: 'Medium', type: 'Coding', timeLimit: 25, marks: 8, createdBy: 'AI Generator' },
        { id: questions.length + 3, title: 'Describe HTTP 2.0 vs HTTP 1.1', statement: 'Describe main improvements introduced in HTTP/2 compared to HTTP/1.1.', expectedAnswer: 'Multiplexing, header compression, server push.', hints: 'TCP head-of-line blocking mitigation.', tags: 'Networking, Protocols, Web', category: 'Networking', difficulty: 'Easy', type: 'Short Answer', timeLimit: 15, marks: 5, createdBy: 'AI Generator' },
        { id: questions.length + 4, title: 'Design URL Shortener Service Architecture', statement: 'Draw system design details for a highly scalable URL shortening service like Bitly.', expectedAnswer: 'Base62 hash encoding and Redis caching layer.', hints: 'Estimate QPS and database write storage limits first.', tags: 'System Design, Architecture, Scale', category: 'System Design', difficulty: 'Hard', type: 'Scenario Based', timeLimit: 45, marks: 15, createdBy: 'AI Generator' },
        { id: questions.length + 5, title: 'Reverse a Linked List in Groups of K', statement: 'Given a linked list, reverse nodes of a linked list k at a time and return its modified list.', expectedAnswer: 'Reverse iteratively in chunks.', hints: 'Use pointer book-keeping for sub-list joints.', tags: 'Data Structures, Linked List, Recursion', category: 'Data Structures', difficulty: 'Hard', type: 'Coding', timeLimit: 35, marks: 12, createdBy: 'AI Generator' }
      ]
      setQuestions([...questions, ...newGenerated])
      showToast('Successfully generated and saved 5 questions to Bank!')
    }, 1200)
  }

  // Submit dynamic ticket support
  const handleTicketSubmittal = (e) => {
    e.preventDefault()
    if (!ticketDescription.trim()) return
    const ticketId = supportTickets.length + 1
    const newTicket = {
      id: ticketId,
      description: ticketDescription,
      status: 'Open',
      created: new Date().toISOString().replace('T', ' ').substring(0, 19)
    }
    setSupportTickets([newTicket, ...supportTickets])
    setTicketDescription('')
    showToast(`Support Ticket #${ticketId} submitted successfully!`)
  }

  // Handle assigning an assessment to selected student
  const handleAssignAssessmentSubmit = (e) => {
    e.preventDefault()
    showToast(`Assigned assessment "${assignAssessmentName}" to ${assignStudentTarget.name}!`)
    setAssignModalOpen(false)
  }

  // Handle scheduling interview to selected student
  const handleScheduleInterviewSubmit = (e) => {
    e.preventDefault()
    const newId = assignments.length ? Math.max(...assignments.map(a => a.id)) + 1 : 1
    const newSch = {
      id: newId,
      title: `${scheduleCompanyName} - ${scheduleInterviewTitle} for ${scheduleStudentTarget.name}`,
      company: scheduleCompanyName,
      dept: scheduleStudentTarget.dept,
      program: scheduleStudentTarget.program,
      assignedStudents: 1,
      startDate: '2026-07-25',
      endDate: '2026-07-25',
      duration: '45 Min',
      status: 'Upcoming',
      scoreVisibility: 'Visible',
      createdBy: 'Admin (Scheduler)'
    }
    setAssignments([newSch, ...assignments])
    showToast(`Interview scheduled for ${scheduleStudentTarget.name}!`)
    setScheduleModalOpen(false)
  }

  // Add custom new category dynamically
  const handleCreateCategorySubmit = (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    setDynamicCategories([...dynamicCategories, newCategoryName])
    setNewCategoryName('')
    setCategoryModalOpen(false)
    showToast(`Category "${newCategoryName}" added successfully!`)
  }

  return (
    <div className={`min-h-screen font-sans flex transition-colors duration-300 ${darkMode ? 'bg-[#0E0E0E] text-[#E0E0E0]' : 'bg-[#FAF7F0] text-[#111111]'}`}
         style={{
           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
           backgroundAttachment: 'fixed'
         }}>
      
      {/* Toast alert system */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C] text-[#E0E0E0]' : 'bg-white border-[#EBEBEB] text-[#111111]'}`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? '72px' : '270px' }}
        className={`shrink-0 sticky top-0 h-screen border-r flex flex-col justify-between overflow-y-auto select-none transition-all ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'}`}
      >
        <div>
          <div className="h-[72px] flex items-center justify-between px-5 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${darkMode ? 'bg-[#E0E0E0] text-black' : 'bg-black text-white'}`}>P</div>
              {!sidebarCollapsed && <span className="font-heading font-extrabold text-lg tracking-tight">Placify.</span>}
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

          <div className="py-4 space-y-6">
            {sidebarSections.map((sec) => (
              <div key={sec.section} className="px-4">
                {!sidebarCollapsed && (
                  <h3 className={`text-[10px] font-bold tracking-wider uppercase mb-2 ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {sec.section}
                  </h3>
                )}
                <ul className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon
                    const isSelected = activeView === item.name || (item.name === 'Interview Management' && activeView === 'Assignments')
                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => {
                            if (item.name === 'Interview Management') {
                              setActiveView('Assignments')
                            } else {
                              setActiveView(item.name)
                            }
                            setSelectedStudentForDetail(null)
                            showToast(`Loaded ${item.name}`)
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-xs font-semibold ${
                            isSelected 
                              ? darkMode 
                                ? 'bg-white/10 text-white' 
                                : 'bg-black text-white' 
                              : darkMode
                                ? 'text-neutral-400 hover:bg-white/5 hover:text-white'
                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                          }`}
                        >
                          <Icon className="w-4.5 h-4.5 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-black/5">
          {!sidebarCollapsed && (
            <div className="p-3 rounded-xl border border-black/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center font-bold text-xs">A</div>
              <div>
                <p className="text-xs font-bold truncate">Admin User</p>
                <p className="text-[10px] text-neutral-500 truncate">admin@placify.com</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Topbar */}
        <header className={`h-[72px] sticky top-0 z-40 border-b flex items-center justify-between px-8 ${darkMode ? 'bg-[#0E0E0E]/80 border-[#202020]' : 'bg-[#FAF7F0]/80 border-[#EBEBEB]'} backdrop-blur-md`}>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <span>Admin</span>
            <span>/</span>
            <span className={darkMode ? 'text-white' : 'text-black'}>
              {activeView}
            </span>
          </div>

          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className={`w-full text-xs pl-9 pr-4 py-2 rounded-xl border focus:outline-none ${
                darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C]' : 'bg-white border-[#E0E0E0]'
              }`}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border hover:bg-black/5 transition-all ${darkMode ? 'border-[#2C2C2C]' : 'border-[#EAEAEA]'}`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="max-w-[1700px] w-full mx-auto p-8 flex-1 flex flex-col gap-8">
          <AnimatePresence mode="wait">
            
            {activeView === 'Dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                {/* Hero Header */}
                <div className="border-b border-[#EBEBEB]/10 pb-6">
                  <h1 className="font-heading font-extrabold text-3xl tracking-tight">Dashboard</h1>
                  <p className="text-sm text-neutral-500 mt-1">Monitor placements, interviews, assessments and student progress in one place.</p>
                </div>

                {/* Overview Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Total Students', value: stats.totalStudents, icon: Users, desc: 'Registered students count' },
                    { title: 'Active Assessments', value: stats.activeAssessments, icon: ClipboardList, desc: 'Ongoing tests' },
                    { title: 'Interviews Conducted', value: stats.interviewsConducted, icon: Briefcase, desc: 'Evaluations finished' },
                    { title: 'Average Placement Score', value: `${stats.averageScore}%`, icon: BarChart3, desc: 'Overall passing score average' }
                  ].map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div
                        key={stat.title}
                        className={`transition-all hover:-translate-y-[3px] duration-300 ${
                          darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[rgba(0,0,0,0.06)]'
                        }`}
                        style={{ borderRadius: '18px', padding: '28px', borderWidth: '1px' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">{stat.title}</span>
                          <Icon className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="mt-4">
                          <span className="font-heading font-extrabold text-3xl tracking-tight">{stat.value}</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-2">{stat.desc}</p>
                      </div>
                    )
                  })}
                </section>

                {/* SVG Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase mb-4">Placement Rate Trend</h4>
                    <div className="h-40 flex items-end justify-between px-2 pt-6">
                      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <path d="M 0 90 Q 25 70, 50 45 T 100 20" fill="none" stroke={darkMode ? '#FFFFFF' : '#111111'} strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                    <h4 className="text-xs font-bold text-neutral-400 uppercase mb-4">Student Readiness Performance</h4>
                    <div className="h-40 flex items-end justify-around px-2">
                      {[80, 95, 60, 45].map((h, i) => (
                        <div key={i} className="w-8 rounded-t bg-neutral-300 dark:bg-neutral-700" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'Students' && (
              <motion.div key="students" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {selectedStudentForDetail ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedStudentForDetail(null)} className="text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <h2 className="font-heading font-extrabold text-xl">{selectedStudentForDetail.name}</h2>
                    </div>

                    <div className="flex border-b border-black/5 overflow-x-auto pb-[1px]">
                      {['Profile', 'Interviews', 'Assigned Assessments', 'Past Assessments', 'Resume', 'Assigned Questions', 'Check Role Suitability'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setStudentDetailTab(tab)}
                          className={`px-4 py-2 text-xs font-semibold shrink-0 border-b-2 -mb-[2px] transition-all ${
                            studentDetailTab === tab ? 'text-black border-black font-bold' : 'text-neutral-400 border-transparent'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="pt-4">
                      {studentDetailTab === 'Profile' && (
                        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'}`}>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm">Personal Information</h3>
                            <button
                              onClick={() => {
                                setEditingStudentData(selectedStudentForDetail)
                                setStudentEditOpen(true)
                              }}
                              className="text-xs font-semibold px-3 py-1.5 bg-black text-white rounded-lg dark:bg-white dark:text-black"
                            >
                              Edit Profile
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <p><strong>Name:</strong> {selectedStudentForDetail.name}</p>
                            <p><strong>Email:</strong> {selectedStudentForDetail.email}</p>
                            <p><strong>PRN:</strong> {selectedStudentForDetail.prn}</p>
                            <p><strong>CGPA:</strong> {selectedStudentForDetail.cgpa}</p>
                            <p><strong>Status:</strong> {selectedStudentForDetail.status}</p>
                          </div>
                        </div>
                      )}
                      {studentDetailTab === 'Interviews' && <p className="text-xs">Mock Interview Record: Google SE Round 1 (Passed - 88%)</p>}
                      {studentDetailTab === 'Assigned Assessments' && <p className="text-xs">No active assessments assigned.</p>}
                      {studentDetailTab === 'Past Assessments' && <p className="text-xs">DSA Midterm Quiz: 92/100</p>}
                      {studentDetailTab === 'Resume' && (
                        <div className="space-y-4 text-xs">
                          <p>File: {selectedStudentForDetail.name}_Resume.pdf</p>
                          <button onClick={() => handleDownloadStudentResume(selectedStudentForDetail)} className="px-3 py-1.5 bg-black text-white rounded-xl dark:bg-white dark:text-black font-semibold flex items-center gap-1.5 w-max">
                            <Download className="w-3.5 h-3.5" /> Download resume PDF
                          </button>
                        </div>
                      )}
                      {studentDetailTab === 'Assigned Questions' && <p className="text-xs">Assigned question sets count: 4</p>}
                      {studentDetailTab === 'Check Role Suitability' && (
                        <div className="space-y-4 max-w-md">
                          <button onClick={checkSuitabilityScore} className="px-4 py-2 bg-black text-white text-xs rounded-lg">Run Suitability Analyzer</button>
                          {suitabilityReport && <p className="text-xs">AI Compatibility Score: {suitabilityReport.score}%</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-black/5">
                      <h2 className="font-heading font-extrabold text-xl">Students Directory</h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={handleCsvImportSimulate} className="text-xs font-semibold px-3.5 py-2 border rounded-xl flex items-center gap-1.5">
                          <Upload className="w-4 h-4" /> Import CSV
                        </button>
                        <button onClick={handleExportRosterCSV} className="text-xs font-semibold px-3.5 py-2 border rounded-xl flex items-center gap-1.5">
                          <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={handleDownloadAcademicReport} className="text-xs font-semibold px-3.5 py-2 border rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center gap-1.5">
                          <FileText className="w-4 h-4" /> Generate Report
                        </button>
                      </div>
                    </div>

                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="p-3">Name</th>
                          <th className="p-3">PRN</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(s => (
                          <tr key={s.id} className="border-b hover:bg-neutral-50 dark:hover:bg-white/5 cursor-pointer">
                            <td className="p-3 font-bold" onClick={() => setSelectedStudentForDetail(s)}>{s.name}</td>
                            <td className="p-3 font-mono" onClick={() => setSelectedStudentForDetail(s)}>{s.prn}</td>
                            <td className="p-3" onClick={() => setSelectedStudentForDetail(s)}>{s.status}</td>
                            <td className="p-3 text-right relative">
                              <button
                                onClick={() => setActiveActionRowId(activeActionRowId === s.id ? null : s.id)}
                                className="p-1 rounded hover:bg-black/5"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              <AnimatePresence>
                                {activeActionRowId === s.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActiveActionRowId(null)} />
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className={`absolute right-4 mt-2 w-48 z-50 rounded-xl shadow-lg border text-left p-1.5 ${
                                        darkMode ? 'bg-[#1C1C1C] border-[#2C2C2C]' : 'bg-white border-[#EBEBEB]'
                                      }`}
                                    >
                                      <button onClick={() => { setSelectedStudentForDetail(s); setStudentDetailTab('Profile'); setActiveActionRowId(null); }} className="w-full text-left p-2 hover:bg-black/5 rounded">View Profile</button>
                                      <button onClick={() => { setEditingStudentData(s); setStudentEditOpen(true); setActiveActionRowId(null); }} className="w-full text-left p-2 hover:bg-black/5 rounded">Edit Student</button>
                                      <button onClick={() => { setAssignStudentTarget(s); setAssignModalOpen(true); setActiveActionRowId(null); }} className="w-full text-left p-2 hover:bg-black/5 rounded">Assign Assessment</button>
                                      <button onClick={() => { setScheduleStudentTarget(s); setScheduleModalOpen(true); setActiveActionRowId(null); }} className="w-full text-left p-2 hover:bg-black/5 rounded">Schedule Interview</button>
                                      <button onClick={() => { handleDownloadStudentResume(s); setActiveActionRowId(null); }} className="w-full text-left p-2 hover:bg-black/5 rounded">Download Resume</button>
                                      <button onClick={() => { setStudentsList(studentsList.filter(item => item.id !== s.id)); showToast(`Removed: ${s.name}`); setActiveActionRowId(null); }} className="w-full text-left p-2 text-red-500 hover:bg-red-500/5 rounded">Delete</button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* ASSESSMENTS VIEW */}
            {activeView === 'Assessments' && (
              <motion.div key="assessments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <div className="flex border-b border-transparent">
                    {['Student Attempts', 'Create Assessment'].map(tab => (
                      <button key={tab} onClick={() => setAssessmentTab(tab)} className={`px-5 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all ${
                        assessmentTab === tab ? 'text-black border-black font-bold' : 'text-neutral-400 border-transparent'
                      }`}>{tab}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setInviteModalOpen(true)} className="text-xs font-semibold px-3 py-1.5 border rounded-xl">Invite Students</button>
                    <button onClick={handleGenerateQuestionsAuto} className="text-xs font-semibold px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black rounded-xl">Generate Questions</button>
                  </div>
                </div>

                {assessmentTab === 'Student Attempts' && (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3">Student</th>
                        <th className="p-3">Assessment</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-right">View Attempt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attemptsList.map(a => (
                        <tr key={a.id} className="border-b">
                          <td className="p-3 font-bold">{a.name}</td>
                          <td className="p-3">{a.assessment}</td>
                          <td className="p-3 text-center font-bold">{a.score}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => setSelectedAttempt(a)} className="p-1 border rounded"><Eye className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {assessmentTab === 'Create Assessment' && (
                  <form onSubmit={handleCreateAssessment} className="space-y-4 max-w-md text-xs">
                    <input type="text" required value={newAssessment.title} onChange={e => setNewAssessment({title: e.target.value})} placeholder="Assessment Name" className="w-full p-2 border rounded" />
                    <button type="submit" className="p-2 bg-black text-white rounded">Publish</button>
                  </form>
                )}
              </motion.div>
            )}

            {/* INTERVIEW ASSIGNMENTS VIEW */}
            {activeView === 'Assignments' && (
              <motion.div key="assignments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex border-b border-black/5">
                  {['Assignments', 'Create'].map(tab => (
                    <button key={tab} onClick={() => setInterviewAssignmentTab(tab)} className={`px-5 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all ${
                      interviewAssignmentTab === tab ? 'text-black border-black font-bold' : 'text-neutral-400 border-transparent'
                    }`}>{tab}</button>
                  ))}
                </div>

                {interviewAssignmentTab === 'Assignments' && (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3">Title</th>
                        <th className="p-3">Company</th>
                        <th className="p-3">Date Range</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id} className="border-b">
                          <td className="p-3 font-bold">{a.title}</td>
                          <td className="p-3 font-semibold">{a.company}</td>
                          <td className="p-3 text-neutral-500 font-mono">{a.startDate} to {a.endDate}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleDeleteAssignment(a.id)} className="p-1 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {interviewAssignmentTab === 'Create' && (
                  <form onSubmit={handleSaveAssignment} className="space-y-4 max-w-md text-xs">
                    <input type="text" required value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="Assignment Name" className="w-full p-2 border rounded" />
                    <button type="submit" className="p-2 bg-black text-white rounded">Save</button>
                  </form>
                )}
              </motion.div>
            )}

            {/* QUESTION BANK VIEW */}
            {activeView === 'Question Bank' && (
              <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <h2 className="font-heading font-extrabold text-xl">Question Bank Workspace</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setCategoryModalOpen(true)} className="text-xs font-semibold px-3 py-1.5 border rounded-xl">Create Category</button>
                    <button
                      onClick={() => {
                        setEditingQuestion({ title: '', statement: '', category: 'Algorithms', difficulty: 'Easy', type: 'Coding', expectedAnswer: '' })
                        setEditorOpen(true)
                      }}
                      className="text-xs font-semibold px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl"
                    >
                      Add Question
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    {questions.map(q => (
                      <div key={q.id} className="p-4 rounded-xl border text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold block">{q.title}</span>
                          <span className="text-[10px] text-neutral-400">{q.category} • {q.difficulty}</span>
                        </div>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* COMPANY MANAGEMENT VIEW */}
            {activeView === 'Companies' && (
              <motion.div key="companies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex border-b border-black/5">
                  {['Companies', 'Roles', 'Configuration Stepper'].map(tab => (
                    <button key={tab} onClick={() => setCompanyTab(tab)} className={`px-5 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all ${
                      companyTab === tab ? 'text-black border-black font-bold' : 'text-neutral-400 border-transparent'
                    }`}>{tab}</button>
                  ))}
                </div>

                {companyTab === 'Companies' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {companies.map(c => (
                      <div key={c.id} className="p-5 rounded-2xl border text-xs space-y-2">
                        <h4 className="font-bold text-sm">{c.name}</h4>
                        <p>Industry: {c.industry}</p>
                        <p>Website: {c.website}</p>
                      </div>
                    ))}
                  </div>
                )}

                {companyTab === 'Roles' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roles.map(r => (
                      <div key={r.id} className="p-5 rounded-2xl border text-xs space-y-2">
                        <h4 className="font-bold">{r.name}</h4>
                        <p>{r.dept} • {r.salary}</p>
                      </div>
                    ))}
                  </div>
                )}

                {companyTab === 'Configuration Stepper' && (
                  <div className="max-w-xl mx-auto">
                    <div className={`p-8 rounded-2xl border space-y-6 ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-[#EBEBEB]'}`}>
                      <h3 className="font-heading font-extrabold text-lg">Interview Setup Stepper</h3>
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                        <span className={stepperStep >= 1 ? 'text-black dark:text-white font-bold' : ''}>1. Choose Company</span>
                        <span className={stepperStep >= 2 ? 'text-black dark:text-white font-bold' : ''}>2. Select Role</span>
                        <span className={stepperStep >= 3 ? 'text-black dark:text-white font-bold' : ''}>3. Add Settings</span>
                        <span className={stepperStep >= 4 ? 'text-black dark:text-white font-bold' : ''}>4. Review</span>
                      </div>

                      <div className="pt-4 text-xs space-y-4">
                        {stepperStep === 1 && (
                          <div>
                            <label className="block mb-1 font-bold">Select Recruitment Company</label>
                            <select value={stepperForm.company} onChange={e => setStepperForm({...stepperForm, company: e.target.value})} className="w-full p-2 border rounded">
                              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                        )}
                        {stepperStep === 2 && (
                          <div>
                            <label className="block mb-1 font-bold">Choose Assignment Role</label>
                            <select value={stepperForm.role} onChange={e => setStepperForm({...stepperForm, role: e.target.value})} className="w-full p-2 border rounded">
                              {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                          </div>
                        )}
                        {stepperStep === 3 && (
                          <div>
                            <label className="block mb-1 font-bold">Time Limit</label>
                            <select value={stepperForm.duration} onChange={e => setStepperForm({...stepperForm, duration: e.target.value})} className="w-full p-2 border rounded">
                              <option value="45 Min">45 Min</option>
                              <option value="60 Min">60 Min</option>
                              <option value="90 Min">90 Min</option>
                            </select>
                          </div>
                        )}
                        {stepperStep === 4 && (
                          <div className="space-y-2">
                            <p><strong>Company:</strong> {stepperForm.company}</p>
                            <p><strong>Role:</strong> {stepperForm.role}</p>
                            <p><strong>Time:</strong> {stepperForm.duration}</p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          {stepperStep > 1 && <button onClick={() => setStepperStep(stepperStep - 1)} className="px-4 py-2 border rounded text-xs">Back</button>}
                          <button onClick={handleStepperWizardNext} className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded text-xs font-bold">
                            {stepperStep === 4 ? 'Complete Setup' : 'Next Step'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* PROGRAMS MANAGEMENT VIEW */}
            {activeView === 'Programs' && (
              <motion.div key="programs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex border-b border-black/5">
                  {['Programs', 'Departments', 'Divisions', 'Create'].map(tab => (
                    <button key={tab} onClick={() => setHierarchyTab(tab)} className={`px-5 py-3 text-xs font-semibold border-b-2 -mb-[2px] transition-all ${
                      hierarchyTab === tab ? 'text-black border-black font-bold' : 'text-neutral-400 border-transparent'
                    }`}>{tab}</button>
                  ))}
                </div>

                {hierarchyTab === 'Programs' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {programsList.map(p => (
                      <div key={p.id} className="p-5 rounded-2xl border text-xs space-y-2">
                        <h4 className="font-bold">{p.name}</h4>
                        <p>{p.degree} ({p.duration})</p>
                      </div>
                    ))}
                  </div>
                )}

                {hierarchyTab === 'Create' && (
                  <form onSubmit={handleCreateProgramSubmit} className="space-y-4 max-w-md text-xs">
                    <input type="text" required value={newProgram.name} onChange={e => setNewProgram({...newProgram, name: e.target.value})} placeholder="Program Name" className="w-full p-2 border rounded" />
                    <button type="submit" className="p-2 bg-black text-white rounded">Publish Program</button>
                  </form>
                )}
              </motion.div>
            )}

            {/* SETTINGS VIEW */}
            {activeView === 'Settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-xl">
                <h1 className="font-heading font-extrabold text-2xl">Portal Settings</h1>
                <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                  <h3 className="font-bold text-sm">Security & Access Configuration</h3>
                  <div className="space-y-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={require2FA} onChange={e => {
                        setRequire2FA(e.target.checked)
                        showToast(e.target.checked ? '2FA enforcement activated' : '2FA disabled')
                      }} className="rounded accent-black" />
                      <span>Require Two-Factor Authentication (2FA) for administrators</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={autoProctoring} onChange={e => {
                        setAutoProctoring(e.target.checked)
                        showToast(e.target.checked ? 'Proctoring monitoring active' : 'Proctoring warnings disabled')
                      }} className="rounded accent-black" />
                      <span>Enable AI Proctoring Logs automatic capture</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUPPORT VIEW */}
            {activeView === 'Support' && (
              <motion.div key="support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h1 className="font-heading font-extrabold text-2xl">Help & Support</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <form onSubmit={handleTicketSubmittal} className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                    <h3 className="font-bold text-sm">Submit Admin Support Ticket</h3>
                    <textarea required value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} placeholder="Describe the issue you are experiencing..." className="w-full p-2.5 rounded-lg border text-xs h-24 focus:outline-none dark:bg-[#1A1A1A]" />
                    <button type="submit" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl">Submit Ticket</button>
                  </form>

                  <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                    <h3 className="font-bold text-sm">Your Tickets Log</h3>
                    {supportTickets.length === 0 ? <p className="text-xs text-neutral-400">No support tickets submitted.</p> : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {supportTickets.map(t => (
                          <div key={t.id} className="p-3 border rounded-xl text-xs flex justify-between items-start">
                            <div>
                              <p className="font-bold">Ticket #{t.id}</p>
                              <p className="text-neutral-500">{t.description}</p>
                            </div>
                            <span className="px-2 py-0.5 text-[9px] font-bold border border-emerald-500 text-emerald-500 rounded">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SYSTEM LOGS VIEW */}
            {activeView === 'Logs' && (
              <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <h1 className="font-heading font-extrabold text-2xl">System Activity Logs</h1>
                  <div className="flex gap-2">
                    <button onClick={handleExportSystemLogs} className="text-xs font-semibold px-3 py-1.5 border rounded-xl flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> Export Logs
                    </button>
                    <button onClick={() => {
                      setSystemLogs([])
                      showToast('Clear activity logs success')
                    }} className="text-xs font-semibold px-3 py-1.5 border rounded-xl">Clear Logs</button>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border text-xs font-mono max-h-96 overflow-y-auto ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                  {systemLogs.length === 0 ? <p className="text-neutral-500">Logs cleared.</p> : (
                    systemLogs.map(log => (
                      <p key={log.id} className={`pb-2 ${log.type === 'warn' ? 'text-amber-500' : log.type === 'success' ? 'text-emerald-500' : 'text-neutral-500'}`}>
                        [{log.time}] {log.msg}
                      </p>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* SECURE EXTENSION VIEW */}
            {activeView === 'Secure Extension' && (
              <motion.div key="secure-ext" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-xl">
                <h1 className="font-heading font-extrabold text-2xl">Secure Exam Extension</h1>
                <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                  <h3 className="font-bold text-sm">Lockdown Browser Integration</h3>
                  <p className="text-xs text-neutral-500">Configure key binding restrictions, screen-sharing prevention alerts, and student system level checks.</p>
                  <div className="flex gap-2">
                    <button onClick={() => showToast('Security extension initialized')} className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl">Configure Settings</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* UNIVERSAL FALLBACK VIEW FOR THE REST OF SECTIONS */}
            {!['Dashboard', 'Students', 'Assessments', 'Assignments', 'Question Bank', 'Companies', 'Programs', 'Settings', 'Support', 'Logs', 'Secure Extension'].includes(activeView) && (
              <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h1 className="font-heading font-extrabold text-2xl">{activeView} Workspace</h1>
                <div className={`p-8 rounded-2xl border text-center ${darkMode ? 'bg-[#121212] border-[#202020]' : 'bg-white border-black/5'}`}>
                  <p className="text-xs text-neutral-400">Minimal workspace details for {activeView} is successfully loaded under native Placify admin system.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* Dynamic Modal Dialog for Assigning Assessment */}
      <AnimatePresence>
        {assignModalOpen && assignStudentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl border ${
                darkMode ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#EBEBEB]'
              }`}
            >
              <h3 className="font-heading font-bold text-sm mb-4">Assign Assessment to {assignStudentTarget.name}</h3>
              <form onSubmit={handleAssignAssessmentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1">Select Assessment</label>
                  <select value={assignAssessmentName} onChange={e => setAssignAssessmentName(e.target.value)} className="w-full p-2 border rounded">
                    <option value="Data Structures & Algorithms Midterm">Data Structures & Algorithms Midterm</option>
                    <option value="System Design Mock Test">System Design Mock Test</option>
                    <option value="General Aptitude & Reasoning">General Aptitude & Reasoning</option>
                  </select>
                </div>
                <button type="submit" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-bold">Assign Now</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Modal Dialog for Scheduling Interview */}
      <AnimatePresence>
        {scheduleModalOpen && scheduleStudentTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setScheduleModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl border ${
                darkMode ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#EBEBEB]'
              }`}
            >
              <h3 className="font-heading font-bold text-sm mb-4">Schedule Interview for {scheduleStudentTarget.name}</h3>
              <form onSubmit={handleScheduleInterviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1">Target Company</label>
                  <select value={scheduleCompanyName} onChange={e => setScheduleCompanyName(e.target.value)} className="w-full p-2 border rounded">
                    {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Interview Title</label>
                  <input type="text" required value={scheduleInterviewTitle} onChange={e => setScheduleInterviewTitle(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <button type="submit" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-bold">Schedule Interview</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Creation Overlay Modal */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCategoryModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl border ${
                darkMode ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#EBEBEB]'
              }`}
            >
              <h3 className="font-heading font-bold text-sm mb-4">Create New Question Category</h3>
              <form onSubmit={handleCreateCategorySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1">Category Name</label>
                  <input type="text" required value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Distributed Systems" className="w-full p-2 border rounded" />
                </div>
                <button type="submit" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-bold">Add Category</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Code Generator Modal */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInviteModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl border text-center ${
                darkMode ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#EBEBEB]'
              }`}
            >
              <h3 className="font-heading font-bold text-sm mb-2">Student Invitation Link</h3>
              <p className="text-xs text-neutral-400 mb-4">Share this unique workspace code with eligible students for automated enrollment registration.</p>
              <div className="p-3 border rounded-xl font-mono font-bold text-lg select-all bg-neutral-100 dark:bg-neutral-800">
                {inviteCode}
              </div>
              <div className="flex gap-2 justify-center pt-4">
                <button onClick={() => {
                  navigator.clipboard.writeText(inviteCode)
                  showToast('Code copied to clipboard!')
                  setInviteModalOpen(false)
                }} className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold">Copy Code</button>
                <button onClick={() => {
                  const newCode = `INV-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                  setInviteCode(newCode)
                  showToast('Regenerated code link')
                }} className="px-4 py-2 border rounded-xl text-xs font-semibold">Regenerate</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Editor Modal for Question Bank */}
      <AnimatePresence>
        {editorOpen && editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditorOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg p-6 rounded-2xl shadow-xl border ${
                darkMode ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#EBEBEB]'
              }`}
            >
              <h3 className="font-heading font-bold text-sm mb-4">
                {editingQuestion.id ? 'Edit Question' : 'Add Question'}
              </h3>
              <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1">Title</label>
                  <input type="text" required value={editingQuestion.title} onChange={e => setEditingQuestion({...editingQuestion, title: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block mb-1">Statement</label>
                  <textarea required value={editingQuestion.statement} onChange={e => setEditingQuestion({...editingQuestion, statement: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <button type="submit" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded">Save</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Roster Edit Student Profile Modal */}
      <AnimatePresence>
        {studentEditOpen && editingStudentData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStudentEditOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-lg p-6 rounded-2xl shadow-xl border ${
                darkMode ? 'bg-[#161616] border-[#2C2C2C]' : 'bg-white border-[#EBEBEB]'
              }`}
            >
              <h3 className="font-heading font-bold text-sm mb-4">Edit Student Profile</h3>
              <form onSubmit={handleSaveEditedStudent} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1">Name</label>
                  <input type="text" required value={editingStudentData.name} onChange={e => setEditingStudentData({...editingStudentData, name: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block mb-1">Email</label>
                  <input type="email" required value={editingStudentData.email} onChange={e => setEditingStudentData({...editingStudentData, email: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block mb-1">CGPA</label>
                  <input type="number" step="0.01" required value={editingStudentData.cgpa} onChange={e => setEditingStudentData({...editingStudentData, cgpa: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block mb-1">Placement Status</label>
                  <select value={editingStudentData.status} onChange={e => setEditingStudentData({...editingStudentData, status: e.target.value})} className="w-full p-2 border rounded">
                    <option value="Placed">Placed</option>
                    <option value="Eligible">Eligible</option>
                    <option value="Pending">Pending</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
                <button type="submit" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-bold">Save Changes</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proctoring/Attempt Detail Drawer */}
      <AnimatePresence>
        {selectedAttempt && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAttempt(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className={`relative w-80 max-w-full h-full p-8 overflow-y-auto flex flex-col justify-between border-l ${
                darkMode ? 'bg-[#121212] border-[#2C2C2C]' : 'bg-[#FAF7F0] border-[#EBEBEB]'
              }`}
            >
              <div className="space-y-6 text-xs">
                <h3 className="font-heading font-extrabold text-base mb-4">Evaluation Details</h3>
                <div className="space-y-3">
                  <p><strong>Candidate:</strong> {selectedAttempt.name}</p>
                  <p><strong>Assessment:</strong> {selectedAttempt.assessment}</p>
                  <p><strong>Total Warnings:</strong> <span className={selectedAttempt.warnings > 0 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>{selectedAttempt.warnings}</span></p>
                  {selectedAttempt.reason && <p className="text-red-500"><strong>Violation Detail:</strong> {selectedAttempt.reason}</p>}
                </div>

                <div className="pt-4 border-t">
                  <p className="font-bold mb-2">PROCTORING TIMELINE LOG</p>
                  <div className="space-y-2 text-[10px] font-mono text-neutral-500">
                    <p>[02:10] Camera authentication check success.</p>
                    {selectedAttempt.warnings > 0 && <p className="text-amber-500">[05:14] WARNING: Candidate left full-screen browser frame.</p>}
                    {selectedAttempt.status === 'Terminated' && <p className="text-red-500">[11:15] CRITICAL: Maximum switch limit reached. Terminated.</p>}
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedAttempt(null)} className="w-full py-2 bg-black text-white dark:bg-white dark:text-black font-bold text-xs rounded-xl mt-6">Close Panel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Company Creator Dialog */}
      <AnimatePresence>
        {newCompanyFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewCompanyFormOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg p-6 bg-white rounded border"
            >
              <h3>New Company</h3>
              <form onSubmit={handleCreateCompanySubmit}>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  className="w-full p-2 border my-2"
                />
                <button type="submit" className="p-2 bg-black text-white">Save</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
