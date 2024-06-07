const fs = require('fs');
const axios = require('axios');
const pgp = require('pg-promise')();
const Client = require('ssh2').Client; // Import modul ssh2

// Konfigurasi koneksi SSH
const sshConfig = {
  host: '172.26.80.55', // Ganti dengan alamat SSH host Anda
  port: 2230, // Port SSH default
  username: 'bsiadmin1', // Ganti dengan nama pengguna SSH Anda
  password: 'bsiadminVER1', // Ganti dengan kata sandi SSH Anda
};

const maxContentLength = 1024 * 1024 * 1024; // 800 MB
let offset = 0;
const chunkSize = 5000;
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9wZW5nZ3VuYSI6IjA0YmM3MzVhLWNhNjktNDBiYS05ZmYzLWIyNmViYzdkOGQ2NyIsInVzZXJuYW1lIjoiMDcxMDAxIiwibm1fcGVuZ2d1bmEiOiIgVU5JVkVSU0lUQVMgMTcgQUdVU1RVUyAxOTQ1IFNVUkFCQVlBICAgIiwidGVtcGF0X2xhaGlyIjoiIiwidGdsX2xhaGlyIjoiMTk0NS0wOC0xNlQxNzowMDowMC4wMDBaIiwiamVuaXNfa2VsYW1pbiI6IkwiLCJhbGFtYXQiOiIiLCJ5bSI6InJlenRvZWFkamVua0BnbWFpbC5jb20iLCJza3lwZSI6IiIsIm5vX3RlbCI6IiIsImFwcHJvdmFsX3BlbmdndW5hIjoiMSIsImFfYWt0aWYiOiIxIiwidGdsX2dhbnRpX3B3ZCI6IjIwMjMtMTAtMDJUMTc6MDA6MDAuMDAwWiIsImlkX3NkbV9wZW5nZ3VuYSI6bnVsbCwiaWRfcGRfcGVuZ2d1bmEiOm51bGwsImlkX3dpbCI6Ijk5OTk5OSAgIiwibGFzdF91cGRhdGUiOiIyMDIzLTEwLTAzVDA0OjI5OjE0LjE2MFoiLCJzb2Z0X2RlbGV0ZSI6IjAiLCJsYXN0X3N5bmMiOiIyMDIzLTEwLTEyVDA4OjM4OjAwLjU3MVoiLCJpZF91cGRhdGVyIjoiMDRiYzczNWEtY2E2OS00MGJhLTlmZjMtYjI2ZWJjN2Q4ZDY3IiwiY3NmIjoiMjE3OTAzMDY4IiwidG9rZW5fcmVnIjpudWxsLCJqYWJhdGFuIjpudWxsLCJ0Z2xfY3JlYXRlIjoiMTk2OS0xMi0zMVQxNzowMDowMC4wMDBaIiwiaWRfcGVyYW4iOjMsIm5tX3BlcmFuIjoiQWRtaW4gUFQiLCJpZF9zcCI6IjI2NTA1NTRhLWU5ZWMtNGI1Yi04YmNmLWZhZGI3ZTI4ZTc1ZSIsImlkX3NtdCI6IjIwMjMxIiwiaWF0IjoxNjk3MTI0OTEzLCJleHAiOjE2OTcxMjY3MTN9.5MBciY3abLMriR1ZXySBpedbLZhSPRcM74JY5mhPEF0';
const baseUrl = 'http://172.26.80.39:3003/ws/live2.php';

const dbConfig = {
    user: 'postgres',     // Ganti dengan nama pengguna database Anda
    host: '172.26.80.55',    // Ganti dengan host database Anda
    database: 'untag', // Ganti dengan nama database yang sesuai
    password: 's3mbarang123', // Ganti dengan kata sandi database Anda
    port: 5432            // Port default PostgreSQL
  };

const db = pgp(dbConfig);
function createTableQuery(data) {
    const fields = Object.keys(data[0]);
    let createQuery = `CREATE TABLE IF NOT EXISTS integrator.map_kelas (\n`;
  
    fields.forEach((field) => {
      createQuery += `  "${field}" TEXT,\n`;
    });
    createQuery = createQuery.slice(0, -2); // Menghapus koma ekstra dan newline terakhir
    createQuery += '\n);';
  
    return createQuery;
  }
  
  // Fungsi untuk membuat query INSERT
  // Fungsi untuk membuat query INSERT
  function insertDataQuery(data) {
    let insertQuery = 'INSERT INTO integrator.map_kelas VALUES \n';

    data.forEach((item) => {
        const values = Object.values(item).map((value) => {
            if (value === null) {
                return 'NULL';
            }
            if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`;
            }
            return value;
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
      //let periode = 19971;
      while (true) {
        const response = await axios.post(baseUrl, {
          act: 'GetListKelasKuliah',
          token: authToken,
          offset,
          limit: chunkSize,
        }, {
          maxContentLength,
        });
        //periode++;
        //if (periode > 20231) { break; }
        const chunkData = response.data.data;
  
        if (chunkData.length === 0) {
          console.log('Pengambilan data selesai.');
          break;
        }
  
        if (offset === 0) {
          // Hapus tabel jika sudah ada
          await db.none('DROP TABLE IF EXISTS integrator.map_kelas');
        }
  
        // Buat tabel jika belum ada
        if (offset === 0) {
          await db.none(createTableQuery(chunkData));
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
    } finally {
      conn.end(); // Tutup koneksi SSH
      pgp.end(); // Tutup koneksi ke database setelah selesai
    }
  }

fetchDataAndSaveToDatabase();
