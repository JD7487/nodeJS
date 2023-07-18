var router = require('express').Router();

router.get('/sports',(req,res) => {
  res.send('sports page');
});
router.get('/game',(req,res) => {
  res.send('game page');
});

module.exports = router;