const express = require('express');
const router = express.Router();
const controller = require('../controllers/internal.controller');
const authMiddleware = require('../middlewares/auth.middleware');

//create new account for user
router.get('/createaccount', controller.getCreateAccount);
router.post('/createaccount', controller.postCreateAccount);

//nhân viên lấy thông tin cá nhân của ai đó
router.get('/getuserinfo', controller.getGetUserInfo);
router.post('/getuserinfo', controller.postGetUserInfo);

//hàm nhân viên lấy danh sách tài khoản của 1 user
router.get('/getuseraccount', controller.getGetUserAccount);
router.post('/getuseraccount', controller.postGetUserAccount);

//nhân viên thêm tiền vào tài khoản cho 1 người nào đó
router.post('/addbalance', controller.postAddBalance);
router.get('/addbalance', controller.getAddBalance);

//nhân viên cập nhật thông tin người dùng nào đó
router.post('/updateuserinfo', controller.postUpdateUserInfo);
router.get('/updateuserinfo', controller.getUpdateUserInfo);

//nhân viên cập nhật tài khoản
router.post('/updateaccount', controller.postUpdateAccount);

//nhân viên duyệt hoặc từ chối 1 người dùng nhất định
//get là lấy list đang chờ duyệt, post là phê duyệt
router.get('/verifyuser', controller.getVerifyUser);
router.post('/verifyuser', controller.postVerifyUser);

//nhân viên search và lọc theo tiêu chí, có phân trang
router.get('/search', controller.getSearch);
router.post('/search', controller.postSearch);

//lấy audit log
router.get('/getaudit', controller.getGetAudit);
router.post('/getaudit', controller.postGetAudit);

//lấy history account log
router.get('/getuserlog', controller.getGetUserLog);
router.post('/getuserlog', controller.postGetUserLog);

//Nhân viên rút tiền dùm user
router.get('/withdraw', controller.getWithdraw);
router.post('/withdraw', controller.postWithdraw);

//all controller
router.post('/backendcontrol', controller.postBackEndControl);

module.exports = router;
