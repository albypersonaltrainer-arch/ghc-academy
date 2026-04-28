# GHC Academy - Premium Sports Training Platform

A modern educational platform for sports training courses with comprehensive admin panel, cart/checkout functionality, and dual-role dashboard system.

## Features

### Public Store
- Browse and purchase courses without login
- Shopping cart with checkout (no authentication required)
- Responsive design for all devices

### Student Dashboard
- Track enrolled courses and progress
- Module-based learning with auto-graded exams
- Progress tracking and certificates

### Admin Panel
- Complete course and module management
- User management (block/unblock, impersonation, gift courses)
- Payment tracking and management
- Certificate generation and distribution
- Anti-piracy protection features
- LocalStorage-based persistence (demo mode)

## Installation

```bash
npm install
```

## Development

**Run the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Access Points

- **Storefront**: `http://localhost:5173`
- **Admin Panel**: `http://localhost:5173/?admin=1`

## Build

**Create a production build:**
```bash
npm run build
```

**Preview the production build:**
```bash
npm run preview
```

## Admin Panel Access

### Authentication

1. Navigate to `http://localhost:5173/?admin=1`
2. Enter admin password
3. Default password: `admin123`

**Security Note**: This is a client-side demo implementation. In production, implement proper server-side authentication with secure password hashing, session management, and HTTPS.

### Admin Features

#### 1. Course Management
- **Create/Edit/Delete Courses**: Full CRUD operations
- **Module Management**: Add, edit, delete, and reorder modules
- **Content Upload**: Store module content and metadata
- **Exam Configuration**: Create multiple-choice exams per module with passing thresholds

#### 2. User Management
- **View All Users**: Complete user list with enrollment status
- **Block/Unblock**: Prevent or restore user access
- **Impersonation**: View platform from user's perspective (useful for support)
- **Gift Courses**: Manually grant course access to users

#### 3. Exam System
- **Auto-Grading**: Multiple-choice questions with automatic scoring
- **Passing Threshold**: Configurable passing score (default 70%)
- **Module Unlock**: Automatically unlock next module upon passing
- **Score Tracking**: Store exam results in user progress

#### 4. Certificates
- **Auto-Generation**: Create certificates upon course completion
- **Download**: Generate downloadable certificate images
- **Certificate Numbers**: Unique sequential numbering (format: GHC-YYYY-###)
- **Status Tracking**: Monitor issued certificates

#### 5. Payment Management
- **Payment Records**: Track all course purchases
- **Manual Confirmation**: Mark pending payments as completed
- **Course Access**: Automatically grant course access upon payment completion

#### 6. Anti-Piracy Features (Client-Side)
- **Right-Click Protection**: Disable context menu on protected content
- **Text Selection**: Prevent text selection on course content
- **Watermark Overlay**: Display user email/ID across content
- **Download Prevention**: Disable content downloads (configurable)

**Important Security Limitations**:
- These are client-side protections only
- Can be bypassed by determined users
- **Recommended for Production**:
  - Server-side content delivery with authentication
  - Encrypted content streams
  - Session-based access control
  - IP tracking and rate limiting
  - DRM for video content
  - Watermarking at server level

#### 7. Settings
- **Admin Password**: Change admin authentication password
- **Feature Toggles**: Enable/disable certificates, anti-piracy, downloads
- **Watermark Configuration**: Customize watermark text

## LocalStorage Data Schema

The admin panel uses browser LocalStorage for demo persistence. Data is stored in the following keys:

### Storage Keys

```javascript
{
  "ghc_admin_courses": [...],      // Course catalog with modules
  "ghc_admin_users": [...],        // User accounts and progress
  "ghc_admin_payments": [...],     // Payment transactions
  "ghc_admin_exams": [...],        // Exam questions and config
  "ghc_admin_certificates": [...], // Issued certificates
  "ghc_admin_settings": {...}      // Admin configuration
}
```

### Data Structures

#### Course Object
```javascript
{
  id: "course_1",
  name: "Nutrición Deportiva",
  level: "Level 1",
  price: 349,
  description: "Course description...",
  image: "https://...",
  modules: [
    {
      id: "mod_1_1",
      title: "Module Title",
      order: 1,
      content: "Module content...",
      duration: "2h 30min",
      locked: false
    }
  ],
  createdAt: "2024-01-15T10:00:00.000Z",
  isActive: true
}
```

#### User Object
```javascript
{
  id: "user_1",
  name: "Juan Pérez García",
  email: "juan@demo.com",
  phone: "+34 612 345 678",
  enrolledCourses: ["course_1"],
  progress: {
    course_1: {
      completedModules: ["mod_1_1"],
      currentModule: "mod_1_2",
      examScores: { mod_1_1: 85 },
      overallProgress: 33
    }
  },
  isBlocked: false,
  createdAt: "2024-01-15T10:00:00.000Z"
}
```

#### Payment Object
```javascript
{
  id: "pay_1",
  userId: "user_1",
  courseId: "course_1",
  amount: 349,
  status: "completed", // "pending" | "completed" | "failed"
  method: "SumUp",
  date: "2024-01-15T10:00:00.000Z",
  concept: "Nutrición Deportiva - Full Payment"
}
```

#### Exam Object
```javascript
{
  id: "exam_1_1",
  moduleId: "mod_1_1",
  courseId: "course_1",
  passingScore: 70,
  questions: [
    {
      id: "q1",
      question: "Question text?",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: 1 // Index of correct option
    }
  ]
}
```

#### Certificate Object
```javascript
{
  id: "cert_1",
  userId: "user_1",
  courseId: "course_1",
  issuedAt: "2024-03-01T10:00:00.000Z",
  certificateNumber: "GHC-2024-001",
  status: "issued"
}
```

#### Settings Object
```javascript
{
  adminPassword: "admin123",
  certificatesEnabled: true,
  antiPiracyEnabled: true,
  watermarkText: "GHC Academy",
  allowDownloads: false
}
```

### Clearing Data

To reset all admin data:
```javascript
localStorage.clear();
```

Or clear specific data:
```javascript
localStorage.removeItem('ghc_admin_courses');
localStorage.removeItem('ghc_admin_users');
// etc.
```

## Logo Setup

Place your `logo-limpio.png` file in the `public/` directory at the project root. The app references it as `/logo-limpio.png`.

## Production Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository
2. Connect your repo to Vercel
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy!

### Security Recommendations for Production

#### Authentication & Authorization
- Implement server-side authentication (JWT, OAuth, or session-based)
- Use secure password hashing (bcrypt, Argon2)
- Implement role-based access control (RBAC)
- Enable HTTPS/TLS for all communications
- Add rate limiting to prevent brute force attacks

#### Content Protection
- **Server-Side Content Delivery**:
  - Store content in secure cloud storage (AWS S3, CloudFlare R2)
  - Generate signed URLs with expiration
  - Implement session-based access control
  
- **Video Protection** (if using video content):
  - Use DRM (Digital Rights Management)
  - Implement adaptive bitrate streaming (HLS, DASH)
  - Add server-side watermarking with user identification
  
- **Document Protection**:
  - Convert PDFs to images server-side
  - Use document viewers that prevent downloading
  - Implement document expiration
  
- **API Security**:
  - Authenticate all API requests
  - Implement request signing
  - Use CORS properly
  - Add API rate limiting

#### Data Protection
- **Database**: Use proper database (PostgreSQL, MongoDB) instead of LocalStorage
- **Encryption**: Encrypt sensitive data at rest and in transit
- **Backups**: Implement automated backup system
- **Audit Logs**: Track all admin actions and user activities

#### Monitoring & Analytics
- Implement error tracking (Sentry, LogRocket)
- Add analytics for user behavior
- Monitor for suspicious activities
- Set up alerts for critical events

#### Performance
- Implement CDN for static assets
- Use lazy loading for course content
- Optimize images and videos
- Enable caching strategies

### Environment Variables

For production, use environment variables for sensitive configuration:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_ADMIN_SECRET=your-secure-secret
VITE_STRIPE_KEY=pk_live_...
```

## Tech Stack

- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **LocalStorage** - Demo data persistence (replace with database in production)

## Project Structure
