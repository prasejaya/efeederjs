const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Assuming password hashing is needed

// Models or services for authentication and data fetching
const { UserModel, AuthService, SemesterService, YearService } = require('../models'); // Replace with your model/service paths

router.get('/', async (req, res) => {
    const semesters = [
        { value: '', text: 'Pilih Semester' },
        { value: '1', text: 'Gasal' },
        { value: '2', text: 'Genap' },
        { value: '5', text: 'Antara' },
      ];
  const years = await YearService.getYears(); // Fetch years from your data source
  const error_code = req.query.error_code || 0;
  const message_desc = req.query.message_desc || '';

  res.render('login', {
    title: 'E-Feeder',
    a_semester: semesters,
    a_tahun: years,
    error_code,
    message_desc,
  });
});

router.post('/', async (req, res) => {
  const { username, password, semester, tahun } = req.body;

  if (!semester || !tahun) {
    return res.redirect('/login?error_code=1&message_desc=Pilihlah Semester dan Tahun terlebih dahulu!');
  }

  try {
    const user = await UserModel.findOne({ username }); // Find user by username

    if (!user) {
      return res.redirect('/login?error_code=1&message_desc=Username atau password salah!');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password); // Compare passwords (if hashed)

    if (!isPasswordValid) {
      return res.redirect('/login?error_code=1&message_desc=Username atau password salah!');
    }

    // Successful login, set session data (replace with your logic)
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      periode: `${tahun}${semester}`,
      tahun,
      semester,
    };

    res.redirect('/beranda'); // Redirect to homepage or appropriate route
  } catch (error) {
    console.error('Error during login:', error);
    res.redirect('/login?error_code=1&message_desc=Internal server error!');
  }
});

module.exports = router;