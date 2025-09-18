// 测试数据持久性 - 验证数据是否正确保存到MongoDB Atlas
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const User = require('./models/User');
const Course = require('./models/Course');
const Grade = require('./models/Grade');

async function testDataPersistence() {
    try {
        console.log('🔄 连接到MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ 连接成功！');
        
        // 测试用户数据
        console.log('\n📊 数据统计:');
        const userCount = await User.countDocuments();
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const studentCount = await User.countDocuments({ role: 'student' });
        
        console.log(`   总用户数: ${userCount}`);
        console.log(`   教师数量: ${teacherCount}`);
        console.log(`   学生数量: ${studentCount}`);
        
        // 测试课程数据
        const courseCount = await Course.countDocuments();
        console.log(`   课程数量: ${courseCount}`);
        
        // 测试成绩数据
        const gradeCount = await Grade.countDocuments();
        const publishedGradeCount = await Grade.countDocuments({ isPublished: true });
        
        console.log(`   成绩总数: ${gradeCount}`);
        console.log(`   已发布成绩: ${publishedGradeCount}`);
        
        // 显示最近创建的用户
        console.log('\n👥 最近注册的用户:');
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username email role firstName lastName createdAt');
            
        recentUsers.forEach(user => {
            console.log(`   - ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
        });
        
        // 显示课程信息
        console.log('\n📚 课程列表:');
        const courses = await Course.find()
            .populate('teacher', 'firstName lastName')
            .select('courseCode courseName teacher enrolledCount');
            
        courses.forEach(course => {
            console.log(`   - ${course.courseCode}: ${course.courseName}`);
            console.log(`     教师: ${course.teacher.firstName} ${course.teacher.lastName}`);
            console.log(`     学生数: ${course.students ? course.students.length : 0}`);
        });
        
        console.log('\n✅ 数据持久性测试完成！');
        console.log('💡 您可以在MongoDB Atlas控制台中查看这些数据：');
        console.log('   1. 进入Atlas控制台');
        console.log('   2. 点击 "Browse Collections"');
        console.log('   3. 查看 school_db 数据库中的集合');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 数据库连接已关闭');
    }
}

if (require.main === module) {
    testDataPersistence();
}

module.exports = { testDataPersistence };
