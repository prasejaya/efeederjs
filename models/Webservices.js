const axios = require('axios');
const xml2js = require('xml2js');

class Webservice {
  constructor() {
    const pengaturan = new Pengaturan();

    this.url = `${pengaturan.get_host()}/ws/live2.php?wsdl`;
    this.user = pengaturan.get_user();
    this.password = pengaturan.get_password();
  }

  async run(data, type = 'json') {
    const headers = {
      'Content-Type': type === 'xml' ? 'application/xml' : 'application/json',
    };

    if (data) {
      if (type === 'xml') {
        data = this.stringXML(data);
      } else {
        data = JSON.stringify(data);
      }
    }

    try {
      const response = await axios.post(this.url, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  stringXML(data) {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(data);
    return xml;
  }

  async array_to_XML(data) {
    const builder = new xml2js.Builder();
    const xml = builder.buildObject(data);
    return xml;
  }

  get_key_value(key, value, arraylist) {
    const list = arraylist;

    const a_data = {};
    for (const row of list) {
      a_data[row[key]] = `${row[key]} - ${row[value]}`;
    }

    return a_data;
  }

  get_key_value_matkul(key, value, arraylist) {
    const list = arraylist;

    const a_data = {};
    for (const row of list) {
      a_data[row[key]] = `${row['kode_mata_kuliah']} - ${row[value]}`;
    }

    return a_data;
  }

  get_key_value_dosen(key, value, arraylist) {
    const list = arraylist;

    const a_data = {};
    for (const row of list) {
      a_data[row[key]] = `${row['nidn']} - ${row[value]}`;
    }

    return a_data;
  }

  async getToken() {
    const act = 'GetToken';

    const data = {
      act,
      username: this.user,
      password: this.password,
    };

    try {
      const resultToken = await this.run(data);
      const tokenDecode = resultToken;

      if (tokenDecode.error_code > 0) {
        console.error('Error:', tokenDecode);
        // Handle error here
        // If needed, you might want to recursively call getToken again or throw an error
      } else {
        const token = tokenDecode.data.token;
        return token;
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async execute(a_data) {
    const token = await this.getToken();
    const a_token = { token };
    const data = { ...a_data, ...a_token };

    try {
      const resultString = await this.run(data);
      const result = JSON.parse(resultString);
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

class Pengaturan {
  get_host() {
    return 'http://172.26.80.39:3003'; // Implement your host logic
  }

  get_user() {
    return '071001'; // Implement your username logic
  }

  get_password() {
    return '@Pddiktiutg45'; // Implement your password logic
  }
}

module.exports = Webservice;
