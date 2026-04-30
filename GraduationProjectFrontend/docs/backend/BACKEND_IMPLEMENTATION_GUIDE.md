# Backend Implementation Guide - MERN Stack
## Graduation Project Management System - MongoDB, Express, Node.js

**Version:** 3.0 - MERN Stack  
**Last Updated:** December 2024  
**Purpose:** Complete implementation guide with actual MERN code examples

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [MongoDB Setup with Mongoose](#mongodb-setup)
3. [Complete API Implementation Examples](#api-implementation-examples)
4. [Authentication Implementation](#authentication-implementation)
5. [Middleware & Error Handling](#middleware--error-handling)
6. [File Upload Implementation](#file-upload-implementation)
7. [WebSocket Implementation](#websocket-implementation)
8. [Email Service Implementation](#email-service-implementation)
9. [Caching Strategy](#caching-strategy)
10. [Testing Examples](#testing-examples)
11. [Docker & Deployment](#docker--deployment)

---

## 1. Project Setup

### 1.1 Initialize Node.js Project

\`\`\`bash
mkdir graduation-project-backend
cd graduation-project-backend
npm init -y
\`\`\`

### 1.2 Install Dependencies

\`\`\`bash
# Core
npm install express typescript @types/express @types/node ts-node nodemon

# Database - MongoDB & Mongoose
npm install mongoose @types/mongoose
npm install mongodb

# Authentication
npm install jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
npm install express-validator

# File Upload
npm install multer @aws-sdk/client-s3 @types/multer sharp

# Real-time
npm install socket.io cors @types/cors

# Email
npm install nodemailer @types/nodemailer

# Cache
npm install redis ioredis @types/ioredis

# Utilities
npm install dotenv helmet express-rate-limit compression morgan uuid zod
\`\`\`

### 1.3 Project Structure

\`\`\`
backend/
├── src/
│   ├── config/
│   │   ├── database.ts        # MongoDB connection
│   │   ├── redis.ts           # Redis cache
│   │   └── aws.ts             # S3 config
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── teams.controller.ts
│   │   ├── tasks.controller.ts
│   │   ├── proposals.controller.ts
│   │   ├── submissions.controller.ts
│   │   └── notifications.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── upload.middleware.ts
│   ├── models/              # Mongoose schemas
│   │   ├── User.model.ts
│   │   ├── Team.model.ts
│   │   ├── Task.model.ts
│   │   ├── Proposal.model.ts
│   │   ├── Submission.model.ts
│   │   ├── Notification.model.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── teams.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── proposals.routes.ts
│   │   └── submissions.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── upload.service.ts
│   │   ├── notification.service.ts
│   │   └── cache.service.ts
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── hash.util.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── .env
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
\`\`\`

### 1.4 TypeScript Configuration (tsconfig.json)

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
\`\`\`

### 1.5 Environment Variables (.env)

\`\`\`env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/graduation_project
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/graduation_project?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS S3 (File Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=graduation-project-files

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@graduationproject.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
\`\`\`

---

## 2. MongoDB Setup with Mongoose

### 2.1 Database Connection (src/config/database.ts)

\`\`\`typescript
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      // Options for MongoDB connection
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
\`\`\`

### 2.2 Mongoose Models

#### User Model (src/models/User.model.ts)

\`\`\`typescript
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'teaching_assistant' | 'student';
  avatar?: string;
  department?: string;
  studentId?: string;
  phoneNumber?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  isActive: boolean;
  gamification: {
    level: number;
    xp: number;
    coins: number;
    streak: number;
    achievements: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'teaching_assistant', 'student'],
    default: 'student'
  },
  avatar: String,
  department: String,
  studentId: String,
  phoneNumber: String,
  bio: String,
  skills: [String],
  interests: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  gamification: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    achievements: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ 'gamification.xp': -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
\`\`\`

#### Team Model (src/models/Team.model.ts)

\`\`\`typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  projectTitle: string;
  projectDescription?: string;
  category: 'web' | 'mobile' | 'ai' | 'cybersecurity' | 'iot' | 'other';
  status: 'forming' | 'proposal' | 'active' | 'completed' | 'archived';
  isActive: boolean;
  academicYear: string;
  semester: 'Fall' | 'Spring' | 'Summer';
  members: {
    userId: mongoose.Types.ObjectId;
    role: 'leader' | 'member';
    joinedAt: Date;
  }[];
  supervisors: mongoose.Types.ObjectId[];
  technologies: string[];
  repositoryUrl?: string;
  demoUrl?: string;
  progress: number;
  currentPhase: 'planning' | 'requirements' | 'design' | 'implementation' | 'testing' | 'deployment';
  gamification: {
    level: number;
    xp: number;
    achievements: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  projectTitle: {
    type: String,
    required: [true, 'Project title is required'],
    maxlength: [200, 'Project title cannot exceed 200 characters']
  },
  projectDescription: {
    type: String,
    maxlength: [2000, 'Project description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['web', 'mobile', 'ai', 'cybersecurity', 'iot', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['forming', 'proposal', 'active', 'completed', 'archived'],
    default: 'forming'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    required: true
  },
  members: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['leader', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  supervisors: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  technologies: [String],
  repositoryUrl: String,
  demoUrl: String,
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  currentPhase: {
    type: String,
    enum: ['planning', 'requirements', 'design', 'implementation', 'testing', 'deployment'],
    default: 'planning'
  },
  gamification: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    achievements: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ category: 1 });
teamSchema.index({ academicYear: 1, semester: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ supervisors: 1 });

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

export const Team = mongoose.model<ITeam>('Team', teamSchema);
\`\`\`

#### Task Model (src/models/Task.model.ts)

\`\`\`typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  teamId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'frontend' | 'backend' | 'database' | 'design' | 'testing' | 'documentation' | 'other';
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachments: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }[];
  comments: {
    userId: mongoose.Types.ObjectId;
    comment: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  assignedTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['frontend', 'backend', 'database', 'design', 'testing', 'documentation', 'other'],
    required: true
  },
  dueDate: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [String],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ teamId: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ createdBy: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
\`\`\`

#### Proposal Model (src/models/Proposal.model.ts)

\`\`\`typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IProposal extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  teamId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>({
  title: {
    type: String,
    required: [true, 'Proposal title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
proposalSchema.index({ teamId: 1, status: 1 });
proposalSchema.index({ submittedBy: 1 });

export const Proposal = mongoose.model<IProposal>('Proposal', proposalSchema);
\`\`\`

#### Submission Model (src/models/Submission.model.ts)

\`\`\`typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  content: string;
  attachments: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
  }[];
  status: 'submitted' | 'graded' | 'resubmitted';
  grade?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['submitted', 'graded', 'resubmitted'],
    default: 'submitted'
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: Date
}, {
  timestamps: true
});

// Indexes
submissionSchema.index({ taskId: 1 });
submissionSchema.index({ teamId: 1 });
submissionSchema.index({ submittedBy: 1 });
submissionSchema.index({ status: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
\`\`\`

#### Notification Model (src/models/Notification.model.ts)

\`\`\`typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string; // e.g., 'new_message', 'task_assigned', 'team_invite'
  title: string;
  message: string;
  read: boolean;
  link?: string; // URL to navigate to
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [150, 'Notification title cannot exceed 150 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Notification message cannot exceed 500 characters']
  },
  read: {
    type: Boolean,
    default: false
  },
  link: String
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
\`\`\`

#### Index file for models (src/models/index.ts)

\`\`\`typescript
export * from './User.model';
export * from './Team.model';
export * from './Task.model';
export * from './Proposal.model';
export * from './Submission.model';
export * from './Notification.model';
\`\`\`

### 2.3 Seed Script (src/scripts/seed.ts)

\`\`\`typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.model';
import { Team } from '../models/Team.model';
import { Task } from '../models/Task.model';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@university.edu',
      password: 'Admin@123',
      role: 'admin',
      department: 'Computer Science',
      isActive: true
    });

    // Create Doctors
    const doctor1 = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu',
      password: 'Doctor@123',
      role: 'doctor',
      department: 'Computer Science',
      bio: 'Professor of Software Engineering',
      skills: ['Software Architecture', 'Agile', 'Web Development']
    });

    // Create Students
    const student1 = await User.create({
      name: 'John Smith',
      email: 'john.smith@student.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'CS2021001',
      department: 'Computer Science',
      skills: ['React', 'Node.js', 'MongoDB'],
      gamification: {
        level: 5,
        xp: 1250,
        coins: 500,
        streak: 7,
        achievements: ['First Task', 'Team Player']
      }
    });

    // Create Team
    const team1 = await Team.create({
      name: 'Team Alpha',
      description: 'E-commerce platform development team',
      projectTitle: 'Modern E-Commerce Platform',
      projectDescription: 'Building a full-stack e-commerce solution',
      category: 'web',
      status: 'active',
      academicYear: '2024',
      semester: 'Spring',
      members: [
        { userId: student1._id, role: 'leader', joinedAt: new Date() }
      ],
      supervisors: [doctor1._id],
      technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
      progress: 45,
      currentPhase: 'implementation'
    });

    console.log('Database seeded successfully!');
    console.log({
      admin: { email: admin.email, password: 'Admin@123' },
      doctor: { email: doctor1.email, password: 'Doctor@123' },
      student: { email: student1.email, password: 'Student@123' }
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
\`\`\`

---

## 3. Complete API Implementation Examples

### 3.1 Server Setup (src/server.ts)

\`\`\`typescript
import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database';
import { errorHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import teamRoutes from './routes/teams.routes';
import taskRoutes from './routes/tasks.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port ${PORT} in ${process.env.NODE_ENV} mode\`);
});
\`\`\`

### 3.2 App Configuration (src/app.ts)

This section is no longer needed as the server setup is handled directly in `src/server.ts` for the MERN stack.

### 3.3 Database Configuration (src/config/database.ts)

This is now handled in `src/config/database.ts` as shown in section 2.1.

### 3.4 Redis Configuration (src/config/redis.ts)

\`\`\`typescript
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));

// Cache helper functions (moved to src/services/cache.service.ts)
\`\`\`

---

## 4. Authentication Implementation

### 4.1 Auth Service (src/services/auth.service.ts)

\`\`\`typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';
import { AppError } from '../utils/errors';
import { cacheHelper } from './cache.service'; // Import cache service

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12); // Increased salt rounds for better security
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'doctor' | 'teaching_assistant' | 'student';
    department?: string;
    studentId?: string;
  }): Promise<{ user: Partial<IUser>, accessToken: string, refreshToken: string }> {
    const { name, email, password, role = 'student', department, studentId } = data;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email,
      password: passwordHash, // Store the hashed password
      role,
      department,
      studentId,
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user._id.toHexString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Cache user data (optional, useful for frequent profile lookups)
    await cacheHelper.set(`user:${user._id.toHexString()}`, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(email: string, password: string): Promise<{ user: Partial<IUser>, accessToken: string, refreshToken: string }> {
    // Find user
    const user = await User.findOne({ email }).select('+password'); // Select password to compare

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user._id.toHexString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Update user cache with login timestamp or other relevant info if needed
    // For simplicity, we'll just return the tokens and user info here.

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const payload = this.verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 404);
    }

    const newAccessToken = this.generateAccessToken({
      userId: user._id.toHexString(),
      email: user.email,
      role: user.role,
    });

    return { accessToken: newAccessToken };
  }

  static async logout(userId: string): Promise<void> {
    // In a real-world scenario, you would blacklist the refresh token here.
    // For this example, we'll simulate it by removing from cache if it was cached.
    await cacheHelper.del(`user:${userId}`);
    console.log(`User ${userId} logged out.`);
  }

  static async getProfile(userId: string): Promise<Partial<IUser> | null> {
    // Try to get from cache first
    const cachedUser = await cacheHelper.get<Partial<IUser>>(`user:${userId}`);
    if (cachedUser) {
      return cachedUser;
    }

    // If not in cache, fetch from DB
    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Store in cache for future requests
    await cacheHelper.set(`user:${user._id.toHexString()}`, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      studentId: user.studentId,
      department: user.department,
      // Add other relevant fields
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      studentId: user.studentId,
      department: user.department,
    };
  }
}
\`\`\`

### 4.2 Auth Controller (src/controllers/auth.controller.ts)

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/errors';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, department, studentId } = req.body;

      if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required', 400);
      }

      const result = await AuthService.register({
        name,
        email,
        password,
        role,
        department,
        studentId
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await AuthService.login(email, password);

      // Set refresh token as an httpOnly cookie for better security
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AppError('Refresh token is required. Please log in again.', 401);
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await AuthService.logout(userId);

      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      });

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await AuthService.getProfile(userId);

      if (!user) {
        throw new AppError('User profile not found', 404);
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
\`\`\`

### 4.3 Auth Middleware (src/middleware/auth.middleware.ts)

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no Bearer token, try to get from cookies (e.g., refresh token scenario, though typically access token is in header)
      // For access token, it MUST be in the header. This check is primarily for access token.
      throw new AppError('Authentication token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = AuthService.verifyAccessToken(token);

    req.user = payload; // Attach user info to request
    next();
  } catch (error) {
    // Handle JWT verification errors specifically if needed
    if (error instanceof AppError && (error.message === 'Invalid or expired token' || error.message === 'No token provided')) {
       return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error); // Pass other errors to the global error handler
  }
};

// Middleware to authorize roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This should ideally not happen if authenticate middleware is used first
      throw new AppError('User not authenticated', 401);
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      throw new AppError(`Forbidden: Insufficient permissions. Allowed roles are: ${roles.join(', ')}`, 403);
    }

    next();
  };
};
\`\`\`

### 4.4 Auth Routes (src/routes/auth.routes.ts)

\`\`\`typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// Schemas for validation
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'doctor', 'teaching_assistant', 'student']).optional(),
  department: z.string().optional(),
  studentId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh); // Route to refresh access token

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);

// Example of an admin-only route (requires authentication and authorization)
// router.get('/admin/users', authenticate, authorize('admin'), AuthController.getAllUsers);

export default router;
\`\`\`

---

## 5. Middleware & Error Handling

### 5.1 Error Handler (src/middleware/error.middleware.ts)

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import mongoose from 'mongoose';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Global Error Handler:', error.stack); // Log the full stack trace

  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = null; // For additional error details

  // Handle specific AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    // Optionally include operational details if available and safe to expose
    if (error.details) {
      details = error.details;
    }
  }
  // Handle Mongoose errors
  else if (error instanceof mongoose.Error) {
    // Check for specific Mongoose errors like validation errors
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      details = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key as keyof typeof error.errors].message
      }));
    } else if (error instanceof mongoose.CastError) { // e.g., invalid ObjectId format
      statusCode = 400;
      message = `Invalid ID format: ${error.path}`;
      details = { path: error.path, value: error.value };
    } else {
      statusCode = 400; // Generic Mongoose error
      message = 'Database error occurred';
      details = error.message;
    }
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }
  // Handle Zod validation errors
  else if (error instanceof Error && error.message.startsWith('Validation error:')) {
    try {
      const validationError = JSON.parse(error.message.split('Validation error: ')[1]);
      statusCode = 400;
      message = 'Validation Failed';
      details = validationError.errors;
    } catch (parseError) {
      // Fallback if JSON parsing fails
      statusCode = 400;
      message = 'Validation Failed';
      details = error.message;
    }
  }
  // Handle generic errors
  else {
    message = error.message; // Use the error message directly if not a known type
  }

  // Send JSON response
  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }), // Include details only if they exist
    // Optionally include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
\`\`\`

### 5.2 Validation Middleware (src/middleware/validation.middleware.ts)

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'), // Path to the field
          message: err.message,    // Error message
          code: err.code,          // Zod error code
        }));

        // Return a structured validation error response
        return res.status(400).json({
          success: false,
          message: 'Validation Failed',
          errors: errors,
        });
      }
      // If it's not a ZodError, pass it to the next error handler
      next(error);
    }
  };
};
\`\`\`

### 5.3 Custom Error Class (src/utils/errors.ts)

\`\`\`typescript
// Custom error class for handling application-specific errors
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any; // Optional field for more detailed error information

  constructor(message: string, statusCode: number, isOperational: boolean = true, details?: any) {
    super(message); // Call the parent Error constructor

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Capture the stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for correct instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
\`\`\`

---

## 6. Complete CRUD Examples

### 6.1 Teams Controller (src/controllers/teams.controller.ts)

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
import { Team, ITeam } from '../models/Team.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/errors';
import { cacheHelper } from '../services/cache.service'; // Assume cache service is available

export class TeamsController {

  // --- Helper Functions ---
  private static generateInviteCode(): string {
    return `TEAM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  // --- CRUD Operations ---

  /**
   * @description Get all teams with filtering, sorting, and pagination
   * @route GET /api/teams
   * @access Public (or Protected depending on requirements)
   */
  static async getAllTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        stage,
        visibility, // Assuming visibility is a field in Team model
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        category,
        semester,
        academicYear,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query for MongoDB
      const filter: any = {
        isActive: true, // Default to active teams
        // Add other default filters if necessary
      };

      if (stage) filter.status = stage; // Map 'stage' query param to 'status' field
      if (category) filter.category = category;
      if (semester) filter.semester = semester;
      if (academicYear) filter.academicYear = academicYear;
      // if (visibility) filter.visibility = visibility; // If visibility field exists

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { projectTitle: { $regex: search, $options: 'i' } },
        ];
      }

      // Cache key based on query parameters
      const cacheKey = `teams:${JSON.stringify(filter)}:page-${pageNum}:limit-${limitNum}:${sortBy}-${sortOrder}`;
      const cachedTeams = await cacheHelper.get<any>(cacheKey);

      if (cachedTeams) {
        console.log('Serving teams from cache');
        return res.json({
          success: true,
          data: cachedTeams,
          cached: true,
        });
      }

      // Build sort object for MongoDB
      const sort: any = {};
      if (sortBy && sortOrder) {
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
      }

      // Fetch teams from MongoDB
      const teams = await Team.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('members.userId', 'name email avatar studentId') // Populate member details
        .populate('supervisors', 'name email') // Populate supervisor details
        .lean(); // Use .lean() for performance if not modifying documents

      // Get total count for pagination
      const total = await Team.countDocuments(filter);

      const responseData = {
        teams: teams,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum * limitNum < total,
          hasPrevPage: pageNum > 1,
        },
      };

      // Store in cache (e.g., for 5 minutes)
      await cacheHelper.set(cacheKey, responseData, 300);

      res.json({
        success: true,
        data: responseData,
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Get a single team by ID
   * @route GET /api/teams/:id
   * @access Public (or Protected)
   */
  static async getTeamById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Basic validation for ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid team ID format', 400);
      }

      const team = await Team.findById(id)
        .populate('members.userId', 'name email avatar studentId role')
        .populate('supervisors', 'name email')
        .populate('tasks') // Optionally populate associated tasks
        .lean();

      if (!team) {
        throw new AppError('Team not found', 404);
      }

      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Create a new team
   * @route POST /api/teams
   * @access Protected (Requires authentication, typically 'student' or 'leader' role)
   */
  static async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId; // Authenticated user ID
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const {
        name,
        description,
        projectTitle,
        category,
        academicYear,
        semester,
        technologies,
        // supervisorId // Optional: If assigning a supervisor during creation
      } = req.body;

      // Basic validation
      if (!name || !description || !projectTitle || !category || !academicYear || !semester) {
        throw new AppError('Missing required team details', 400);
      }

      // Check if user is already in a team (optional, depends on business logic)
      const existingMembership = await Team.findOne({ 'members.userId': userId });
      if (existingMembership) {
        throw new AppError('User is already a member of a team', 400);
      }

      // Create the team with the logged-in user as the leader
      const newTeam = new Team({
        name,
        description,
        projectTitle,
        projectDescription: req.body.projectDescription,
        category,
        academicYear,
        semester,
        members: [{ userId: new mongoose.Types.ObjectId(userId), role: 'leader' }],
        technologies: technologies || [],
        inviteCode: TeamsController.generateInviteCode(), // Generate unique invite code
        // supervisors: supervisorId ? [new mongoose.Types.ObjectId(supervisorId)] : [],
      });

      // If a supervisor ID is provided, validate and add it
      if (req.body.supervisorId) {
        const supervisor = await User.findById(req.body.supervisorId);
        if (!supervisor || supervisor.role !== 'doctor') {
          throw new AppError('Invalid supervisor provided', 400);
        }
        newTeam.supervisors.push(new mongoose.Types.ObjectId(req.body.supervisorId));
      }

      await newTeam.save();

      // Invalidate cache for teams list to reflect the new team
      await cacheHelper.delPattern('teams:*'); // Clear all cached teams

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: newTeam,
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Update a team's details
   * @route PUT /api/teams/:id
   * @access Protected (Only leader or admin can update)
   */
  static async updateTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { role } = req.user!; // Get user role from authenticated request

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid team ID format', 400);
      }

      const team = await Team.findById(id);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Authorization check: Only team leader or admin can update
      const isLeader = team.members.some(member => member.userId.toString() === userId && member.role === 'leader');
      if (role !== 'admin' && !isLeader) {
        throw new AppError('You are not authorized to update this team', 403);
      }

      const updates = req.body;

      // Prevent updating certain fields directly via this endpoint if needed (e.g., members, inviteCode)
      delete updates.members;
      delete updates.inviteCode;
      delete updates.leaderId; // Leader is determined by the members array

      // Use findByIdAndUpdate for efficiency
      const updatedTeam = await Team.findByIdAndUpdate(id, updates, {
        new: true, // Return the updated document
        runValidators: true, // Ensure Mongoose validators are run
      })
        .populate('members.userId', 'name email avatar studentId')
        .populate('supervisors', 'name email')
        .lean();

      if (!updatedTeam) {
        // This case should ideally not happen if team was found earlier
        throw new AppError('Team not found after update attempt', 404);
      }

      // Invalidate cache for this specific team and the general teams list
      await cacheHelper.del(`team:${id}`);
      await cacheHelper.delPattern('teams:*');

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: updatedTeam,
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Delete a team
   * @route DELETE /api/teams/:id
   * @access Protected (Only leader or admin can delete)
   */
  static async deleteTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const { role } = req.user!;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid team ID format', 400);
      }

      const team = await Team.findById(id);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Authorization check: Only team leader or admin can delete
      const isLeader = team.members.some(member => member.userId.toString() === userId && member.role === 'leader');
      if (role !== 'admin' && !isLeader) {
        throw new AppError('You are not authorized to delete this team', 403);
      }

      // Perform the deletion
      await Team.findByIdAndDelete(id);

      // Invalidate cache
      await cacheHelper.del(`team:${id}`);
      await cacheHelper.delPattern('teams:*');

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Join a team using an invite code
   * @route POST /api/teams/join
   * @access Protected (Requires authentication)
   */
  static async joinTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteCode } = req.body;
      const userId = req.user?.userId;

      if (!inviteCode) {
        throw new AppError('Invite code is required', 400);
      }
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Find the team by invite code
      const team = await Team.findOne({ inviteCode, isActive: true })
        .populate('members.userId'); // Populate to check for existing membership easily

      if (!team) {
        throw new AppError('Invalid or expired invite code', 404);
      }

      // Check if the user is already a member
      const isAlreadyMember = team.members.some(member => member.userId?._id.toString() === userId);
      if (isAlreadyMember) {
        throw new AppError('You are already a member of this team', 400);
      }

      // Check team capacity (assuming maxMembers field exists in Team model)
      if (team.members.length >= (team.maxMembers || 6)) { // Use default 6 if maxMembers is not set
        throw new AppError('Team is full', 400);
      }

      // Add user to the team members
      team.members.push({
        userId: new mongoose.Types.ObjectId(userId),
        role: 'member', // Default role for joining
        joinedAt: new Date(),
      });

      // Save the updated team
      await team.save();

      // Invalidate cache
      await cacheHelper.del(`team:${team._id}`);
      await cacheHelper.delPattern('teams:*');

      res.json({
        success: true,
        message: 'Successfully joined team',
        data: { teamId: team._id, teamName: team.name },
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Leave a team
   * @route DELETE /api/teams/:id/leave
   * @access Protected (Requires authentication)
   */
  static async leaveTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // Team ID
      const userId = req.user?.userId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid team ID format', 400);
      }
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const team = await Team.findById(id);
      if (!team) {
        throw new AppError('Team not found', 404);
      }

      // Check if the user is a member
      const memberIndex = team.members.findIndex(member => member.userId.toString() === userId);
      if (memberIndex === -1) {
        throw new AppError('You are not a member of this team', 400);
      }

      const leavingMember = team.members[memberIndex];

      // Handle case where the last leader tries to leave
      if (leavingMember.role === 'leader' && team.members.filter(m => m.role === 'leader').length === 1) {
        // Option 1: Prevent leaving and ask to transfer leadership
        // throw new AppError('Cannot leave as the sole leader. Transfer leadership first.', 400);

        // Option 2: Allow leaving and automatically assign a new leader (e.g., first member) or archive team
        // For simplicity, let's allow it and remove the leader role. The system might need logic to assign new leader.
        console.warn(`Sole leader leaving team ${id}. Leadership might be unassigned.`);
      }

      // Remove the member
      team.members.splice(memberIndex, 1);

      // If the team becomes empty, you might want to archive or delete it
      if (team.members.length === 0) {
        team.isActive = false; // Mark as inactive instead of deleting immediately
        team.status = 'archived';
        await team.save();
        console.log(`Team ${id} is now empty and has been archived.`);
      } else {
        await team.save();
      }

      // Invalidate cache
      await cacheHelper.del(`team:${id}`);
      await cacheHelper.delPattern('teams:*');

      res.json({
        success: true,
        message: 'Successfully left team',
      });

    } catch (error) {
      next(error);
    }
  }

  // Add methods for assigning roles, inviting members, managing supervisors, etc. as needed
}
\`\`\`

---

## 7. File Upload Implementation

(This section is a placeholder and will be detailed in the full documentation.)

---

## 8. WebSocket Implementation

(This section is a placeholder and will be detailed in the full documentation.)

---

## 9. Email Service Implementation

(This section is a placeholder and will be detailed in the full documentation.)

---

## 10. Caching Strategy

### 10.1 Redis Configuration (src/config/redis.ts)

(This code is the same as provided in section 3.4, moved here for clarity in the MERN context)

\`\`\`typescript
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));
\`\`\`

### 10.2 Cache Service (src/services/cache.service.ts)

\`\`\`typescript
import { redis } from '../config/redis';

export const cacheHelper = {
  /**
   * @description Get data from Redis cache.
   * @param {string} key - The cache key.
   * @returns {Promise<T | null>} - The cached data or null if not found.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * @description Set data in Redis cache with an expiration time.
   * @param {string} key - The cache key.
   * @param {*} value - The data to cache.
   * @param {number} [expirationSeconds=3600] - Expiration time in seconds (default 1 hour).
   * @returns {Promise<void>}
   */
  async set(key: string, value: any, expirationSeconds: number = 3600): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', expirationSeconds);
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
    }
  },

  /**
   * @description Delete a key from Redis cache.
   * @param {string} key - The cache key to delete.
   * @returns {Promise<void>}
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
    }
  },

  /**
   * @description Delete multiple keys matching a pattern from Redis cache.
   * @param {string} pattern - The pattern to match keys (e.g., 'users:*').
   * @returns {Promise<void>}
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`Redis DEL pattern error for pattern ${pattern}:`, error);
    }
  },
};
\`\`\`

---

## 11. Docker & Deployment

(This section is a placeholder and will be detailed in the full documentation.)

---

## Summary

This implementation guide provides:
- ✅ Complete project structure for MERN stack
- ✅ MongoDB setup with Mongoose schemas
- ✅ Authentication with JWT and secure cookie handling
- ✅ Middleware for validation, authentication, and error handling
- ✅ CRUD operations for core entities (Users, Teams) with Mongoose models
- ✅ Redis caching integration
- ✅ Preparation for File Uploads, WebSockets, and Email services
- ✅ Production-ready patterns and configurations

**Continue reading BACKEND_COMPLETE_DOCUMENTATION.md for:**
- File storage implementation (e.g., AWS S3)
- WebSocket real-time features
- Email service configuration and usage
- Complete API endpoints for all entities (Tasks, Proposals, Submissions, Notifications)
- Testing strategies (Unit, Integration, E2E)
- Dockerizing the application
- Deployment strategies (e.g., to cloud platforms)
