// Basic tests for authentication functionality
// Note: These are simplified tests for demonstration purposes
// In a production environment, you would use more comprehensive testing

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// Test database connection
const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/school_db_test';

describe('Authentication Tests', () => {
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        // Clean up and close connection
        await mongoose.connection.db.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        test('should register a new student successfully', async () => {
            const studentData = {
                username: 'testStudent',
                email: 'test@student.com',
                password: 'password123',
                confirmPassword: 'password123',
                role: 'student',
                firstName: 'Test',
                lastName: 'Student',
                studentId: '12345678',
                department: 'Computer Science'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(studentData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe(studentData.email);
            expect(response.body.user.role).toBe('student');
        });

        test('should register a new teacher successfully', async () => {
            const teacherData = {
                username: 'testTeacher',
                email: 'test@teacher.com',
                password: 'password123',
                confirmPassword: 'password123',
                role: 'teacher',
                firstName: 'Test',
                lastName: 'Teacher',
                teacherId: 'T123456',
                department: 'Mathematics'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(teacherData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe(teacherData.email);
            expect(response.body.user.role).toBe('teacher');
        });

        test('should fail registration with missing required fields', async () => {
            const incompleteData = {
                username: 'testUser',
                email: 'test@example.com',
                // Missing password and other required fields
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(incompleteData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Missing required fields');
        });

        test('should fail registration with password mismatch', async () => {
            const userData = {
                username: 'testUser',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'differentPassword',
                role: 'student',
                firstName: 'Test',
                lastName: 'User',
                studentId: '12345678'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Password mismatch');
        });

        test('should fail registration with duplicate email', async () => {
            // Create first user
            const userData1 = {
                username: 'testUser1',
                email: 'duplicate@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                role: 'student',
                firstName: 'Test',
                lastName: 'User1',
                studentId: '12345678'
            };

            await request(app)
                .post('/api/auth/register')
                .send(userData1);

            // Try to create second user with same email
            const userData2 = {
                username: 'testUser2',
                email: 'duplicate@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                role: 'student',
                firstName: 'Test',
                lastName: 'User2',
                studentId: '87654321'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData2);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user for login tests
            const user = new User({
                username: 'loginTest',
                email: 'login@test.com',
                password: 'password123',
                role: 'student',
                firstName: 'Login',
                lastName: 'Test',
                studentId: '12345678'
            });
            await user.save();
        });

        test('should login successfully with email', async () => {
            const loginData = {
                identifier: 'login@test.com',
                password: 'password123',
                role: 'student'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe('login@test.com');
            expect(response.body.redirectUrl).toBe('/student');
        });

        test('should login successfully with username', async () => {
            const loginData = {
                identifier: 'loginTest',
                password: 'password123',
                role: 'student'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user.username).toBe('loginTest');
        });

        test('should fail login with wrong password', async () => {
            const loginData = {
                identifier: 'login@test.com',
                password: 'wrongPassword',
                role: 'student'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        test('should fail login with wrong role', async () => {
            const loginData = {
                identifier: 'login@test.com',
                password: 'password123',
                role: 'teacher' // User is a student, not teacher
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        test('should fail login with missing fields', async () => {
            const loginData = {
                identifier: 'login@test.com',
                // Missing password and role
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Missing credentials');
        });
    });

    describe('GET /api/auth/status', () => {
        test('should return not authenticated for unauthenticated request', async () => {
            const response = await request(app)
                .get('/api/auth/status');

            expect(response.status).toBe(200);
            expect(response.body.isAuthenticated).toBe(false);
            expect(response.body.user).toBeNull();
        });
    });
});

// Model validation tests
describe('User Model Tests', () => {
    beforeAll(async () => {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    test('should create a valid student user', async () => {
        const userData = {
            username: 'validStudent',
            email: 'valid@student.com',
            password: 'password123',
            role: 'student',
            firstName: 'Valid',
            lastName: 'Student',
            studentId: '12345678'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.password).not.toBe(userData.password); // Should be hashed
        expect(savedUser.role).toBe('student');
    });

    test('should create a valid teacher user', async () => {
        const userData = {
            username: 'validTeacher',
            email: 'valid@teacher.com',
            password: 'password123',
            role: 'teacher',
            firstName: 'Valid',
            lastName: 'Teacher',
            teacherId: 'T123456'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.role).toBe('teacher');
    });

    test('should fail validation with invalid email', async () => {
        const userData = {
            username: 'testUser',
            email: 'invalid-email',
            password: 'password123',
            role: 'student',
            firstName: 'Test',
            lastName: 'User',
            studentId: '12345678'
        };

        const user = new User(userData);
        
        await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation with invalid student ID', async () => {
        const userData = {
            username: 'testUser',
            email: 'test@student.com',
            password: 'password123',
            role: 'student',
            firstName: 'Test',
            lastName: 'User',
            studentId: '123' // Invalid - should be 8 digits
        };

        const user = new User(userData);
        
        await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation with invalid teacher ID', async () => {
        const userData = {
            username: 'testUser',
            email: 'test@teacher.com',
            password: 'password123',
            role: 'teacher',
            firstName: 'Test',
            lastName: 'User',
            teacherId: 'INVALID' // Invalid - should be T followed by 6 digits
        };

        const user = new User(userData);
        
        await expect(user.save()).rejects.toThrow();
    });

    test('should hash password before saving', async () => {
        const plainPassword = 'password123';
        const userData = {
            username: 'testUser',
            email: 'test@example.com',
            password: plainPassword,
            role: 'student',
            firstName: 'Test',
            lastName: 'User',
            studentId: '12345678'
        };

        const user = new User(userData);
        await user.save();

        expect(user.password).not.toBe(plainPassword);
        expect(user.password.length).toBeGreaterThan(plainPassword.length);
        
        // Test password comparison
        const isMatch = await user.comparePassword(plainPassword);
        expect(isMatch).toBe(true);
        
        const isNotMatch = await user.comparePassword('wrongPassword');
        expect(isNotMatch).toBe(false);
    });
});

module.exports = {
    // Export test utilities if needed
};

