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

const maxContentLength = 800 * 1024 * 1024; // 800 MB
let offset = 0;
const chunkSize = 5000;
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9wZW5nZ3VuYSI6IjA0YmM3MzVhLWNhNjktNDBiYS05ZmYzLWIyNmViYzdkOGQ2NyIsInVzZXJuYW1lIjoiMDcxMDAxIiwibm1fcGVuZ2d1bmEiOiIgVU5JVkVSU0lUQVMgMTcgQUdVU1RVUyAxOTQ1IFNVUkFCQVlBICAgIiwidGVtcGF0X2xhaGlyIjoiIiwidGdsX2xhaGlyIjoiMTk0NS0wOC0xNlQxNzowMDowMC4wMDBaIiwiamVuaXNfa2VsYW1pbiI6IkwiLCJhbGFtYXQiOiIiLCJ5bSI6Imh1bWFzQHVudGFnLXNieS5hYy5pZCIsInNreXBlIjoiIiwibm9fdGVsIjoiIiwibm9faHAiOiIiLCJhcHByb3ZhbF9wZW5nZ3VuYSI6IjEiLCJhX2FrdGlmIjoiMSIsInRnbF9nYW50aV9wd2QiOm51bGwsImlkX3NkbV9wZW5nZ3VuYSI6bnVsbCwiaWRfcGRfcGVuZ2d1bmEiOm51bGwsImlkX3dpbCI6Ijk5OTk5OSAgIiwibGFzdF91cGRhdGUiOiIyMDIxLTA5LTA5VDA3OjI3OjM0LjAwMFoiLCJzb2Z0X2RlbGV0ZSI6IjAiLCJsYXN0X3N5bmMiOiIyMDIzLTA5LTExVDAzOjM4OjE5LjM0N1oiLCJpZF91cGRhdGVyIjoiMDRiYzczNWEtY2E2OS00MGJhLTlmZjMtYjI2ZWJjN2Q4ZDY3IiwiY3NmIjoiMjE3OTAzMDY4IiwidG9rZW5fcmVnIjpudWxsLCJqYWJhdGFuIjpudWxsLCJ0Z2xfY3JlYXRlIjoiMTk2OS0xMi0zMVQxNzowMDowMC4wMDBaIiwiaWRfcGVyYW4iOjMsIm5tX3BlcmFuIjoiQWRtaW4gUFQiLCJpZF9zcCI6IjI2NTA1NTRhLWU5ZWMtNGI1Yi04YmNmLWZhZGI3ZTI4ZTc1ZSIsImlkX3NtdCI6IjIwMjMxIiwiaWF0IjoxNjk0NDA4NzgyLCJleHAiOjE2OTQ0MTA1ODJ9.1IVYWt6-z9nIUxUiZA5l9Puh_3g7NP-BtGznmxAWs4s';
const baseUrl = 'http://172.26.80.39:3003/ws/live2.php';

const dbConfig = {
    user: 'postgres',     // Ganti dengan nama pengguna database Anda
    host: '172.26.80.55',    // Ganti dengan host database Anda
    database: 'integrator', // Ganti dengan nama database yang sesuai
    password: 's3mbarang123', // Ganti dengan kata sandi database Anda
    port: 5432            // Port default PostgreSQL
  };

const db = pgp(dbConfig);
function createTableQuery(data) {
    const fields = Object.keys(data[0]);
    let createQuery = `CREATE TABLE IF NOT EXISTS akademik.map_perwalian (\n`;
  
    fields.forEach((field) => {
      createQuery += `  ${field} TEXT,\n`;
    });
    createQuery = createQuery.slice(0, -2); // Menghapus koma ekstra dan newline terakhir
    createQuery += '\n);';
  
    return createQuery;
  }
  
  // Fungsi untuk membuat query INSERT
  // Fungsi untuk membuat query INSERT
function insertDataQuery(data) {
    let insertQuery = 'INSERT INTO akademik.map_perwalian VALUES \n';
  
    data.forEach((item) => {
      const values = Object.values(item).map((value) => {
        // Memeriksa apakah nilai null, jika ya, biarkan sebagai NULL
        if (value === null) {
          return 'NULL';
        }
        // Mengganti tanda kutip tunggal dengan tanda kutip ganda
        return value.replace(/'/g, "''");
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
        const response = await axios.post(baseUrl, {
          act: 'GetAktivitasKuliahMahasiswa',
          token: authToken,
          offset,
          limit: chunkSize,
        }, {
          maxContentLength,
        });
  
        const chunkData = response.data.data;
  
        if (chunkData.length === 0) {
          console.log('Pengambilan data selesai.');
          break;
        }
  
        if (offset === 0) {
          // Hapus tabel jika sudah ada
          await db.none('DROP TABLE IF EXISTS akademik.map_perwalian');
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