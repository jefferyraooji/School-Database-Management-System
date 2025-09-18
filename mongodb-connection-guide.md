# MongoDB连接完全指南

## 📖 目录
1. [MongoDB基础概念](#基础概念)
2. [连接字符串详解](#连接字符串)
3. [本地MongoDB安装和连接](#本地连接)
4. [MongoDB Atlas云服务连接](#云服务连接)
5. [Node.js中的连接实现](#nodejs连接)
6. [常见问题和解决方案](#故障排除)

## 🎯 基础概念

### 什么是MongoDB连接？
MongoDB连接是应用程序与数据库服务器之间建立的通信链路。就像打电话需要电话号码一样，连接数据库需要"连接字符串"。

### 连接字符串的作用
连接字符串告诉应用程序：
- 数据库在哪里 (主机地址)
- 使用什么端口
- 用什么用户名和密码
- 连接到哪个数据库

## 🔗 连接字符串详解

### 基本格式
```
mongodb://[用户名:密码@]主机地址[:端口]/数据库名[?选项]
```

### 示例解析

#### 1. 本地连接 (最简单)
```
mongodb://localhost:27017/school_db
```
- `mongodb://` - 协议
- `localhost` - 主机 (本地电脑)
- `27017` - 端口 (MongoDB默认端口)
- `school_db` - 数据库名

#### 2. 带认证的本地连接
```
mongodb://admin:password123@localhost:27017/school_db
```
- `admin` - 用户名
- `password123` - 密码

#### 3. Atlas云服务连接
```
mongodb+srv://admin:password@cluster0.abc123.mongodb.net/school_db
```
- `mongodb+srv://` - SRV协议 (Atlas专用)
- `cluster0.abc123.mongodb.net` - Atlas集群地址

## 🖥️ 本地MongoDB安装和连接

### Windows安装步骤

#### 1. 下载和安装
```bash
# 1. 访问 https://www.mongodb.com/try/download/community
# 2. 下载 MongoDB Community Server
# 3. 运行安装程序，选择 "Complete" 安装
# 4. 勾选 "Install MongoDB as a Service"
```

#### 2. 验证安装
```bash
# 打开命令提示符 (管理员权限)
mongod --version
mongo --version
```

#### 3. 启动MongoDB服务
```bash
# 方法1: 通过服务管理器
net start MongoDB

# 方法2: 手动启动
mongod --dbpath "C:\data\db"
```

#### 4. 连接测试
```javascript
// test-local-connection.js
const mongoose = require('mongoose');

async function testConnection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/test_db');
        console.log('✅ 本地MongoDB连接成功！');
        
        // 创建一个简单的文档测试
        const TestSchema = new mongoose.Schema({
            name: String,
            createdAt: { type: Date, default: Date.now }
        });
        const Test = mongoose.model('Test', TestSchema);
        
        const doc = new Test({ name: '测试文档' });
        await doc.save();
        console.log('✅ 数据保存成功:', doc);
        
        await mongoose.disconnect();
        console.log('✅ 连接已关闭');
    } catch (error) {
        console.error('❌ 连接失败:', error.message);
    }
}

testConnection();
```

## ☁️ MongoDB Atlas云服务连接

### 优势
- ✅ 无需本地安装
- ✅ 自动备份和维护
- ✅ 高可用性
- ✅ 免费层可用

### 设置步骤

#### 1. 创建Atlas账号
1. 访问 https://www.mongodb.com/atlas
2. 点击 "Try Free"
3. 注册账号并验证邮箱

#### 2. 创建集群
```
1. 创建新项目 (例如: "School Database")
2. 选择 "Build a Database"
3. 选择 "M0 Sandbox" (免费层)
4. 选择云提供商和区域 (推荐就近选择)
5. 集群名称 (例如: Cluster0)
6. 点击 "Create Cluster"
```

#### 3. 设置数据库用户
```
1. 进入 "Database Access"
2. 点击 "Add New Database User"
3. 选择 "Password" 认证
4. 用户名: admin
5. 密码: 创建强密码 (例如: MySecurePass123)
6. 角色: "Read and write to any database"
7. 点击 "Add User"
```

#### 4. 配置网络访问
```
1. 进入 "Network Access"
2. 点击 "Add IP Address"
3. 选择 "Allow Access from Anywhere" (0.0.0.0/0)
   或者添加您的当前IP地址
4. 点击 "Confirm"
```

#### 5. 获取连接字符串
```
1. 返回 "Database" 页面
2. 点击集群的 "Connect" 按钮
3. 选择 "Connect your application"
4. 选择 "Node.js" 和版本
5. 复制连接字符串
```

## 💻 Node.js中的连接实现

### 1. 安装依赖
```bash
npm install mongoose
```

### 2. 基础连接代码
```javascript
// database.js
const mongoose = require('mongoose');

// 连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_db';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // 监听连接事件
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.log('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });

    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
```

### 3. 在应用中使用
```javascript
// app.js
require('dotenv').config();
const express = require('express');
const connectDB = require('./database');

const app = express();

// 连接数据库
connectDB();

// 其他中间件和路由...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 4. 环境变量配置
```bash
# .env 文件
MONGODB_URI=mongodb+srv://admin:MySecurePass123@cluster0.abc123.mongodb.net/school_db
```

## 🔧 实际项目中的完整实现

### 1. 连接管理器
```javascript
// config/database.js
const mongoose = require('mongoose');

class DatabaseManager {
    constructor() {
        this.connection = null;
    }

    async connect(uri, options = {}) {
        try {
            const defaultOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10, // 最大连接池大小
                serverSelectionTimeoutMS: 5000, // 服务器选择超时
                socketTimeoutMS: 45000, // Socket超时
                bufferMaxEntries: 0, // 禁用缓冲
                bufferCommands: false, // 禁用命令缓冲
            };

            const finalOptions = { ...defaultOptions, ...options };
            
            this.connection = await mongoose.connect(uri, finalOptions);
            
            console.log('✅ Database connected successfully');
            console.log(`📍 Host: ${this.connection.connection.host}`);
            console.log(`📊 Database: ${this.connection.connection.name}`);
            
            // 设置事件监听器
            this.setupEventListeners();
            
            return this.connection;
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    setupEventListeners() {
        mongoose.connection.on('connected', () => {
            console.log('🟢 Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('🔴 Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🟡 Mongoose disconnected');
        });

        // 优雅关闭
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.disconnect();
            console.log('✅ Database disconnected');
        }
    }

    isConnected() {
        return mongoose.connection.readyState === 1;
    }
}

module.exports = new DatabaseManager();
```

### 2. 在Express应用中使用
```javascript
// server.js
const express = require('express');
const DatabaseManager = require('./config/database');
require('dotenv').config();

const app = express();

async function startServer() {
    try {
        // 连接数据库
        await DatabaseManager.connect(process.env.MONGODB_URI);
        
        // 设置中间件
        app.use(express.json());
        
        // 健康检查路由
        app.get('/health', (req, res) => {
            res.json({
                status: 'OK',
                database: DatabaseManager.isConnected() ? 'Connected' : 'Disconnected',
                timestamp: new Date().toISOString()
            });
        });
        
        // 启动服务器
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
```

## 🛠️ 故障排除

### 常见错误和解决方案

#### 1. 连接超时
```
Error: MongoServerSelectionError: connect ECONNREFUSED
```
**解决方案:**
- 检查MongoDB服务是否启动
- 验证连接字符串中的主机和端口
- 检查防火墙设置

#### 2. 认证失败
```
Error: Authentication failed
```
**解决方案:**
- 检查用户名和密码是否正确
- 确认用户有访问指定数据库的权限
- 检查连接字符串格式

#### 3. 网络访问被拒绝 (Atlas)
```
Error: MongoNetworkError: connection refused
```
**解决方案:**
- 在Atlas中添加当前IP到白名单
- 检查网络连接
- 确认集群状态正常

#### 4. 数据库不存在
```
Error: Database does not exist
```
**解决方案:**
- MongoDB会自动创建不存在的数据库
- 检查连接字符串中的数据库名
- 确认有创建数据库的权限

### 调试技巧

#### 1. 启用详细日志
```javascript
// 启用Mongoose调试模式
mongoose.set('debug', true);

// 或者只在开发环境启用
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}
```

#### 2. 连接状态检查
```javascript
function checkConnectionStatus() {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    console.log(`Connection state: ${states[mongoose.connection.readyState]}`);
}
```

#### 3. 连接测试工具
```javascript
// test-connection.js
async function testConnection(uri) {
    console.log('Testing connection to:', uri);
    
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Connection successful');
        
        // 测试基本操作
        const testCollection = mongoose.connection.db.collection('test');
        await testCollection.insertOne({ test: 'data', timestamp: new Date() });
        console.log('✅ Write operation successful');
        
        const result = await testCollection.findOne({ test: 'data' });
        console.log('✅ Read operation successful:', result);
        
        await testCollection.deleteOne({ test: 'data' });
        console.log('✅ Delete operation successful');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

// 使用示例
testConnection('mongodb://localhost:27017/test');
```

## 📝 最佳实践

### 1. 环境变量管理
```javascript
// config/env.js
const config = {
    development: {
        MONGODB_URI: 'mongodb://localhost:27017/school_db_dev'
    },
    production: {
        MONGODB_URI: process.env.MONGODB_URI
    },
    test: {
        MONGODB_URI: 'mongodb://localhost:27017/school_db_test'
    }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

### 2. 连接池配置
```javascript
const options = {
    maxPoolSize: 10, // 最大连接数
    minPoolSize: 2,  // 最小连接数
    maxIdleTimeMS: 30000, // 连接空闲时间
    serverSelectionTimeoutMS: 5000, // 服务器选择超时
    socketTimeoutMS: 45000, // Socket超时
};
```

### 3. 错误处理
```javascript
// 全局错误处理
process.on('unhandledRejection', (err) => {
    console.log('Unhandled Promise Rejection:', err);
    process.exit(1);
});

mongoose.connection.on('error', (err) => {
    console.error('Database error:', err);
    // 可以添加重连逻辑
});
```

## 🎯 学习建议

1. **从本地开始**: 先学会本地MongoDB的安装和连接
2. **理解连接字符串**: 掌握各部分的含义和作用
3. **实践Atlas**: 体验云服务的便利性
4. **监控和调试**: 学会查看连接状态和调试问题
5. **安全性**: 了解认证、授权和网络安全

## 📚 扩展资源

- [MongoDB官方文档](https://docs.mongodb.com/)
- [Mongoose文档](https://mongoosejs.com/docs/)
- [MongoDB Atlas教程](https://docs.atlas.mongodb.com/)
- [MongoDB大学免费课程](https://university.mongodb.com/)
