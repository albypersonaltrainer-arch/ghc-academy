import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, BookOpen, Award, Users, Clock, Zap, TrendingUp, Bell, Settings, LogOut, Home, GraduationCap, DollarSign, AlertCircle, CheckCircle, Lock, Unlock, Brain, BarChart3, CreditCard, FileText, Activity, ArrowUpRight, PlayCircle, Trophy, Flame, Check, AlertTriangle, Download, Video, FileQuestion, ShoppingCart, Store } from 'lucide-react';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; overflow-x: hidden; background: #0A0A0A; }

  .glass {
    background: rgba(26, 26, 26, 0.8);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .glass-light {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  .hover-lift { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4) !important; }
`;

const COLORS = {
  accent: '#E26A1B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const INITIAL_STUDENTS = [
  { id: 1, name: 'Juan Pérez García', email: 'alumno@demo.com', password: '123', phone: '+34 612 345 678', level: 1, progress: 67, status: 'active', payment: 'paid', amount: 349, enrolled: '2024-01-15', lastAccess: '2024-04-26', modulesUnlocked: 8, examsPassed: [1, 2, 3, 4, 5, 6, 7, 8], currentModule: 9 },
  { id: 2, name: 'María García López', email: 'maria@demo.com', password: '123', phone: '+34 623 456 789', level: 1, progress: 34, status: 'active', payment: 'installment', amount: 399, enrolled: '2024-02-20', lastAccess: '2024-04-25', modulesUnlocked: 5, examsPassed: [1, 2, 3, 4, 5], currentModule: 6 },
  { id: 3, name: 'Carlos López Martín', email: 'carlos@demo.com', password: '123', phone: '+34 634 567 890', level: 2, progress: 89, status: 'active', payment: 'paid', amount: 449, enrolled: '2024-01-10', lastAccess: '2024-04-26', modulesUnlocked: 16, examsPassed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], currentModule: 17 },
  { id: 4, name: 'Ana Martínez Sanz', email: 'ana@demo.com', password: '123', phone: '+34 645 678 901', level: 1, progress: 12, status: 'blocked', payment: 'overdue', amount: 349, enrolled: '2024-03-05', lastAccess: '2024-03-28', modulesUnlocked: 2, examsPassed: [1], currentModule: 2 },
  { id: 5, name: 'David Rodríguez Ruiz', email: 'david@demo.com', password: '123', phone: '+34 656 789 012', level: 1, progress: 56, status: 'active', payment: 'paid', amount: 399, enrolled: '2024-02-01', lastAccess: '2024-04-24', modulesUnlocked: 8, examsPassed: [1, 2, 3, 4, 5, 6, 7, 8], currentModule: 9 },
  { id: 6, name: 'Laura Sánchez Díaz', email: 'laura@demo.com', password: '123', phone: '+34 667 890 123', level: 3, progress: 100, status: 'active', payment: 'paid', amount: 549, enrolled: '2023-12-20', lastAccess: '2024-04-19', modulesUnlocked: 18, examsPassed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], currentModule: 18 },
  { id: 7, name: 'Javier Fernández Gil', email: 'javier@demo.com', password: '123', phone: '+34 678 901 234', level: 2, progress: 23, status: 'active', payment: 'installment', amount: 449, enrolled: '2024-03-15', lastAccess: '2024-04-26', modulesUnlocked: 4, examsPassed: [1, 2, 3, 4], currentModule: 5 },
  { id: 8, name: 'Sofía Moreno Torres', email: 'sofia@demo.com', password: '123', phone: '+34 689 012 345', level: 1, progress: 45, status: 'active', payment: 'paid', amount: 349, enrolled: '2024-02-10', lastAccess: '2024-04-25', modulesUnlocked: 6, examsPassed: [1, 2, 3, 4, 5], currentModule: 6 },
  { id: 9, name: 'Miguel Ángel Romero', email: 'miguel@demo.com', password: '123', phone: '+34 690 123 456', level: 2, progress: 78, status: 'active', payment: 'paid', amount: 449, enrolled: '2024-01-25', lastAccess: '2024-04-26', modulesUnlocked: 12, examsPassed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], currentModule: 12 },
  { id: 10, name: 'Elena Navarro Castro', email: 'elena@demo.com', password: '123', phone: '+34 601 234 567', level: 1, progress: 8, status: 'blocked', payment: 'overdue', amount: 349, enrolled: '2024-03-20', lastAccess: '2024-04-01', modulesUnlocked: 1, examsPassed: [1], currentModule: 2 },
];

const INITIAL_TRANSACTIONS = [
  { id: 1, studentId: 1, studentName: 'Juan Pérez García', amount: 349, status: 'completed', method: 'SumUp', date: '2024-01-15', concept: 'Nivel 1 - Nutrición Deportiva', time: '10:23' },
  { id: 2, studentId: 2, studentName: 'María García López', amount: 133, status: 'completed', method: 'Transferencia', date: '2024-02-20', concept: 'Cuota 1/3 Nivel 1', time: '15:45' },
  { id: 3, studentId: 2, studentName: 'María García López', amount: 133, status: 'completed', method: 'Transferencia', date: '2024-03-20', concept: 'Cuota 2/3 Nivel 1', time: '09:12' },
  { id: 4, studentId: 2, studentName: 'María García López', amount: 133, status: 'pending', method: 'Transferencia', date: '2024-04-20', concept: 'Cuota 3/3 Nivel 1', time: '--:--' },
  { id: 5, studentId: 3, studentName: 'Carlos López Martín', amount: 449, status: 'completed', method: 'SumUp', date: '2024-01-10', concept: 'Nivel 2 - Entrenamiento Avanzado', time: '11:34' },
  { id: 6, studentId: 4, studentName: 'Ana Martínez Sanz', amount: 349, status: 'failed', method: 'SumUp', date: '2024-03-05', concept: 'Nivel 1 - PAGO FALLIDO', time: '14:22' },
  { id: 7, studentId: 5, studentName: 'David Rodríguez Ruiz', amount: 399, status: 'completed', method: 'SumUp', date: '2024-02-01', concept: 'Nivel 1 - Nutrición Deportiva', time: '16:55' },
  { id: 8, studentId: 6, studentName: 'Laura Sánchez Díaz', amount: 549, status: 'completed', method: 'Transferencia', date: '2023-12-20', concept: 'Nivel 3 - Rendimiento Élite', time: '08:30' },
  { id: 9, studentId: 7, studentName: 'Javier Fernández Gil', amount: 150, status: 'completed', method: 'SumUp', date: '2024-03-15', concept: 'Cuota 1/3 Nivel 2', time: '12:10' },
  { id: 10, studentId: 7, studentName: 'Javier Fernández Gil', amount: 150, status: 'pending', method: 'SumUp', date: '2024-04-15', concept: 'Cuota 2/3 Nivel 2', time: '--:--' },
  { id: 11, studentId: 8, studentName: 'Sofía Moreno Torres', amount: 349, status: 'completed', method: 'SumUp', date: '2024-02-10', concept: 'Nivel 1 - Nutrición Deportiva', time: '13:45' },
  { id: 12, studentId: 9, studentName: 'Miguel Ángel Romero', amount: 449, status: 'completed', method: 'Transferencia', date: '2024-01-25', concept: 'Nivel 2 - Entrenamiento Avanzado', time: '10:05' },
  { id: 13, studentId: 10, studentName: 'Elena Navarro Castro', amount: 349, status: 'failed', method: 'SumUp', date: '2024-03-20', concept: 'Nivel 1 - PAGO FALLIDO', time: '17:33' },
  { id: 14, studentId: 1, studentName: 'Juan Pérez García', amount: 150, status: 'pending', method: 'Transferencia', date: '2024-04-26', concept: 'Módulo Extra Premium', time: '--:--' },
  { id: 15, studentId: 3, studentName: 'Carlos López Martín', amount: 99, status: 'pending', method: 'SumUp', date: '2024-04-25', concept: 'Certificado Oficial', time: '--:--' },
];

const COURSE_LEVELS = {
  1: {
    name: 'Nutrición Deportiva',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    modules: [
      { id: 1, title: 'Fundamentos de Nutrición', duration: '2h 30min', type: 'video', locked: false },
      { id: 2, title: 'Macronutrientes Esenciales', duration: '3h 15min', type: 'video', locked: false },
      { id: 3, title: 'Micronutrientes y Vitaminas', duration: '2h 45min', type: 'pdf', locked: false },
      { id: 4, title: 'Hidratación en el Deporte', duration: '1h 50min', type: 'video', locked: false },
      { id: 5, title: 'Timing Nutricional', duration: '2h 20min', type: 'video', locked: false },
      { id: 6, title: 'Planificación de Comidas', duration: '3h 00min', type: 'pdf', locked: false },
      { id: 7, title: 'Nutrición Pre-Entreno', duration: '1h 40min', type: 'video', locked: false },
      { id: 8, title: 'Nutrición Post-Entreno', duration: '1h 45min', type: 'video', locked: false },
      { id: 9, title: 'Suplementación Deportiva', duration: '2h 50min', type: 'pdf', locked: true },
      { id: 10, title: 'Pérdida de Grasa', duration: '3h 10min', type: 'video', locked: true },
      { id: 11, title: 'Ganancia Muscular', duration: '2h 55min', type: 'video', locked: true },
      { id: 12, title: 'Casos Prácticos', duration: '4h 00min', type: 'pdf', locked: true },
    ],
    totalModules: 12,
    price: 349
  },
  2: {
    name: 'Entrenamiento Fuerza',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    modules: [
      { id: 1, title: 'Introducción al Entrenamiento', duration: '2h 00min', type: 'video', locked: false },
      { id: 2, title: 'Anatomía Funcional', duration: '3h 30min', type: 'pdf', locked: false },
      { id: 3, title: 'Técnica de Ejercicios', duration: '4h 00min', type: 'video', locked: false },
      { id: 4, title: 'Programación de Fuerza', duration: '3h 15min', type: 'pdf', locked: false },
      { id: 5, title: 'Periodización Avanzada', duration: '2h 45min', type: 'video', locked: false },
      { id: 6, title: 'Biomecánica Aplicada', duration: '3h 20min', type: 'video', locked: false },
      { id: 7, title: 'Prevención de Lesiones', duration: '2h 30min', type: 'pdf', locked: true },
      { id: 8, title: 'Ejercicios Avanzados', duration: '3h 50min', type: 'video', locked: true },
      { id: 9, title: 'Sistemas de Entrenamiento', duration: '2h 40min', type: 'video', locked: true },
      { id: 10, title: 'Evaluación del Rendimiento', duration: '2h 15min', type: 'pdf', locked: true },
      { id: 11, title: 'Powerlifting', duration: '3h 00min', type: 'video', locked: true },
      { id: 12, title: 'Halterofilia', duration: '3h 10min', type: 'video', locked: true },
      { id: 13, title: 'Entrenamiento Funcional', duration: '2h 50min', type: 'video', locked: true },
      { id: 14, title: 'Movilidad Avanzada', duration: '2h 20min', type: 'video', locked: true },
      { id: 15, title: 'Programación Personalizada', duration: '4h 30min', type: 'pdf', locked: true },
      { id: 16, title: 'Casos de Estudio', duration: '3h 40min', type: 'pdf', locked: true },
    ],
    totalModules: 16,
    price: 449
  },
  3: {
    name: 'Rendimiento Élite',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    modules: [
      { id: 1, title: 'Fisiología del Ejercicio', duration: '3h 30min', type: 'pdf', locked: false },
      { id: 2, title: 'Sistemas Energéticos', duration: '2h 45min', type: 'video', locked: false },
      { id: 3, title: 'Adaptaciones al Entrenamiento', duration: '3h 15min', type: 'video', locked: false },
      { id: 4, title: 'Evaluación Física Integral', duration: '4h 00min', type: 'pdf', locked: false },
      { id: 5, title: 'Entrenamiento de Velocidad', duration: '3h 20min', type: 'video', locked: false },
      { id: 6, title: 'Entrenamiento de Potencia', duration: '3h 10min', type: 'video', locked: false },
      { id: 7, title: 'Resistencia Aeróbica', duration: '2h 50min', type: 'video', locked: true },
      { id: 8, title: 'Resistencia Anaeróbica', duration: '2h 40min', type: 'video', locked: true },
      { id: 9, title: 'Psicología del Deporte', duration: '3h 00min', type: 'pdf', locked: true },
      { id: 10, title: 'Recuperación Avanzada', duration: '2h 30min', type: 'video', locked: true },
      { id: 11, title: 'Tecnología en el Deporte', duration: '2h 45min', type: 'video', locked: true },
      { id: 12, title: 'Análisis de Datos', duration: '3h 25min', type: 'pdf', locked: true },
      { id: 13, title: 'Periodización Táctica', duration: '3h 15min', type: 'video', locked: true },
      { id: 14, title: 'Alto Rendimiento', duration: '4h 00min', type: 'video', locked: true },
      { id: 15, title: 'Gestión de Cargas', duration: '2h 55min', type: 'pdf', locked: true },
      { id: 16, title: 'Peak Performance', duration: '3h 30min', type: 'video', locked: true },
      { id: 17, title: 'Competición Elite', duration: '3h 45min', type: 'video', locked: true },
      { id: 18, title: 'Proyecto Final', duration: '5h 00min', type: 'pdf', locked: true },
    ],
    totalModules: 18,
    price: 549
  }
};

const EXAM_QUESTIONS = {
  1: [
    { id: 1, question: '¿Cuál es el macronutriente más importante para la recuperación muscular?', options: ['Carbohidratos', 'Proteínas', 'Grasas', 'Fibra'], correct: 1 },
    { id: 2, question: '¿Cuántos gramos de proteína por kg se recomiendan para atletas?', options: ['0.8-1g', '1.2-2g', '3-4g', '5-6g'], correct: 1 },
    { id: 3, question: '¿Qué es la ventana anabólica?', options: ['Horario de comidas', 'Periodo post-entreno', 'Tiempo de ayuno', 'Duración del sueño'], correct: 1 },
    { id: 4, question: '¿Cuál es el combustible durante ejercicio de alta intensidad?', options: ['Grasas', 'Proteínas', 'Glucógeno', 'Cetonas'], correct: 2 },
    { id: 5, question: '¿Qué vitamina es esencial para vegetarianos deportistas?', options: ['Vitamina C', 'B12', 'Vitamina D', 'Vitamina K'], correct: 1 },
  ],
  2: [
    { id: 1, question: '¿Qué es el 1RM?', options: ['1 Repetición Máxima', '1 Rutina Mensual', '1 Resto Mínimo', '1 Rango Muscular'], correct: 0 },
    { id: 2, question: '¿Cuántas series son óptimas por músculo por semana?', options: ['1-5', '6-9', '10-20', '30-40'], correct: 2 },
    { id: 3, question: '¿Qué es la hipertrofia?', options: ['Pérdida muscular', 'Aumento muscular', 'Definición', 'Resistencia'], correct: 1 },
    { id: 4, question: '¿Rango de repeticiones ideal para fuerza?', options: ['1-5', '8-12', '15-20', '25-30'], correct: 0 },
    { id: 5, question: '¿Qué es la sobrecarga progresiva?', options: ['Entrenar más días', 'Aumentar peso gradualmente', 'Descansar más', 'Comer más'], correct: 1 },
  ],
  3: [
    { id: 1, question: '¿Sistema energético en sprints de 10 segundos?', options: ['Aeróbico', 'ATP-PC', 'Glucolítico', 'Oxidativo'], correct: 1 },
    { id: 2, question: '¿Qué es el VO2 Max?', options: ['Volumen máximo de oxígeno', 'Velocidad óptima', 'Variable oxidativa', 'Ventilación'], correct: 0 },
    { id: 3, question: '¿Descanso entre series de fuerza máxima?', options: ['30 seg', '1 min', '2-5 min', '10 min'], correct: 2 },
    { id: 4, question: '¿Qué es la periodización?', options: ['Organización en ciclos', 'Descanso activo', 'Dieta por fases', 'Horario fijo'], correct: 0 },
    { id: 5, question: '¿Herramienta para medir carga de entrenamiento?', options: ['Báscula', 'RPE/sRPE', 'Cronómetro', 'GPS'], correct: 1 },
  ]
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10001,
        padding: '1rem 1.5rem', borderRadius: '0.75rem',
        background: type === 'success' ? COLORS.success : type === 'error' ? COLORS.error : COLORS.info,
        color: 'white', fontWeight: 600, boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', gap: '0.75rem'
      }}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      {message}
    </motion.div>
  );
};

const Header = ({ onMenuToggle, currentUser, onLogout, onNavigate }) => (
  <header className="glass" style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
    background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  }}>
    <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentUser && (
          <button onClick={onMenuToggle} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white',
            cursor: 'pointer', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex'
          }}>
            <Menu size={22} />
          </button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
             onClick={() => onNavigate('store')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
     onClick={() => onNavigate('store')}>
  <img
    src="./logo-limpio.png"
    alt="GHC Nutrition"
    style={{
      height: '50px',
      width: '50px',
      objectFit: 'contain',
      borderRadius: '50%',
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
    }}
  />
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <span style={{ fontSize: '1rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
      GHC ACADEMY
    </span>
    <span style={{ color: COLORS.accent, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      SPORT THROUGH SCIENCE. HEALTH THROUGH PERFORMANCE.
    </span>
  </div>
</div>
  <img 
    src="/logo-limpio.png" 
    alt="GHC Nutrition" 
    style={{ 
      height: '50px', 
      width: '50px', 
      objectFit: 'contain',
      borderRadius: '50%',
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
    }} 
  />
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <span style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>
      GHC ACADEMY
    </span>
    <span style={{ color: COLORS.accent, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      SPORT THROUGH SCIENCE. HEALTH THROUGH PERFORMANCE.
    </span>
  </div>
</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {currentUser ? (
          <>
            <div style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>{currentUser.name}</div>
            <button onClick={onLogout} style={{
              padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem',
              color: COLORS.error, cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <LogOut size={18} />
              Logout
            </button>
          </>
        ) : (
          <button onClick={() => onNavigate('login')} style={{
            padding: '0.75rem 1.5rem', background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
            border: 'none', borderRadius: '0.75rem',
            color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <GraduationCap size={18} />
            Login
          </button>
        )}
      </div>
    </div>
  </header>
);

const Sidebar = ({ isOpen, onClose, currentPage, onNavigate, role }) => {
  const adminMenu = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'admin-students', label: 'Student Management', icon: Users },
    { id: 'admin-payments', label: 'Payments & Finance', icon: DollarSign },
    { id: 'admin-authorizations', label: 'Access Authorizations', icon: Lock },
    { id: 'admin-courses', label: 'Courses & Modules', icon: BookOpen },
    { id: 'admin-exams', label: 'Exams', icon: FileQuestion },
    { id: 'admin-automations', label: 'Automations', icon: Zap },
    { id: 'admin-history', label: 'History', icon: Activity },
  ];

  const studentMenu = [
    { id: 'student-dashboard', label: 'My Dashboard', icon: Home },
    { id: 'student-courses', label: 'My Courses', icon: BookOpen },
    { id: 'student-content', label: 'Content', icon: Video },
    { id: 'student-exams', label: 'Exams', icon: FileQuestion },
    { id: 'student-certificates', label: 'Certificates', icon: Award },
  ];

  const menu = role === 'admin' ? adminMenu : studentMenu;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)', zIndex: 9998
            }} />
        )}
      </AnimatePresence>

      <motion.aside initial={{ x: -320 }} animate={{ x: isOpen ? 0 : -320 }} transition={{ type: 'spring', damping: 25 }}
        className="glass" style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, width: '20rem', zIndex: 9999,
          borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto'
        }}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div style={{ color: 'white', fontWeight: 900, fontSize: '1.125rem' }}>
              {role === 'admin' ? 'ADMIN MENU' : 'MY ACADEMY'}
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer'
            }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <motion.button key={item.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1rem', borderRadius: '0.75rem',
                    background: isActive ? `${COLORS.accent}33` : 'transparent',
                    color: isActive ? COLORS.accent : 'rgba(255,255,255,0.7)',
                    border: 'none', cursor: 'pointer', fontWeight: 600,
                    width: '100%', textAlign: 'left', transition: 'all 0.3s'
                  }}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

const Login = ({ onLogin, showAdminButton }) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(null);

  const handleLogin = (loginType) => {
    setLoading(true);
    setType(loginType);
    setTimeout(() => {
      if (loginType === 'admin') {
        onLogin({ name: 'Admin GHC', role: 'admin' });
      } else {
        onLogin({ name: 'Juan Pérez García', role: 'student', studentId: 1 });
      }
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0A0A0A', padding: '2rem'
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass" style={{
          maxWidth: '28rem', width: '100%', borderRadius: '2rem',
          padding: '3rem', textAlign: 'center'
        }}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: '6rem', height: '6rem', margin: '0 auto 2rem',
            borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 900, color: 'white',
            boxShadow: `0 0 40px ${COLORS.accent}80`
          }}>G</motion.div>

        <h2 style={{
          fontSize: '2rem', fontWeight: 900, color: 'white',
          marginBottom: '0.5rem', fontFamily: 'Playfair Display, serif'
       <div 
  onClick={() => setCurrentPage('store')}
  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
>
  <img 
    src="/logo-limpio.png" 
    alt="GHC Nutrition" 
    style={{ 
      height: '50px', 
      width: '50px', 
      objectFit: 'contain',
      borderRadius: '50%',
      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
    }} 
  />
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <span style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>
      GHC ACADEMY
    </span>
    <span style={{ color: COLORS.accent, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      SPORT THROUGH SCIENCE. HEALTH THROUGH PERFORMANCE.
    </span>
  </div>
</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {showAdminButton && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleLogin('admin')} disabled={loading}
              className="hover-lift" style={{
                width: '100%', padding: '1.5rem',
                background: type === 'admin' && loading ? 'rgba(59,130,246,0.2)' : `linear-gradient(135deg, ${COLORS.info}, #1D4ED8)`,
                border: 'none', borderRadius: '1rem', color: 'white',
                fontSize: '1.125rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
              }}>
              {type === 'admin' && loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '1.5rem', height: '1.5rem', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%'
                  }} />
              ) : (
                <><Settings size={24} />Administrator Access<ChevronRight size={24} /></>
              )}
            </motion.button>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin('student')} disabled={loading}
            className="hover-lift" style={{
              width: '100%', padding: '1.5rem',
              background: type === 'student' && loading ? 'rgba(16,185,129,0.2)' : `linear-gradient(135deg, ${COLORS.success}, #059669)`,
              border: 'none', borderRadius: '1rem', color: 'white',
              fontSize: '1.125rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
            }}>
            {type === 'student' && loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '1.5rem', height: '1.5rem', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%'
                }} />
            ) : (
              <><GraduationCap size={24} />Student Access<ChevronRight size={24} /></>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass" style={{
              position: 'fixed', bottom: '6rem', right: '2rem', width: '22rem',
              borderRadius: '1.5rem', padding: '1.5rem', zIndex: 10000,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem' }}>🤖 AI Assistant</h4>
              <button onClick={() => setIsOpen(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer'
              }}><X size={20} /></button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Your personal assistant coming soon
            </p>
            <div className="glass-light" style={{ padding: '1rem', borderRadius: '0.75rem' }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                🎯 Features:
              </div>
              <ul style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                <li>Instant answers</li>
                <li>Personalized plans</li>
                <li>Progress analysis</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)} className="hover-lift" style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '3.5rem', height: '3.5rem', borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
          border: 'none', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, boxShadow: `0 10px 40px ${COLORS.accent}60`
        }}>
        <Brain size={24} />
      </motion.button>
    </>
  );
};

export default function GHCAcademy() {
  const [currentPage, setCurrentPage] = useState('store');
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [logs, setLogs] = useState([]);
  const [examInProgress, setExamInProgress] = useState(null);
  const [examAnswers, setExamAnswers] = useState([]);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const adminParam = params.get('admin');

    if (pageParam) {
      setCurrentPage(pageParam);
    }
    
    if (adminParam === '1') {
      setShowAdminButton(true);
    }
  }, []);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const addLog = (action, target, detail) => {
    setLogs(prev => [{
      id: Date.now(),
      action,
      user: currentUser?.name || 'System',
      target,
      detail,
      timestamp: new Date().toLocaleString()
    }, ...prev]);
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    handleNavigate(user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    handleNavigate('store');
  };

  const handlePurchase = (level) => {
    if (!currentUser) {
      setCurrentPage('login');
      showToast('Please login as a student to purchase', 'info');
      return;
    }

    if (currentUser.role !== 'student') {
      showToast('Only students can purchase courses', 'error');
      return;
    }

    const course = COURSE_LEVELS[level];
    const newTransaction = {
      id: Date.now(),
      studentId: currentUser.studentId,
      studentName: currentUser.name,
      amount: course.price,
      status: 'completed',
      method: 'Store Purchase',
      date: new Date().toISOString().split('T')[0],
      concept: `${course.name} - Store Purchase`,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    addLog('Course Purchased', currentUser.name, `Purchased ${course.name} for €${course.price}`);
    showToast(`Successfully purchased ${course.name}! 🎉`);
  };

  const blockStudent = (id) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'blocked' } : s));
    const student = students.find(s => s.id === id);
    addLog('Block', student.name, 'Access blocked by admin');
    showToast(`${student.name} blocked successfully`);
  };

  const unlockStudent = (id) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    const student = students.find(s => s.id === id);
    addLog('Unlock', student.name, 'Access restored by admin');
    showToast(`${student.name} unlocked successfully`);
  };

  const confirmPayment = (id) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'completed', time: new Date().toLocaleTimeString() } : t));
    const transaction = transactions.find(t => t.id === id);
    addLog('Payment Confirmed', transaction.studentName, `€${transaction.amount} processed manually`);
    showToast(`Payment of €${transaction.amount} confirmed`);
  };

  const unlockModule = (studentId, moduleId) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, modulesUnlocked: Math.max(s.modulesUnlocked, moduleId) } : s));
    const student = students.find(s => s.id === studentId);
    addLog('Module Unlocked', student.name, `Module ${moduleId} unlocked manually`);
    showToast(`Module unlocked for ${student.name}`);
  };

  const startExam = (level) => {
    setExamInProgress(level);
    setExamAnswers([]);
  };

  const submitExam = () => {
    const questions = EXAM_QUESTIONS[examInProgress];
    const correct = examAnswers.filter((answer, idx) => answer === questions[idx].correct).length;
    const score = (correct / questions.length) * 100;
    const passed = score >= 70;

    if (passed) {
      setStudents(prev => prev.map(s => s.id === currentUser.studentId ? {
        ...s,
        examsPassed: [...s.examsPassed, s.currentModule],
        modulesUnlocked: s.modulesUnlocked + 1,
        currentModule: s.currentModule + 1,
        progress: Math.min(100, Math.round(((s.examsPassed.length + 1) / COURSE_LEVELS[s.level].totalModules) * 100))
      } : s));
      showToast(`Exam passed with ${score.toFixed(0)}%! 🎉`);
    } else {
      showToast(`Exam failed with ${score.toFixed(0)}%. Keep studying! 💪`, 'error');
    }

    setExamInProgress(null);
    setExamAnswers([]);
  };

  const totalRevenue = transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingRevenue = transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const studentData = currentUser?.role === 'student' ? students.find(s => s.id === currentUser.studentId) : null;
  const currentCourse = studentData ? COURSE_LEVELS[studentData.level] : null;

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh' }}>
      <style>{globalStyles}</style>
      
      {currentUser && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
          currentPage={currentPage} onNavigate={handleNavigate} role={currentUser.role} />
      )}
      
      <Header onMenuToggle={() => setSidebarOpen(true)}
        currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} />

      <div style={{ paddingTop: '5rem' }}>
        {currentPage === 'login' && !currentUser && <Login onLogin={handleLogin} showAdminButton={showAdminButton} />}

        {currentPage === 'store' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem', fontFamily: 'Playfair Display' }}>
                Course Store
              </motion.h1>
              <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.6)', marginBottom: '3rem' }}>
                Choose your path to excellence
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {Object.entries(COURSE_LEVELS).map(([level, course], idx) => (
                  <motion.div key={level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass hover-lift" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <img src={course.image} alt={course.name} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                    <div style={{ padding: '2rem' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{course.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                        Level {level} • {course.totalModules} modules
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: COLORS.accent }}>€{course.price}</div>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => handlePurchase(level)}
                        style={{
                          width: '100%', padding: '1rem', background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
                          border: 'none', borderRadius: '0.75rem', color: 'white',
                          cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}>
                        <ShoppingCart size={20} />
                        Buy Now
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-dashboard' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem', fontFamily: 'Playfair Display' }}>
                Dashboard
              </motion.h1>
              <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.6)', marginBottom: '3rem' }}>
                Real-time operations center
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                  { label: 'Total Revenue', value: `€${totalRevenue}`, color: COLORS.success, icon: ArrowUpRight },
                  { label: 'Pending', value: `€${pendingRevenue}`, color: COLORS.warning, icon: Clock },
                  { label: 'Active Students', value: students.filter(s => s.status === 'active').length, color: COLORS.info, icon: Users },
                  { label: 'Blocked', value: students.filter(s => s.status === 'blocked').length, color: COLORS.error, icon: Lock },
                ].map((metric, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass hover-lift" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ padding: '0.875rem', borderRadius: '1rem', background: `${metric.color}33` }}>
                        <metric.icon size={28} color={metric.color} />
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: metric.color }}>{metric.value}</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{metric.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>📊 Recent Activity</h3>
                {logs.slice(0, 5).map((log, idx) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      padding: '1rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.03)',
                      borderRadius: '0.75rem', borderLeft: `3px solid ${COLORS.accent}`
                    }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{log.action}</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                      {log.target} • {log.detail} • {log.timestamp}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-students' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Student Management</h1>
              
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                {students.map((student, idx) => (
                  <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)',
                      borderRadius: '0.75rem'
                    }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{student.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                        Level {student.level} • {student.progress}% • {student.email}
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ height: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', overflow: 'hidden', width: '200px' }}>
                          <div style={{ width: `${student.progress}%`, height: '100%', background: COLORS.accent }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {student.status === 'blocked' ? (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => unlockStudent(student.id)} style={{
                            padding: '0.5rem 1rem', background: `${COLORS.success}33`,
                            border: 'none', borderRadius: '0.5rem', color: COLORS.success,
                            cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem'
                          }}>
                          <Unlock size={16} />Activate
                        </motion.button>
                      ) : (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => blockStudent(student.id)} style={{
                            padding: '0.5rem 1rem', background: `${COLORS.error}33`,
                            border: 'none', borderRadius: '0.5rem', color: COLORS.error,
                            cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem'
                          }}>
                          <Lock size={16} />Block
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => unlockModule(student.id, student.modulesUnlocked + 1)} style={{
                          padding: '0.5rem 1rem', background: `${COLORS.info}33`,
                          border: 'none', borderRadius: '0.5rem', color: COLORS.info,
                          cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem'
                        }}>
                        <Unlock size={16} />Unlock Module
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-payments' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Payments & Finance</h1>
              
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                {transactions.map((t, idx) => (
                  <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.03)',
                      borderRadius: '0.75rem'
                    }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.studentName}</div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                        {t.concept} • {t.date} {t.time}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        fontSize: '1.125rem', fontWeight: 700,
                        color: t.status === 'completed' ? COLORS.success : t.status === 'pending' ? COLORS.warning : COLORS.error
                      }}>
                        €{t.amount}
                      </div>
                      {t.status === 'pending' && (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => confirmPayment(t.id)} style={{
                            padding: '0.5rem 1rem', background: `${COLORS.success}33`,
                            border: 'none', borderRadius: '0.5rem', color: COLORS.success,
                            cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem'
                          }}>
                          <CheckCircle size={16} />Confirm
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-authorizations' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Access Authorizations</h1>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Module-level access control system</p>
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-courses' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Courses & Modules</h1>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {Object.entries(COURSE_LEVELS).map(([level, course]) => (
                  <motion.div key={level} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass hover-lift" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                    <img src={course.image} alt={course.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    <div style={{ padding: '2rem' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{course.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                        Level {level} • {course.totalModules} modules • €{course.price}
                      </div>
                      <button style={{
                        width: '100%', padding: '0.75rem', background: `${COLORS.accent}33`,
                        border: 'none', borderRadius: '0.5rem', color: COLORS.accent,
                        cursor: 'pointer', fontWeight: 700
                      }}>View Details</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-exams' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Exams</h1>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Exam review and grading system</p>
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-automations' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Automations</h1>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Automated process control</p>
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && currentPage === 'admin-history' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>History</h1>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>All Activity Logs ({logs.length})</h3>
                {logs.map((log) => (
                  <div key={log.id} style={{
                    padding: '1rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0.75rem'
                  }}>
                    <div style={{ fontWeight: 600 }}>{log.action} - {log.target}</div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                      {log.detail} • {log.user} • {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'student' && studentData && currentPage === 'student-dashboard' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '0.5rem', fontFamily: 'Playfair Display' }}>
                Hello, {studentData.name.split(' ')[0]}! 👋
              </motion.h1>
              <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.6)', marginBottom: '3rem' }}>
                Continue your path to sports excellence
              </p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass hover-lift" style={{ padding: '2.5rem', borderRadius: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>🎯 Your Overall Progress</h3>
                
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600 }}>Level {studentData.level}: {currentCourse.name}</span>
                    <span style={{ color: COLORS.accent, fontWeight: 900, fontSize: '1.5rem' }}>{studentData.progress}%</span>
                  </div>
                  <div style={{ height: '1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${studentData.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${COLORS.accent}, #FF6B35)`,
                        borderRadius: '1rem'
                      }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Modules Completed', value: studentData.modulesUnlocked, color: COLORS.success },
                    { label: 'Exams Passed', value: studentData.examsPassed.length, color: COLORS.info },
                    { label: 'Modules Remaining', value: currentCourse.totalModules - studentData.modulesUnlocked, color: COLORS.warning },
                  ].map((stat, idx) => (
                    <div key={idx} className="glass-light" style={{ padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass hover-lift" style={{
                  padding: '2rem', borderRadius: '1.5rem',
                  background: `linear-gradient(135deg, ${COLORS.accent}1A, rgba(255,107,53,0.05))`,
                  border: `2px solid ${COLORS.accent}4D`
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{
                    width: '4rem', height: '4rem', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Flame size={32} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: COLORS.accent, fontWeight: 700, marginBottom: '0.25rem' }}>
                      📚 NEXT RECOMMENDED STEP
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Module {studentData.currentModule}: {currentCourse.modules[studentData.currentModule - 1]?.title || 'Complete!'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                      {studentData.currentModule <= currentCourse.totalModules ? 'Continue your training!' : 'All modules completed! 🎉'}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate('student-content')} style={{
                      padding: '1rem 2rem', background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
                      border: 'none', borderRadius: '0.75rem', color: 'white',
                      fontWeight: 700, cursor: 'pointer'
                    }}>
                    Continue →
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {currentUser?.role === 'student' && studentData && currentPage === 'student-courses' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>My Courses</h1>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass hover-lift" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                <img src={currentCourse.image} alt={currentCourse.name}
                  style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                <div style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {currentCourse.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                    Level {studentData.level} • {currentCourse.totalModules} modules
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ height: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', overflow: 'hidden' }}>
                      <div style={{ width: `${studentData.progress}%`, height: '100%', background: COLORS.accent }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                      {studentData.progress}% completed
                    </div>
                  </div>
                  <button onClick={() => handleNavigate('student-content')} style={{
                    width: '100%', padding: '1rem', background: `${COLORS.accent}33`,
                    border: 'none', borderRadius: '0.75rem', color: COLORS.accent,
                    cursor: 'pointer', fontWeight: 700, fontSize: '1rem'
                  }}>
                    Access Course Content
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {currentUser?.role === 'student' && studentData && currentPage === 'student-content' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Course Content</h1>
              
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {currentCourse.modules.map((module, idx) => {
                    const isUnlocked = idx + 1 <= studentData.modulesUnlocked;
                    const isPassed = studentData.examsPassed.includes(idx + 1);
                    
                    return (
                      <motion.div key={module.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          padding: '1.5rem', background: isUnlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                          borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem',
                          opacity: isUnlocked ? 1 : 0.5,
                          border: `1px solid ${isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`
                        }}>
                        <div style={{
                          width: '3rem', height: '3rem', borderRadius: '0.75rem',
                          background: isPassed ? `${COLORS.success}33` : isUnlocked ? `${COLORS.accent}33` : 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.25rem', fontWeight: 900,
                          color: isPassed ? COLORS.success : isUnlocked ? COLORS.accent : 'rgba(255,255,255,0.3)'
                        }}>
                          {isPassed ? <Check size={24} /> : isUnlocked ? (idx + 1) : <Lock size={20} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                            {module.title}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                            {module.duration} • {module.type === 'video' ? '📹 Video' : '📄 PDF'}
                          </div>
                        </div>
                        {isUnlocked && !isPassed && (
                          <button onClick={() => handleNavigate('student-exams')} style={{
                            padding: '0.75rem 1.5rem', background: `${COLORS.accent}33`,
                            border: 'none', borderRadius: '0.5rem', color: COLORS.accent,
                            cursor: 'pointer', fontWeight: 700
                          }}>
                            Take Exam
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentUser?.role === 'student' && studentData && currentPage === 'student-exams' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Exam Center</h1>
              
              {!examInProgress ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass hover-lift" style={{ padding: '3rem', borderRadius: '1.5rem', textAlign: 'center' }}>
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Trophy size={100} color={COLORS.accent} style={{ margin: '0 auto 1.5rem' }} />
                  </motion.div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Module {studentData.currentModule} Exam
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                    5 questions • Pass with 70% • Unlimited time
                  </p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => startExam(studentData.level)} style={{
                      padding: '1.25rem 3rem', background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
                      border: 'none', borderRadius: '1rem', color: 'white',
                      fontSize: '1.125rem', fontWeight: 800, cursor: 'pointer',
                      boxShadow: `0 10px 40px ${COLORS.accent}40`
                    }}>
                    Start Exam
                  </motion.button>
                </motion.div>
              ) : (
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>
                    Answer all questions
                  </h3>
                  {EXAM_QUESTIONS[examInProgress].map((q, idx) => (
                    <div key={q.id} style={{ marginBottom: '2rem' }}>
                      <div style={{ fontWeight: 700, marginBottom: '1rem' }}>
                        {idx + 1}. {q.question}
                      </div>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {q.options.map((option, optIdx) => (
                          <motion.button key={optIdx} whileHover={{ x: 4 }}
                            onClick={() => {
                              const newAnswers = [...examAnswers];
                              newAnswers[idx] = optIdx;
                              setExamAnswers(newAnswers);
                            }}
                            style={{
                              padding: '1rem', background: examAnswers[idx] === optIdx ? `${COLORS.accent}33` : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${examAnswers[idx] === optIdx ? COLORS.accent : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: '0.75rem', color: 'white', cursor: 'pointer',
                              textAlign: 'left', fontWeight: examAnswers[idx] === optIdx ? 700 : 400
                            }}>
                            {option}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={submitExam}
                    disabled={examAnswers.length < EXAM_QUESTIONS[examInProgress].length}
                    style={{
                      width: '100%', padding: '1rem', background: examAnswers.length < EXAM_QUESTIONS[examInProgress].length ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${COLORS.success}, #059669)`,
                      border: 'none', borderRadius: '0.75rem', color: 'white',
                      fontSize: '1rem', fontWeight: 800, cursor: examAnswers.length < EXAM_QUESTIONS[examInProgress].length ? 'not-allowed' : 'pointer'
                    }}>
                    Submit Exam
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentUser?.role === 'student' && studentData && currentPage === 'student-certificates' && (
          <div style={{ padding: '2rem', color: 'white', minHeight: '100vh' }}>
            <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>My Certificates</h1>
              
              {studentData.progress === 100 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass hover-lift" style={{ padding: '3rem', borderRadius: '1.5rem', textAlign: 'center' }}>
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Award size={100} color={COLORS.accent} style={{ margin: '0 auto 2rem' }} />
                  </motion.div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Certificate Available!
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                    You completed 100% of {currentCourse.name}
                  </p>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '1.25rem 3rem', background: `linear-gradient(135deg, ${COLORS.accent}, #EF4444)`,
                      border: 'none', borderRadius: '1rem', color: 'white',
                      fontSize: '1.125rem', fontWeight: 800, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '0.75rem'
                    }}>
                    <Download size={24} />
                    Download Certificate
                  </motion.button>
                </motion.div>
              ) : (
                <div className="glass" style={{ padding: '3rem', borderRadius: '1.5rem', textAlign: 'center' }}>
                  <Lock size={80} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 1.5rem' }} />
                  <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.5rem', marginBottom: '1rem' }}>
                    Certificate Not Available
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Complete 100% of the course to unlock your official certificate
                  </p>
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                      Your current progress:
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: COLORS.accent }}>
                      {studentData.progress}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AIAssistant />
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
