const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const moment = require('moment');
const Model = Sequelize.Model;
const Op = Sequelize.Op;
const db = require('../db');
const randomHelper = require('../../helpers/random.helper');
const jwtHelper = require('../../helpers/jwt.helper');
const emailHelper = require('../../helpers/email.helper');
const makeMessageHelper = require('../../helpers/makeMessage.helper');
const accountService = require('../accounts/account.service');
const errorListConstant = require('../../constants/errorsList.constant');

class User extends Model {
	static async findUserByPKNoneExclude(id) {
		const user = await User.findByPk(id);

		return user;
	}
	static async findUserByPKUsingExclude(id) {
		const user = await User.findOne({
			where: { id: id },
			attributes: {
				exclude: [ 'password', 'createdAt', 'updatedAt', 'verifyCode', 'forgotCode', 'activeCode', 'status' ]
			}
		});

		return user;
	}

	static async findUserNoneExclude(username) {
		const user = await User.findOne({
			where: {
				[Op.or]: [
					{ email: username },
					{ citizenIdentificationId: username },
					{ phoneNumber: username },
					{ username: username }
				]
			}
		});
		return user;
	}

	static async findUserUsingExclude(username) {
		const user = await User.findOne({
			where: {
				[Op.or]: [
					{ email: username },
					{ citizenIdentificationId: username },
					{ phoneNumber: username },
					{ username: username }
				]
			},
			attributes: {
				exclude: [ 'password', 'createdAt', 'updatedAt', 'verifyCode', 'forgotCode', 'activeCode', 'status' ]
			}
		});
		return user;
	}

	static async authenticationLoginAIO({ username, password }) {
		//tìm user và lấy mật khẩu + các thông tin mật để authentication
		const authUser = await User.findUserNoneExclude(username);

		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;

		//tìm user nhưng ko trả ra mật khẩu và các thông tin mật
		const user = await User.findUserUsingExclude(username);
		const token = jwtHelper.generateToken(user.dataValues);
		const result = user.dataValues;
		result.dateOfBirth = user.dateOfBirth;
		result.token = token;
		result.message = 'OK';
		return result;
	}

	static async authenticationLoginByEmail({ email, password }) {
		const authUser = await User.findOne({
			where: {
				email: email
			}
		});
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;
		const user = await User.findUserUsingExclude(email);
		const token = jwtHelper.generateToken(user.dataValues);
		return { user, token };
	}

	static async authenticationLoginByPhoneNumber({ phoneNumber, password }) {
		const authUser = await User.findOne({
			where: {
				phoneNumber: phoneNumber
			}
		});
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;

		const user = await User.findUserUsingExclude(phoneNumber);
		const token = jwtHelper.generateToken(user.dataValues);
		return { user, token };
	}

	static async authenticationLoginByCitizenIdentificationId({ citizenIdentificationId, password }) {
		const authUser = await User.findOne({
			where: {
				citizenIdentificationId: citizenIdentificationId
			}
		});
		if (!authUser) return null;
		if (!await User.verifyPassword(password, authUser.password)) return null;

		const user = await User.findUserUsingExclude(citizenIdentificationId);
		const token = jwtHelper.generateToken(user.dataValues);
		return { user, token };
	}

	static async checkConflictUserName(username) {
		const conflictEmail = await User.findAll({
			where: {
				username: username
			}
		});
		if (conflictEmail.length > 0) return 'Conflict User Name';
		return null;
	}

	static async checkConflictEmail(email) {
		const conflictEmail = await User.findAll({
			where: {
				email: email
			}
		});
		if (conflictEmail.length > 0) return 'Conflict email';
		return null;
	}

	static async checkConflictPhoneNumber(phoneNumber) {
		const conflictPhoneNumber = await User.findAll({
			where: {
				phoneNumber: phoneNumber
			}
		});
		if (conflictPhoneNumber.length > 0) return 'Conflict phone number';
		return null;
	}

	static async checkConflictCitizenIdentificationId(citizenIdentificationId) {
		const conflictCitizenIdentificationId = await User.findAll({
			where: {
				citizenIdentificationId: citizenIdentificationId
			}
		});
		if (conflictCitizenIdentificationId.length > 0) return 'Conflict citizenIdentificationId';
		return null;
	}

	//hàm này kiểm tra xem các thông tin: SDT, CMND, email, username có bị trùng với ai trong DB ko
	//để đăng ký mới thì 4 thông tin trên phải ko trùng với bất kỳ ai đã tồn tại trong DB
	static async checkConflictUser(request) {
		//tạo 1 Error List sẵn
		const errorList = [];

		//ở đây ta sẽ dùng lỗi của phần đăng nhập được khai báo từ trước
		const registerErrors = errorListConstant.registerErrorValidate;

		//Kiểm tra Email trùng
		if (typeof request.email !== 'undefined' && request.email != null) {
			var isConflictEmail = await User.checkConflictEmail(request.email);
			if (isConflictEmail) errorList.push(registerErrors.EMAIL_CONFLICT);
		} else {
			errorList.push(registerErrors.EMAIL_TOO_SHORT);
		}

		//Kiểm tra username trùng
		if (typeof request.username !== 'undefined' && request.username != null) {
			var isConflictUserName = await User.checkConflictUserName(request.username);
			if (isConflictUserName) errorList.push(registerErrors.USERNAME_CONFLICT);
		} else {
			errorList.push(registerErrors.USERNAME_TOO_SHORT);
		}

		//Kiểm tra phoneNumber trùng
		if (typeof request.phoneNumber !== 'undefined' && request.phoneNumber != null) {
			var isConflictPhoneNumber = await User.checkConflictPhoneNumber(request.phoneNumber);
			if (isConflictPhoneNumber) errorList.push(registerErrors.PHONENUMBER_CONFLICT);
		} else {
			errorList.push(registerErrors.PHONENUMBER_TOO_SHORT);
		}

		//nếu danh sách lỗi có ít nhất 1 thì trả ra cho bên create, bên create trả cho controller
		if (errorList.length > 0) return errorList;

		//nếu danh sách lỗi trống -> nghĩa là không trùng gì cả, return null cho hàm create biết
		return null;
	}

	static async activeEmailCode(_code) {
		const isExist = await User.findOne({
			where: {
				activeCode: _code
			}
		});
		if (isExist) {
			await User.update(
				{
					activeCode: ''
				},
				{
					where: { activeCode: _code }
				}
			);
			return isExist;
		}
		return null;
	}

	static async checkUserActiveEmailCodeYet(currentUser) {
		const isExist = await User.findOne({
			where: {
				email: currentUser.email,
				activeCode: ''
			}
		});
		if (isExist) return isExist;
		return null;
	}

	static async checkIfExistVerifyCode(_code) {
		const isExist = await User.findOne({
			where: {
				verifyCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}

	static async checkIfExistActiveCode(_code) {
		const isExist = await User.findOne({
			where: {
				activeCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}

	static async checkIfExistForgotCode(_code) {
		const isExist = await User.findOne({
			where: {
				forgotCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}

	//hàm này ko async vì ta sẽ dùng req.session để nhận biết, ko dùng tới DB
	static checkUserVeiryCitizenIdentificationIdYet(currentUser) {
		var result = String(currentUser.citizenIdentificationId).startsWith('empty=[');
		//nếu CMND bắt đầu bằng empty -> chưa xác nhận
		if (result) return null;
		return 'activated';
	}

	//hàm này đảm bảo code random được tạo ra là độc nhất, đang không tồn tại trong DB
	static async getUniqueRandomCode() {
		var randomCode = randomHelper.getRandomString(15);
		while (
			(await User.checkIfExistVerifyCode(randomCode)) ||
			(await User.checkIfExistForgotCode(randomCode)) ||
			(await User.checkIfExistActiveCode(randomCode))
		) {
			randomCode = randomHelper.getRandomString(15);
		}
		return randomCode;
	}

	static async createNewUser(request) {
		const isUserConflict = await User.checkConflictUser(request);

		//trả về lỗi conflict hoặc thiếu gì đó nếu có lỗi, = null nghĩa là OK
		if (isUserConflict) return isUserConflict;

		const newActiveCode = await User.getUniqueRandomCode();
		const newUser = await User.create({
			email: request.email,
			lastName: request.lastName,
			firstName: request.firstName,
			//ép sang dạng của Postgre là MM/DD/YYYY, DB của postgre ko chứa DD/MM/YYYY
			//đừng lo vì DB đã có hàm format sẵn khi lấy ra
			dateOfBirth: moment(request.dateOfBirth, 'DD/MM/YYYY').format('YYYY-MM-DD hh:mm:ss'),
			phoneNumber: request.phoneNumber,
			username: request.username,
			address: request.address,
			password: await User.hashPassword(request.password),
			activeCode: newActiveCode
		});

		//send email here
		if (newUser) {
			const newEmailVerifyMessage = makeMessageHelper.verifyEmailMessage(
				newUser.email,
				newUser.lastName,
				newUser.firstName,
				newActiveCode
			);
			await emailHelper.send(
				newUser.email,
				'Kích hoạt tài khoản',
				newEmailVerifyMessage.content,
				newEmailVerifyMessage.html
			);
		}
		//return null to controller know action was success
		return null;
	}

	static async checkInternalUser(currentUser) {
		const isExist = await User.findOne({
			where: {
				email: currentUser.email,
				userType: '0'
			}
		});
		if (isExist) return isExist;
		return null;
	}

	static hashPassword(passwordInput) {
		return bcrypt.hashSync(passwordInput, 10);
	}

	static verifyPassword(passwordsUnHashed, passwordsHashed) {
		return bcrypt.compareSync(passwordsUnHashed, passwordsHashed);
	}

	//quên mật khẩu bước 1: tạo forgotCode và gửi email cho user quên mât khẩu
	static async ForgotPasswordStepOne(request) {
		//tìm user
		//user phải kích hoạt email rồi mới quên mật khẩu lấy lại qua email được
		const forgotPasswordUser = await User.findOne({
			where: {
				email: request.email,
				activeCode: ''
			}
		});

		if (!forgotPasswordUser) {
			return null;
		}
		const newForgotCode = await User.getUniqueRandomCode();
		await User.update(
			{
				forgotCode: newForgotCode
			},
			{
				where: { email: request.email }
			}
		);
		//send email here
		if (forgotPasswordUser) {
			const newEmailVerifyMessage = makeMessageHelper.forgotPasswordMessage(
				forgotPasswordUser.email,
				forgotPasswordUser.lastName,
				forgotPasswordUser.firstName,
				newForgotCode
			);
			await emailHelper.send(
				forgotPasswordUser.email,
				'Lấy lại mật khẩu',
				newEmailVerifyMessage.content,
				newEmailVerifyMessage.html
			);
		}
		//send email here

		//return result
		return newForgotCode;
	}

	//bước 2 - ForgotPasswordStepTwo
	//hàm này kiểm tra mã gửi dùng cho quên mật khẩu có giống không
	static async verifyForgotCode(_code) {
		const isExist = await User.findOne({
			where: {
				forgotCode: _code
			}
		});
		if (isExist) return true;
		return false;
	}

	//bước 3
	//hàm này viết thay đổi mật khẩu cũ thành mật khẩu mới
	static async ForgotPasswordStepThree(request) {
		if (!request.forgotCode) return null;

		const isExist = await User.findOne({
			where: {
				forgotCode: request.forgotCode
			}
		});

		if (!isExist) return null;

		await User.update(
			{
				password: await User.hashPassword(request.newPassword),
				forgotCode: ''
			},
			{
				where: { email: isExist.email }
			}
		);
		return isExist;
	}

	//hàm này được viết cho chức năng đã đăng nhập muốn đổi mật khẩu
	// FE BE đều lưu USer , email,
	static async changePasswordAfterLogin(request, currentUser) {
		//request.currentPassword, newPassword
		const result = await User.findUserNoneExclude(currentUser.email);
		if (!result) return null;
		const verifyOldPassword = await User.verifyPassword(request.currentPassword, result.password);
		if (!verifyOldPassword) return null;

		const newResult = await User.update(
			{
				password: await User.hashPassword(request.newPassword)
			},
			{
				where: {
					email: currentUser.email
				}
			}
		);
		return result;
	}

	//hàm tìm kiếm trả về list theo keyword
	static async searchByKeyword(request) {
		const keyword = request.keyword.toLowerCase();
		const listNumberOne = await User.findAll({
			where: {
				[Op.or]: [
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), { [Op.like]: '%' + keyword + '%' }),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('citizenIdentificationId')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('phoneNumber')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('username')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('firstName')), {
						[Op.like]: '%' + keyword + '%'
					}),
					Sequelize.where(Sequelize.fn('lower', Sequelize.col('lastName')), {
						[Op.like]: '%' + keyword + '%'
					}),

					//Họ + ' ' + Tên
					Sequelize.where(
						Sequelize.fn(
							'lower',
							Sequelize.fn('concat', Sequelize.col('lastName'), ' ', Sequelize.col('firstName'))
						),
						{
							[Op.like]: '%' + keyword + '%'
						}
					)
				],
				userType: '1'
			},
			attributes: {
				exclude: [ 'password', 'userType', 'createdAt', 'updatedAt', 'verifyCode', 'forgotCode', 'activeCode' ]
			}
		});

		const result = [];
		for (var i = 0; i < listNumberOne.length; i++) {
			result.push(listNumberOne[i].dataValues);
			//vì .dataValues là lấy dữ liệu gốc chưa qua getter fotmat
			//muốn lấy dạng format DD/MM/YYYY phải xài dữ liệu trả từ getter
			result[i].dateOfBirth = listNumberOne[i].dateOfBirth;
		}

		return result;
	}

	//hàm user xem thông tin bản thân
	static async getInfo(request) {
		const accountList = await accountService.getAllAccountReferenceByIdUsingExclude(request.id);
		const user = await User.findUserByPKUsingExclude(request.id);
		return { user, accountList };
	}

	//hàm nhân viên xem thông tin ai đó hoặc bản thân, ko ẩn bất kỳ fields nào
	static async getUserInfo(request) {
		const accountList = await accountService.getAllAccountReferenceByIdNoneExclude(request.id);
		const user = await User.findUserByPKNoneExclude(request.id);
		return { user, accountList };
	}

	//hàm đếm số lượng nhân viên hiện có
	static async countStaff() {
		const countList = await User.findAndCountAll({
			where: {
				userType: '0'
			}
		});

		const count = countList.count;
		return count;
	}

	//hàm user xin làm nhân viên
	//thằng nào xin trước thằng đó được làm
	static async requestStaff(request) {
		if (typeof request.id === 'undefined') return 'id must not empty';
		const checkUser = await User.findByPk(request.id);
		if (!checkUser) return 'id not exists';

		const countList = await User.findAndCountAll({
			where: {
				userType: '0'
			}
		});

		const count = countList.count;

		//nếu đã có ít nhất 1 nhân viên rồi thì chờ thằng đã làm nhân viên set lên
		if (count > 0) return 'fail';

		//nếu chưa có thì thằng này lên làm nhân viên
		const result = await User.update(
			{
				userType: '0'
			},
			{
				where: {
					id: request.id
				}
			}
		);
		return null;
	}
	static async updateInfo(request, currentUser) {
		const userId = typeof request.userId !== 'undefined' ? request.userId : request.id;
		if (!userId) return null;
		const updateUser = await user.findOne({
			where: {
				userId: userId
			}
		});
		if (!updateUser) return null;
		const resultupdate = await account.update(
			{
				lastname: request.lastname,
				firstName: request.firstname,
				address: request.address,
				status: request.status,
				dateOfBirth: request.dateOfBirth
			},
			{
				where: { userId: userId }
			}
		);
		if (resultupdate) {
			await audit_log.pushAuditLog(
				currentUser.id,
				updateUser.userId,
				'update info',
				'update ' +
					userId +
					': ' +
					request.lastname +
					',' +
					request.firstname +
					',' +
					request.address +
					',' +
					request.dateOfBirth +
					',' +
					request.status
			);
		}
		return resultupdate;
	}
}

User.init(
	{
		citizenIdentificationId: {
			type: Sequelize.STRING,
			allowNull: true,
			unique: true,
			defaultValue: null
		},
		email: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		phoneNumber: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		username: {
			type: Sequelize.STRING,
			allowNull: false,
			unique: true
		},
		lastName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		firstName: {
			type: Sequelize.STRING,
			allowNull: false
		},
		dateOfBirth: {
			type: Sequelize.DATEONLY,
			//định dạng khi lấy dữ liệu ra, sẽ tự format thành Ngày/tháng/năm
			//vì postgre mặc định sẽ trả ra dạng YYYY-MM-DD
			//postgre khi input date chỉ nhận 2 dạng: YYYY-MM-DD hh:mm:ss và MM-DD-YYYY hh:mm:ss (dấu - hoặc /)
			//nếu muốn data lấy ra đã được getter định dạng thì ko dùng .dataValues
			get: function() {
				return moment.utc(this.getDataValue('dateOfBirth')).format('DD/MM/YYYY');
			}
		},
		address: {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: 'Việt Nam'
		},
		userType: {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: '1' // 1 = member, 0 = internal user
		},
		status: {
			type: Sequelize.STRING,
			allowNull: false,
			defaultValue: '1' // 1 = OK, 0 = Locked
		},
		password: {
			type: Sequelize.STRING,
			allowNull: false
		},
		//mã xác nhận 2 bước
		verifyCode: {
			type: Sequelize.STRING,
			allowNull: true,
			defaultValue: ''
		},
		//mã quên mật khẩu
		forgotCode: {
			type: Sequelize.STRING,
			allowNull: true,
			defaultValue: ''
		},
		//mã kích hoạt tài khoản khi đăng ký
		activeCode: {
			type: Sequelize.STRING,
			allowNull: true,
			defaultValue: ''
		}
	},
	{
		sequelize: db,
		modelName: 'user'
	}
);

module.exports = User;
