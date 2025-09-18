# Atlas用户设置指南

## 🔧 创建新的数据库用户

### 步骤1: 删除现有用户（可选）
1. 在Atlas控制台，进入 "Database Access"
2. 找到 `jinchengrao76_db_user`，点击 "Delete"

### 步骤2: 创建新用户
1. 点击 "Add New Database User"
2. 填写信息：
   ```
   Authentication Method: Password
   Username: admin
   Password: 123456 (或点击自动生成)
   ```
3. 用户权限：
   - 选择 "Built-in Role"
   - 选择 "Read and write to any database"
4. 点击 "Add User"

### 步骤3: 检查网络访问
1. 进入 "Network Access"
2. 确保有以下条目之一：
   - 您的当前IP地址
   - 0.0.0.0/0 (允许所有IP，仅用于开发)

### 步骤4: 更新连接字符串
新的连接字符串格式：
```
mongodb+srv://admin:123456@cluster0.hn1xwpk.mongodb.net/school_db?retryWrites=true&w=majority&appName=Cluster0
```

## 🎯 快速测试方法

如果您创建了用户名为 `admin`，密码为 `123456` 的用户，
请告诉我，我会立即更新配置并测试连接。
