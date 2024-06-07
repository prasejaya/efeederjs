const fs = require('fs');
const axios = require('axios');

const maxContentLength = 800 * 1024 * 1024; // 800 MB
let offset = 0;
const chunkSize = 5000; // Jumlah data yang diambil per iterasi
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZF9wZW5nZ3VuYSI6IjA0YmM3MzVhLWNhNjktNDBiYS05ZmYzLWIyNmViYzdkOGQ2NyIsInVzZXJuYW1lIjoiMDcxMDAxIiwibm1fcGVuZ2d1bmEiOiIgVU5JVkVSU0lUQVMgMTcgQUdVU1RVUyAxOTQ1IFNVUkFCQVlBICAgIiwidGVtcGF0X2xhaGlyIjoiIiwidGdsX2xhaGlyIjoiMTk0NS0wOC0xNlQxNzowMDowMC4wMDBaIiwiamVuaXNfa2VsYW1pbiI6IkwiLCJhbGFtYXQiOiIiLCJ5bSI6Imh1bWFzQHVudGFnLXNieS5hYy5pZCIsInNreXBlIjoiIiwibm9fdGVsIjoiIiwibm9faHAiOiIiLCJhcHByb3ZhbF9wZW5nZ3VuYSI6IjEiLCJhX2FrdGlmIjoiMSIsInRnbF9nYW50aV9wd2QiOm51bGwsImlkX3NkbV9wZW5nZ3VuYSI6bnVsbCwiaWRfcGRfcGVuZ2d1bmEiOm51bGwsImlkX3dpbCI6Ijk5OTk5OSAgIiwibGFzdF91cGRhdGUiOiIyMDIxLTA5LTA5VDA3OjI3OjM0LjAwMFoiLCJzb2Z0X2RlbGV0ZSI6IjAiLCJsYXN0X3N5bmMiOiIyMDIzLTA5LTExVDAyOjA0OjIwLjk3N1oiLCJpZF91cGRhdGVyIjoiMDRiYzczNWEtY2E2OS00MGJhLTlmZjMtYjI2ZWJjN2Q4ZDY3IiwiY3NmIjoiMjE3OTAzMDY4IiwidG9rZW5fcmVnIjpudWxsLCJqYWJhdGFuIjpudWxsLCJ0Z2xfY3JlYXRlIjoiMTk2OS0xMi0zMVQxNzowMDowMC4wMDBaIiwiaWRfcGVyYW4iOjMsIm5tX3BlcmFuIjoiQWRtaW4gUFQiLCJpZF9zcCI6IjI2NTA1NTRhLWU5ZWMtNGI1Yi04YmNmLWZhZGI3ZTI4ZTc1ZSIsImlkX3NtdCI6IjIwMjMxIiwiaWF0IjoxNjk0NDAwNTI1LCJleHAiOjE2OTQ0MDIzMjV9.q_ukpzDxNZQFBJ65Achvq4Av1QGaeOOIsEp9B4SMXlg'; // Ganti dengan token Anda
const baseUrl = 'http://172.26.80.39:3003/ws/live2.php'; // URL endpoint

// Fungsi untuk membuat query CREATE TABLE
function createTableQuery(data) {
  const fields = Object.keys(data[0]);
  let createQuery = `CREATE TABLE IF NOT EXISTS akademik.map_nilaimhs (\n`;

  fields.forEach((field) => {
    createQuery += `  ${field} TEXT,\n`;
  });
  createQuery = createQuery.slice(0, -2); // Menghapus koma ekstra dan newline terakhir
  createQuery += '\n);';

  return createQuery;
}

// Fungsi untuk membuat query INSERT
function insertDataQuery(data) {
  let insertQuery = 'INSERT INTO akademik.map_nilaimhs VALUES \n';

  data.forEach((item) => {
    const values = Object.values(item).map((value) => `'${value}'`).join(', ');
    insertQuery += `(${values}),\n`;
  });

  insertQuery = insertQuery.slice(0, -2); // Menghapus koma ekstra dan newline terakhir
  insertQuery += ';';

  return insertQuery;
}

// Fungsi untuk menyimpan data dalam file SQL
function saveDataToFile(data, filename) {
  const sqlContent = insertDataQuery(data);
  fs.writeFile(filename, sqlContent, (err) => {
    if (err) {
      console.error('Terjadi kesalahan saat menyimpan data:', err);
    } else {
      console.log(`Data telah disimpan dalam file ${filename}`);
    }
  });
}

// Fungsi untuk menyimpan perintah CREATE TABLE dalam file SQL
function saveCreateTableToFile(data, filename) {
  const createTableSQL = createTableQuery(data);
  fs.writeFile(filename, createTableSQL, (err) => {
    if (err) {
      console.error('Terjadi kesalahan saat menyimpan perintah CREATE TABLE:', err);
    } else {
      console.log(`Perintah CREATE TABLE telah disimpan dalam file ${filename}`);
    }
  });
}

async function fetchDataAndSaveToFile() {
  try {
    let tableCreated = false;

    while (true) {
      const response = await axios.post(baseUrl, {
        act: 'GetRiwayatNilaiMahasiswa',
        token: authToken,
        offset,
        limit: chunkSize,
      }, {
        maxContentLength,
      });

      const chunkData = response.data.data;

      if (chunkData.length === 0) {
        // Tidak ada data lagi
        console.log('Pengambilan data selesai.');
        break;
      }

      if (!tableCreated) {
        // Simpan perintah CREATE TABLE hanya sekali
        const createTableFilename = 'create_table_mapnilai.sql';
        saveCreateTableToFile(chunkData, createTableFilename);
        tableCreated = true;
      }

      // Simpan data dalam file SQL
      const filename = `data_mapnilai_${offset / chunkSize}.sql`;
      saveDataToFile(chunkData, filename);

      offset += chunkSize;
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

// Panggil fungsi untuk menjalankan skrip
fetchDataAndSaveToFile();
