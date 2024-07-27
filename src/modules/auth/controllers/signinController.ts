import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../../../models/authModel';
import jwt, { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const singIn = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({
        message: 'Admin not found.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid password.',
      });
    }

    const payload = {
      id: admin._id,
      role: admin.role,
    };

    const jwt_secret = process.env.JWT_SECRET;

    const token = jwt.sign(payload, jwt_secret as Secret, { expiresIn: '24h' });

    return res.status(200).json({
      message: 'SignIn successful',
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error in signIn',
      error,
    });
  }
};
