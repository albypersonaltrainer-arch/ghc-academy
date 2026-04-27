import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Home, 
  BookOpen, 
  Award, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  CheckCircle,
  X,
  ArrowLeft,
  Settings,
  GraduationCap
} from 'lucide-react';

// Sample course data
const COURSES = [
  {
    id: 1,
    name: 'Nutrición Deportiva',
    level: 'Level 1',
    price: 349,
    description: 'Master sports nutrition fundamentals and meal planning',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop',
    modules: 12
  },
  {
    id: 2,
    name: 'Entrenamiento de Fuerza',
    level: 'Level 2',
    price: 449,
    description: 'Advanced strength training techniques and programming',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
    modules: 16
  },
  {
    id: 3,
    name: 'Rendimiento Élite',
    level: 'Level 3',
    price: 549,
    description: 'Elite performance optimization and peak conditioning',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop',
    modules: 18
  }
];

// Sample admin metrics
const ADMIN_METRICS = [
  { label: 'Total Revenue', value: '€12,450', icon: DollarSign, color: '#10B981' },
  { label: 'Active Students', value: '127', icon: Users, color: '#3B82F6' },
  { label: 'Courses Sold', value: '89', icon: BookOpen, color: '#F59E0B' },
  { label: 'Completion Rate', value: '78%', icon: TrendingUp, color: '#8B5CF6' }
];

// Sample student enrolled courses
const STUDENT_COURSES = [
  { id: 1, name: 'Nutrición Deportiva', progress: 67, nextModule: 'Module 9: Suplementación' },
  { id: 2, name: 'Entrenamiento de Fuerza', progress: 34, nextModule: 'Module 6: Periodización' }
];

export default function GHCAcademy() {
  // Navigation state - starts on 'store'
  const [currentPage, setCurrentPage] = useState('store');
  
  // Cart state
  const [cart, setCart] = useState([]);
  
  // User state (null, or { role: 'student'/'admin', name: string })
  const [currentUser, setCurrentUser] = useState(null);
  
  // Admin button visibility (controlled by ?admin=1 query param)
  const [showAdminButton, setShowAdminButton] = useState(false);
  
  // Success message for purchases
  const [successMessage, setSuccessMessage] = useState('');

  // Check URL parameters on mount to determine admin button visibility
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');
    if (adminParam === '1') {
      setShowAdminButton(true);
    }
  }, []);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handler: Add course to cart and navigate to cart page
  const handleBuyNow = (course) => {
    setCart(prev => [...prev, course]);
    setCurrentPage('cart');
  };

  // Handler: Remove item from cart
  const handleRemoveFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Handler: Confirm purchase (no login required)
  const handleConfirmPurchase = () => {
    setCart([]);
    setSuccessMessage(`Successfully purchased ${cart.length} course${cart.length > 1 ? 's' : ''}! Check your email for access details.`);
    setCurrentPage('store');
  };

  // Handler: Login (demo - no actual authentication)
  const handleLogin = (role) => {
    if (role === 'admin') {
      setCurrentUser({ role: 'admin', name: 'Admin User' });
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentUser({ role: 'student', name: 'Juan Pérez García' });
      setCurrentPage('student-dashboard');
    }
  };

  // Handler: Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('store');
  };

  // Calculate cart total
  const cartTotal = cart.reduce((sum, course) => sum + course.price, 0);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <img src="/logo-limpio.png" alt="GHC Academy" className="logo" />
            <div className="brand">
              <h1>GHC ACADEMY</h1>
              <p className="tagline">SPORT THROUGH SCIENCE</p>
            </div>
          </div>

          <nav className="header-nav">
            <button 
              onClick={() => setCurrentPage('store')} 
              className={`nav-button ${currentPage === 'store' ? 'active' : ''}`}
            >
              <Home size={18} />
              Store
            </button>

            {!currentUser && (
              <button 
                onClick={() => setCurrentPage('login')} 
                className="nav-button"
              >
                <User size={18} />
                Login
              </button>
            )}

            {currentUser && (
              <>
                <button 
                  onClick={() => setCurrentPage(currentUser.role === 'admin' ? 'admin-dashboard' : 'student-dashboard')} 
                  className="nav-button"
                >
                  <GraduationCap size={18} />
                  Dashboard
                </button>
                <button onClick={handleLogout} className="nav-button logout">
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            )}

            <button 
              onClick={() => setCurrentPage('cart')} 
              className="cart-button"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
          </nav>
        </div>
      </header>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="success-banner"
          >
            <CheckCircle size={20} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="main-content">
        {/* STORE PAGE */}
        {currentPage === 'store' && (
          <div className="store-page">
            <div className="page-header">
              <h2>Course Store</h2>
              <p>Choose your path to sports excellence</p>
            </div>

            <div className="courses-grid">
              {COURSES.map((course) => (
                <motion.div 
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="course-card"
                >
                  <img src={course.image} alt={course.name} className="course-image" />
                  <div className="course-content">
                    <div className="course-level">{course.level}</div>
                    <h3>{course.name}</h3>
                    <p className="course-description">{course.description}</p>
                    <div className="course-meta">
                      <span>{course.modules} modules</span>
                    </div>
                    <div className="course-footer">
                      <div className="price">€{course.price}</div>
                      <button 
                        onClick={() => handleBuyNow(course)}
                        className="buy-button"
                      >
                        <ShoppingCart size={18} />
                        Buy Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CART/CHECKOUT PAGE */}
        {currentPage === 'cart' && (
          <div className="cart-page">
            <div className="page-header">
              <button onClick={() => setCurrentPage('store')} className="back-button">
                <ArrowLeft size={18} />
                Back to Store
              </button>
              <h2>Shopping Cart</h2>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={64} />
                <h3>Your cart is empty</h3>
                <p>Add courses from the store to get started</p>
                <button onClick={() => setCurrentPage('store')} className="primary-button">
                  Browse Courses
                </button>
              </div>
            ) : (
              <div className="cart-content">
                <div className="cart-items">
                  {cart.map((course, index) => (
                    <div key={index} className="cart-item">
                      <img src={course.image} alt={course.name} className="cart-item-image" />
                      <div className="cart-item-details">
                        <h4>{course.name}</h4>
                        <p>{course.level}</p>
                      </div>
                      <div className="cart-item-price">€{course.price}</div>
                      <button 
                        onClick={() => handleRemoveFromCart(index)}
                        className="remove-button"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Items ({cart.length})</span>
                    <span>€{cartTotal}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>€{cartTotal}</span>
                  </div>
                  <button 
                    onClick={handleConfirmPurchase}
                    className="checkout-button"
                  >
                    <CheckCircle size={20} />
                    Confirm Purchase (No Login Required)
                  </button>
                  <p className="checkout-note">
                    You'll receive access details via email immediately after purchase.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOGIN PAGE */}
        {currentPage === 'login' && (
          <div className="login-page">
            <div className="login-container">
              <div className="login-logo">
                <div className="logo-circle">G</div>
              </div>
              <h2>Sign In</h2>
              <p className="login-subtitle">Select your access type</p>

              <div className="login-buttons">
                <button 
                  onClick={() => handleLogin('student')}
                  className="login-option student"
                >
                  <GraduationCap size={24} />
                  <span>Student Access</span>
                  <p>View your courses and progress</p>
                </button>

                {showAdminButton && (
                  <button 
                    onClick={() => handleLogin('admin')}
                    className="login-option admin"
                  >
                    <Settings size={24} />
                    <span>Administrator Access</span>
                    <p>Manage students and content</p>
                  </button>
                )}
              </div>

              <p className="demo-note">
                Demo: Click any option to explore. No actual credentials required.
              </p>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {currentPage === 'admin-dashboard' && currentUser?.role === 'admin' && (
          <div className="dashboard-page">
            <div className="page-header">
              <h2>Admin Dashboard</h2>
              <p>Welcome back, {currentUser.name}</p>
            </div>

            <div className="metrics-grid">
              {ADMIN_METRICS.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="metric-card"
                  >
                    <div className="metric-icon" style={{ color: metric.color }}>
                      <Icon size={32} />
                    </div>
                    <div className="metric-content">
                      <div className="metric-value">{metric.value}</div>
                      <div className="metric-label">{metric.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="dashboard-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <Activity size={20} />
                  <div>
                    <strong>New enrollment:</strong> María García enrolled in Nutrición Deportiva
                  </div>
                  <span className="activity-time">2 hours ago</span>
                </div>
                <div className="activity-item">
                  <Activity size={20} />
                  <div>
                    <strong>Payment received:</strong> €449 from Carlos López
                  </div>
                  <span className="activity-time">5 hours ago</span>
                </div>
                <div className="activity-item">
                  <Activity size={20} />
                  <div>
                    <strong>Course completed:</strong> Ana Martínez finished Level 1
                  </div>
                  <span className="activity-time">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENT DASHBOARD */}
        {currentPage === 'student-dashboard' && currentUser?.role === 'student' && (
          <div className="dashboard-page">
            <div className="page-header">
              <h2>My Dashboard</h2>
              <p>Welcome back, {currentUser.name}</p>
            </div>

            <div className="student-courses">
              <h3>My Enrolled Courses</h3>
              {STUDENT_COURSES.map((course) => (
                <div key={course.id} className="enrolled-course">
                  <div className="enrolled-course-header">
                    <h4>{course.name}</h4>
                    <span className="progress-badge">{course.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="next-module">
                    <BookOpen size={16} />
                    Next: {course.nextModule}
                  </p>
                  <button className="continue-button">
                    Continue Learning →
                  </button>
                </div>
              ))}
            </div>

            <div className="dashboard-section">
              <h3>Quick Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <Award size={24} />
                  <div>
                    <div className="stat-value">12</div>
                    <div className="stat-label">Modules Completed</div>
                  </div>
                </div>
                <div className="stat-item">
                  <TrendingUp size={24} />
                  <div>
                    <div className="stat-value">8</div>
                    <div className="stat-label">Exams Passed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 GHC Academy - Sport Through Science</p>
      </footer>
    </div>
  );
}
