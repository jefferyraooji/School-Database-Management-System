# School Database Management System

A full-stack web application for school database management using JavaScript across both front-end and back-end, featuring role-based authentication for teachers and students.

## 🎯 Features

### For Teachers
- **Course Management**: Create and manage courses with detailed information
- **Grade Management**: Add, edit, publish/unpublish grades for students
- **Student Management**: View enrolled students and their performance
- **Dashboard Analytics**: Overview of courses, students, and grading statistics
- **Export Functionality**: Export grades and course data to CSV

### For Students
- **Course Overview**: View enrolled courses and teacher information
- **Grade Tracking**: Access published grades and performance data
- **Academic Analytics**: Visual representation of grade distribution and trends
- **Transcript Generation**: View and export official academic transcript
- **Performance Insights**: Track improvement over time

### System Features
- **Role-based Authentication**: Secure login for teachers and students
- **Session Management**: Persistent login sessions with security
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Dynamic content loading and updates
- **Data Export**: CSV export functionality for grades and transcripts

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **connect-mongo** - MongoDB session store

### Frontend
- **HTML5** - Markup language
- **CSS3** - Styling with modern features (Grid, Flexbox, Animations)
- **Vanilla JavaScript** - Client-side functionality
- **Font Awesome** - Icons and visual elements

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd school-database-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure your settings:
```bash
cp config.env.example config.env
```

Edit `config.env` with your configuration:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/school_db

# Session Secret (use a strong, unique secret in production)
SESSION_SECRET=your-super-secret-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Admin Configuration (optional)
ADMIN_EMAIL=admin@school.edu
ADMIN_PASSWORD=admin123
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Run the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📱 Usage

### Initial Setup

1. **Access the Application**: Navigate to `http://localhost:3000`
2. **Register Accounts**: Create teacher and student accounts using the registration form
3. **Login**: Use your credentials to access role-specific dashboards

### Demo Accounts

For testing purposes, you can create accounts with these sample credentials:

**Teacher Account:**
- Email: `teacher@demo.com`
- Username: `teacher1`
- Teacher ID: `T123456`
- Password: `teacher123`

**Student Account:**
- Email: `student@demo.com`
- Username: `student1`
- Student ID: `12345678`
- Password: `student123`

### Teacher Workflow

1. **Create Courses**: Set up courses with details like code, name, credits, schedule
2. **Manage Students**: Add students to courses (students must register first)
3. **Add Grades**: Create assessments and assign grades to students
4. **Publish Grades**: Make grades visible to students when ready
5. **Monitor Progress**: Use dashboard analytics to track student performance

### Student Workflow

1. **View Courses**: See enrolled courses and teacher information
2. **Check Grades**: Access published grades and feedback
3. **Track Progress**: Monitor academic performance over time
4. **Generate Transcript**: View and export official academic records

## 🗂️ Project Structure

```
school-database-management-system/
├── config.env                 # Environment configuration
├── package.json              # Dependencies and scripts
├── server.js                 # Main server file
├── middleware/               # Custom middleware
│   └── auth.js              # Authentication middleware
├── models/                   # Database models
│   ├── User.js              # User model (teachers/students)
│   ├── Course.js            # Course model
│   └── Grade.js             # Grade model
├── routes/                   # API routes
│   ├── auth.js              # Authentication routes
│   ├── teacher.js           # Teacher-specific routes
│   └── student.js           # Student-specific routes
└── public/                   # Static frontend files
    ├── index.html           # Login/registration page
    ├── teacher.html         # Teacher dashboard
    ├── student.html         # Student dashboard
    ├── css/
    │   └── styles.css       # Application styles
    └── js/
        ├── utils.js         # Utility functions
        ├── auth.js          # Authentication logic
        ├── teacher.js       # Teacher dashboard logic
        └── student.js       # Student dashboard logic
```

## 🔐 Security Features

- **Password Hashing**: Uses bcryptjs with salt rounds for secure password storage
- **Session Management**: Secure session handling with MongoDB store
- **Role-based Access Control**: Middleware to protect routes based on user roles
- **Input Validation**: Server-side validation for all user inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **SQL Injection Prevention**: MongoDB's inherent protection against SQL injection

## 📊 Database Schema

### User Model
- Authentication information (username, email, password)
- Role-based fields (student ID, teacher ID)
- Profile information (name, department)
- Course relationships (enrolled/teaching courses)

### Course Model
- Course details (code, name, description, credits)
- Scheduling information (semester, year, time, room)
- Teacher and student relationships
- Enrollment limits and tracking

### Grade Model
- Assessment information (type, name, description)
- Scoring details (score, max score, weight)
- Grade calculations (percentage, letter grade, GPA)
- Publication status and feedback

## 🧪 Testing

### Manual Testing
1. **Authentication Flow**: Test registration and login for both roles
2. **Teacher Functions**: Create courses, add students, manage grades
3. **Student Functions**: View courses, check grades, generate transcripts
4. **Edge Cases**: Test with invalid data, empty states, permission boundaries

### API Testing
You can test the API endpoints using tools like Postman or curl:

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"teacher1","password":"teacher123","role":"teacher"}'

# Test teacher dashboard (requires authentication)
curl -X GET http://localhost:3000/api/teacher/dashboard \
  -H "Cookie: connect.sid=<session-cookie>"
```

## 📈 Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Session Storage**: MongoDB-based session storage for scalability
- **Client-side Caching**: Efficient data loading and caching strategies
- **Responsive Design**: Optimized for various screen sizes and devices

## 🔧 Development

### Adding New Features

1. **Backend**: Create routes in the appropriate route file
2. **Models**: Update or create new Mongoose models as needed
3. **Frontend**: Add UI components and JavaScript functionality
4. **Testing**: Test new features thoroughly

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ conventions
- Add comments for complex logic
- Use meaningful variable and function names

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set production values in config.env
2. **Database**: Use a production MongoDB instance (MongoDB Atlas recommended)
3. **Session Secret**: Use a strong, unique session secret
4. **HTTPS**: Enable HTTPS in production
5. **Process Management**: Use PM2 or similar for process management

### Example Production Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "school-db-system"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Font Awesome for icons
- MongoDB for the database solution
- Express.js community for excellent documentation
- All contributors and testers

## 📞 Support

For support, please create an issue in the repository or contact the development team.

---

**Note**: This is an educational project demonstrating full-stack web development with JavaScript. For production use, additional security measures and optimizations may be required.

