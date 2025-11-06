/*
 * @Author: 姜彦汐
 * @Date: 2024-11-03 20:59:47
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2024-11-03 16:08:22
 * @Description: PostgreSQL Default Configuration
 * @Site: https://www.undsky.com
 */
module.exports = (appInfo) => ({
  pgsql: {
    default: {
      port: 5432,
      max: 100,              // 连接池最大连接数
      idleTimeoutMillis: 30000,  // 空闲连接超时时间
      connectionTimeoutMillis: 2000,  // 连接超时时间
    },
    // 是否自动将查询结果的字段名从下划线命名转换为驼峰命名
    // 例如: user_name -> userName, created_at -> createdAt
    // 默认值: false (保持向后兼容)
    camelCase: false,
    // Single
    // client: {
    //   host: '127.0.0.1',
    //   user: 'postgres',
    //   password: 'your_password',
    //   database: 'your_database',
    // },
    // Multi
    // clients: {
    //   pg1: {
    //     host: '127.0.0.1',
    //     user: 'postgres',
    //     password: 'password1',
    //     database: 'database1',
    //   },
    //   pg2: {
    //     host: '192.168.1.100',
    //     user: 'postgres',
    //     password: 'password2',
    //     database: 'database2',
    //   }
    // }
  },
});

