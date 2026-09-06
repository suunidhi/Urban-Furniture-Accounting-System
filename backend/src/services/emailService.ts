import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendSignupOtp(to: string, otp: string) {
    const mailOptions = {
      from: `"Urban Furniture" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your Urban Furniture Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #714B67; text-align: center;">Welcome to Urban Furniture!</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Thank you for registering. Please use the following One-Time Password (OTP) to verify your account. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="background-color: #F8F9FA; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #714B67;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetOtp(to: string, otp: string) {
    const mailOptions = {
      from: `"Urban Furniture" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Password Reset - Urban Furniture',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #714B67; text-align: center;">Password Reset Request</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">We received a request to reset the password for your account. Please use the following OTP to reset your password. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="background-color: #F8F9FA; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #714B67;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
