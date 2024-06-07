const axios = require('axios');
const pgp = require('pg-promise')();

class YourClassName {
  constructor() {
    // Initialize an empty object to store the configuration values
    this.config = {};
  }

  async init() {
    try {
      // Create a PostgreSQL connection using pg-promise
      const db = pgp({
        host: '172.26.80.55',
        port: 5432,
        user: 'postgres',
        password: 's3mbarang123',
        database: 'untag',
      });

      // Query the ms_setting table to get the configuration values
      const result = await db.one(
        'SELECT username, password, url FROM ms_setting'
      );

      // Store the values in the configuration object
      this.config.user = result.username;
      this.config.password = result.password;
      this.config.url = result.url;

      // Disconnect from the database
      await db.$pool.end();
    } catch (error) {
      // Handle any errors that occur during database access
      console.error('Database error:', error);
    }
  }

  async getToken() {
    const act = 'GetToken';

    const data = {
      act,
      username: this.config.user,
      password: this.config.password,
    };

    try {
      const resultToken = await this.run(data);
      const tokenDecode = resultToken.data;

      if (tokenDecode.error_code > 0) {
        // Handle error here
      } else {
        const token = tokenDecode.data.token;
        return token;
      }
    } catch (error) {
      // Handle error here
    }
  }

  async run(data, type = 'json') {
    try {
      const headers = {
        'Content-Type': type === 'xml' ? 'application/xml' : 'application/json',
      };

      const response = await axios({
        method: 'post',
        url: this.config.url,
        headers,
        data: type === 'xml' ? this.stringXML(data) : data,
      });

      return response;
    } catch (error) {
      // Handle error here
    }
  }

  stringXML(data) {
    // Implement your XML conversion logic here
    // Return the XML string
  }
}

// Usage
const yourInstance = new YourClassName();
yourInstance.init()
  .then(() => {
    return yourInstance.getToken();
  })
  .then((token) => {
    console.log('Token:', token);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
