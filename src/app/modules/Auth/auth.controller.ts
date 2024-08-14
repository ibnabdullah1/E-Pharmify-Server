import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

const register = catchAsync(async (req, res) => {
  const { name, email, password, photo } = req.body;
  const response = await AuthServices.register(name, email, password, photo);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User registered successfully. Please check your email for OTP.',
    data: response,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const response = await AuthServices.resendOtp(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP resent successfully.',
    data: response,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const response = await AuthServices.verifyOtp(email, otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Email verified successfully.',
    data: response,
  });
});

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUser(req.body);
  const { refreshToken, accessToken, user } = result;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User logged in successfully!',
    data: { accessToken, user },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access token retrieved successfully!',
    data: result,
  });
});

export const AuthControllers = {
  register,
  resendOtp,
  verifyOtp,
  loginUser,
  refreshToken,
};
