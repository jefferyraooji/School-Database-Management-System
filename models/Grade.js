const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assessmentType: {
        type: String,
        required: true,
        enum: ['exam', 'quiz', 'assignment', 'project', 'participation', 'midterm', 'final'],
        trim: true
    },
    assessmentName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 300
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    maxScore: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
        default: 100
    },
    weight: {
        type: Number,
        min: 0,
        max: 1,
        default: 1 // Weight in final grade calculation (0-1)
    },
    letterGrade: {
        type: String,
        enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
        trim: true
    },
    gpa: {
        type: Number,
        min: 0,
        max: 4.0
    },
    feedback: {
        type: String,
        trim: true,
        maxlength: 500
    },
    submissionDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    gradedDate: {
        type: Date,
        default: Date.now
    },
    isPublished: {
        type: Boolean,
        default: false // Teachers can grade but not publish immediately
    },
    isLate: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one grade per student per assessment
gradeSchema.index({ student: 1, course: 1, assessmentName: 1 }, { unique: true });
gradeSchema.index({ course: 1, assessmentType: 1 });
gradeSchema.index({ teacher: 1, gradedDate: -1 });
gradeSchema.index({ student: 1, isPublished: 1 });

// Pre-save middleware to calculate letter grade and GPA
gradeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Calculate percentage
    const percentage = (this.score / this.maxScore) * 100;
    
    // Calculate letter grade and GPA based on percentage
    if (percentage >= 97) {
        this.letterGrade = 'A+';
        this.gpa = 4.0;
    } else if (percentage >= 93) {
        this.letterGrade = 'A';
        this.gpa = 4.0;
    } else if (percentage >= 90) {
        this.letterGrade = 'A-';
        this.gpa = 3.7;
    } else if (percentage >= 87) {
        this.letterGrade = 'B+';
        this.gpa = 3.3;
    } else if (percentage >= 83) {
        this.letterGrade = 'B';
        this.gpa = 3.0;
    } else if (percentage >= 80) {
        this.letterGrade = 'B-';
        this.gpa = 2.7;
    } else if (percentage >= 77) {
        this.letterGrade = 'C+';
        this.gpa = 2.3;
    } else if (percentage >= 73) {
        this.letterGrade = 'C';
        this.gpa = 2.0;
    } else if (percentage >= 70) {
        this.letterGrade = 'C-';
        this.gpa = 1.7;
    } else if (percentage >= 67) {
        this.letterGrade = 'D+';
        this.gpa = 1.3;
    } else if (percentage >= 63) {
        this.letterGrade = 'D';
        this.gpa = 1.0;
    } else if (percentage >= 60) {
        this.letterGrade = 'D-';
        this.gpa = 0.7;
    } else {
        this.letterGrade = 'F';
        this.gpa = 0.0;
    }
    
    // Check if submission is late
    if (this.submissionDate && this.dueDate) {
        this.isLate = this.submissionDate > this.dueDate;
    }
    
    next();
});

// Virtual for percentage score
gradeSchema.virtual('percentage').get(function() {
    return Math.round((this.score / this.maxScore) * 100 * 100) / 100; // Round to 2 decimal places
});

// Virtual for status
gradeSchema.virtual('status').get(function() {
    if (!this.isPublished) return 'Draft';
    if (this.isLate) return 'Late';
    return 'On Time';
});

// Instance method to publish grade
gradeSchema.methods.publish = function() {
    this.isPublished = true;
    return this.save();
};

// Instance method to unpublish grade
gradeSchema.methods.unpublish = function() {
    this.isPublished = false;
    return this.save();
};

// Static method to find grades by student
gradeSchema.statics.findByStudent = function(studentId, publishedOnly = true) {
    const query = { student: studentId };
    if (publishedOnly) query.isPublished = true;
    
    return this.find(query)
               .populate('course', 'courseCode courseName credits')
               .populate('teacher', 'firstName lastName')
               .sort({ gradedDate: -1 });
};

// Static method to find grades by course
gradeSchema.statics.findByCourse = function(courseId) {
    return this.find({ course: courseId })
               .populate('student', 'firstName lastName studentId')
               .populate('teacher', 'firstName lastName')
               .sort({ assessmentType: 1, gradedDate: -1 });
};

// Static method to find grades by teacher
gradeSchema.statics.findByTeacher = function(teacherId) {
    return this.find({ teacher: teacherId })
               .populate('student', 'firstName lastName studentId')
               .populate('course', 'courseCode courseName')
               .sort({ gradedDate: -1 });
};

// Static method to calculate course average for student
gradeSchema.statics.calculateCourseAverage = async function(studentId, courseId) {
    const grades = await this.find({ 
        student: studentId, 
        course: courseId, 
        isPublished: true 
    });
    
    if (grades.length === 0) return null;
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    grades.forEach(grade => {
        const percentage = (grade.score / grade.maxScore) * 100;
        totalWeightedScore += percentage * grade.weight;
        totalWeight += grade.weight;
    });
    
    return totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : null;
};

// Ensure virtual fields are serialized
gradeSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Grade', gradeSchema);

