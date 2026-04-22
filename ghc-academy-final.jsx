import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronRight, BookOpen, Award, Users, Clock, Play, Download, Eye, EyeOff, Zap, Target, TrendingUp, Star, Bell, Settings, LogOut, Home, GraduationCap, FileText, BarChart3 } from 'lucide-react';

// ============================================================================
// GHC ACADEMY - EXPERIENCIA NATIVA DE LUJO
// Glassmorphism + Animaciones CSS Avanzadas + Motion Design
// ============================================================================

const COLORS = {
  dark: {
    bg: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceHover: '#252525',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#FFFFFF',
    textMuted: '#A0A0A0',
    accent: '#E26A1B',
    accentHover: '#FF7A2E',
    success: '#10B981',
    glass: 'rgba(26, 26, 26, 0.6)',
  }
};

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }

  .backdrop-blur {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(60px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .scale-in {
    animation: scaleIn 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .slide-in {
    animation: slideIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .float {
    animation: float 1.5s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(10px);
    }
  }

  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
  .stagger-5 { animation-delay: 0.5s; }

  .hover-lift {
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s;
  }

  .hover-lift:hover {
    transform: translateY(-8px);
  }

  .avatar-pop {
    animation: avatarPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }

  @keyframes avatarPop {
    from {
      transform: scale(0) translateX(-20px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateX(0);
      opacity: 1;
    }
  }
`;

// Datos
const COURSES = [
  {
    id: 'nutricion',
    title: 'Nutrición Deportiva Científica',
    category: 'Nutrición',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1400&q=90',
    gradient: 'linear-gradient(135deg, rgba(226, 106, 27, 0.2), rgba(239, 68, 68, 0.2))',
    price: 349,
    students: 1256,
    rating: 4.9,
    duration: '45h',
    modules: 12,
    description: 'Domina la periodización nutricional y protocolos de suplementación basados en evidencia.',
    avatars: [
      'https://i.pravatar.cc/150?img=1',
      'https://i.pravatar.cc/150?img=2',
      'https://i.pravatar.cc/150?img=3',
      'https://i.pravatar.cc/150?img=4',
      'https://i.pravatar.cc/150?img=5'
    ],
    features: ['Periodización nutricional', 'Suplementación científica', 'Casos prácticos reales']
  },
  {
    id: 'fuerza',
    title: 'Entrenamiento de Fuerza',
    category: 'Entrenamiento',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=90',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.2))',
    price: 399,
    students: 2134,
    rating: 4.9,
    duration: '50h',
    modules: 15,
    description: 'Programación científica de fuerza desde biomecánica hasta periodización avanzada.',
    avatars: [
      'https://i.pravatar.cc/150?img=6',
      'https://i.pravatar.cc/150?img=7',
      'https://i.pravatar.cc/150?img=8',
      'https://i.pravatar.cc/150?img=9',
      'https://i.pravatar.cc/150?img=10'
    ],
    features: ['Biomecánica aplicada', 'Programación científica', 'Prevención de lesiones']
  },
  {
    id: 'anatomia',
    title: 'Anatomía Funcional',
    category: 'Ciencia',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1400&q=90',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
    price: 299,
    students: 892,
    rating: 4.8,
    duration: '35h',
    modules: 10,
    description: 'Comprensión profunda de la anatomía funcional y su aplicación al rendimiento.',
    avatars: [
      'https://i.pravatar.cc/150?img=11',
      'https://i.pravatar.cc/150?img=12',
      'https://i.pravatar.cc/150?img=13',
      'https://i.pravatar.cc/150?img=14',
      'https://i.pravatar.cc/150?img=15'
    ],
    features: ['Anatomía 3D', 'Cadenas cinéticas', 'Análisis del movimiento']
  }
];

// Hooks
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// Sidebar
const Sidebar = ({ isOpen, onClose, currentPage, onNavigate, currentUser }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'courses', label: 'Cursos', icon: BookOpen },
    { id: 'progress', label: 'Mi Progreso', icon: TrendingUp },
    { id: 'certificates', label: 'Certificados', icon: Award },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 40,
            animation: 'fadeIn 0.3s'
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '18rem',
          zIndex: 50,
          background: COLORS.dark.glass,
          borderRight: `1px solid ${COLORS.dark.border}`,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
        className="backdrop-blur"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem',
            borderBottom: `1px solid ${COLORS.dark.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src="/mnt/user-data/uploads/logo-limpio.png"
                alt="GHC"
                style={{
                  width: '3rem',
                  height: '3rem',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 20px rgba(226, 106, 27, 0.4))'
                }}
              />
              <div>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
                  GHC ACADEMY
                </div>
                <div style={{ color: COLORS.dark.accent, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  SPORT SCIENCE
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer'
            }}>
              <X size={24} />
            </button>
          </div>

          {currentUser && (
            <div style={{ padding: '1.5rem' }} className="fade-in-up">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '1rem',
                background: COLORS.dark.surface
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E26A1B, #EF4444)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700
                }}>
                  {currentUser.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                    Plan Premium
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav style={{ flex: 1, padding: '1rem 1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`fade-in-up stagger-${idx + 1}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.75rem',
                      background: isActive ? COLORS.dark.accent : 'transparent',
                      color: isActive ? 'white' : COLORS.dark.textMuted,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      transition: 'all 0.3s',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.transform = 'translateX(8px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div style={{
            padding: '1rem',
            borderTop: `1px solid ${COLORS.dark.border}`
          }}>
            {currentUser && (
              <button
                onClick={() => onNavigate('logout')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  background: 'transparent',
                  color: '#EF4444',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  width: '100%',
                  transition: 'background 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

// Header flotante
const FloatingHeader = ({ onMenuToggle, currentUser }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={scrolled ? 'backdrop-blur' : ''}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        background: scrolled ? 'rgba(13, 13, 13, 0.8)' : 'transparent',
        borderBottom: scrolled ? `1px solid ${COLORS.dark.border}` : 'none',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        animation: 'slideDown 0.5s'
      }}
    >
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); }}`}</style>
      
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onMenuToggle}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.5rem',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Menu size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              position: 'relative',
              padding: '0.5rem'
            }}
          >
            <Bell size={20} />
            <span style={{
              position: 'absolute',
              top: '0.25rem',
              right: '0.25rem',
              width: '0.5rem',
              height: '0.5rem',
              background: COLORS.dark.accent,
              borderRadius: '50%'
            }} />
          </button>
          
          {currentUser && (
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E26A1B, #EF4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 700
            }}>
              {currentUser.name.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Course Card con efectos de lujo
const CourseCard = ({ course, onClick, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`hover-lift fade-in-up stagger-${index + 1}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        background: COLORS.dark.surface,
        border: `1px solid ${COLORS.dark.border}`,
        boxShadow: isHovered ? '0 20px 60px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
        transition: 'box-shadow 0.3s'
      }}
    >
      <div style={{ position: 'relative', height: '12rem', overflow: 'hidden' }}>
        <img
          src={course.image}
          alt={course.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: course.gradient,
          mixBlendMode: 'multiply'
        }} />
        
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'white',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)'
          }}
          className="backdrop-blur"
        >
          {course.category}
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 900,
          color: 'white',
          marginBottom: '0.5rem',
          lineHeight: 1.3
        }}>
          {course.title}
        </h3>
        
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '1rem',
          lineHeight: 1.6
        }}>
          {course.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {course.features.map((feature, i) => (
            <div
              key={i}
              className={`fade-in-up stagger-${i + 3}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.5)'
              }}
            >
              <div style={{
                width: '0.25rem',
                height: '0.25rem',
                borderRadius: '50%',
                background: COLORS.dark.accent
              }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={14} />
            <span>{course.duration}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <BookOpen size={14} />
            <span>{course.modules} módulos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Star size={14} fill={COLORS.dark.accent} color={COLORS.dark.accent} />
            <span>{course.rating}</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '1rem',
          borderTop: `1px solid ${COLORS.dark.border}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex' }}>
              {course.avatars.slice(0, 4).map((avatar, i) => (
                <img
                  key={i}
                  src={avatar}
                  alt=""
                  className={`avatar-pop stagger-${i + 1}`}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    border: `2px solid ${COLORS.dark.surface}`,
                    marginLeft: i === 0 ? 0 : '-0.75rem'
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              <div style={{ color: 'white', fontWeight: 700 }}>
                {course.students.toLocaleString()}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)' }}>estudiantes</div>
            </div>
          </div>

          <div style={{
            fontSize: '1.5rem',
            fontWeight: 900,
            color: COLORS.dark.accent,
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s'
          }}>
            €{course.price}
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(226, 106, 27, 0.2), transparent)',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none'
      }} />
    </div>
  );
};

// Hero cinematográfico
const CinematicHero = ({ onNavigate }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxY = scrollY * 0.3;
  const opacity = Math.max(0, 1 - scrollY / 300);

  return (
    <div style={{
      position: 'relative',
      height: '100vh',
      minHeight: '800px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${parallaxY}px)`
      }}>
        <img
          src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1920&q=90"
          alt="Elite Athlete"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, #0D0D0D, rgba(13,13,13,0.8), rgba(13,13,13,0.4))'
        }} />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 1.5rem',
          maxWidth: '80rem',
          opacity
        }}
      >
        <div className="scale-in" style={{ marginBottom: '2rem' }}>
          <img 
            src="/mnt/user-data/uploads/logo-limpio.png"
            alt="GHC"
            style={{
              width: '8rem',
              height: '8rem',
              margin: '0 auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 30px rgba(226, 106, 27, 0.6))'
            }}
          />
        </div>

        <h1
          className="fade-in-up stagger-2"
          style={{
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            fontWeight: 900,
            color: 'white',
            marginBottom: '1.5rem',
            lineHeight: 1,
            letterSpacing: '-0.03em'
          }}
        >
          LA CIENCIA
          <br />
          DEL{' '}
          <span style={{
            background: 'linear-gradient(135deg, #E26A1B, #EF4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            RENDIMIENTO
          </span>
        </h1>

        <p
          className="fade-in-up stagger-3"
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '3rem',
            maxWidth: '48rem',
            margin: '0 auto 3rem',
            lineHeight: 1.6
          }}
        >
          Formación profesional de élite basada en evidencia científica para transformar tu carrera
        </p>

        <button
          className="scale-in stagger-4"
          onClick={() => onNavigate('dashboard')}
          style={{
            padding: '1.25rem 3rem',
            background: 'linear-gradient(135deg, #E26A1B, #EF4444)',
            color: 'white',
            fontSize: '1.125rem',
            fontWeight: 700,
            border: 'none',
            borderRadius: '1rem',
            cursor: 'pointer',
            boxShadow: '0 12px 40px rgba(226, 106, 27, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'transform 0.3s, box-shadow 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 16px 48px rgba(226, 106, 27, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(226, 106, 27, 0.4)';
          }}
        >
          Explorar Cursos
          <ChevronRight size={24} />
        </button>

        <div
          className="fade-in-up stagger-5"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            marginTop: '5rem',
            maxWidth: '48rem',
            margin: '5rem auto 0'
          }}
        >
          {[
            { value: '4,282', label: 'Profesionales' },
            { value: '4.9/5', label: 'Valoración' },
            { value: '97%', label: 'Tasa de éxito' }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 900,
                color: COLORS.dark.accent,
                lineHeight: 1,
                marginBottom: '0.5rem',
                textShadow: '0 2px 12px rgba(226, 106, 27, 0.5)'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.9375rem',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 600
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="float" style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity
      }}>
        <div style={{
          width: '1.5rem',
          height: '2.5rem',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '1.25rem',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '0.5rem'
        }}>
          <div style={{
            width: '0.25rem',
            height: '0.5rem',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '0.125rem'
          }} />
        </div>
      </div>
    </div>
  );
};

// Login
const LuxuryLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (email === 'demo@ghc.test' && password === 'demo1234') {
        onLogin({ email, name: 'Usuario Demo', role: 'student' });
      } else if (email === 'admin@ghc.test' && password === 'admin1234') {
        onLogin({ email, name: 'Admin GHC', role: 'admin' });
      } else {
        alert('Credenciales incorrectas');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: COLORS.dark.bg
    }}>
      <div className="scale-in" style={{ width: '100%', maxWidth: '28rem' }}>
        <div
          className="backdrop-blur"
          style={{
            borderRadius: '1.5rem',
            padding: '2rem',
            background: COLORS.dark.glass,
            border: `1px solid ${COLORS.dark.border}`,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="scale-in stagger-1" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem'
          }}>
            <img 
              src="/mnt/user-data/uploads/logo-limpio.png"
              alt="GHC"
              style={{
                width: '6rem',
                height: '6rem',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 20px rgba(226, 106, 27, 0.5))'
              }}
            />
          </div>

          <div className="fade-in-up stagger-2" style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 900,
              color: 'white',
              marginBottom: '0.5rem'
            }}>
              Bienvenido
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              Accede a tu formación de élite
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div className="fade-in-up stagger-3">
              <label style={{
                display: 'block',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: COLORS.dark.surface,
                  border: `1px solid ${COLORS.dark.border}`,
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.dark.accent}
                onBlur={(e) => e.target.style.borderColor = COLORS.dark.border}
              />
            </div>

            <div className="fade-in-up stagger-4">
              <label style={{
                display: 'block',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    paddingRight: '3rem',
                    background: COLORS.dark.surface,
                    border: `1px solid ${COLORS.dark.border}`,
                    borderRadius: '0.75rem',
                    color: 'white',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="fade-in-up stagger-5"
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, #E26A1B, #EF4444)',
                color: 'white',
                fontWeight: 700,
                border: 'none',
                borderRadius: '0.75rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                position: 'relative',
                boxShadow: '0 8px 24px rgba(226, 106, 27, 0.3)',
                transition: 'transform 0.3s'
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {isLoading ? (
                <div className="spinner" style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  margin: '0 auto'
                }} />
              ) : (
                'Acceder'
              )}
            </button>
          </form>

          <div className="fade-in-up stagger-6" style={{
            marginTop: '2rem',
            padding: '1rem',
            borderRadius: '0.75rem',
            background: COLORS.dark.surface,
            fontSize: '0.75rem'
          }}>
            <div style={{
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem',
              fontWeight: 600
            }}>
              Cuentas demo:
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
              <div>👤 demo@ghc.test / demo1234</div>
              <div>👑 admin@ghc.test / admin1234</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard
const Dashboard = ({ onNavigate }) => {
  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: '6rem',
      paddingBottom: '3rem',
      background: COLORS.dark.bg
    }}>
      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '0 1.5rem'
      }}>
        <div className="fade-in-up" style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            color: 'white',
            marginBottom: '1rem'
          }}>
            Dashboard
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            Gestiona tu formación profesional
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {[
            { label: 'Cursos activos', value: '3', icon: BookOpen, color: 'linear-gradient(135deg, #3B82F6, #06B6D4)' },
            { label: 'Progreso total', value: '67%', icon: TrendingUp, color: 'linear-gradient(135deg, #E26A1B, #EF4444)' },
            { label: 'Certificados', value: '2', icon: Award, color: 'linear-gradient(135deg, #A855F7, #EC4899)' }
          ].map((stat, i) => (
            <div
              key={i}
              className={`fade-in-up stagger-${i + 1} hover-lift`}
              style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                background: COLORS.dark.surface,
                border: `1px solid ${COLORS.dark.border}`,
                cursor: 'pointer'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  background: stat.color
                }}>
                  <stat.icon size={24} color="white" />
                </div>
                <div style={{
                  fontSize: '1.875rem',
                  fontWeight: 900,
                  color: 'white'
                }}>
                  {stat.value}
                </div>
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 600
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          {COURSES.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
              onClick={() => onNavigate('course-detail', course.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// App principal
export default function GHCAcademyNative() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useLocalStorage('ghc_user', null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageData, setPageData] = useState(null);

  const handleNavigate = (page, data = null) => {
    setCurrentPage(page);
    setPageData(data);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    handleNavigate('home');
  };

  if (!currentUser && currentPage !== 'home') {
    return (
      <>
        <style>{globalStyles}</style>
        <LuxuryLogin onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div style={{ background: COLORS.dark.bg, minHeight: '100vh' }}>
      <style>{globalStyles}</style>
      
      {currentUser && currentPage !== 'login' && (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            currentPage={currentPage}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
          <FloatingHeader
            onMenuToggle={() => setSidebarOpen(true)}
            currentUser={currentUser}
          />
        </>
      )}

      <div className={currentUser ? 'slide-in' : ''} style={{
        marginLeft: currentUser && window.innerWidth >= 1024 ? '18rem' : 0,
        transition: 'margin-left 0.3s'
      }}>
        {currentPage === 'home' && !currentUser && (
          <>
            <CinematicHero onNavigate={handleNavigate} />
            <div style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
              <Dashboard onNavigate={handleNavigate} />
            </div>
          </>
        )}
        
        {currentPage === 'login' && <LuxuryLogin onLogin={handleLogin} />}
        {currentPage === 'dashboard' && currentUser && <Dashboard onNavigate={handleNavigate} />}
        {currentPage === 'courses' && currentUser && <Dashboard onNavigate={handleNavigate} />}
        {currentPage === 'logout' && handleLogout()}
      </div>
    </div>
  );
}
