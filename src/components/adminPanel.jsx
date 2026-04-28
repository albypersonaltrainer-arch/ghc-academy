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
}// Payments View
function PaymentsView({ payments, showToast }) {
  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Payments</h1>
        <p>Manage payment records</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Amount</th>
              <th>Concept</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.date).toLocaleDateString()}</td>
                <td>{payment.userId}</td>
                <td><strong>€{payment.amount}</strong></td>
                <td>{payment.concept}</td>
                <td>
                  <span className={`status-badge ${payment.status}`}>
                    {payment.status}
                  </span>
                </td>
                <td>
                  {payment.status === 'pending' && (
                    <button
                      className="admin-btn-sm-success"
                      onClick={() => {
                        markPaymentCompleted(payment.id);
                        showToast('Payment marked as completed');
                        window.location.reload();
                      }}
                    >
                      <CheckCircle size={14} />
                      Confirm
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Certificates View
function CertificatesView({ certificates, users, courses, showToast }) {
  const handleDownloadCertificate = (cert) => {
    const user = users.find(u => u.id === cert.userId);
    const course = courses.find(c => c.id === cert.courseId);
    
    if (user && course) {
      const dataURL = createCertificateDataURL(cert, user.name, course.name);
      const link = document.createElement('a');
      link.download = `certificate-${cert.certificateNumber}.png`;
      link.href = dataURL;
      link.click();
      showToast('Certificate downloaded');
    }
  };

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Certificates</h1>
        <p>Manage issued certificates</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Certificate No.</th>
              <th>User ID</th>
              <th>Course ID</th>
              <th>Issued Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => (
              <tr key={cert.id}>
                <td><strong>{cert.certificateNumber}</strong></td>
                <td>{cert.userId}</td>
                <td>{cert.courseId}</td>
                <td>{new Date(cert.issuedAt).toLocaleDateString()}</td>
                <td>
                  <span className="status-badge active">{cert.status}</span>
                </td>
                <td>
                  <button
                    className="admin-btn-icon"
                    onClick={() => handleDownloadCertificate(cert)}
                    title="Download certificate"
                  >
                    <Download size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Settings View
function SettingsView({ settings, showToast }) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    showToast('Settings saved successfully');
  };

  return (
    <div className="admin-view">
      <div className="admin-view-header">
        <h1>Settings</h1>
        <p>Configure admin panel</p>
      </div>

      <div className="admin-section-card">
        <h3>Security</h3>
        <div className="admin-form-group">
          <label>Admin Password</label>
          <input
            type="password"
            value={localSettings.adminPassword || ''}
            onChange={(e) => setLocalSettings({ ...localSettings, adminPassword: e.target.value })}
            className="admin-input"
          />
        </div>
      </div>

      <div className="admin-section-card">
        <h3>Features</h3>
        <div className="admin-form-group">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.certificatesEnabled || false}
              onChange={(e) => setLocalSettings({ ...localSettings, certificatesEnabled: e.target.checked })}
            />
            <span>Enable Certificates</span>
          </label>
        </div>
        <div className="admin-form-group">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.antiPiracyEnabled || false}
              onChange={(e) => setLocalSettings({ ...localSettings, antiPiracyEnabled: e.target.checked })}
            />
            <span>Enable Anti-Piracy Protection</span>
          </label>
        </div>
        <div className="admin-form-group">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={localSettings.allowDownloads || false}
              onChange={(e) => setLocalSettings({ ...localSettings, allowDownloads: e.target.checked })}
            />
            <span>Allow Content Downloads</span>
          </label>
        </div>
      </div>

      <div className="admin-section-card">
        <h3>Watermark</h3>
        <div className="admin-form-group">
          <label>Watermark Text</label>
          <input
            type="text"
            value={localSettings.watermarkText || ''}
            onChange={(e) => setLocalSettings({ ...localSettings, watermarkText: e.target.value })}
            className="admin-input"
            placeholder="e.g., GHC Academy"
          />
        </div>
      </div>

      <button className="admin-btn-primary" onClick={handleSave}>
        <Save size={18} />
        Save Settings
      </button>
    </div>
  );
}

// Admin Content Router
function AdminContent({
  view,
  courses,
  users,
  payments,
  certificates,
  statistics,
  settings,
  onRefresh,
  showToast,
  setShowCourseModal,
  setShowModuleModal,
  setEditingCourse,
  setSelectedCourse,
  setSelectedUser,
  impersonatedUser,
  setImpersonatedUser
}) {
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleAddModule = (course) => {
    setSelectedCourse(course);
    setShowModuleModal(true);
  };

  const handleGiftCourse = (user) => {
    const courseId = prompt('Enter course ID to gift:');
    if (courseId) {
      const success = giftCourse(user.id, courseId);
      if (success) {
        showToast(`Course gifted to ${user.name}`);
        onRefresh();
      } else {
        showToast('Failed to gift course', 'error');
      }
    }
  };

  const handleImpersonate = (user) => {
    setImpersonatedUser(user);
    showToast(`Now viewing as ${user.name}`);
  };

  switch (view) {
    case 'dashboard':
      return <DashboardView statistics={statistics} />;
    
    case 'courses':
      return (
        <CoursesView
          courses={courses}
          onEdit={handleEditCourse}
          onDelete={() => onRefresh()}
          onAddModule={handleAddModule}
          showToast={showToast}
        />
      );
    
    case 'users':
      return (
        <UsersView
          users={users}
          onBlock={() => onRefresh()}
          onUnblock={() => onRefresh()}
          onGiftCourse={handleGiftCourse}
          onImpersonate={handleImpersonate}
          showToast={showToast}
        />
      );
    
    case 'payments':
      return <PaymentsView payments={payments} showToast={showToast} />;
    
    case 'certificates':
      return (
        <CertificatesView
          certificates={certificates}
          users={users}
          courses={courses}
          showToast={showToast}
        />
      );
    
    case 'settings':
      return <SettingsView settings={settings} showToast={showToast} />;
    
    default:
      return <DashboardView statistics={statistics} />;
  }
}

// Course Modal Component
function CourseModal({ course, onClose, onSave }) {
  const [formData, setFormData] = useState(
    course || {
      name: '',
      level: '',
      price: 0,
      description: '',
      image: '',
      isActive: true
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (course) {
      updateCourse(course.id, formData);
    } else {
      createCourse(formData);
    }
    
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="admin-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h2>{course ? 'Edit Course' : 'New Course'}</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="admin-form-group">
            <label>Course Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="admin-input"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Level *</label>
            <input
              type="text"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="admin-input"
              placeholder="e.g., Level 1"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Price (€) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="admin-input"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="admin-textarea"
              rows={3}
            />
          </div>

          <div className="admin-form-group">
            <label>Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="admin-input"
              placeholder="https://..."
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span>Active</span>
            </label>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">
              <Save size={18} />
              Save Course
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Module Modal Component
function ModuleModal({ course, module, onClose, onSave }) {
  const [formData, setFormData] = useState(
    module || {
      title: '',
      content: '',
      duration: '',
      locked: false
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (module) {
      updateModule(course.id, module.id, formData);
    } else {
      addModule(course.id, formData);
    }
    
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="admin-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">
          <h2>{module ? 'Edit Module' : 'New Module'}</h2>
          <button className="admin-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="admin-form-group">
            <label>Module Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="admin-input"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Duration *</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="admin-input"
              placeholder="e.g., 2h 30min"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="admin-textarea"
              rows={5}
              placeholder="Module content..."
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={formData.locked}
                onChange={(e) => setFormData({ ...formData, locked: e.target.checked })}
              />
              <span>Locked (requires previous module completion)</span>
            </label>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">
              <Save size={18} />
              Save Module
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

