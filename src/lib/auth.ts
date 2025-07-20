import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (payload: { userId: string; email: string; role?: string }): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

export const verifyToken = (token: string): { userId: string; email: string; role?: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string; role?: string }
  } catch {
    return null
  }
}
