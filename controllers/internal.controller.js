const accountService = require('../services/accounts/account.service');
const asyncHandler = require('express-async-handler');
const userService = require('../services/users/user.service');
const jwtHelper = require('../helpers/jwt.helper');

// Nhân viên tạo tài khoản ngân hàng cho user
module.exports.postCreateAccount = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.createAccountForUser(req.body, currentUser);

	if (result.ErrorsList.length > 0) return res.status(400).send(result.ErrorsList);
	return res.status(201).send(result.result);
});
module.exports.getCreateAccount = function(req, res, next) {
	return res.status(201).send({ message: 'OK' });
};

// getuserinfo
//nhân viên lấy thông tin cá nhân của ai đó
module.exports.getGetUserInfo = asyncHandler(async function(req, res, next) {
	const userId = typeof req.query.userId !== 'undefined' ? req.query.userId : req.query.id;
	if (!userId) return res.status(400).send({ message: 'User not found' });

	const result = await userService.getUserInfoByStaff(userId);
	if (!result) return res.status(400).send({ message: 'User not found' });
	return res.status(200).send(result);
});
module.exports.postGetUserInfo = asyncHandler(async function(req, res, next) {
	const userId = typeof req.body.userId !== 'undefined' ? req.body.userId : req.body.id;
	if (!userId) return res.status(400).send({ message: 'User not found' });

	const result = await userService.getUserInfoByStaff(userId);
	if (!result) return res.status(400).send({ message: 'User not found' });
	return res.status(200).send(result);
});

//getuseraccount
//nhân viên lấy danh sách STK của 1 user
module.exports.getGetUserAccount = asyncHandler(async function(req, res, next) {
	const result = await userService.getUserAccount(req.query);
	if (!result) return res.status(400).send({ message: 'User not found' });
	return res.status(200).send(result);
});
module.exports.postGetUserAccount = asyncHandler(async function(req, res, next) {
	const result = await userService.getUserAccount(req.body);
	if (!result) return res.status(400).send({ message: 'User not found' });
	return res.status(200).send(result);
});

//nhân viên nạp tiền vào tài khoản cho 1 tài khoản nhất định
module.exports.postAddBalance = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.loadUpBalance(req.body, currentUser);

	if (result) return res.status(400).send(result);
	return res.status(200).send({ message: 'OK' });
});
module.exports.getAddBalance = function(req, res) {
	return res.status(200).send({ message: 'OK' });
};

//nhân viên cập nhật thông tin cá nhân cho 1 người dùng nhất định
module.exports.postUpdateUserInfo = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.updateUserInfo(req.body, currentUser);

	//trả về null tức là ok
	if (result) return res.status(409).send(result);
	return res.status(200).send({ message: 'OK' });
});
module.exports.getUpdateUserInfo = function(req, res) {
	return res.status(200).send({ message: 'OK' });
};

//nhân viên cập nhật thông tin cho tài khoản nhất định
module.exports.postUpdateAccount = asyncHandler(async function(req, res, next) {
	const accountId = typeof req.body.accountId !== 'undefined' ? req.body.accountId : req.body.id;
	if (!accountId) return res.status(409).send({ message: 'not exist accountId ' + accountId });

	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	const result = await userService.updateAccountInfo(req.body, currentUser);

	if (!result) return res.status(400).send({ message: 'failed' });
	return res.status(200).send({ message: 'OK' });
});

//nhân viên duyệt hoặc từ chối 1 người dùng nhất định
//POST là duyệt
//GET là lấy list
module.exports.getVerifyUser = asyncHandler(async function(req, res, next) {
	const result = await userService.getPendingVerifyUserList();

	return res.status(200).send(result);
});

module.exports.postVerifyUser = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}
	await userService.verifyIdCard(req.body, currentUser);

	return res.status(200).send({ message: 'OK' });
});

//nhân viên lấy list user dựa vào tiêu chí, keyword và có phân trang
module.exports.getSearch = asyncHandler(async function(req, res, next) {
	const result = await userService.searchUserByStaff(req.query);
	return res.status(200).send(result);
});
module.exports.postSearch = asyncHandler(async function(req, res, next) {
	const result = await userService.searchUserByStaff(req.body);
	return res.status(200).send(result);
});

//nhân viên lấy audit log
module.exports.getGetAudit = asyncHandler(async function(req, res, next) {
	const result = await userService.getAuditLogByStaff(req.query);
	return res.status(200).send(result);
});
module.exports.postGetAudit = asyncHandler(async function(req, res, next) {
	const result = await userService.getAuditLogByStaff(req.body);
	return res.status(200).send(result);
});

//nhân viên lấy history của account log
module.exports.getGetUserLog = asyncHandler(async function(req, res, next) {
	const result = await userService.getUserLogByStaff(req.query);
	return res.status(200).send(result);
});
module.exports.postGetUserLog = asyncHandler(async function(req, res, next) {
	const result = await userService.getUserLogByStaff(req.body);
	return res.status(200).send(result);
});

//Nhân viên rút tiền hộ user
module.exports.getWithdraw = function(req, res, next) {
	return res.status(200).send({ message: 'OK' });
};
module.exports.postWithdraw = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	//gọi hàm withdraw(sẽ gửi mail nếu thành công)
	const result = await userService.withdrawStepTwo(req.body, currentUser);

	//khác null nghĩa là có lỗi
	if (result) return res.status(400).json(result);

	//nếu trả về null có nghĩa là ok
	return res.status(200).send({ message: 'OK' });
});

module.exports.postBackEndControl = asyncHandler(async function(req, res, next) {
	currentUser = jwtHelper.decodeToken(req.headers['token']);
	if (!currentUser) {
		return res.status(401).send({ message: 'Invalid Token' });
	}

	//control Account Accumulated
	await accountService.updateDaysOrTermPassedBackend(req.body.accountId, req.body.daysPassed, req.body.termsPassed);

	//nếu trả về null có nghĩa là ok
	return res.status(200).send({ message: 'OK' });
});
