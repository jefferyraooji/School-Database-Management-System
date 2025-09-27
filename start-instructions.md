# Quick Start Instructions

## Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database with Demo Data
```bash
npm run seed
```

### 3. Start Application
```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

### 4. Access Application
Open browser: http://localhost:3000

## Demo Accounts

**Teacher Account:**
- Email: teacher@demo.com
- Username: teacher1  
- Password: teacher123
- Teacher ID: T123456

**Student Account:**
- Email: student@demo.com
- Username: student1
- Password: student123
- Student ID: 12345678

## Features

### Teachers Can:
- Create and manage courses
- Add/edit/publish student grades
- View enrolled students
- Access analytics dashboard

### Students Can:
- View enrolled courses
- Check published grades
- Generate academic transcripts
- Track performance analytics

## Troubleshooting

**Database Connection Issues:**
- Verify MongoDB Atlas connection string in config.env
- Check network connectivity
- Ensure database user has proper permissions

**Port Already in Use:**
- Change PORT in config.env to different number (e.g., 3001)
- Stop other applications using port 3000

**Page Loading Issues:**
- Clear browser cache
- Check browser console for errors
- Ensure all dependencies installed (npm install)

For detailed help, see README.md
