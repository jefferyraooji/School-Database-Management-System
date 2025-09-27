const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const { isTeacher, canAccessCourse } = require('../middleware/auth');

const router = express.Router();

// All routes require teacher authentication
router.use(isTeacher);

// Get teacher dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const teacherId = req.user._id;
        
        // Get teacher's courses with student counts
        const courses = await Course.findByTeacher(teacherId);
        
        // Get recent grades (last 10)
        const recentGrades = await Grade.findByTeacher(teacherId)
            .limit(10)
            .populate('student', 'firstName lastName studentId')
            .populate('course', 'courseCode courseName');
        
        // Calculate statistics
        const totalStudents = courses.reduce((sum, course) => sum + course.enrolledCount, 0);
        const totalCourses = courses.length;
        const pendingGrades = await Grade.countDocuments({ teacher: teacherId, isPublished: false });
        
        res.json({
            success: true,
            data: {
                teacher: {
                    name: req.user.getFullName(),
                    teacherId: req.user.teacherId,
                    department: req.user.department
                },
                statistics: {
                    totalCourses,
                    totalStudents,
                    pendingGrades,
                    publishedGrades: await Grade.countDocuments({ teacher: teacherId, isPublished: true })
                },
                courses,
                recentGrades
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            error: 'Dashboard load failed',
            message: 'Error loading dashboard data'
        });
    }
});

// Get all teacher's courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.findByTeacher(req.user._id);
        res.json({
            success: true,
            courses
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            error: 'Failed to load courses',
            message: 'Error retrieving course data'
        });
    }
});

// Create new course
router.post('/courses', async (req, res) => {
    try {
        const {
            courseCode,
            courseName,
            description,
            department,
            credits,
            semester,
            year,
            maxStudents,
            schedule
        } = req.body;

        // Validation
        if (!courseCode || !courseName || !department || !credits || !semester || !year) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please provide all required course information'
            });
        }

        // Check if course code already exists for this semester/year
        const existingCourse = await Course.findOne({
            courseCode: courseCode.toUpperCase(),
            semester,
            year,
            isActive: true
        });

        if (existingCourse) {
            return res.status(400).json({
                error: 'Course already exists',
                message: `Course ${courseCode} already exists for ${semester} ${year}`
            });
        }

        const course = new Course({
            courseCode: courseCode.toUpperCase(),
            courseName,
            description,
            department,
            credits,
            semester,
            year,
            teacher: req.user._id,
            maxStudents: maxStudents || 30,
            schedule
        });

        await course.save();
        await course.populate('teacher', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Validation error',
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            error: 'Course creation failed',
            message: 'Error creating course'
        });
    }
});

// Update course
router.put('/courses/:courseId', canAccessCourse, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        
        const allowedUpdates = [
            'courseName', 'description', 'maxStudents', 'schedule'
        ];
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        await course.save();
        await course.populate('teacher', 'firstName lastName email');
        await course.populate('students', 'firstName lastName studentId email');

        res.json({
            success: true,
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            error: 'Course update failed',
            message: 'Error updating course'
        });
    }
});

// Get course details with students
router.get('/courses/:courseId', canAccessCourse, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .populate('teacher', 'firstName lastName email teacherId')
            .populate('students', 'firstName lastName studentId email');

        if (!course) {
            return res.status(404).json({
                error: 'Course not found',
                message: 'The requested course does not exist'
            });
        }

        // Get grades for this course
        const grades = await Grade.findByCourse(req.params.courseId);

        res.json({
            success: true,
            course,
            grades
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            error: 'Failed to load course',
            message: 'Error retrieving course data'
        });
    }
});

// Add student to course
router.post('/courses/:courseId/students', canAccessCourse, async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({
                error: 'Missing student ID',
                message: 'Please provide student ID'
            });
        }

        const student = await User.findOne({ 
            studentId, 
            role: 'student', 
            isActive: true 
        });

        if (!student) {
            return res.status(404).json({
                error: 'Student not found',
                message: 'No active student found with this ID'
            });
        }

        const course = await Course.findById(req.params.courseId);
        
        if (course.addStudent(student._id)) {
            await course.save();
            
            // Also add course to student's enrolled courses
            if (!student.enrolledCourses.includes(course._id)) {
                student.enrolledCourses.push(course._id);
                await student.save();
            }

            await course.populate('students', 'firstName lastName studentId email');

            res.json({
                success: true,
                message: `Student ${student.getFullName()} added to course`,
                course
            });
        } else {
            res.status(400).json({
                error: 'Cannot add student',
                message: 'Student is already enrolled or course is full'
            });
        }
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({
            error: 'Failed to add student',
            message: 'Error adding student to course'
        });
    }
});

// Remove student from course
router.delete('/courses/:courseId/students/:studentId', canAccessCourse, async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        const student = await User.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({
                error: 'Student not found',
                message: 'Student not found'
            });
        }

        if (course.removeStudent(student._id)) {
            await course.save();
            
            // Remove course from student's enrolled courses
            student.enrolledCourses = student.enrolledCourses.filter(
                courseId => courseId.toString() !== course._id.toString()
            );
            await student.save();

            await course.populate('students', 'firstName lastName studentId email');

            res.json({
                success: true,
                message: `Student ${student.getFullName()} removed from course`,
                course
            });
        } else {
            res.status(400).json({
                error: 'Cannot remove student',
                message: 'Student is not enrolled in this course'
            });
        }
    } catch (error) {
        console.error('Remove student error:', error);
        res.status(500).json({
            error: 'Failed to remove student',
            message: 'Error removing student from course'
        });
    }
});

// Create/Update grade
router.post('/grades', async (req, res) => {
    try {
        const {
            studentId,
            courseId,
            assessmentType,
            assessmentName,
            description,
            score,
            maxScore,
            weight,
            feedback,
            dueDate,
            submissionDate
        } = req.body;

        // Validation
        if (!studentId || !courseId || !assessmentType || !assessmentName || score === undefined || !maxScore) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please provide all required grade information'
            });
        }

        // Verify course belongs to teacher
        const course = await Course.findOne({
            _id: courseId,
            teacher: req.user._id
        });

        if (!course) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only create grades for your own courses'
            });
        }

        // Verify student is enrolled in course
        if (!course.students.includes(studentId)) {
            return res.status(400).json({
                error: 'Student not enrolled',
                message: 'Student is not enrolled in this course'
            });
        }

        // Check if grade already exists for this assessment
        let grade = await Grade.findOne({
            student: studentId,
            course: courseId,
            assessmentName
        });

        if (grade) {
            // Update existing grade
            grade.assessmentType = assessmentType;
            grade.description = description;
            grade.score = score;
            grade.maxScore = maxScore;
            grade.weight = weight || 1;
            grade.feedback = feedback;
            grade.dueDate = dueDate;
            grade.submissionDate = submissionDate;
        } else {
            // Create new grade
            grade = new Grade({
                student: studentId,
                course: courseId,
                teacher: req.user._id,
                assessmentType,
                assessmentName,
                description,
                score,
                maxScore,
                weight: weight || 1,
                feedback,
                dueDate,
                submissionDate
            });
        }

        await grade.save();
        await grade.populate('student', 'firstName lastName studentId');
        await grade.populate('course', 'courseCode courseName');

        res.json({
            success: true,
            message: grade.isNew ? 'Grade created successfully' : 'Grade updated successfully',
            grade
        });
    } catch (error) {
        console.error('Create/Update grade error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Validation error',
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            error: 'Grade operation failed',
            message: 'Error creating/updating grade'
        });
    }
});

// Get all grades for teacher's courses
router.get('/grades', async (req, res) => {
    try {
        const { courseId, studentId, published } = req.query;
        
        let query = { teacher: req.user._id };
        
        if (courseId) query.course = courseId;
        if (studentId) query.student = studentId;
        if (published !== undefined) query.isPublished = published === 'true';

        const grades = await Grade.find(query)
            .populate('student', 'firstName lastName studentId')
            .populate('course', 'courseCode courseName')
            .sort({ gradedDate: -1 });

        res.json({
            success: true,
            grades
        });
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({
            error: 'Failed to load grades',
            message: 'Error retrieving grade data'
        });
    }
});

// Publish/Unpublish grade
router.patch('/grades/:gradeId/publish', async (req, res) => {
    try {
        const { publish } = req.body;
        
        const grade = await Grade.findOne({
            _id: req.params.gradeId,
            teacher: req.user._id
        });

        if (!grade) {
            return res.status(404).json({
                error: 'Grade not found',
                message: 'Grade not found or access denied'
            });
        }

        if (publish) {
            await grade.publish();
        } else {
            await grade.unpublish();
        }

        await grade.populate('student', 'firstName lastName studentId');
        await grade.populate('course', 'courseCode courseName');

        res.json({
            success: true,
            message: `Grade ${publish ? 'published' : 'unpublished'} successfully`,
            grade
        });
    } catch (error) {
        console.error('Publish grade error:', error);
        res.status(500).json({
            error: 'Grade publish failed',
            message: 'Error updating grade publication status'
        });
    }
});

// Update a grade
router.put('/grades/:gradeId', async (req, res) => {
    try {
        const teacherId = req.user._id;
        const gradeId = req.params.gradeId;
        const { assessmentName, percentage, letterGrade, feedback, isPublished } = req.body;
        
        // Find the grade
        const grade = await Grade.findById(gradeId).populate('course');
        if (!grade) {
            return res.status(404).json({
                error: 'Grade not found',
                message: 'The requested grade does not exist'
            });
        }
        
        // Verify teacher owns this course
        if (grade.course.teacher.toString() !== teacherId.toString()) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only edit grades for your own courses'
            });
        }
        
        // Validate input
        if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
            return res.status(400).json({
                error: 'Invalid percentage',
                message: 'Percentage must be between 0 and 100'
            });
        }
        
        // Update grade
        if (assessmentName !== undefined) grade.assessmentName = assessmentName;
        if (percentage !== undefined) grade.percentage = percentage;
        if (letterGrade !== undefined) grade.letterGrade = letterGrade;
        if (feedback !== undefined) grade.feedback = feedback;
        if (isPublished !== undefined) grade.isPublished = isPublished;
        grade.updatedAt = new Date();
        
        await grade.save();
        
        // Populate for response
        await grade.populate([
            { path: 'student', select: 'firstName lastName studentId' },
            { path: 'course', select: 'courseCode courseName' }
        ]);
        
        res.json({
            success: true,
            message: 'Grade updated successfully',
            grade: grade
        });
        
    } catch (error) {
        console.error('Update grade error:', error);
        res.status(500).json({
            error: 'Failed to update grade',
            message: 'Error updating grade'
        });
    }
});

// Delete grade
router.delete('/grades/:gradeId', async (req, res) => {
    try {
        const grade = await Grade.findOneAndDelete({
            _id: req.params.gradeId,
            teacher: req.user._id
        });

        if (!grade) {
            return res.status(404).json({
                error: 'Grade not found',
                message: 'Grade not found or access denied'
            });
        }

        res.json({
            success: true,
            message: 'Grade deleted successfully'
        });
    } catch (error) {
        console.error('Delete grade error:', error);
        res.status(500).json({
            error: 'Grade deletion failed',
            message: 'Error deleting grade'
        });
    }
});

module.exports = router;

