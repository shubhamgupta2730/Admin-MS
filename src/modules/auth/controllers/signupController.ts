import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Admin, { IAdmin } from '../../../models/authModel';

export const signUp = async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;
  try {
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).send({ message: 'All fields are required.' });
    }
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { phone }] });
    if (existingAdmin) {
      return res.status(400).json('Email or Phone  already in use.');
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
    res.status(500).send('Error in signup Admin');
  }
};
