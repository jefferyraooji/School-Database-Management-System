// 启动演示服务器 - 包含预设账号
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();

// 预设用户数据 (包含加密密码)
let users = [];
let nextId = 1;

// 初始化预设账号
async function initializeUsers() {
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    users = [
        {
            id: nextId++,
            username: 'teacher01',
            email: 'teacher@test.com',
            password: hashedPassword,
            role: 'teacher',
            firstName: '李',
            lastName: '老师',
            teacherId: 'T123456',
            department: 'Computer Science',
            createdAt: new Date(),
            isActive: true
        },
        {
            id: nextId++,
            username: 'student01',
            email: 'student@test.com',
            password: hashedPassword,
            role: 'student',
            firstName: '王',
            lastName: '同学',
            studentId: '20241001',
            department: 'Computer Science',
            createdAt: new Date(),
            isActive: true
        }
    ];
    
    console.log('✅ 预设账号已创建:');
    console.log('   教师: teacher@test.com / 123456');
    console.log('   学生: student@test.com / 123456');
}

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'demo-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

// 注册路由
app.post('/api/auth/register', async (req, res) => {
    try {
        const {
            username, email, password, confirmPassword, role,
            firstName, lastName, studentId, teacherId, department
        } = req.body;

        console.log('📝 注册请求:', { username, email, role, firstName, lastName });

        // 基本验证
        if (!username || !email || !password || !role || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: '请填写所有必填字段'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Password mismatch',
                message: '两次输入的密码不匹配'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password too short',
                message: '密码至少需要6位'
            });
        }

        // 角色特定验证
        if (role === 'student' && (!studentId || !/^\d{8}$/.test(studentId))) {
            return res.status(400).json({
                error: 'Invalid student ID',
                message: '学生ID必须是8位数字'
            });
        }

        if (role === 'teacher' && (!teacherId || !/^T\d{6}$/.test(teacherId))) {
            return res.status(400).json({
                error: 'Invalid teacher ID',
                message: '教师ID必须是T开头加6位数字'
            });
        }

        // 检查重复
        const existingUser = users.find(u => 
            u.email === email || 
            u.username === username ||
            (studentId && u.studentId === studentId) ||
            (teacherId && u.teacherId === teacherId)
        );

        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                message: '该用户信息已存在'
            });
        }

        // 创建新用户
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = {
            id: nextId++,
            username, email, password: hashedPassword, role,
            firstName, lastName, department,
            studentId: role === 'student' ? studentId : undefined,
            teacherId: role === 'teacher' ? teacherId : undefined,
            createdAt: new Date(),
            isActive: true
        };

        users.push(newUser);

        console.log('✅ 用户注册成功:', { id: newUser.id, username, email, role });

        res.status(201).json({
            success: true,
            message: '账号创建成功！现在可以登录了。',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                fullName: `${newUser.firstName} ${newUser.lastName}`
            }
        });

    } catch (error) {
        console.error('❌ 注册错误:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: '注册过程中发生错误'
        });
    }
});

// 登录路由
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password, role } = req.body;

        console.log('🔐 登录请求:', { identifier, role });

        if (!identifier || !password || !role) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: '请提供完整的登录信息'
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
            console.log('❌ 用户未找到:', { identifier, role });
            return res.status(401).json({
                error: 'Invalid credentials',
                message: '用户名、密码或角色错误'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ 密码错误:', { identifier });
            return res.status(401).json({
                error: 'Invalid credentials',
                message: '用户名、密码或角色错误'
            });
        }

        // 创建session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        console.log('✅ 登录成功:', { id: user.id, username: user.username, role: user.role });

        res.json({
            success: true,
            message: '登录成功',
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
        console.error('❌ 登录错误:', error);
        res.status(500).json({
            error: 'Login failed',
            message: '登录过程中发生错误'
        });
    }
});

// 获取当前用户信息
app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({
            error: 'Not authenticated',
            message: '未登录'
        });
    }

    const user = users.find(u => u.id === req.session.userId);
    if (!user) {
        return res.status(404).json({
            error: 'User not found',
            message: '用户不存在'
        });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: `${user.firstName} ${user.lastName}`,
            studentId: user.studentId,
            teacherId: user.teacherId,
            department: user.department
        }
    });
});

// 登出
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                error: 'Logout failed',
                message: '登出失败'
            });
        }
        res.json({
            success: true,
            message: '已成功登出'
        });
    });
});

// 查看所有用户
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

// 静态页面路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

app.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

const PORT = 3002;

// 启动服务器
async function startServer() {
    await initializeUsers();
    
    app.listen(PORT, () => {
        console.log('\n🎉 学校数据库管理系统演示服务器启动成功！');
        console.log(`📍 访问地址: http://localhost:${PORT}`);
        console.log('\n🔑 预设测试账号:');
        console.log('   👨‍🏫 教师账号: teacher@test.com / 123456');
        console.log('   👨‍🎓 学生账号: student@test.com / 123456');
        console.log('\n📝 测试步骤:');
        console.log('   1. 打开浏览器访问上述地址');
        console.log('   2. 选择角色并输入账号密码');
        console.log('   3. 点击登录按钮');
        console.log('   4. 或者点击"Register here"注册新账号');
        console.log('\n🔍 查看用户列表: http://localhost:' + PORT + '/api/users');
        console.log('\n✨ 功能特点:');
        console.log('   - 完整的用户注册和登录验证');
        console.log('   - 角色基础的访问控制');
        console.log('   - 安全的密码加密存储');
        console.log('   - 支持多种登录方式 (邮箱/用户名/ID)');
    });
}

startServer().catch(console.error);
