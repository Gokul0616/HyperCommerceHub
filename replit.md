# HyperPure E-commerce Platform

## Overview

HyperPure is a full-stack e-commerce platform designed for restaurant ingredient sourcing. Built with a modern tech stack including React, TypeScript, Express.js, and PostgreSQL, the application provides a comprehensive solution for managing products, categories, orders, and user authentication with role-based access control.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **API Design**: RESTful API endpoints with proper error handling

### Database Schema
The application uses PostgreSQL with the following main entities:
- **Users**: Authentication and profile management with role-based access
- **Categories**: Product categorization with icons and descriptions
- **Products**: Inventory items with pricing, quantities, and category relationships
- **Orders**: Order management with items, status tracking, and delivery information
- **Cart**: Shopping cart functionality with user-product relationships

## Key Components

### Authentication System
- Session-based authentication with secure cookie handling
- Password hashing using bcrypt
- Role-based access control (admin, customer, seller)
- Protected routes and middleware for authorization

### Product Management
- Product catalog with category-based organization
- Search and filtering capabilities
- Inventory tracking with min/max quantities
- Image support for product visualization

### Order Management
- Shopping cart functionality
- Order placement and tracking
- Status management (pending, processing, shipped, delivered, cancelled)
- Order history and details

### Admin Panel
- Product and category management
- Order status updates
- User management capabilities
- Analytics and reporting features

## Data Flow

1. **User Authentication**: Users register/login through secure forms, sessions are maintained server-side
2. **Product Discovery**: Users browse categories, search products, and view detailed product information
3. **Shopping Cart**: Items are added to cart, quantities managed, and cart persists across sessions
4. **Order Processing**: Cart items are converted to orders with delivery details and payment information
5. **Admin Operations**: Admins manage inventory, process orders, and maintain system data

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **Date Handling**: date-fns for date formatting and manipulation
- **Form Validation**: Zod for runtime type validation

### Backend Dependencies
- **Database**: Neon PostgreSQL for serverless database hosting
- **Session Management**: Express-session for user session handling
- **Password Security**: bcrypt for secure password hashing
- **Development**: tsx for TypeScript execution in development

### Development Tools
- **Build System**: Vite with React plugin for fast development
- **Database Management**: Drizzle Kit for migrations and schema management
- **Code Quality**: TypeScript for type safety and better developer experience

## Deployment Strategy

### Development Environment
- Vite development server with Hot Module Replacement
- TypeScript compilation and type checking
- Environment-based configuration with development-specific settings

### Production Build
- Vite production build with optimizations
- esbuild for server-side bundling
- Static asset optimization and compression

### Database Management
- Drizzle migrations for schema versioning
- Environment-based database connection handling
- Connection pooling for production scalability

## Changelog
- July 06, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.