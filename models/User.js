const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true, // Only required for students
        match: [/^\d{8}$/, 'Student ID must be 8 digits']
    },
    teacherId: {
        type: String,
        unique: true,
        sparse: true, // Only required for teachers
        match: [/^T\d{6}$/, 'Teacher ID must start with T followed by 6 digits']
    },
    department: {
        type: String,
        trim: true
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    teachingCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
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
userSchema.index({ email: 1, role: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ teacherId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to update timestamp
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get full name
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
    return this.find({ role, isActive: true });
};

// Virtual for display name
userSchema.virtual('displayName').get(function() {
    return this.getFullName();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password; // Never send password in JSON
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);

