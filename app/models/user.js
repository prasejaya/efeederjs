const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

const User = {
  findByEmail: async (email) => {
    try {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return res.rows[0];
    } catch (err) {
      console.error(err);
    }
  },

  create: async (name, email, password) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const res = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
        [name, email, hashedPassword]
      );
      return res.rows[0];
    } catch (err) {
      console.error(err);
    }
  },

  findById: async (id) => {
    try {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0];
    } catch (err) {
      console.error(err);
    }
  },
};

module.exports = User;