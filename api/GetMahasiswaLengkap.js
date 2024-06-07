const fs = require('fs');
const axios = require('axios');
const pgp = require('pg-promise')();
const { Client } = require('ssh2'); // Import modul ssh2
const Webservice = require('./Webservice'); // Import kelas Webservice
//const Webservice = require('./path/to/Webservice');

// Konfigurasi koneksi SSH
const sshConfig = {
  host: '172.26.80.55', // Ganti dengan alamat SSH host Anda
  port: 2230, // Port SSH default
  username: 'bsiadmin1', // Ganti dengan nama pengguna SSH Anda
  password: 'bsiadminVER1', // Ganti dengan kata sandi SSH Anda
};

const maxContentLength = 800 * 1024 * 1024; // 800 MB
let offset = 0;
const chunkSize = 800;

const webservice = new Webservice(); // Buat objek Webservice

const dbConfig = {
  user: 'postgres', // Ganti dengan nama pengguna database Anda
  host: '172.26.80.55', // Ganti dengan host database Anda
  database: 'untag', // Ganti dengan nama database yang sesuai
  password: 's3mbarang123', // Ganti dengan kata sandi database Anda
  port: 5432, // Port default PostgreSQL
};
const id_prodi = process.argv[2];
const id_periode_masuk = process.argv[3];

const db = pgp(dbConfig);
/*const filter = {
  id_prodi: id_prodi, // Use the variable from PHP
  id_periode_masuk: id_periode_masuk, // Use the variable from PHP
};*/
function insertDataQuery(data) {
  let insertQuery = 'INSERT INTO integrator.map_mahasiswalengkap VALUES \n';

  data.forEach((item) => {
    const values = Object.values(item).map((value) => {
      // Memeriksa apakah nilai null, jika ya, biarkan sebagai NULL
      if (value === null) {
        return 'NULL';
      }
      // Mengganti tanda kutip tunggal dengan tanda kutip ganda hanya jika nilai adalah string
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      } else {
        return value;
      }
    }).join(', ');
    insertQuery += `(${values}),\n`;
  });

  insertQuery = insertQuery.slice(0, -2); // Menghapus koma ekstra dan newline terakhir
  insertQuery += ';';

  return insertQuery;
}

async function fetchDataAndSaveToDatabase() {
  const conn = new Client(); // Buat objek koneksi SSH

  try {
    // Lakukan koneksi SSH
    await conn.connect(sshConfig);

    while (true) {
      const token = await webservice.getToken();
      console.log(token);
      const response = await axios.post(webservice.url, {
        act: 'GetListRiwayatPendidikanMahasiswa',
        token,
        filter:"id_prodi = '069b02a6-ab86-4d36-aba5-2ce2aa3e7dbd' and id_periode_masuk='20131'",
        offset,
        limit: chunkSize,
      }, {
        maxContentLength,
      });

      const chunkData = response.data.data;
      console.log(response);
      if (chunkData.length === 0) {
        console.log('Pengambilan data selesai.');

        break;
      }

      // Memecah data menjadi beberapa kelompok
      const chunkedData = chunkData.reduce((chunks, item) => {
        if (chunks[chunks.length - 1].length < 500) {
          chunks[chunks.length - 1].push(item);
        } else {
          chunks.push([item]);
        }
        return chunks;
      }, [[]]);

      // Insert data dalam transaksi
      await db.tx(async (t) => {
        for (const chunk of chunkedData) {
          const insertQuery = insertDataQuery(chunk);
          await t.none(insertQuery);
        }
      });

      offset += chunkSize;
    }

    console.log('Semua data telah dimasukkan ke dalam database.');
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    console.log(JSON.stringify({ error: error.message }));
  } finally {
    conn.end(); // Tutup koneksi SSH
    pgp.end(); // Tutup koneksi ke database setelah selesai
  }
}

fetchDataAndSaveToDatabase();
