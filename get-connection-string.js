// 获取Atlas连接字符串的帮助工具
console.log('🔗 MongoDB Atlas连接字符串获取指南');
console.log('');
console.log('1. 在Atlas控制台中，点击 "Get connection string" 按钮');
console.log('2. 选择 "Connect your application"');
console.log('3. 选择 "Node.js" 驱动');
console.log('4. 复制连接字符串，格式类似：');
console.log('   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority');
console.log('');
console.log('5. 将连接字符串粘贴到这里，我们来处理：');
console.log('');

// 用户输入连接字符串后的处理函数
function processConnectionString(connectionString) {
    if (!connectionString) {
        console.log('❌ 请提供连接字符串');
        return;
    }

    // 检查连接字符串格式
    if (!connectionString.includes('mongodb+srv://')) {
        console.log('❌ 连接字符串格式不正确，应该以 mongodb+srv:// 开头');
        return;
    }

    // 替换密码占位符
    let finalConnectionString = connectionString;
    if (connectionString.includes('<password>')) {
        console.log('⚠️  请将 <password> 替换为您的实际密码');
        finalConnectionString = connectionString.replace('<password>', 'SchoolDB2024!');
    }

    // 添加数据库名
    if (!finalConnectionString.includes('/school_db')) {
        if (finalConnectionString.includes('/?')) {
            finalConnectionString = finalConnectionString.replace('/?', '/school_db?');
        } else {
            finalConnectionString += '/school_db';
        }
    }

    console.log('✅ 处理后的连接字符串：');
    console.log(finalConnectionString);
    console.log('');
    console.log('📝 请将此连接字符串复制到 config.env 文件中：');
    console.log(`MONGODB_URI=${finalConnectionString}`);
    
    return finalConnectionString;
}

// 示例用法
console.log('📋 示例连接字符串：');
const exampleString = 'mongodb+srv://admin:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority';
processConnectionString(exampleString);

module.exports = { processConnectionString };
