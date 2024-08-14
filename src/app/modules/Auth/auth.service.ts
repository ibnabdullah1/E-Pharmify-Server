import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import config from '../../config';
import AppError from '../../errors/AppError';
import { TLoginUser } from './auth.interface';
import { User } from './auth.model';
import {
  createToken,
  generateOTP,
  sendVerificationEmail,
  verifyToken,
} from './auth.utils';

const register = async (
  name: string,
  email: string,
  password: string,
  photo: string,
) => {
  const otp = await generateOTP();
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const userData = {
    name,
    email,
    password: hashedPassword,
    photo,
    otp,
    role: 'user',
  };

  await sendVerificationEmail(email, otp);
  const user = new User(userData);
  await user.save();
  return {
    message: 'User registered successfully. Please check your email for OTP.',
  };
};
const resendOtp = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');
  const otp = await generateOTP();
  user.otp = otp;
  await user.save();

  await sendVerificationEmail(email, otp);

  return { message: 'OTP resent to your email.' };
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');

  if (user.otp !== otp) throw new Error('Invalid OTP');

  user.isVerified = true;
  user.otp = undefined;
  await user.save();

  return { message: 'Email verified successfully' };
};

const loginUser = async (payload: TLoginUser) => {
  const user = await User.isUserExistsByCustomId(payload.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }

  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }
  if (!(await User.isPasswordMatched(payload?.password, user?.password)))
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not matched');

  const jwtPayload = {
    role: user.role,
    photo: user.photo,
    userEmail: user.email,
    name: user.name,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);
  const { userEmail } = decoded;
  const user = await User.isUserExistsByCustomId(userEmail);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }

  // checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }

  const jwtPayload = {
    userEmail: user.email,
    role: user.role,
    photo: user.photo,
    name: user.name,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  return {
    accessToken,
  };
};

export const AuthServices = {
  loginUser,
  refreshToken,
  register,
  resendOtp,
  verifyOtp,
};
