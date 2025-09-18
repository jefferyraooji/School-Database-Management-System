const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z]{2,4}\d{3,4}$/, 'Course code must be 2-4 letters followed by 3-4 digits (e.g., CS101, MATH1001)']
    },
    courseName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    credits: {
        type: Number,
        required: true,
        min: 1,
        max: 6
    },
    semester: {
        type: String,
        required: true,
        enum: ['Fall', 'Spring', 'Summer']
    },
    year: {
        type: Number,
        required: true,
        min: 2020,
        max: 2030
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxStudents: {
        type: Number,
        default: 30,
        min: 1,
        max: 100
    },
    schedule: {
        days: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        startTime: {
            type: String,
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format']
        },
        endTime: {
            type: String,
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format']
        },
        room: {
            type: String,
            trim: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
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

// Index for better query performance
courseSchema.index({ courseCode: 1 });
courseSchema.index({ teacher: 1 });
courseSchema.index({ department: 1, semester: 1, year: 1 });
courseSchema.index({ students: 1 });

// Pre-save middleware to update timestamp
courseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for enrolled student count
courseSchema.virtual('enrolledCount').get(function() {
    return this.students ? this.students.length : 0;
});

// Virtual for available spots
courseSchema.virtual('availableSpots').get(function() {
    const studentCount = this.students ? this.students.length : 0;
    return this.maxStudents - studentCount;
});

// Virtual for full course identifier
courseSchema.virtual('fullIdentifier').get(function() {
    return `${this.courseCode} - ${this.courseName}`;
});

// Instance method to check if student is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
    return this.students.includes(studentId);
};

// Instance method to add student
courseSchema.methods.addStudent = function(studentId) {
    if (!this.isStudentEnrolled(studentId) && this.availableSpots > 0) {
        this.students.push(studentId);
        return true;
    }
    return false;
};

// Instance method to remove student
courseSchema.methods.removeStudent = function(studentId) {
    const index = this.students.indexOf(studentId);
    if (index > -1) {
        this.students.splice(index, 1);
        return true;
    }
    return false;
};

// Static method to find courses by teacher
courseSchema.statics.findByTeacher = function(teacherId) {
    return this.find({ teacher: teacherId, isActive: true })
               .populate('teacher', 'firstName lastName email')
               .populate('students', 'firstName lastName studentId email');
};

// Static method to find courses by student
courseSchema.statics.findByStudent = function(studentId) {
    return this.find({ students: studentId, isActive: true })
               .populate('teacher', 'firstName lastName email')
               .populate('students', 'firstName lastName studentId email');
};

// Ensure virtual fields are serialized
courseSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Course', courseSchema);

