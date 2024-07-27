import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

interface CustomRequest extends Request {
  user?: JwtPayload;
}

// Authentication Middleware
export const authenticateAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token format invalid' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as Secret
    ) as JwtPayload;
    req.user = decoded; // Attach the decoded token to the request object
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Authorization Middleware
export const authorizeAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(403).json({ message: 'No user authenticated' });
  }

  const { role } = req.user;
  if (role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'You are not authorized to perform this action' });
  }

  next();
};
