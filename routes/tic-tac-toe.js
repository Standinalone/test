var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
    res.render('tic-tac-toe', { title: 'The best site ever made' });
});

module.exports = router;
