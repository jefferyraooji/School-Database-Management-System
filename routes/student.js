const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const { isStudent } = require('../middleware/auth');

const router = express.Router();

// All routes require student authentication
router.use(isStudent);

// Get student dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const studentId = req.user._id;
        
        // Get student's enrolled courses
        const courses = await Course.findByStudent(studentId);
        
        // Get recent published grades (last 10)
        const recentGrades = await Grade.findByStudent(studentId, true)
            .limit(10);
        
        // Calculate GPA and statistics
        let totalGradePoints = 0;
        let totalCredits = 0;
        const courseAverages = [];

        for (const course of courses) {
            const average = await Grade.calculateCourseAverage(studentId, course._id);
            if (average !== null) {
                courseAverages.push({
                    course: course.courseCode,
                    courseName: course.courseName,
                    average,
                    credits: course.credits
                });
                
                // Calculate GPA contribution
                const gradePoints = convertPercentageToGPA(average);
                totalGradePoints += gradePoints * course.credits;
                totalCredits += course.credits;
            }
        }

        const overallGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
        
        res.json({
            success: true,
            data: {
                student: {
                    name: req.user.getFullName(),
                    studentId: req.user.studentId,
                    email: req.user.email,
                    department: req.user.department
                },
                statistics: {
                    totalCourses: courses.length,
                    totalCredits,
                    overallGPA,
                    totalGrades: recentGrades.length
                },
                courses,
                recentGrades,
                courseAverages
            }
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({
            error: 'Dashboard load failed',
            message: 'Error loading dashboard data'
        });
    }
});

// Get all student's courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.findByStudent(req.user._id);
        
        // Add course averages
        const coursesWithAverages = await Promise.all(
            courses.map(async (course) => {
                const average = await Grade.calculateCourseAverage(req.user._id, course._id);
                return {
                    ...course.toJSON(),
                    average,
                    letterGrade: average ? convertPercentageToLetterGrade(average) : null
                };
            })
        );

        res.json({
            success: true,
            courses: coursesWithAverages
        });
    } catch (error) {
        console.error('Get student courses error:', error);
        res.status(500).json({
            error: 'Failed to load courses',
            message: 'Error retrieving course data'
        });
    }
});

// Get specific course details
router.get('/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId)
            .populate('teacher', 'firstName lastName email teacherId');

        if (!course) {
            return res.status(404).json({
                error: 'Course not found',
                message: 'The requested course does not exist'
            });
        }

        // Check if student is enrolled
        if (!course.students.includes(req.user._id)) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You are not enrolled in this course'
            });
        }

        // Get student's grades for this course
        const grades = await Grade.find({
            student: req.user._id,
            course: req.params.courseId,
            isPublished: true
        }).sort({ gradedDate: -1 });

        // Calculate course average
        const average = await Grade.calculateCourseAverage(req.user._id, req.params.courseId);

        res.json({
            success: true,
            course: {
                ...course.toJSON(),
                average,
                letterGrade: average ? convertPercentageToLetterGrade(average) : null
            },
            grades
        });
    } catch (error) {
        console.error('Get course details error:', error);
        res.status(500).json({
            error: 'Failed to load course',
            message: 'Error retrieving course data'
        });
    }
});

// Get all student's grades
router.get('/grades', async (req, res) => {
    try {
        const { courseId, semester, year } = req.query;
        
        let query = { student: req.user._id, isPublished: true };
        
        if (courseId) {
            query.course = courseId;
        }

        let grades = await Grade.find(query)
            .populate('course', 'courseCode courseName semester year credits')
            .populate('teacher', 'firstName lastName')
            .sort({ gradedDate: -1 });

        // Filter by semester/year if provided
        if (semester || year) {
            grades = grades.filter(grade => {
                if (semester && grade.course.semester !== semester) return false;
                if (year && grade.course.year !== parseInt(year)) return false;
                return true;
            });
        }

        res.json({
            success: true,
            grades
        });
    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({
            error: 'Failed to load grades',
            message: 'Error retrieving grade data'
        });
    }
});

// Get grade statistics and analytics
router.get('/analytics', async (req, res) => {
    try {
        const studentId = req.user._id;
        
        // Get all published grades
        const grades = await Grade.findByStudent(studentId, true);
        
        if (grades.length === 0) {
            return res.json({
                success: true,
                analytics: {
                    totalGrades: 0,
                    averageScore: 0,
                    gradeDistribution: {},
                    performanceByType: {},
                    semesterPerformance: [],
                    improvementTrend: []
                }
            });
        }

        // Calculate statistics
        const totalScore = grades.reduce((sum, grade) => sum + grade.percentage, 0);
        const averageScore = (totalScore / grades.length).toFixed(2);
        
        // Grade distribution
        const gradeDistribution = {};
        grades.forEach(grade => {
            const letter = grade.letterGrade;
            gradeDistribution[letter] = (gradeDistribution[letter] || 0) + 1;
        });

        // Performance by assessment type
        const performanceByType = {};
        grades.forEach(grade => {
            const type = grade.assessmentType;
            if (!performanceByType[type]) {
                performanceByType[type] = { total: 0, count: 0, average: 0 };
            }
            performanceByType[type].total += grade.percentage;
            performanceByType[type].count += 1;
        });

        // Calculate averages for each type
        Object.keys(performanceByType).forEach(type => {
            const data = performanceByType[type];
            data.average = (data.total / data.count).toFixed(2);
        });

        // Semester performance (group by course semester/year)
        const semesterGroups = {};
        for (const grade of grades) {
            const course = await Course.findById(grade.course);
            if (course) {
                const key = `${course.semester} ${course.year}`;
                if (!semesterGroups[key]) {
                    semesterGroups[key] = { total: 0, count: 0, credits: 0 };
                }
                semesterGroups[key].total += grade.percentage * course.credits;
                semesterGroups[key].credits += course.credits;
                semesterGroups[key].count += 1;
            }
        }

        const semesterPerformance = Object.keys(semesterGroups).map(semester => ({
            semester,
            average: (semesterGroups[semester].total / semesterGroups[semester].credits).toFixed(2),
            courses: semesterGroups[semester].count
        }));

        // Improvement trend (last 10 grades)
        const recentGrades = grades.slice(-10);
        const improvementTrend = recentGrades.map((grade, index) => ({
            assessment: grade.assessmentName,
            score: grade.percentage,
            date: grade.gradedDate,
            order: index + 1
        }));

        res.json({
            success: true,
            analytics: {
                totalGrades: grades.length,
                averageScore: parseFloat(averageScore),
                gradeDistribution,
                performanceByType,
                semesterPerformance,
                improvementTrend
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            error: 'Failed to load analytics',
            message: 'Error retrieving analytics data'
        });
    }
});

// Get transcript data
router.get('/transcript', async (req, res) => {
    try {
        const studentId = req.user._id;
        
        // Get all courses student has been enrolled in
        const courses = await Course.find({
            students: studentId
        }).populate('teacher', 'firstName lastName');

        const transcript = [];
        let totalGradePoints = 0;
        let totalCredits = 0;

        for (const course of courses) {
            const average = await Grade.calculateCourseAverage(studentId, course._id);
            
            if (average !== null) {
                const letterGrade = convertPercentageToLetterGrade(average);
                const gradePoints = convertPercentageToGPA(average);
                
                transcript.push({
                    semester: course.semester,
                    year: course.year,
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    credits: course.credits,
                    grade: letterGrade,
                    gradePoints: gradePoints.toFixed(2),
                    percentage: average,
                    teacher: course.teacher.getFullName()
                });

                totalGradePoints += gradePoints * course.credits;
                totalCredits += course.credits;
            }
        }

        // Sort by year and semester
        transcript.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            const semesterOrder = { 'Spring': 1, 'Summer': 2, 'Fall': 3 };
            return semesterOrder[a.semester] - semesterOrder[b.semester];
        });

        const cumulativeGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

        res.json({
            success: true,
            transcript: {
                student: {
                    name: req.user.getFullName(),
                    studentId: req.user.studentId,
                    department: req.user.department
                },
                summary: {
                    totalCredits,
                    cumulativeGPA: parseFloat(cumulativeGPA),
                    totalCourses: transcript.length
                },
                courses: transcript
            }
        });
    } catch (error) {
        console.error('Get transcript error:', error);
        res.status(500).json({
            error: 'Failed to load transcript',
            message: 'Error retrieving transcript data'
        });
    }
});

// Helper functions
function convertPercentageToLetterGrade(percentage) {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
}

function convertPercentageToGPA(percentage) {
    if (percentage >= 97) return 4.0;
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 63) return 1.0;
    if (percentage >= 60) return 0.7;
    return 0.0;
}

module.exports = router;

