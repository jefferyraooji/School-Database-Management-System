const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isAuthenticated, attachUser } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            confirmPassword,
            role,
            firstName,
            lastName,
            studentId,
            teacherId,
            department
        } = req.body;

        // Validation
        if (!username || !email || !password || !role || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please fill in all required fields'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Password mismatch',
                message: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password too short',
                message: 'Password must be at least 6 characters long'
            });
        }

        if (!['student', 'teacher'].includes(role)) {
            return res.status(400).json({
                error: 'Invalid role',
                message: 'Role must be either student or teacher'
            });
        }

        // Role-specific validation
        if (role === 'student' && !studentId) {
            return res.status(400).json({
                error: 'Student ID required',
                message: 'Student ID is required for student accounts'
            });
        }

        if (role === 'teacher' && !teacherId) {
            return res.status(400).json({
                error: 'Teacher ID required',
                message: 'Teacher ID is required for teacher accounts'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username },
                ...(studentId ? [{ studentId }] : []),
                ...(teacherId ? [{ teacherId }] : [])
            ]
        });

        if (existingUser) {
            let message = 'An account with this ';
            if (existingUser.email === email) message += 'email';
            else if (existingUser.username === username) message += 'username';
            else if (existingUser.studentId === studentId) message += 'student ID';
            else if (existingUser.teacherId === teacherId) message += 'teacher ID';
            message += ' already exists';

            return res.status(400).json({
                error: 'User already exists',
                message
            });
        }

        // Create new user
        const userData = {
            username,
            email,
            password,
            role,
            firstName,
            lastName,
            department
        };

        if (role === 'student') {
            userData.studentId = studentId;
        } else if (role === 'teacher') {
            userData.teacherId = teacherId;
        }

        const user = new User(userData);
        await user.save();

        // Don't automatically log in after registration
        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please log in.',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.getFullName()
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 11000) {
            // Handle duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                error: 'Duplicate field',
                message: `An account with this ${field} already exists`
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Validation error',
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { identifier, password, role } = req.body; // identifier can be email, username, studentId, or teacherId

        if (!identifier || !password || !role) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Please provide identifier, password, and role'
            });
        }

        // Build query based on role
        let query = { role, isActive: true };
        
        if (role === 'student') {
            query.$or = [
                { email: identifier.toLowerCase() },
                { username: identifier },
                { studentId: identifier }
            ];
        } else if (role === 'teacher') {
            query.$or = [
                { email: identifier.toLowerCase() },
                { username: identifier },
                { teacherId: identifier }
            ];
        } else {
            return res.status(400).json({
                error: 'Invalid role',
                message: 'Role must be either student or teacher'
            });
        }

        // Find user
        const user = await User.findOne(query);

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid identifier, password, or role'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid identifier, password, or role'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create session
        req.session.userId = user._id;
        req.session.userRole = user.role;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.getFullName(),
                studentId: user.studentId,
                teacherId: user.teacherId,
                department: user.department
            },
            redirectUrl: user.role === 'teacher' ? '/teacher' : '/student'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'An error occurred during login'
        });
    }
});

// Logout user
router.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                error: 'Logout failed',
                message: 'An error occurred during logout'
            });
        }

        res.clearCookie('connect.sid'); // Clear session cookie
        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
});

// Get current user info
router.get('/me', attachUser, (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Not authenticated',
            message: 'No active session found'
        });
    }

    res.json({
        success: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            fullName: req.user.getFullName(),
            studentId: req.user.studentId,
            teacherId: req.user.teacherId,
            department: req.user.department,
            lastLogin: req.user.lastLogin
        }
    });
});

// Check authentication status
router.get('/status', attachUser, (req, res) => {
    res.json({
        isAuthenticated: !!req.user,
        user: req.user ? {
            id: req.user._id,
            username: req.user.username,
            role: req.user.role,
            fullName: req.user.getFullName()
        } : null
    });
});

// Change password
router.put('/change-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please provide current password, new password, and confirmation'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                error: 'Password mismatch',
                message: 'New passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Password too short',
                message: 'New password must be at least 6 characters long'
            });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'User account not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                error: 'Invalid current password',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Password change failed',
            message: 'An error occurred while changing password'
        });
    }
});

module.exports = router;

