# ruoyi-eggjs-pgsql

> Egg plugin for PostgreSQL

基于 [node-postgres (pg)](https://github.com/brianc/node-postgres) 的 Egg.js PostgreSQL 插件，提供简单易用的数据库操作接口和连接池管理。

## 特性

- ✅ 基于 node-postgres 连接池，性能优异
- ✅ 支持单实例和多实例配置
- ✅ 提供简洁的 API 封装（select、insert、update、delete）
- ✅ 内置事务支持，自动提交和回滚
- ✅ 开发环境自动打印 SQL 执行时间
- ✅ 错误信息包含执行的 SQL 语句
- ✅ 原生 Promise/Async 支持
- ✅ 支持参数化查询，防止 SQL 注入

## 安装

```bash
$ npm i ruoyi-eggjs-pgsql --save
```

## 支持的 egg 版本

| egg 3.x | egg 2.x | egg 1.x |
| ------- | ------- | ------- |
| 😁      | 😁      | ❌      |

## 开启插件

```js
// {app_root}/config/plugin.js
exports.pgsql = {
  enable: true,
  package: "ruoyi-eggjs-pgsql",
};
```

## 配置

### 单实例

```js
// {app_root}/config/config.default.js
config.pgsql = {
  default: {
    port: 5432,
    max: 100,                          // 连接池最大连接数
    idleTimeoutMillis: 30000,         // 空闲连接超时时间（毫秒）
    connectionTimeoutMillis: 2000,    // 连接超时时间（毫秒）
  },
  client: {
    host: "127.0.0.1",
    user: "postgres",
    password: "your_password",
    database: "your_database",
  },
};
```

### 多实例

```js
// {app_root}/config/config.default.js
config.pgsql = {
  default: {
    port: 5432,
    max: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  clients: {
    // 主库
    pg1: {
      host: "127.0.0.1",
      user: "postgres",
      password: "password1",
      database: "database1",
    },
    // 从库
    pg2: {
      host: "192.168.1.100",
      user: "postgres",
      password: "password2",
      database: "database2",
    },
  },
};
```

### 配置参数说明

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| host | String | localhost | PostgreSQL 服务器地址 |
| port | Number | 5432 | PostgreSQL 端口 |
| user | String | - | 数据库用户名 |
| password | String | - | 数据库密码 |
| database | String | - | 数据库名称 |
| max | Number | 10 | 连接池最大连接数 |
| idleTimeoutMillis | Number | 10000 | 空闲连接超时时间（毫秒） |
| connectionTimeoutMillis | Number | 0 | 连接超时时间（毫秒） |
| ssl | Boolean/Object | false | SSL 配置 |

更多配置选项请参考 [node-postgres 文档](https://node-postgres.com/api/pool)。

## 使用方法

### 单实例

```js
// 在 controller 或 service 中使用
const { app } = this;

// 单条查询（参数化查询）
const user = await app.pgsql.select(
  'SELECT * FROM users WHERE id = $1',
  [1]
);

// 多条查询
const users = await app.pgsql.selects(
  'SELECT * FROM users WHERE age > $1',
  [18]
);

// 插入数据（返回插入的行，需要 RETURNING 子句）
const result = await app.pgsql.insert(
  "INSERT INTO users (name, age) VALUES ($1, $2) RETURNING id",
  ['张三', 25]
);
console.log(result.id); // 新插入行的 ID

// 更新数据（返回影响的行数）
const affectedRows = await app.pgsql.update(
  "UPDATE users SET age = $1 WHERE id = $2",
  [26, 1]
);

// 删除数据（返回影响的行数）
const deleted = await app.pgsql.del(
  "DELETE FROM users WHERE id = $1",
  [1]
);

// 执行任意 SQL
await app.pgsql.run(
  "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(255))"
);
```

### 多实例

```js
// 获取指定数据库实例
const pg1 = app.pgsql.get('pg1');
const pg2 = app.pgsql.get('pg2');

// 从不同数据库查询
const user = await pg1.select('SELECT * FROM users WHERE id = $1', [1]);
const order = await pg2.select('SELECT * FROM orders WHERE id = $1', [1]);
```

## API 说明

### select(sql, values)

执行单条查询，返回第一行数据。

```js
const user = await app.pgsql.select('SELECT * FROM users WHERE id = $1', [1]);
// 返回: { id: 1, name: '张三', age: 25 } 或 null
```

### selects(sql, values)

执行多条查询，返回所有匹配的行。

```js
const users = await app.pgsql.selects('SELECT * FROM users WHERE age > $1', [18]);
// 返回: [{ id: 1, name: '张三', age: 25 }, { id: 2, name: '李四', age: 30 }]
```

### insert(sql, values)

执行插入操作，返回插入的行数据（需要 RETURNING 子句）或影响行数。

```js
// 使用 RETURNING 返回插入的数据
const result = await app.pgsql.insert(
  "INSERT INTO users (name, age) VALUES ($1, $2) RETURNING id, name, age",
  ['王五', 28]
);
// 返回: { id: 3, name: '王五', age: 28 }

// 不使用 RETURNING，返回影响行数
const rowCount = await app.pgsql.insert(
  "INSERT INTO users (name, age) VALUES ($1, $2)",
  ['赵六', 32]
);
// 返回: 1
```

### update(sql, values)

执行更新操作，返回受影响的行数。

```js
const affectedRows = await app.pgsql.update(
  "UPDATE users SET age = $1 WHERE id = $2",
  [26, 1]
);
// 返回: 1 (受影响的行数)
```

### del(sql, values)

执行删除操作，返回受影响的行数（实际是 `update` 的别名）。

```js
const deleted = await app.pgsql.del("DELETE FROM users WHERE age < $1", [18]);
// 返回: 2 (删除的行数)
```

### run(sql, values)

执行任意 SQL 语句，返回完整的执行结果。

```js
const result = await app.pgsql.run("SELECT * FROM users");
// result.rows: 查询结果数组
// result.rowCount: 影响的行数
// result.fields: 字段信息数组
```

### transaction(sqls)

执行事务，传入 SQL 数组，全部成功则自动提交，任一失败则自动回滚。

```js
// SQL 可以是字符串或 [sql, values] 数组
const results = await app.pgsql.transaction([
  ["INSERT INTO users (name, age) VALUES ($1, $2)", ['张三', 25]],
  ["INSERT INTO users (name, age) VALUES ($1, $2)", ['李四', 30]],
  ["UPDATE accounts SET balance = balance - $1 WHERE user_id = $2", [100, 1]],
  ["UPDATE accounts SET balance = balance + $1 WHERE user_id = $2", [100, 2]],
]);
// 返回: 所有 SQL 的执行结果数组
```

如果事务中任何一条 SQL 执行失败，所有更改会自动回滚：

```js
try {
  await app.pgsql.transaction([
    ["INSERT INTO users (name, age) VALUES ($1, $2)", ['张三', 25]],
    ["INSERT INTO invalid_table (name) VALUES ($1)", ['test']], // 这条会失败
  ]);
} catch (error) {
  console.log(error.sqls); // 包含所有执行的 SQL
  // 第一条插入会被自动回滚
}
```

### pool

获取原始的 node-postgres 连接池对象，用于高级操作。

```js
const pool = app.pgsql.pool;
const result = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
console.log(result.rows);
```

### close()

关闭连接池（通常在应用关闭时调用）。

```js
await app.pgsql.close();
```

## 开发调试

在非生产环境下，插件会自动在控制台打印每条 SQL 的执行时间：

```
SELECT * FROM users WHERE id = $1: 1.234ms
INSERT INTO users (name, age) VALUES ($1, $2) RETURNING id: 2.567ms
```

## 完整示例

### Service 层使用

```js
// app/service/user.js
const { Service } = require('egg');

class UserService extends Service {
  async create(name, age) {
    const result = await this.app.pgsql.insert(
      'INSERT INTO users (name, age, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [name, age]
    );
    return result.id;
  }

  async findById(id) {
    return await this.app.pgsql.select(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
  }

  async findAll() {
    return await this.app.pgsql.selects(
      'SELECT * FROM users ORDER BY id DESC'
    );
  }

  async update(id, data) {
    const affectedRows = await this.app.pgsql.update(
      'UPDATE users SET name = $1, age = $2, updated_at = NOW() WHERE id = $3',
      [data.name, data.age, id]
    );
    return affectedRows > 0;
  }

  async delete(id) {
    const deleted = await this.app.pgsql.del(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return deleted > 0;
  }

  // 转账示例（事务）
  async transfer(fromUserId, toUserId, amount) {
    return await this.app.pgsql.transaction([
      [
        'UPDATE accounts SET balance = balance - $1 WHERE user_id = $2',
        [amount, fromUserId]
      ],
      [
        'UPDATE accounts SET balance = balance + $1 WHERE user_id = $2',
        [amount, toUserId]
      ],
      [
        'INSERT INTO transactions (from_user, to_user, amount, created_at) VALUES ($1, $2, $3, NOW())',
        [fromUserId, toUserId, amount]
      ],
    ]);
  }
}

module.exports = UserService;
```

### Controller 层使用

```js
// app/controller/user.js
const Controller = require('egg').Controller;

class UserController extends Controller {
  async index() {
    const { ctx } = this;
    const users = await ctx.service.user.findAll();
    ctx.body = users;
  }

  async show() {
    const { ctx } = this;
    const id = ctx.params.id;
    const user = await ctx.service.user.findById(id);
    ctx.body = user;
  }

  async create() {
    const { ctx } = this;
    const { name, age } = ctx.request.body;
    const userId = await ctx.service.user.create(name, age);
    ctx.body = { id: userId, msg: '创建成功' };
  }

  async update() {
    const { ctx } = this;
    const id = ctx.params.id;
    const success = await ctx.service.user.update(id, ctx.request.body);
    ctx.body = { success, msg: success ? '更新成功' : '更新失败' };
  }

  async destroy() {
    const { ctx } = this;
    const id = ctx.params.id;
    const success = await ctx.service.user.delete(id);
    ctx.body = { success, msg: success ? '删除成功' : '删除失败' };
  }
}

module.exports = UserController;
```

### 多数据库操作

```js
// app/service/sync.js
class SyncService extends Service {
  async syncUserData(userId) {
    const pg1 = this.app.pgsql.get('pg1'); // 主库
    const pg2 = this.app.pgsql.get('pg2'); // 从库

    // 从主库读取用户数据
    const user = await pg1.select(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (user) {
      // 同步到从库
      await pg2.insert(
        `INSERT INTO users (id, name, age) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = $2, age = $3`,
        [user.id, user.name, user.age]
      );
    }

    return user;
  }
}
```

## PostgreSQL vs MySQL 对比

### 主要区别

1. **占位符语法**
   - MySQL: 使用 `?` 占位符
   - PostgreSQL: 使用 `$1, $2, $3...` 占位符

2. **自增 ID**
   - MySQL: 直接返回 `insertId`
   - PostgreSQL: 需要使用 `RETURNING id` 子句

3. **字符串连接**
   - MySQL: `CONCAT(str1, str2)`
   - PostgreSQL: `str1 || str2`

4. **日期函数**
   - MySQL: `NOW()`, `SYSDATE()`
   - PostgreSQL: `NOW()`, `CURRENT_TIMESTAMP`

5. **LIMIT 语法**
   - MySQL: `LIMIT offset, count`
   - PostgreSQL: `LIMIT count OFFSET offset`

### 迁移示例

```js
// MySQL 写法
await app.mysql.insert("INSERT INTO users (name) VALUES ('张三')");

// PostgreSQL 写法（需要 RETURNING 获取 ID）
const result = await app.pgsql.insert(
  "INSERT INTO users (name) VALUES ($1) RETURNING id",
  ['张三']
);
console.log(result.id);
```

## 注意事项

1. **参数化查询**：PostgreSQL 使用 `$1, $2...` 作为占位符，建议始终使用参数化查询防止 SQL 注入

2. **RETURNING 子句**：插入或更新数据后需要返回结果时，使用 `RETURNING` 子句

3. **连接池管理**：插件自动管理连接池，无需手动释放连接（除非直接操作 `pool`）

4. **时区问题**：PostgreSQL 默认使用 UTC 时区，如需设置时区，在配置中添加 `timezone: 'Asia/Shanghai'`

5. **事务使用**：事务会占用一个独立连接直到提交或回滚，注意连接池大小设置

6. **错误处理**：所有方法都会抛出异常，建议使用 try-catch 捕获

```js
try {
  await app.pgsql.insert("INSERT INTO users (name) VALUES ($1)", ['test']);
} catch (error) {
  console.error('执行失败的 SQL:', error.sql);
  console.error('参数:', error.values);
  console.error('错误信息:', error.message);
}
```

## 性能优化建议

1. **合理设置连接池大小**：根据并发量调整 `max` 参数
2. **使用索引**：确保查询字段有适当的索引
3. **避免 SELECT ***：明确指定需要的字段
4. **批量操作**：使用事务进行批量插入/更新
5. **读写分离**：使用多实例配置实现主从分离
6. **使用连接池**：避免频繁创建和销毁连接
7. **prepared statements**：对于重复执行的查询，考虑使用 prepared statements

## 相关链接

- [node-postgres 官方文档](https://node-postgres.com/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [连接池最佳实践](https://node-postgres.com/features/pooling)

---

## 关于 ruoyi-eggjs 项目

本插件是 [ruoyi-eggjs](https://github.com/undsky/ruoyi-eggjs) 项目的扩展组件。

**ruoyi-eggjs** 是一个基于 Egg.js 的企业级后台管理系统，参照若依（RuoYi）架构设计，提供完善的权限管理、用户管理、系统监控等功能，是快速开发企业级应用的最佳选择。

### 主要特性

- 🎯 **完整的权限系统**：基于 RBAC 的权限控制，支持细粒度权限管理
- 🚀 **开箱即用**：集成常用功能模块，快速启动项目开发
- 🔧 **MyBatis 风格**：采用 XML 风格的 SQL 编写，熟悉的开发体验
- 📦 **模块化设计**：松耦合的插件体系，按需使用
- 🛡️ **企业级安全**：XSS 防护、SQL 注入防护、访问控制等
- 📊 **系统监控**：在线用户、登录日志、操作日志、定时任务等

### 项目地址

- GitHub: [https://github.com/undsky/ruoyi-eggjs](https://github.com/undsky/ruoyi-eggjs)
- Gitee: [https://gitee.com/undsky/ruoyi-eggjs](https://gitee.com/undsky/ruoyi-eggjs)

### 相关插件

- [ruoyi-eggjs-cache](https://github.com/undsky/ruoyi-eggjs-cache) - 缓存插件
- [ruoyi-eggjs-mybatis](https://github.com/undsky/ruoyi-eggjs-mybatis) - MyBatis 集成
- [ruoyi-eggjs-mysql](https://github.com/undsky/ruoyi-eggjs-mysql) - MySQL 连接
- [ruoyi-eggjs-pgsql](https://github.com/undsky/ruoyi-eggjs-pgsql) - PostgreSQL 连接
- [ruoyi-eggjs-ratelimiter](https://github.com/undsky/ruoyi-eggjs-ratelimiter) - 限流插件
- [ruoyi-eggjs-sqlite](https://github.com/undsky/ruoyi-eggjs-sqlite) - SQLite 支持
- [ruoyi-eggjs-handlebars](https://github.com/undsky/ruoyi-eggjs-handlebars) - Handlebars 模板

### 联系方式

- 📮 **Issues**: [提交问题或建议](https://github.com/undsky/ruoyi-eggjs/issues)
- 🌐 **官网**: [https://www.undsky.com](https://www.undsky.com)
- 💬 **讨论**: [GitHub Discussions](https://github.com/undsky/ruoyi-eggjs/discussions)

### 贡献指南

欢迎提交 Issue 和 Pull Request！

如果这个项目对你有帮助，请给我们一个 ⭐️ Star 支持一下！

---

## License

[MIT](LICENSE)

