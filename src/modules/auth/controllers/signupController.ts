import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Admin, { IAdmin } from '../../../models/authModel';
import User from '../../../models/userModel';

export const signUp = async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;

  try {
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).send({ message: 'All fields are required.' });
    }

    const existingAdmin = await Admin.findOne({ $or: [{ email }, { phone }] });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email or Phone already in use by another admin.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Phone already in use by a user.' });
    }

    if (!['admin', 'superAdmin'].includes(role)) {
      return res.status(400).send({ message: 'Invalid role.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin: IAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });

    await newAdmin.save();

    return res.status(200).json({
      message: 'Admin added successfully',
    });
  } catch (error) {
    console.error('Error in signup Admin:', error);
    res.status(500).send({ message: 'Error in signup Admin' });
  }
};
