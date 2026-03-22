# Student Dropout Prevention System - Project Overview

## What is This Application?

The **Student Dropout Prevention System** is an AI-powered web application designed for educational institutions to identify at-risk students early and provide timely interventions. It analyzes academic performance, attendance, and behavioral data to predict dropout risk and generate personalized counseling recommendations.

## Core Purpose

- **Predict**: Use 7+ data points to calculate risk scores
- **Identify**: Categorize students as High, Medium, or Low risk
- **Intervene**: Enable counselors and teachers to track and support at-risk students
- **Improve**: Provide AI-generated improvement suggestions via Google Gemini API

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 7 |
| **Styling** | Tailwind CSS + shadcn/ui (Radix UI components) |
| **Routing** | React Router v6 |
| **State** | React Query (TanStack Query) |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **AI** | Google Gemini API (optional) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  (Index → Login → Role-based Dashboards)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌───────────┐  ┌──────────┐  ┌─────────────┐
│ Supabase  │  │ Gemini   │  │  Services   │
│ Auth + DB │  │ AI API   │  │ (database.ts)│
└───────────┘  └──────────┘  └─────────────┘
```

## Key Concepts Used

### 1. Role-Based Access Control (RBAC)
Three user roles with distinct dashboards:
- **Student**: View own performance, risk, timetable, events
- **Teacher**: Manage students, enter performance data, view risk by subject
- **HOD (Head of Department)**: Department-wide analytics, teachers, timetable, events

### 2. 7-Point Risk Assessment Algorithm
Weighted scoring based on:
- Marks (25 pts max)
- Attendance (20 pts max)
- Assignment Completion (15 pts max)
- Class Participation (12 pts max)
- Motivation Level (15 pts max)
- Stress Level (10 pts max)
- Past Failures/Backlogs (20 pts max)

**Risk Levels**: High (60+), Medium (30-59), Low (0-29)

### 3. Service Layer Pattern
All data operations go through `lib/database.ts`:
- authService, studentService, teacherService, hodService
- performanceService, riskService, counselingService
- timetableService, eventService

### 4. Supabase Integration
- **Authentication**: Email/password with role mapping in `users` table
- **Database**: PostgreSQL with RLS (Row Level Security)
- **Real-time ready**: Client designed for Supabase patterns
