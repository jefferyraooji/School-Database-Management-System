// 测试Atlas连接的脚本
const mongoose = require('mongoose');

async function testAtlasConnection(password) {
    // 构建完整的连接字符串
    const connectionString = `mongodb+srv://jinchengrao76_db_user:${password}@cluster0.hn1xwpk.mongodb.net/school_db?retryWrites=true&w=majority&appName=Cluster0`;
    
    console.log('🔄 正在测试MongoDB Atlas连接...');
    console.log('📍 集群: cluster0.hn1xwpk.mongodb.net');
    console.log('👤 用户: jinchengrao76_db_user');
    console.log('🗄️  数据库: school_db');
    console.log('');

    try {
        // 尝试连接
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10秒超时
        });

        console.log('✅ Atlas连接成功！');
        console.log('📊 连接详情:');
        console.log('   - 数据库名:', mongoose.connection.name);
        console.log('   - 连接状态:', mongoose.connection.readyState === 1 ? '已连接' : '未连接');
        console.log('   - 主机:', mongoose.connection.host);
        
        // 测试基本数据库操作
        console.log('');
        console.log('🧪 测试数据库操作...');
        
        // 创建测试集合
        const testSchema = new mongoose.Schema({
            name: String,
            message: String,
            timestamp: { type: Date, default: Date.now }
        });
        
        const TestModel = mongoose.model('ConnectionTest', testSchema);
        
        // 写入测试数据
        const testDoc = new TestModel({
            name: '连接测试',
            message: 'MongoDB Atlas连接成功！'
        });
        
        await testDoc.save();
        console.log('✅ 写入操作成功');
        
        // 读取测试数据
        const savedDoc = await TestModel.findOne({ name: '连接测试' });
        console.log('✅ 读取操作成功:', savedDoc.message);
        
        // 删除测试数据
        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('✅ 删除操作成功');
        
        // 关闭连接
        await mongoose.disconnect();
        console.log('✅ 连接已安全关闭');
        
        console.log('');
        console.log('🎉 所有测试通过！您的Atlas数据库已准备就绪。');
        console.log('');
        console.log('📝 下一步：');
        console.log('   1. 运行: npm run seed (加载演示数据)');
        console.log('   2. 运行: npm run dev (启动应用)');
        console.log('   3. 访问: http://localhost:3000');
        
        return true;
        
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
        console.log('');
        console.log('🔍 常见问题排查:');
        
        if (error.message.includes('authentication failed')) {
            console.log('   - 检查用户名和密码是否正确');
            console.log('   - 确认用户有数据库访问权限');
        } else if (error.message.includes('network error') || error.message.includes('ENOTFOUND')) {
            console.log('   - 检查网络连接');
            console.log('   - 确认IP地址在Atlas白名单中');
        } else if (error.message.includes('server selection timed out')) {
            console.log('   - 检查集群是否处于活动状态');
            console.log('   - 验证连接字符串格式');
        }
        
        console.log('');
        console.log('💡 解决方案:');
        console.log('   1. 在Atlas控制台检查Database Access设置');
        console.log('   2. 在Network Access中添加当前IP地址');
        console.log('   3. 确认集群状态为"Active"');
        
        return false;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const password = process.argv[2];
    if (!password) {
        console.log('使用方法: node test-atlas-connection.js <your_password>');
        console.log('例如: node test-atlas-connection.js SchoolDB2024!');
        process.exit(1);
    }
    
    testAtlasConnection(password);
}

module.exports = { testAtlasConnection };
