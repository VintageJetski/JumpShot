# Overview

The CS2 Analytics Platform is a comprehensive full-stack application designed to analyze Counter-Strike 2 player and team performance using advanced metrics and positional data. The system processes authentic match data from IEM Katowice 2025 to calculate Player Impact Value (PIV) scores and Team Impact Rating (TIR) values, providing detailed analytics for scouting, team composition analysis, and match prediction.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom gradient themes
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query for server state and local React state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Data Processing**: In-memory storage with hybrid caching system
- **File Processing**: CSV parsing using csv-parse library
- **API Design**: RESTful endpoints with JSON responses

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Caching Layer**: In-memory storage with Map-based caching
- **File Storage**: CSV files stored in attached_assets directory
- **Session Management**: connect-pg-simple for PostgreSQL session store

# Key Components

## Data Processing Pipeline
1. **CSV Parsers**: Multiple specialized parsers for different data types
   - Player statistics parser (newDataParser.ts)
   - Role assignments parser (roleParser.ts) 
   - XYZ positional data parser (xyzDataParser.ts)
   - Round-level data parser for match analytics

2. **Analytics Engines**:
   - Player Impact Value (PIV) calculation system
   - Team Impact Rating (TIR) computation
   - Role-specific metrics evaluation
   - Positional analysis from XYZ coordinates

3. **Storage Layer**: Hybrid storage system combining database persistence with in-memory caching for performance

## Frontend Components
- **Dashboard**: Main analytics interface with data visualization
- **Player Analysis**: Individual player performance breakdowns
- **Team Analysis**: Team composition and synergy evaluation
- **Match Predictor**: AI-powered match outcome prediction
- **Positional Analysis**: Map-based player positioning insights
- **Scout Tools**: Player discovery and comparison utilities

## Core Analytics Features
- **Role Detection**: Automatic player role assignment (IGL, AWP, Spacetaker, Lurker, Anchor, Support)
- **Performance Metrics**: Advanced statistics beyond traditional K/D ratios
- **Synergy Calculation**: Team chemistry and role complementarity analysis
- **Map Analytics**: Positional heat maps and territory control metrics

# Data Flow

1. **Data Ingestion**: CSV files are loaded and parsed on server startup
2. **Role Assignment**: Players are assigned roles based on performance patterns and explicit role definitions
3. **Metric Calculation**: PIV scores are computed using role-specific weightings and performance metrics
4. **Team Analysis**: TIR values are calculated by aggregating player PIVs with synergy bonuses
5. **API Exposure**: Processed data is exposed through RESTful endpoints
6. **Client Rendering**: React frontend fetches and visualizes the analytics data
7. **Real-time Updates**: Data refreshes automatically with configurable intervals

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM with PostgreSQL support
- **csv-parse**: High-performance CSV file processing
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **recharts**: Data visualization and charting library

## Development Tools
- **tsx**: TypeScript execution for development
- **vite**: Fast build tool with HMR support
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-shadcn-theme-json**: Theme configuration integration

## Utility Libraries
- **wouter**: Lightweight React router
- **clsx**: Conditional CSS class management
- **zod**: Runtime type validation
- **nanoid**: Unique ID generation

# Deployment Strategy

## Development Environment
- **Server**: Express.js with Vite middleware for HMR
- **Database**: Neon PostgreSQL with automatic migrations
- **File System**: Direct CSV file access from attached_assets directory
- **Hot Reload**: Vite dev server with proxy configuration

## Production Environment
- **Build Process**: Vite builds client assets, esbuild bundles server code
- **Server**: Express.js serving static assets and API endpoints
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Health Monitoring**: /health endpoint for deployment verification

## Configuration Management
- **Environment Variables**: DATABASE_URL for database connection
- **Build Scripts**: Separate development and production configurations
- **Static Assets**: Client built to dist/public directory
- **API Routes**: Centralized route registration in routes.ts

# Changelog

Changelog:
- July 07, 2025. Initial setup
- July 09, 2025. Implemented manual zone mapping interface with drag-and-drop positioning and resizing functionality for CS2 Inferno tactical analysis

# User Preferences

Preferred communication style: Simple, everyday language.

## Efficiency Requirements
- Use direct, targeted edits instead of exploratory file searches
- Make single-purpose tool calls when possible
- Avoid unnecessary file exploration when function location is known
- Prioritize minimal token usage and focused actions