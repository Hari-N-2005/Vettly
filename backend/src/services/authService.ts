import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface JWTPayload {
  userId: string
  email: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me'
const JWT_EXPIRY = '7d'

export const authService = {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcryptjs.genSalt(10)
    return bcryptjs.hash(password, salt)
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash)
  },

  generateToken(userId: string, email: string): string {
    const payload: JWTPayload = { userId, email }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
  },

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch {
      return null
    }
  },

  async signup(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password and create user
    const hashedPassword = await this.hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    // Generate token
    const token = this.generateToken(user.id, user.email)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    }
  },

  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Compare password
    const isPasswordValid = await this.comparePassword(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    // Generate token
    const token = this.generateToken(user.id, user.email)

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    }
  },
}
