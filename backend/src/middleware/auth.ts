import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface DecodedToken {
  userId: string
  email: string
  iat: number
  exp: number
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedToken
    // @ts-ignore
    req.userId = decoded.userId
    // @ts-ignore
    req.email = decoded.email
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
