# PEAKMODE Backend

This is the backend server for the PEAKMODE application. It provides authentication and data services for the frontend.

## Setup Instructions

1. Install dependencies
```bash
cd backend
npm install
```

2. Create a `.env` file in the root of the backend directory with the following variables:
```
# Server configuration
PORT=5000
NODE_ENV=development

# JWT configuration
JWT_SECRET=your_jwt_secret_here_change_this_in_production
JWT_EXPIRES_IN=90d

# MongoDB configuration
MONGODB_URI=mongodb://localhost:27017/peakmode
# For MongoDB Atlas: mongodb+srv://<username>:<password>@cluster0.mongodb.net/peakmode
```

3. Start the development server
```bash
npm run dev
```

## API Endpoints

### Authentication

- **POST /api/auth/signup** - Register a new user
  - Request body: `{ "fullName": "John Doe", "email": "john@example.com", "password": "password123" }`

- **POST /api/auth/login** - Login a user
  - Request body: `{ "email": "john@example.com", "password": "password123" }`

- **POST /api/auth/forgotPassword** - Request password reset
  - Request body: `{ "email": "john@example.com" }`

- **PATCH /api/auth/resetPassword/:token** - Reset password with token
  - Request body: `{ "password": "newpassword123" }`

### Health Check

- **GET /api/health** - Check API status

## Protected Routes

Protected routes require a valid JWT token sent in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
``` 