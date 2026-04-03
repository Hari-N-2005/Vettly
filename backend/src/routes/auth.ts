import { Router, Response } from 'express'
import { authService } from '../services/authService.js'
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js'

const router = Router()

// Sign up
router.post('/signup', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    const result = await authService.signup(email, password, name)
    res.status(201).json(result)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await authService.login(email, password)
    res.json(result)
  } catch (error: any) {
    res.status(401).json({ error: error.message })
  }
})

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      userId: req.userId,
      email: req.email,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
