import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import nodemailer from 'nodemailer';
export const createToken = (
  jwtPayload: { userEmail: string; role: string; name: string; photo: string },
  secret: string,
  expiresIn: string,
) => {
  return jwt.sign(jwtPayload, secret, {
    expiresIn,
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const generateOTP = async () => {
  return crypto.randomInt(100000, 999999).toString();
};
export const sendVerificationEmail = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email Address',
    text: `Your verification code is ${otp}.`,
  };

  await transporter.sendMail(mailOptions);
};
