module.exports = {
  db: {
    untag: {
      driver: 'postgres',
      host: '172.26.80.55',
      port: 5432,
      username: 'postgres',
      password: 's3mbarang123', // Consider using environment variables for password storage
      dbname: 'untag',
    },
    integrator: {
      driver: 'postgres',
      host: '172.26.80.55',
      port: 5432,
      username: 'postgres',
      password: 's3mbarang123', // Consider using environment variables for password storage
      dbname: 'integrator',
    },
  },
};