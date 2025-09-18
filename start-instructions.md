# Quick Start Instructions

## After Setting Up MongoDB (Atlas or Local):

### 1. Seed the Database with Demo Data
```bash
npm run seed
```

### 2. Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

### 3. Access the Application
Open your browser and go to: http://localhost:3000

### 4. Login with Demo Accounts

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

## What You'll See:

### For Teachers:
- Dashboard with course and student statistics
- Course management (create, edit, view courses)
- Grade management (add, edit, publish grades)
- Student management (view enrolled students)

### For Students:
- Dashboard with GPA and course overview
- Course details and teacher information
- Grade tracking and performance analytics
- Academic transcript generation

## Troubleshooting:

### If you see "Database connection failed":
1. Make sure MongoDB is running (local) or Atlas connection string is correct
2. Check your network connection
3. Verify database user credentials

### If you see "Port already in use":
1. Change PORT in config.env to a different number (e.g., 3001)
2. Or stop any other applications using port 3000

### If pages don't load properly:
1. Clear your browser cache
2. Check browser console for JavaScript errors
3. Make sure all dependencies are installed (npm install)

## Need Help?
Check the README.md file for detailed documentation and troubleshooting guides.
