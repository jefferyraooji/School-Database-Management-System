// 演示版本 - 不需要数据库连接的注册功能测试
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();

// 临时内存存储 (演示用)
let users = [];
let nextId = 1;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 简化的session配置
app.use(session({
    secret: 'demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// 用户验证函数
function validateUser(userData) {
    const errors = {};
    
    if (!userData.username || userData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
    }
    
    if (!userData.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
        errors.email = 'Please enter a valid email';
    }
    
    if (!userData.password || userData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }
    
    if (userData.role === 'student' && (!userData.studentId || !/^\d{8}$/.test(userData.studentId))) {
        errors.studentId = 'Student ID must be 8 digits';
    }
    
    if (userData.role === 'teacher' && (!userData.teacherId || !/^T\d{6}$/.test(userData.teacherId))) {
        errors.teacherId = 'Teacher ID must be T followed by 6 digits';
    }
    
    return errors;
}

// 注册路由
app.post('/api/auth/register', async (req, res) => {
    try {
        const {
            username, email, password, confirmPassword, role,
            firstName, lastName, studentId, teacherId, department
        } = req.body;

        console.log('Registration attempt:', { username, email, role, firstName, lastName });

        // 基本验证
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

        // 详细验证
        const validationErrors = validateUser(req.body);
        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                message: 'Please fix the form errors',
                details: validationErrors
            });
        }

        // 检查是否已存在
        const existingUser = users.find(u => 
            u.email === email || 
            u.username === username ||
            (studentId && u.studentId === studentId) ||
            (teacherId && u.teacherId === teacherId)
        );

        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                message: 'An account with this information already exists'
            });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 12);

        // 创建用户
        const newUser = {
            id: nextId++,
            username,
            email,
            password: hashedPassword,
            role,
            firstName,
            lastName,
            studentId: role === 'student' ? studentId : undefined,
            teacherId: role === 'teacher' ? teacherId : undefined,
            department,
            createdAt: new Date(),
            isActive: true
        };

        users.push(newUser);

        console.log('User registered successfully:', { id: newUser.id, username, email, role });
        console.log('Total users:', users.length);

        res.status(201).json({
            success: true,
            message: 'Account created successfully! You can now log in.',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                fullName: `${newUser.firstName} ${newUser.lastName}`
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration'
        });
    }
});

// 登录路由
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password, role } = req.body;

        console.log('Login attempt:', { identifier, role });

        if (!identifier || !password || !role) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Please provide identifier, password, and role'
            });
        }

        // 查找用户
        const user = users.find(u => 
            u.role === role && u.isActive && (
                u.email === identifier.toLowerCase() ||
                u.username === identifier ||
                u.studentId === identifier ||
                u.teacherId === identifier
            )
        );

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid identifier, password, or role'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid identifier, password, or role'
            });
        }

        // 创建session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        console.log('Login successful:', { id: user.id, username: user.username, role: user.role });

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: `${user.firstName} ${user.lastName}`,
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

// 查看所有注册用户 (演示用)
app.get('/api/users', (req, res) => {
    const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        fullName: `${u.firstName} ${u.lastName}`,
        studentId: u.studentId,
        teacherId: u.teacherId,
        department: u.department,
        createdAt: u.createdAt
    }));
    
    res.json({
        success: true,
        count: safeUsers.length,
        users: safeUsers
    });
});

// 静态文件路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

const PORT = 3001; // 使用不同端口避免冲突
app.listen(PORT, () => {
    console.log(`\n🎯 演示服务器启动成功！`);
    console.log(`📍 访问地址: http://localhost:${PORT}`);
    console.log(`\n✅ 功能测试:`);
    console.log(`   - 注册新用户: http://localhost:${PORT} (点击Register)`);
    console.log(`   - 查看注册用户: http://localhost:${PORT}/api/users`);
    console.log(`\n📝 测试步骤:`);
    console.log(`   1. 访问主页面`);
    console.log(`   2. 点击"Register here"链接`);
    console.log(`   3. 填写注册表单`);
    console.log(`   4. 提交注册`);
    console.log(`   5. 使用新账号登录`);
    console.log(`\n🔧 演示版本特点:`);
    console.log(`   - 无需数据库连接`);
    console.log(`   - 数据存储在内存中`);
    console.log(`   - 包含完整的注册和登录验证`);
    console.log(`   - 支持学生和老师角色`);
});

module.exports = app;
