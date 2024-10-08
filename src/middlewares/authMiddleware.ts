import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'admin';
  };
}

// Middleware to authenticate the seller
export const authenticateAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: 'admin';
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to authorize the admin
export const authorizeAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'admin') {
    console.error('[Auth Middleware] Access denied: User is not a admin');
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};
