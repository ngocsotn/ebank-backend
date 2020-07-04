const express = require('express');
const router = express.Router();
const controller = require('../controllers/internal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//create new account for user
router.get('/createaccount', controller.getCreateAccount);
router.post('/createaccount', controller.postCreateAccount);

//Internal staff Search User
//search Unique information by keyword
router.get('/searchkeyword', controller.getSearchKeyword);
router.post('/searchkeyword', controller.postSearchKeyword);

//nhân viên lấy thông tin cá nhân của ai đó + các STK của người đó
router.get('/getuserinfo', controller.getGetUserInfo);
router.post('/getuserinfo', controller.postGetUserInfo);
module.exports = router;
