const accountService = require('../services/accounts/account.service');
const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');

// create Account Internal post
module.exports.postCreateAccount = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	const userId = typeof req.body.userId !== 'undefined' ? req.body.userId : req.body.id;
	const checkUser = await userService.findByPk(userId);
	if (!checkUser) return res.status(409).send({ message: 'fail' });

	const result = await accountService.createNewAccount(req.body, currentUser);

	if (!result) return res.status(409).send({ message: 'fail' });
	return res.status(200).send({ message: 'OK' });
});

// create Account Internal get
module.exports.getCreateAccount = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};

//search by keyword
module.exports.getSearchKeyword = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postSearchKeyword = asyncHandler(async function(req, res, next) {
	if (!req.body.keyword) return res.status(409).send({ message: 'keyword must not empty' });
	const list = await userService.searchByKeyword(req.body);
	return res.status(200).send(list);
});

// getuserinfo
//nhân viên lấy thông tin cá nhân của ai đó + các STK của người đó
module.exports.getGetUserInfo = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postGetUserInfo = asyncHandler(async function(req, res, next) {
	const result = await userService.getUserInfo(req.body);
	return res.status(200).send(result);
});
