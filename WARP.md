# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Civic Pulse is a web application for SIH 2025 promoting clean and green technology initiatives within Jharkhand. The application facilitates citizen engagement with environmental projects, issue reporting, and project tracking. It's built as a full-stack application with a React TypeScript frontend and a Node.js Express backend.

## Development Commands

### Frontend Development
- `npm run dev` or `bun run dev` - Start Vite development server (port 5173)
- `npm run build` or `bun build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Backend Development (in `/server` directory)
- `npm run dev` - Start server with nodemon (port 5000)
- `npm start` - Start production server

### Environment Setup
The application requires environment variables:
- Frontend: Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Backend: Create `server/.env` with database and API credentials
- Backend requires `server/key.json` for Google Cloud Vision image analysis. Without it, image analysis returns an error, but the API server and authentication remain available.

## Architecture

### Frontend Structure
The React application follows a standard component-based architecture:

- **Router Configuration**: Uses React Router for SPA routing with routes defined in `App.tsx`
- **Page Components**: Located in `src/pages/` - each major route has its own page component
- **Reusable Components**: Organized in `src/components/` with subdirectories:
  - `Home/` - Landing page sections (Hero, Features, Stats, CTA, Chatbot)
  - `Layout/` - Header and Footer components
  - `Notifications/` - Notification system components
  - `Theme/` - Dark mode theme provider and toggle
- **UI Components**: Uses shadcn/ui components built on Radix UI primitives
- **State Management**: React Query for server state, Context API for theme and global state
- **Styling**: Tailwind CSS with custom design system including dark mode support

### Backend Structure
Express.js server with modular route organization:

- **Main Server**: `server/index.js` handles CORS, JSON parsing, and route mounting
- **Google Cloud Vision**: Image analysis endpoint at `/vision` for OCR and label detection  
- **Modular APIs**: Separate files for notifications (`notifications.js`) and contact (`contact.js`)
- **Database**: MongoDB via Mongoose ODM
- **External Services**: Twilio for SMS, Nodemailer for email

### Key Integrations
- **Supabase**: Primary database and authentication (config in `supabase/config.toml`)
- **Google Cloud Vision**: Image processing and OCR capabilities
- **Google Maps**: Map exploration functionality with `@react-google-maps/api`
- **Leaflet**: Alternative mapping solution with `react-leaflet`

## Key Features and Pages

### Core Pages
- **Index**: Landing page with hero section, features, stats, and CTA
- **MapExplorer**: Interactive map for exploring environmental initiatives
- **ReportIssue**: Citizen reporting system for environmental issues
- **AdminDashboard**: Administrative interface for managing reports and projects
- **Login/Account**: User authentication and profile management

### Component Patterns
- **Theme System**: Custom dark/light theme implementation with CSS variables
- **Form Handling**: React Hook Form with Zod validation
- **Notifications**: Toast system using Sonner and shadcn/ui toaster
- **Responsive Design**: Mobile-first approach with extensive Tailwind breakpoints

## Development Guidelines

### Styling Conventions
- Uses CSS-in-JS approach via Tailwind CSS
- Custom color palette defined in `tailwind.config.ts` with semantic color names
- Extensive animation library with custom keyframes for micro-interactions
- Design system follows shadcn/ui conventions for consistency

### TypeScript Configuration
- Strict TypeScript configuration in `tsconfig.json`
- Separate app-specific config in `tsconfig.app.json`
- Vite environment types in `vite-env.d.ts`

### Component Architecture
- Functional components with hooks
- Custom hooks in `src/hooks/` for reusable logic (mobile detection, toast system)
- Component composition over inheritance
- Props interfaces typically defined inline or in separate `.types.ts` files

### API Integration Patterns
- React Query for data fetching and caching
- Axios for HTTP requests
- Custom API utilities in `src/lib/`
- Environment-based API endpoints

## Package Manager Support
The project supports multiple package managers with lock files for:
- npm (`package-lock.json`)
- bun (`bun.lockb`)  
- pnpm (`pnpm-lock.yaml`)

Choose one and stick with it for consistency across the development team.

## Testing and Quality
- ESLint configuration for code quality
- TypeScript for type safety
- Component and utility testing should follow React Testing Library patterns (infrastructure exists but tests need to be added)

## Deployment Considerations
- Frontend builds to static files via Vite
- Backend requires Node.js runtime with environment variables
- Supabase handles database hosting
- Google Cloud Vision API requires service account key file
