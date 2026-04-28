import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  Users,
  DollarSign,
  Award,
  Settings,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Gift,
  Download,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileText,
  Search,
  Filter
} from 'lucide-react';

import {
  initializeStorage,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
  getUsers,
  getUser,
  updateUser,
  blockUser,
  unblockUser,
  giftCourse,
  getExams,
  getExam,
  createExam,
  updateExam,
  getPayments,
  updatePayment,
  markPaymentCompleted,
  getCertificates,
  generateCertificate,
  createCertificateDataURL,
  getSettings,
  updateSettings,
  getStatistics
} from './admin-utils';

// Password gate component
function PasswordGate({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const settings = getSettings();
    
    if (password === settings.adminPassword) {
      onAuthenticated();
    } else {
      setError('Incorrect password. Default is "admin123"');
      setPassword('');
    }
  };

  return (
    <div className="admin-password-gate">
      <div className="password-gate-container">
        <div className="password-gate-logo">
          <div className="logo-circle-admin">A</div>
        </div>
        <h2>Admin Access</h2>
        <p className="password-gate-subtitle">Enter admin password to continue</p>
        
        <form onSubmit={handleSubmit} className="password-gate-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="password-input"
            autoFocus
          />
          {error && (
            <div className="password-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <button type="submit" className="password-submit-btn">
            <Lock size={18} />
            Authenticate
          </button>
        </form>
        
        <p className="password-hint">Default password: admin123</p>
      </div>
    </div>
  );
}

// Toast notification component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`admin-toast admin-toast-${type}`}
    >
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      {message}
    </motion.div>
  );
}

// Main Admin Panel
export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const [impersonatedUser, setImpersonatedUser] = useState(null);

  // Modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Edit states
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Data states
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [settings, setSettings] = useState({});

  // Initialize storage on mount
  useEffect(() => {
    initializeStorage();
    refreshData();
  }, []);

  const refreshData = () => {
    setCourses(getCourses());
    setUsers(getUsers());
    setPayments(getPayments());
    setCertificates(getCertificates());
    setStatistics(getStatistics());
    setSettings(getSettings());
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <h2>GHC Admin</h2>
            <p>Control Panel</p>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <Home size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            className={`admin-nav-item ${currentView === 'courses' ? 'active' : ''}`}
            onClick={() => setCurrentView('courses')}
          >
            <BookOpen size={20} />
            {sidebarOpen && <span>Courses</span>}
          </button>

          <button
            className={`admin-nav-item ${currentView === 'users' ? 'active' : ''}`}
            onClick={() => setCurrentView('users')}
          >
            <Users size={20} />
            {sidebarOpen && <span>Users</span>}
          </button>

          <button
            className={`admin-nav-item ${currentView === 'payments' ? 'active' : ''}`}
            onClick={() => setCurrentView('payments')}
          >
            <DollarSign size={20} />
            {sidebarOpen && <span>Payments</span>}
          </button>

          <button
            className={`admin-nav-item ${currentView === 'certificates' ? 'active' : ''}`}
            onClick={() => setCurrentView('certificates')}
          >
            <Award size={20} />
            {sidebarOpen && <span>Certificates</span>}
          </button>

          <button
            className={`admin-nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentView('settings')}
          >
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            className="admin-nav-item"
            onClick={() => window.location.href = '/'}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Exit Admin</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <AdminContent
          view={currentView}
          courses={courses}
          users={users}
          payments={payments}
          certificates={certificates}
          statistics={statistics}
          settings={settings}
          onRefresh={refreshData}
          showToast={showToast}
          setShowCourseModal={setShowCourseModal}
          setShowModuleModal={setShowModuleModal}
          setShowUserModal={setShowUserModal}
          setShowPaymentModal={setShowPaymentModal}
          setEditingCourse={setEditingCourse}
          setSelectedCourse={setSelectedCourse}
          setSelectedUser={setSelectedUser}
          impersonatedUser={impersonatedUser}
          setImpersonatedUser={setImpersonatedUser}
        />
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showCourseModal && (
          <CourseModal
            course={editingCourse}
            onClose={() => {
              setShowCourseModal(false);
              setEditingCourse(null);
            }}
            onSave={() => {
              refreshData();
              setShowCourseModal(false);
              setEditingCourse(null);
              showToast('Course saved successfully!');
            }}
          />
        )}

        {showModuleModal && selectedCourse && (
          <ModuleModal
            course={selectedCourse}
            module={editingModule}
            onClose={() => {
              setShowModuleModal(false);
              setEditingModule(null);
            }}
            onSave={() => {
              refreshData();
              setShowModuleModal(false);
              setEditingModule(null);
              showToast('Module saved successfully!');
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Dashboard View
function DashboardView({ statistics }) {
  const stats = [
    { label: 'Total Revenue', value: `€${statistics.totalRevenue || 0}`, color: '#10b981', icon: DollarSign },
    { label: 'Active Users', value: statistics.activeUsers || 0, color: '#3b82f6', icon: Users },
    { label: 'Total Courses', value: statistics.totalCourses || 0, color: '#f59e0b', icon: BookOpen },
    { label: 'Certificates', value: statistics.totalCertificates || 0, color: '#8b5cf6', icon: Award }
  ];

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Dashboard</h1>
        <p>Overview of your academy</p>
      </div>

      <div className="admin-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="admin-stat-card"
            >
              <div className="stat-icon" style={{ color: stat.color }}>
                <Icon size={32} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="admin-section-card">
        <h3>Quick Stats</h3>
        <div className="quick-stats-list">
          <div className="quick-stat-item">
            <span>Pending Payments:</span>
            <strong>{statistics.pendingPayments || 0}</strong>
          </div>
          <div className="quick-stat-item">
            <span>Blocked Users:</span>
            <strong>{statistics.blockedUsers || 0}</strong>
          </div>
          <div className="quick-stat-item">
            <span>Active Courses:</span>
            <strong>{statistics.activeCourses || 0}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// Courses View
function CoursesView({ courses, onEdit, onDelete, onAddModule, showToast }) {
  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <div>
          <h1>Courses</h1>
          <p>Manage your course catalog</p>
        </div>
        <button className="admin-btn-primary" onClick={() => onEdit(null)}>
          <Plus size={18} />
          New Course
        </button>
      </div>

      <div className="admin-courses-grid">
        {courses.map((course) => (
          <div key={course.id} className="admin-course-card">
            <img src={course.image} alt={course.name} className="admin-course-image" />
            <div className="admin-course-content">
              <h3>{course.name}</h3>
              <p className="course-level">{course.level}</p>
              <p className="course-price">€{course.price}</p>
              <p className="course-modules">{course.modules?.length || 0} modules</p>
              
              <div className="admin-course-actions">
                <button
                  className="admin-btn-icon"
                  onClick={() => onEdit(course)}
                  title="Edit course"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="admin-btn-icon"
                  onClick={() => onAddModule(course)}
                  title="Add module"
                >
                  <Plus size={16} />
                </button>
                <button
                  className="admin-btn-icon-danger"
                  onClick={() => {
                    if (confirm('Delete this course?')) {
                      deleteCourse(course.id);
                      showToast('Course deleted');
                      window.location.reload();
                    }
                  }}
                  title="Delete course"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {course.modules && course.modules.length > 0 && (
                <div className="admin-modules-list">
                  <h4>Modules:</h4>
                  {course.modules.map((module) => (
                    <div key={module.id} className="admin-module-item">
                      <span>{module.order}. {module.title}</span>
                      <span className="module-duration">{module.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Users View
function UsersView({ users, onBlock, onUnblock, onGiftCourse, onImpersonate, showToast }) {
  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Users</h1>
        <p>Manage student accounts</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Enrolled Courses</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{user.enrolledCourses?.length || 0}</td>
                <td>
                  <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                    {user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions">
                    {user.isBlocked ? (
                      <button
                        className="admin-btn-icon-success"
                        onClick={() => {
                          unblockUser(user.id);
                          showToast(`${user.name} unblocked`);
                          window.location.reload();
                        }}
                        title="Unblock user"
                      >
                        <Unlock size={16} />
                      </button>
                    ) : (
                      <button
                        className="admin-btn-icon-danger"
                        onClick={() => {
                          if (confirm(`Block ${user.name}?`)) {
                            blockUser(user.id);
                            showToast(`${user.name} blocked`);
                            window.location.reload();
                          }
                        }}
                        title="Block user"
                      >
                        <Lock size={16} />
                      </button>
                    )}
                    <button
                      className="admin-btn-icon"
                      onClick={() => onGiftCourse(user)}
                      title="Gift course"
                    >
                      <Gift size={16} />
                    </button>
                    <button
                      className="admin-btn-icon"
                      onClick={() => onImpersonate(user)}
                      title="View as user"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Payments View Component continues in Part 2...
