/**
 * Admin Utilities for LocalStorage Management
 * Handles all data persistence and business logic for the admin panel
 */

const STORAGE_KEYS = {
  COURSES: 'ghc_admin_courses',
  USERS: 'ghc_admin_users',
  PAYMENTS: 'ghc_admin_payments',
  EXAMS: 'ghc_admin_exams',
  CERTIFICATES: 'ghc_admin_certificates',
  SETTINGS: 'ghc_admin_settings',
};

// Seed data for first-time initialization
const SEED_DATA = {
  courses: [
    {
      id: 'course_1',
      name: 'Nutrición Deportiva',
      level: 'Level 1',
      price: 349,
      description: 'Master sports nutrition fundamentals and meal planning',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
      modules: [
        {
          id: 'mod_1_1',
          title: 'Fundamentos de Nutrición',
          order: 1,
          content: 'Introduction to sports nutrition basics...',
          duration: '2h 30min',
          locked: false
        },
        {
          id: 'mod_1_2',
          title: 'Macronutrientes Esenciales',
          order: 2,
          content: 'Understanding proteins, carbs, and fats...',
          duration: '3h 15min',
          locked: true
        },
        {
          id: 'mod_1_3',
          title: 'Micronutrientes y Vitaminas',
          order: 3,
          content: 'Essential vitamins and minerals for athletes...',
          duration: '2h 45min',
          locked: true
        }
      ],
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'course_2',
      name: 'Entrenamiento de Fuerza',
      level: 'Level 2',
      price: 449,
      description: 'Advanced strength training techniques',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
      modules: [
        {
          id: 'mod_2_1',
          title: 'Introducción al Entrenamiento',
          order: 1,
          content: 'Strength training fundamentals...',
          duration: '2h 00min',
          locked: false
        },
        {
          id: 'mod_2_2',
          title: 'Anatomía Funcional',
          order: 2,
          content: 'Muscle groups and movement patterns...',
          duration: '3h 30min',
          locked: true
        }
      ],
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ],
  users: [
    {
      id: 'user_1',
      name: 'Juan Pérez García',
      email: 'juan@demo.com',
      phone: '+34 612 345 678',
      enrolledCourses: ['course_1'],
      progress: {
        course_1: {
          completedModules: ['mod_1_1'],
          currentModule: 'mod_1_2',
          examScores: { mod_1_1: 85 },
          overallProgress: 33
        }
      },
      isBlocked: false,
      createdAt: new Date('2024-01-15').toISOString()
    },
    {
      id: 'user_2',
      name: 'María García López',
      email: 'maria@demo.com',
      phone: '+34 623 456 789',
      enrolledCourses: ['course_1', 'course_2'],
      progress: {
        course_1: {
          completedModules: [],
          currentModule: 'mod_1_1',
          examScores: {},
          overallProgress: 0
        },
        course_2: {
          completedModules: ['mod_2_1'],
          currentModule: 'mod_2_2',
          examScores: { mod_2_1: 92 },
          overallProgress: 50
        }
      },
      isBlocked: false,
      createdAt: new Date('2024-02-20').toISOString()
    },
    {
      id: 'user_3',
      name: 'Carlos López Martín',
      email: 'carlos@demo.com',
      phone: '+34 634 567 890',
      enrolledCourses: ['course_2'],
      progress: {},
      isBlocked: true,
      createdAt: new Date('2024-03-10').toISOString()
    }
  ],
  payments: [
    {
      id: 'pay_1',
      userId: 'user_1',
      courseId: 'course_1',
      amount: 349,
      status: 'completed',
      method: 'SumUp',
      date: new Date('2024-01-15').toISOString(),
      concept: 'Nutrición Deportiva - Full Payment'
    },
    {
      id: 'pay_2',
      userId: 'user_2',
      courseId: 'course_1',
      amount: 349,
      status: 'completed',
      method: 'Transferencia',
      date: new Date('2024-02-20').toISOString(),
      concept: 'Nutrición Deportiva - Full Payment'
    },
    {
      id: 'pay_3',
      userId: 'user_2',
      courseId: 'course_2',
      amount: 449,
      status: 'pending',
      method: 'Transferencia',
      date: new Date('2024-02-20').toISOString(),
      concept: 'Entrenamiento de Fuerza - Installment 1/2'
    }
  ],
  exams: [
    {
      id: 'exam_1_1',
      moduleId: 'mod_1_1',
      courseId: 'course_1',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          question: '¿Cuál es el macronutriente más importante para la recuperación muscular?',
          options: ['Carbohidratos', 'Proteínas', 'Grasas', 'Fibra'],
          correctAnswer: 1
        },
        {
          id: 'q2',
          question: '¿Cuántos gramos de proteína por kg se recomiendan para atletas?',
          options: ['0.8-1g', '1.2-2g', '3-4g', '5-6g'],
          correctAnswer: 1
        },
        {
          id: 'q3',
          question: '¿Qué es la ventana anabólica?',
          options: ['Horario de comidas', 'Periodo post-entreno', 'Tiempo de ayuno', 'Duración del sueño'],
          correctAnswer: 1
        }
      ]
    },
    {
      id: 'exam_2_1',
      moduleId: 'mod_2_1',
      courseId: 'course_2',
      passingScore: 70,
      questions: [
        {
          id: 'q1',
          question: '¿Qué es el 1RM?',
          options: ['1 Repetición Máxima', '1 Rutina Mensual', '1 Resto Mínimo', '1 Rango Muscular'],
          correctAnswer: 0
        },
        {
          id: 'q2',
          question: '¿Cuántas series son óptimas por músculo por semana?',
          options: ['1-5', '6-9', '10-20', '30-40'],
          correctAnswer: 2
        }
      ]
    }
  ],
  certificates: [
    {
      id: 'cert_1',
      userId: 'user_1',
      courseId: 'course_1',
      issuedAt: new Date('2024-03-01').toISOString(),
      certificateNumber: 'GHC-2024-001',
      status: 'issued'
    }
  ],
  settings: {
    adminPassword: 'admin123',
    certificatesEnabled: true,
    antiPiracyEnabled: true,
    watermarkText: 'GHC Academy',
    allowDownloads: false
  }
};

/**
 * Initialize LocalStorage with seed data if empty
 */
export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(SEED_DATA.courses));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_DATA.users));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(SEED_DATA.payments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(SEED_DATA.exams));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(SEED_DATA.certificates));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_DATA.settings));
  }
}

/**
 * Generic getter/setter for LocalStorage
 */
export function getData(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Course Management
 */
export function getCourses() {
  return getData(STORAGE_KEYS.COURSES) || [];
}

export function getCourse(courseId) {
  const courses = getCourses();
  return courses.find(c => c.id === courseId);
}

export function createCourse(courseData) {
  const courses = getCourses();
  const newCourse = {
    id: `course_${Date.now()}`,
    ...courseData,
    modules: [],
    createdAt: new Date().toISOString(),
    isActive: true
  };
  courses.push(newCourse);
  setData(STORAGE_KEYS.COURSES, courses);
  return newCourse;
}

export function updateCourse(courseId, updates) {
  const courses = getCourses();
  const index = courses.findIndex(c => c.id === courseId);
  if (index !== -1) {
    courses[index] = { ...courses[index], ...updates };
    setData(STORAGE_KEYS.COURSES, courses);
    return courses[index];
  }
  return null;
}

export function deleteCourse(courseId) {
  const courses = getCourses().filter(c => c.id !== courseId);
  setData(STORAGE_KEYS.COURSES, courses);
}

/**
 * Module Management
 */
export function addModule(courseId, moduleData) {
  const courses = getCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const newModule = {
      id: `mod_${Date.now()}`,
      ...moduleData,
      order: course.modules.length + 1,
      locked: course.modules.length > 0
    };
    course.modules.push(newModule);
    setData(STORAGE_KEYS.COURSES, courses);
    return newModule;
  }
  return null;
}

export function updateModule(courseId, moduleId, updates) {
  const courses = getCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const moduleIndex = course.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex !== -1) {
      course.modules[moduleIndex] = { ...course.modules[moduleIndex], ...updates };
      setData(STORAGE_KEYS.COURSES, courses);
      return course.modules[moduleIndex];
    }
  }
  return null;
}

export function deleteModule(courseId, moduleId) {
  const courses = getCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    course.modules = course.modules.filter(m => m.id !== moduleId);
    setData(STORAGE_KEYS.COURSES, courses);
  }
}

/**
 * User Management
 */
export function getUsers() {
  return getData(STORAGE_KEYS.USERS) || [];
}

export function getUser(userId) {
  const users = getUsers();
  return users.find(u => u.id === userId);
}

export function updateUser(userId, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    setData(STORAGE_KEYS.USERS, users);
    return users[index];
  }
  return null;
}

export function blockUser(userId) {
  return updateUser(userId, { isBlocked: true });
}

export function unblockUser(userId) {
  return updateUser(userId, { isBlocked: false });
}

export function giftCourse(userId, courseId) {
  const user = getUser(userId);
  if (user) {
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      user.progress[courseId] = {
        completedModules: [],
        currentModule: null,
        examScores: {},
        overallProgress: 0
      };
      updateUser(userId, user);
      return true;
    }
  }
  return false;
}

/**
 * Exam Management
 */
export function getExams() {
  return getData(STORAGE_KEYS.EXAMS) || [];
}

export function getExam(moduleId) {
  const exams = getExams();
  return exams.find(e => e.moduleId === moduleId);
}

export function createExam(examData) {
  const exams = getExams();
  const newExam = {
    id: `exam_${Date.now()}`,
    ...examData,
    passingScore: examData.passingScore || 70
  };
  exams.push(newExam);
  setData(STORAGE_KEYS.EXAMS, exams);
  return newExam;
}

export function updateExam(examId, updates) {
  const exams = getExams();
  const index = exams.findIndex(e => e.id === examId);
  if (index !== -1) {
    exams[index] = { ...exams[index], ...updates };
    setData(STORAGE_KEYS.EXAMS, exams);
    return exams[index];
  }
  return null;
}

export function gradeExam(examId, answers) {
  const exam = getExams().find(e => e.id === examId);
  if (!exam) return null;

  let correctAnswers = 0;
  exam.questions.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      correctAnswers++;
    }
  });

  const score = Math.round((correctAnswers / exam.questions.length) * 100);
  const passed = score >= exam.passingScore;

  return { score, passed, correctAnswers, totalQuestions: exam.questions.length };
}

export function unlockNextModule(userId, courseId, moduleId) {
  const user = getUser(userId);
  const course = getCourse(courseId);
  
  if (!user || !course) return false;

  // Mark current module as completed
  if (!user.progress[courseId].completedModules.includes(moduleId)) {
    user.progress[courseId].completedModules.push(moduleId);
  }

  // Find next module
  const currentModule = course.modules.find(m => m.id === moduleId);
  const nextModule = course.modules.find(m => m.order === currentModule.order + 1);

  if (nextModule) {
    user.progress[courseId].currentModule = nextModule.id;
  }

  // Calculate overall progress
  user.progress[courseId].overallProgress = Math.round(
    (user.progress[courseId].completedModules.length / course.modules.length) * 100
  );

  updateUser(userId, user);
  return true;
}

/**
 * Payment Management
 */
export function getPayments() {
  return getData(STORAGE_KEYS.PAYMENTS) || [];
}

export function createPayment(paymentData) {
  const payments = getPayments();
  const newPayment = {
    id: `pay_${Date.now()}`,
    ...paymentData,
    date: new Date().toISOString()
  };
  payments.push(newPayment);
  setData(STORAGE_KEYS.PAYMENTS, payments);
  return newPayment;
}

export function updatePayment(paymentId, updates) {
  const payments = getPayments();
  const index = payments.findIndex(p => p.id === paymentId);
  if (index !== -1) {
    payments[index] = { ...payments[index], ...updates };
    setData(STORAGE_KEYS.PAYMENTS, payments);
    return payments[index];
  }
  return null;
}

export function markPaymentCompleted(paymentId) {
  const payment = updatePayment(paymentId, { status: 'completed' });
  
  // Grant course access to user
  if (payment) {
    giftCourse(payment.userId, payment.courseId);
  }
  
  return payment;
}

/**
 * Certificate Management
 */
export function getCertificates() {
  return getData(STORAGE_KEYS.CERTIFICATES) || [];
}

export function generateCertificate(userId, courseId) {
  const certificates = getCertificates();
  const user = getUser(userId);
  const course = getCourse(courseId);
  
  if (!user || !course) return null;

  const newCert = {
    id: `cert_${Date.now()}`,
    userId,
    courseId,
    issuedAt: new Date().toISOString(),
    certificateNumber: `GHC-${new Date().getFullYear()}-${String(certificates.length + 1).padStart(3, '0')}`,
    status: 'issued'
  };

  certificates.push(newCert);
  setData(STORAGE_KEYS.CERTIFICATES, certificates);
  return newCert;
}

export function createCertificateDataURL(certificate, userName, courseName) {
  // Create a simple certificate as data URL
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#ff7a3d';
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Title
  ctx.fillStyle = '#0b0b0b';
  ctx.font = 'bold 60px Playfair Display, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 150);

  // User name
  ctx.font = 'bold 48px Inter, sans-serif';
  ctx.fillText(userName, canvas.width / 2, 300);

  // Course name
  ctx.font = '36px Inter, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`has successfully completed`, canvas.width / 2, 380);
  ctx.font = 'bold 42px Inter, sans-serif';
  ctx.fillStyle = '#ff7a3d';
  ctx.fillText(courseName, canvas.width / 2, 450);

  // Date and certificate number
  ctx.font = '24px Inter, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(`Issued: ${new Date(certificate.issuedAt).toLocaleDateString()}`, canvas.width / 2, 580);
  ctx.fillText(`Certificate No: ${certificate.certificateNumber}`, canvas.width / 2, 620);

  // Logo text
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillStyle = '#0b0b0b';
  ctx.fillText('GHC ACADEMY', canvas.width / 2, 720);

  return canvas.toDataURL('image/png');
}

/**
 * Settings Management
 */
export function getSettings() {
  return getData(STORAGE_KEYS.SETTINGS) || SEED_DATA.settings;
}

export function updateSettings(updates) {
  const settings = getSettings();
  const newSettings = { ...settings, ...updates };
  setData(STORAGE_KEYS.SETTINGS, newSettings);
  return newSettings;
}

/**
 * Statistics
 */
export function getStatistics() {
  const courses = getCourses();
  const users = getUsers();
  const payments = getPayments();
  const certificates = getCertificates();

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeUsers = users.filter(u => !u.isBlocked).length;
  const blockedUsers = users.filter(u => u.isBlocked).length;

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  return {
    totalCourses: courses.length,
    activeCourses: courses.filter(c => c.isActive).length,
    totalUsers: users.length,
    activeUsers,
    blockedUsers,
    totalRevenue,
    pendingPayments,
    totalCertificates: certificates.length
  };
}
