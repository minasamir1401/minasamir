import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export const protect = (req: any, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }

  req.user = decoded;
  next();
};
