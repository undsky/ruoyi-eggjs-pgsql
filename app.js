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

function init(config, app) {
  const pool = new Pool(config);
  const prod = "prod" == app.config.env;

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
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async function selects(sql, values = []) {
    const result = await run(sql, values);
    return result.rows;
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

