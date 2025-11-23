/*
 * @Author: 姜彦汐
 * @Date: 2024-11-03 09:33:52
 * @LastEditors: 姜彦汐
 * @LastEditTime: 2024-11-03 16:08:17
 * @Description: PostgreSQL Plugin for Egg.js
 * @Site: https://www.undsky.com
 */
const { Pool } = require("pg");

module.exports = (app) => {
  app.addSingleton("pgsql", init);
};

/**
 * 将下划线命名转换为驼峰命名
 * @param {string} str - 下划线命名的字符串
 * @returns {string} 驼峰命名的字符串
 */
function toCamelCase(str) {
  // 判断是否全是大写字母（忽略下划线和数字）
  const isAllUpperCase = /^[A-Z0-9_]+$/.test(str);
  
  // 如果全是大写，先转为小写
  const normalizedStr = isAllUpperCase ? str.toLowerCase() : str;
  
  // 将下划线后的字母转为大写
  return normalizedStr.replace(/_([a-zA-Z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * 将对象的键从下划线命名转换为驼峰命名
 * @param {object} obj - 原始对象
 * @returns {object} 转换后的对象
 */
function convertKeysToCamelCase(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item));
  }

  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = toCamelCase(key);
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
}

function init(config, app) {
  const pool = new Pool(config);
  const prod = "prod" == app.config.env;
  
  // 获取驼峰命名转换配置，默认为 false（保持向后兼容）
  const camelCase = app.config.pgsql.camelCase !== undefined 
    ? app.config.pgsql.camelCase 
    : false;

  async function run(sql, values = []) {
    if (!prod) console.time(sql);
    try {
      const result = await pool.query(sql, values);
      return result;
    } catch (error) {
      error.sql = sql;
      error.values = values;
      throw error;
    } finally {
      if (!prod) console.timeEnd(sql);
    }
  }

  async function select(sql, values = []) {
    const result = await run(sql, values);
    const row = result.rows && result.rows.length > 0 ? result.rows[0] : null;
    // 根据配置决定是否转换为驼峰命名
    return row ? (camelCase ? convertKeysToCamelCase(row) : row) : null;
  }

  async function selects(sql, values = []) {
    const result = await run(sql, values);
    // 根据配置决定是否转换为驼峰命名
    return camelCase ? convertKeysToCamelCase(result.rows) : result.rows;
  }

  async function insert(sql, values = []) {
    const result = await run(sql, values);
    // PostgreSQL 返回插入的行数据（需要在 SQL 中使用 RETURNING id）
    return result.rows.length > 0 ? result.rows[0] : result.rowCount;
  }

  async function update(sql, values = []) {
    const result = await run(sql, values);
    return result.rowCount;
  }

  async function transaction(sqls) {
    if (!prod) console.time(sqls);
    const client = await pool.connect();
    try {
      let results = [];
      await client.query('BEGIN');
      for (const item of sqls) {
        const sql = Array.isArray(item) ? item[0] : item;
        const values = Array.isArray(item) && item[1] ? item[1] : [];
        const result = await client.query(sql, values);
        results.push(result);
      }
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      error.sqls = sqls;
      throw error;
    } finally {
      client.release();
      if (!prod) console.timeEnd(sqls);
    }
  }

  async function close() {
    await pool.end();
  }

  return {
    pool,
    run,
    select,
    selects,
    insert,
    update,
    del: update,
    transaction,
    close,
  };
}

