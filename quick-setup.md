# 快速登录测试指南

## 方案1: 演示服务器测试 (无需数据库)

### 步骤1: 访问演示系统
打开浏览器访问: **http://localhost:3001**

### 步骤2: 注册测试账号

#### 教师账号注册:
- First Name: 李
- Last Name: 老师  
- Role: Teacher
- Teacher ID: T123456
- Username: teacher01
- Email: teacher01@test.com
- Password: 123456
- Confirm Password: 123456

#### 学生账号注册:
- First Name: 王
- Last Name: 同学
- Role: Student  
- Student ID: 20241001
- Username: student01
- Email: student01@test.com
- Password: 123456
- Confirm Password: 123456

### 步骤3: 登录测试
注册成功后，使用刚注册的账号登录:
- 选择对应角色 (Teacher/Student)
- 输入邮箱: teacher01@test.com 或 student01@test.com
- 输入密码: 123456
- 点击登录

## 方案2: 完整数据库系统

### 快速MongoDB Atlas设置:
1. 访问 https://www.mongodb.com/atlas
2. 注册免费账号
3. 创建免费集群
4. 获取连接字符串
5. 更新 config.env 文件中的 MONGODB_URI

### 然后运行:
```bash
npm run seed  # 创建演示数据
npm run dev   # 启动完整系统
```

### 使用预设演示账号:
**教师账号:**
- 邮箱: teacher@demo.com
- 密码: teacher123

**学生账号:**  
- 邮箱: student@demo.com
- 密码: student123

## 故障排除

### 如果3001端口无法访问:
1. 确认演示服务器正在运行
2. 检查防火墙设置
3. 尝试重启服务器: `node demo-without-db.js`

### 如果注册失败:
1. 检查所有必填字段
2. 确保密码至少6位
3. 学生ID必须8位数字
4. 教师ID必须T+6位数字格式

### 如果登录失败:
1. 确认角色选择正确
2. 检查用户名/邮箱拼写
3. 确认密码正确
4. 查看浏览器控制台错误信息
