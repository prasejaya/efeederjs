const express = require('express');
const app = express(); // Declare app first
const router = express.Router();
app.use(express.static('public'));

router.get('/', (req, res) => {
  res.render('login.ejs');
});

app.use('/', router);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});