const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '172.26.80.55',
  database: 'siakad',
  password: 's3mbarang123',
  port: 5432,
});

class Query {
  constructor() {
    this.sql = '';
    this.order = '';
    this.where = '';
    this.whereValues = [];
  }

  setSchema(schema) {
    this.schema = schema;
  }

  setTable(table) {
    this.table = table;
  }

  setKey(key) {
    this.key = key;
  }

  setSql(sql) {
    this.sql = sql;
    this.order = '';
    this.where = '';
    this.whereValues = [];
  }

  setOrder(id, by) {
    let orderData = `${id} ${by}`;
    if (Array.isArray(id)) {
      orderData = '';
      const orderArray = [];
      for (const key in id) {
        orderArray.push(`${key} ${id[key]}`);
      }
      orderData = orderArray.join(',');
    }
    this.order = ` ORDER BY ${orderData}`;
  }

  setWhere(data = {}, prefix = 'AND', operator = '=') {
    this.where = '(1=1)';
    this.whereValues = [];
    if (Object.keys(data).length > 0) {
      for (const index in data) {
        this.where += ` ${prefix} ${index} ${operator} $${this.whereValues.length + 1}`;
        this.whereValues.push(data[index]);
      }
    }
  }

  async execute(fetch = '') {
    try {
      const client = await pool.connect();
      const query = await client.query(this.sql, this.whereValues);
      let result;
      if (fetch === 'fetch') {
        result = query.rows[0];
      } else {
        result = query.rows;
      }
      client.release();
      this.reset();
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }

  reset() {
    this.sql = '';
    this.order = '';
    this.where = '';
    this.whereValues = [];
  }

  async getRow() {
    if (!this.sql) {
      this.sql = `SELECT * FROM <span class="math-inline">\{this\.schema\}\.</span>{this.table}`;
    }
    if (this.where) {
      this.sql += ` WHERE ${this.where}`;
    }
    if (this.order) {
      this.sql += this.order;
    }
    return await this.execute('fetch');
  }

  async getList() {
    if (!this.sql) {
      this.sql = `SELECT * FROM <span class="math-inline">\{this\.schema\}\.</span>{this.table}`;
    }
    if (this.where) {
      this.sql += ` WHERE ${this.where}`;
    }
    if (this.order) {
      this.sql += this.order;
    }
    return await this.execute();
  }

  async insertData(data) {
    const names = [];
    const params = [];
    const values = [];

    for (const key in data) {
      if (key !== 'act') {
        names.push(key);
        params.push('$' + (values.length + 1));
        values.push(data[key]);
      }
    }

    const currentDate = new Date().toISOString();
    values.push(...['user_id', currentDate, 'ip_address', 0]); // Assuming these are your logging columns

    this.sql = `
      INSERT INTO ${this.schema}.${this.table} 
      (${names.join(',')}, _log_created, _log_time_created, _log_ip_created, _log_delete)
      VALUES (${params.join(',')}, $${values.length + 1}, $${values.length + 2}, $${values.length + 3}, $${values.length + 4})
    `;

    return await this.execute_trans(values, true);
  }

  async updateData(data, id) {
    const updates = [];
    const values = [];

    for (const key in data) {
      if (key !== 'act') {
        updates.push(`${key} = $${values.length + 1}`);
        values.push(data[key]);
      }
    }

    const currentDate = new Date().toISOString();
    values.push(...['user_id', currentDate, 'ip_address']);

    this.sql = `
      UPDATE ${this.schema}.${this.table}
      SET ${updates.join(', ')}
      , _log_updated = $${values.length + 1}, _log_time_updated = $${values.length + 2}, _log_ip_updated = $${values.length + 3}
      WHERE ${this.key} = $${values.length + 4}
    `;

    values.push(id); // Add the id as the last value

    return await this.execute_trans(values);
  }

  async deleteData(id) {
    const values = [new Date().toISOString(), 'ip_address', 1];

    this.sql = `
      UPDATE ${this.schema}.${this.table}
      SET _log_deleted = $1, _log_time_deleted = $2, _log_ip_deleted = $3, _log_delete = 1
      WHERE ${this.key} = $4
    `;

    values.push(id); // Add the id as the last value

    return await this.execute_trans(values);
  }

}