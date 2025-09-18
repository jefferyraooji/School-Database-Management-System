// Database seeding script for demo data
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const User = require('../models/User');
const Course = require('../models/Course');
const Grade = require('../models/Grade');

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Grade.deleteMany({});
        
        // Create demo users
        console.log('Creating demo users...');
        
        // Teachers
        const teacher1 = new User({
            username: 'teacher1',
            email: 'teacher@demo.com',
            password: 'teacher123',
            role: 'teacher',
            firstName: 'John',
            lastName: 'Smith',
            teacherId: 'T123456',
            department: 'Computer Science'
        });
        
        const teacher2 = new User({
            username: 'teacher2',
            email: 'math.teacher@demo.com',
            password: 'teacher123',
            role: 'teacher',
            firstName: 'Sarah',
            lastName: 'Johnson',
            teacherId: 'T789012',
            department: 'Mathematics'
        });
        
        // Students
        const student1 = new User({
            username: 'student1',
            email: 'student@demo.com',
            password: 'student123',
            role: 'student',
            firstName: 'Alice',
            lastName: 'Brown',
            studentId: '12345678',
            department: 'Computer Science'
        });
        
        const student2 = new User({
            username: 'student2',
            email: 'john.doe@demo.com',
            password: 'student123',
            role: 'student',
            firstName: 'John',
            lastName: 'Doe',
            studentId: '87654321',
            department: 'Computer Science'
        });
        
        const student3 = new User({
            username: 'student3',
            email: 'jane.wilson@demo.com',
            password: 'student123',
            role: 'student',
            firstName: 'Jane',
            lastName: 'Wilson',
            studentId: '11223344',
            department: 'Mathematics'
        });
        
        await Promise.all([
            teacher1.save(),
            teacher2.save(),
            student1.save(),
            student2.save(),
            student3.save()
        ]);
        
        console.log('Demo users created');
        
        // Create demo courses
        console.log('Creating demo courses...');
        
        const course1 = new Course({
            courseCode: 'CS101',
            courseName: 'Introduction to Programming',
            description: 'Learn the fundamentals of programming using JavaScript',
            department: 'Computer Science',
            credits: 3,
            semester: 'Fall',
            year: 2025,
            teacher: teacher1._id,
            students: [student1._id, student2._id],
            maxStudents: 30,
            schedule: {
                days: ['Monday', 'Wednesday', 'Friday'],
                startTime: '09:00',
                endTime: '10:30',
                room: 'CS-101'
            }
        });
        
        const course2 = new Course({
            courseCode: 'CS201',
            courseName: 'Data Structures and Algorithms',
            description: 'Advanced programming concepts and algorithm design',
            department: 'Computer Science',
            credits: 4,
            semester: 'Fall',
            year: 2025,
            teacher: teacher1._id,
            students: [student1._id],
            maxStudents: 25,
            schedule: {
                days: ['Tuesday', 'Thursday'],
                startTime: '14:00',
                endTime: '16:00',
                room: 'CS-201'
            }
        });
        
        const course3 = new Course({
            courseCode: 'MATH101',
            courseName: 'Calculus I',
            description: 'Introduction to differential and integral calculus',
            department: 'Mathematics',
            credits: 4,
            semester: 'Fall',
            year: 2025,
            teacher: teacher2._id,
            students: [student1._id, student2._id, student3._id],
            maxStudents: 40,
            schedule: {
                days: ['Monday', 'Wednesday', 'Friday'],
                startTime: '11:00',
                endTime: '12:30',
                room: 'MATH-105'
            }
        });
        
        await Promise.all([
            course1.save(),
            course2.save(),
            course3.save()
        ]);
        
        console.log('Demo courses created');
        
        // Update user course relationships
        console.log('Updating user course relationships...');
        
        teacher1.teachingCourses = [course1._id, course2._id];
        teacher2.teachingCourses = [course3._id];
        
        student1.enrolledCourses = [course1._id, course2._id, course3._id];
        student2.enrolledCourses = [course1._id, course3._id];
        student3.enrolledCourses = [course3._id];
        
        await Promise.all([
            teacher1.save(),
            teacher2.save(),
            student1.save(),
            student2.save(),
            student3.save()
        ]);
        
        // Create demo grades
        console.log('Creating demo grades...');
        
        const grades = [
            // CS101 grades for student1
            {
                student: student1._id,
                course: course1._id,
                teacher: teacher1._id,
                assessmentType: 'assignment',
                assessmentName: 'Assignment 1: Variables and Functions',
                description: 'Basic programming assignment',
                score: 85,
                maxScore: 100,
                weight: 0.2,
                feedback: 'Good work! Pay attention to variable naming conventions.',
                isPublished: true,
                gradedDate: new Date('2025-09-15')
            },
            {
                student: student1._id,
                course: course1._id,
                teacher: teacher1._id,
                assessmentType: 'quiz',
                assessmentName: 'Quiz 1: Basic Syntax',
                score: 92,
                maxScore: 100,
                weight: 0.1,
                feedback: 'Excellent understanding of basic concepts!',
                isPublished: true,
                gradedDate: new Date('2025-09-20')
            },
            {
                student: student1._id,
                course: course1._id,
                teacher: teacher1._id,
                assessmentType: 'midterm',
                assessmentName: 'Midterm Exam',
                score: 78,
                maxScore: 100,
                weight: 0.3,
                feedback: 'Good overall performance. Review loops and conditionals.',
                isPublished: true,
                gradedDate: new Date('2025-10-15')
            },
            
            // CS101 grades for student2
            {
                student: student2._id,
                course: course1._id,
                teacher: teacher1._id,
                assessmentType: 'assignment',
                assessmentName: 'Assignment 1: Variables and Functions',
                score: 76,
                maxScore: 100,
                weight: 0.2,
                feedback: 'Good start! Work on code organization and comments.',
                isPublished: true,
                gradedDate: new Date('2025-09-15')
            },
            {
                student: student2._id,
                course: course1._id,
                teacher: teacher1._id,
                assessmentType: 'quiz',
                assessmentName: 'Quiz 1: Basic Syntax',
                score: 88,
                maxScore: 100,
                weight: 0.1,
                feedback: 'Well done! Keep up the good work.',
                isPublished: true,
                gradedDate: new Date('2025-09-20')
            },
            
            // CS201 grades for student1
            {
                student: student1._id,
                course: course2._id,
                teacher: teacher1._id,
                assessmentType: 'project',
                assessmentName: 'Project 1: Binary Search Tree Implementation',
                description: 'Implement a binary search tree with basic operations',
                score: 94,
                maxScore: 100,
                weight: 0.4,
                feedback: 'Outstanding implementation! Clean code and efficient algorithms.',
                isPublished: true,
                gradedDate: new Date('2025-10-01')
            },
            
            // MATH101 grades for student1
            {
                student: student1._id,
                course: course3._id,
                teacher: teacher2._id,
                assessmentType: 'exam',
                assessmentName: 'Exam 1: Limits and Derivatives',
                score: 82,
                maxScore: 100,
                weight: 0.25,
                feedback: 'Good understanding of concepts. Practice more word problems.',
                isPublished: true,
                gradedDate: new Date('2025-09-25')
            },
            {
                student: student1._id,
                course: course3._id,
                teacher: teacher2._id,
                assessmentType: 'assignment',
                assessmentName: 'Homework Set 1',
                score: 95,
                maxScore: 100,
                weight: 0.15,
                feedback: 'Excellent work! All solutions are correct and well-explained.',
                isPublished: true,
                gradedDate: new Date('2025-09-10')
            },
            
            // MATH101 grades for student2
            {
                student: student2._id,
                course: course3._id,
                teacher: teacher2._id,
                assessmentType: 'exam',
                assessmentName: 'Exam 1: Limits and Derivatives',
                score: 74,
                maxScore: 100,
                weight: 0.25,
                feedback: 'Need to review derivative rules. Come to office hours for help.',
                isPublished: true,
                gradedDate: new Date('2025-09-25')
            },
            {
                student: student2._id,
                course: course3._id,
                teacher: teacher2._id,
                assessmentType: 'assignment',
                assessmentName: 'Homework Set 1',
                score: 88,
                maxScore: 100,
                weight: 0.15,
                feedback: 'Good work overall. Check your calculations on problem 5.',
                isPublished: true,
                gradedDate: new Date('2025-09-10')
            },
            
            // MATH101 grades for student3
            {
                student: student3._id,
                course: course3._id,
                teacher: teacher2._id,
                assessmentType: 'exam',
                assessmentName: 'Exam 1: Limits and Derivatives',
                score: 91,
                maxScore: 100,
                weight: 0.25,
                feedback: 'Excellent performance! Strong grasp of all concepts.',
                isPublished: true,
                gradedDate: new Date('2025-09-25')
            },
            {
                student: student3._id,
                course: course3._id,
                teacher: teacher2._id,
                assessmentType: 'assignment',
                assessmentName: 'Homework Set 1',
                score: 97,
                maxScore: 100,
                weight: 0.15,
                feedback: 'Perfect work! Clear explanations and correct solutions.',
                isPublished: true,
                gradedDate: new Date('2025-09-10')
            }
        ];
        
        // Create grade documents
        const gradePromises = grades.map(gradeData => {
            const grade = new Grade(gradeData);
            return grade.save();
        });
        
        await Promise.all(gradePromises);
        
        console.log('Demo grades created');
        console.log('\n=== DATABASE SEEDING COMPLETED ===');
        console.log('\nDemo accounts created:');
        console.log('\nTeachers:');
        console.log('- teacher@demo.com (username: teacher1, password: teacher123, ID: T123456)');
        console.log('- math.teacher@demo.com (username: teacher2, password: teacher123, ID: T789012)');
        console.log('\nStudents:');
        console.log('- student@demo.com (username: student1, password: student123, ID: 12345678)');
        console.log('- john.doe@demo.com (username: student2, password: student123, ID: 87654321)');
        console.log('- jane.wilson@demo.com (username: student3, password: student123, ID: 11223344)');
        console.log('\nCourses:');
        console.log('- CS101: Introduction to Programming');
        console.log('- CS201: Data Structures and Algorithms');
        console.log('- MATH101: Calculus I');
        console.log('\nYou can now start the server and login with any of the above accounts.');
        
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

// Run the seeding function
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;

