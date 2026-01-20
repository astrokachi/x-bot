import bcrypt from 'bcrypt';
import { ValidationError, NotFoundError } from '../../shared/lib/errors.js';
import { prisma } from '../../shared/lib/prisma.js';

export async function createUser(data: any) {
  const { email, password, name} = data;

  // Validate email constraints
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ValidationError('Email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      name,
    },
  });

  // Return user without password
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      x_account: {
        select: {
          x_username: true,
          connected_at: true,
        }
      }
    }
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateUser(id: string, data: { name?: string; email?: string}) {
  const user = await prisma.user.update({
    where: { id },
    data,
  });
  
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
