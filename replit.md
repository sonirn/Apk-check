# SecureAPK Analyzer - Replit Configuration

## Overview

SecureAPK Analyzer is a professional mobile application security testing tool designed to perform comprehensive security analysis on Android APK files. The application provides automated vulnerability detection, detailed security reporting, and professional-grade analysis results through an intuitive web interface.

## System Architecture

The application follows a full-stack architecture pattern with clear separation between frontend, backend, and data layers:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom security-themed color palette
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Processing**: Multer for handling APK file uploads
- **API Design**: RESTful API endpoints for analysis operations
- **Development Server**: Vite integration for seamless development experience

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Production Storage**: PostgreSQL database with automated schema initialization

## Key Components

### 1. APK Analysis Engine
- Automated security scanning with mock analysis results
- Vulnerability detection across multiple security categories
- Security scoring system with critical/warning issue classification
- Comprehensive metadata extraction (package name, version, permissions)

### 2. Security Categories
The system analyzes 16 different security categories:
- Reconnaissance and information gathering
- Subdomain and directory enumeration
- Port scanning and vulnerability detection
- Authentication and session management testing
- Input validation and injection attacks (SQL, XSS, CSRF)
- File inclusion and remote code execution
- Business logic and access control testing

### 3. File Upload System
- APK file validation and size restrictions (100MB limit)
- Secure file handling with temporary storage
- Progress tracking and real-time status updates
- Error handling for invalid file types

### 4. Reporting System
- Detailed vulnerability reports with severity classifications
- Export functionality for analysis results
- Historical analysis tracking
- Real-time analysis status monitoring

## Data Flow

1. **File Upload**: Users upload APK files through the web interface
2. **Analysis Queue**: Files are processed and analysis status is tracked
3. **Security Analysis**: Mock analysis generates comprehensive security reports
4. **Data Storage**: Results are stored in PostgreSQL with structured JSON data
5. **Report Generation**: Users can view detailed reports and export results
6. **Real-time Updates**: Frontend polls for analysis status updates

## External Dependencies

### Development Dependencies
- **TypeScript**: Type safety and enhanced developer experience
- **ESBuild**: Fast JavaScript bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS
- **React Dropzone**: File upload interface component

### Production Dependencies
- **Drizzle ORM**: Type-safe database operations
- **Zod**: Schema validation and type inference
- **Date-fns**: Date manipulation utilities
- **React Hook Form**: Form state management with validation

### UI Component Libraries
- **Radix UI**: Unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Component variant management

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit integration
- **Database**: PostgreSQL 16 with automatic provisioning
- **Build Process**: Vite development server with hot module replacement
- **Port Configuration**: Application runs on port 5000 with external port 80

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: ESBuild compilation with Node.js module bundling
- **Database**: Drizzle push command for schema deployment
- **Deployment**: Replit autoscale deployment target

### Environment Configuration
- **Development**: `npm run dev` starts both frontend and backend
- **Production**: `npm run build` followed by `npm run start`
- **Database**: `npm run db:push` for schema migrations

## Changelog

- June 24, 2025. Production-ready APK security analysis platform:
  - Real APK file extraction and analysis using yauzl and xml2js
  - Comprehensive vulnerability detection across 25 security categories
  - Advanced pattern matching for XSS, CSRF, SSRF, IDOR, and RCE vulnerabilities
  - Real-time source code analysis for Java and Kotlin files
  - Professional security reporting with CVSS scoring and compliance mapping
  - Automated dev mode APK generation with sandbox features
  - In-app purchase testing integration with Google Play Billing sandbox
  - APK signing and installation-ready package generation
  - PostgreSQL database integration for analysis persistence
  - Executive summary reporting with OWASP compliance assessment
  - Network security config injection for penetration testing
  - SSL bypass and root detection bypass for comprehensive testing
  - Professional-grade remediation recommendations and action plans

## User Preferences

Preferred communication style: Simple, everyday language.
