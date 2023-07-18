var router = require('express').Router();

function login(req, res, next){
  if (req.user){
    next()
  } else {
    res.send('you didnt log on this page')
  }
};

router.use(login);

router.get('/shirts',(req,res) => {
  res.send('shirts page');
});
router.get('/pants',(req,res) => {
  res.send('pants page');
});

module.exports = router;