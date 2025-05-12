# PEAKMODE Backend

This is the backend server for the PEAKMODE iOS application. It provides API endpoints for authentication, user management, and other features.

## Features

- Local SQLite database
- User authentication with JWT
- Security question-based password reset
- User profile management
- Database inspection utilities

## Setup and Installation

```bash
# Install dependencies
npm install

# Start the server in development mode
npm run dev

# Start the server in production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/security-questions` - Get all security questions
- `POST /api/auth/security-questions` - Save user security answers

### Password Reset

- `POST /api/auth/find-username` - Find username by email
- `POST /api/auth/get-security-questions` - Get user's security questions
- `POST /api/auth/verify-security-answers` - Verify security answers
- `POST /api/auth/reset-password` - Reset password with token

### User Profile

- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/change-password` - Change password
- `DELETE /api/users/profile` - Delete account

### Security Questions Management

- `GET /api/users/security-questions` - Get user's security questions
- `POST /api/users/security-questions` - Update security questions

### System Health

- `GET /api/health` - Get system health status
- `GET /api/health/db` - Get database status

## Database Inspection

To view the database content in a formatted way, run:

```bash
./print-db.sh
```

## Database Location

The SQLite database file is stored in the `data` directory as `peakmode.db`.

## Environment Variables

The following environment variables can be set:

- `PORT` - Server port (default: 5003)
- `JWT_SECRET` - Secret key for JWT (default: peakmode-secret-key)
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)
- `NODE_ENV` - Environment (development or production) 