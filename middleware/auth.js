// Authentication middleware for protecting routes

const User = require('../models/User');

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    
    // If it's an API request, return JSON error
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please log in to access this resource' 
        });
    }
    
    // For regular requests, redirect to login
    return res.redirect('/?error=login_required');
};

// Check if user has specific role
const hasRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.session || !req.session.userId) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    message: 'Please log in to access this resource' 
                });
            }

            const user = await User.findById(req.session.userId);
            if (!user || !user.isActive) {
                return res.status(401).json({ 
                    error: 'Invalid user',
                    message: 'User account not found or inactive' 
                });
            }

            // Convert single role to array for consistency
            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ 
                    error: 'Insufficient permissions',
                    message: `This resource requires ${allowedRoles.join(' or ')} role` 
                });
            }

            // Add user to request object for use in route handlers
            req.user = user;
            next();
        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({ 
                error: 'Authorization error',
                message: 'Error checking user permissions' 
            });
        }
    };
};

// Middleware to check if user is a teacher
const isTeacher = hasRole('teacher');

// Middleware to check if user is a student
const isStudent = hasRole('student');

// Middleware to check if user is admin
const isAdmin = hasRole('admin');

// Middleware to check if user is teacher or admin
const isTeacherOrAdmin = hasRole(['teacher', 'admin']);

// Middleware to check if user is student or teacher (for accessing grades)
const isStudentOrTeacher = hasRole(['student', 'teacher']);

// Middleware to attach user info to request if logged in (optional auth)
const attachUser = async (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            const user = await User.findById(req.session.userId);
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        console.error('Attach user error:', error);
        next(); // Continue without user info
    }
};

// Middleware to ensure user can only access their own data
const canAccessUserData = async (req, res, next) => {
    try {
        const requestedUserId = req.params.userId || req.body.userId;
        
        // Admin can access any user's data
        if (req.user.role === 'admin') {
            return next();
        }
        
        // Teacher can access their students' data
        if (req.user.role === 'teacher') {
            const requestedUser = await User.findById(requestedUserId);
            if (requestedUser && requestedUser.role === 'student') {
                // Check if the student is in any of the teacher's courses
                const Course = require('../models/Course');
                const teacherCourses = await Course.find({ 
                    teacher: req.user._id,
                    students: requestedUserId 
                });
                
                if (teacherCourses.length > 0) {
                    return next();
                }
            }
        }
        
        // Users can access their own data
        if (requestedUserId === req.user._id.toString()) {
            return next();
        }
        
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'You can only access your own data' 
        });
        
    } catch (error) {
        console.error('Access control error:', error);
        return res.status(500).json({ 
            error: 'Access control error',
            message: 'Error checking data access permissions' 
        });
    }
};

// Middleware to ensure teacher can only access their own courses
const canAccessCourse = async (req, res, next) => {
    try {
        const courseId = req.params.courseId || req.body.courseId;
        
        // Admin can access any course
        if (req.user.role === 'admin') {
            return next();
        }
        
        const Course = require('../models/Course');
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ 
                error: 'Course not found',
                message: 'The requested course does not exist' 
            });
        }
        
        // Teacher can access their own courses
        if (req.user.role === 'teacher' && course.teacher.toString() === req.user._id.toString()) {
            return next();
        }
        
        // Student can access courses they're enrolled in
        if (req.user.role === 'student' && course.students.includes(req.user._id)) {
            return next();
        }
        
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'You do not have access to this course' 
        });
        
    } catch (error) {
        console.error('Course access control error:', error);
        return res.status(500).json({ 
            error: 'Access control error',
            message: 'Error checking course access permissions' 
        });
    }
};

module.exports = {
    isAuthenticated,
    hasRole,
    isTeacher,
    isStudent,
    isAdmin,
    isTeacherOrAdmin,
    isStudentOrTeacher,
    attachUser,
    canAccessUserData,
    canAccessCourse
};

