import { NotFoundError } from '../../shared/lib/errors.js';
import { prisma } from '../../shared/lib/prisma.js';
import { createUserInput } from '../../shared/types/user.js';

export async function createUser(data: createUserInput) {
  const { email, name, username, id } = data;

  // Validate email constraints
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      where: {
        id
      },
      data: {
        username,
        name,
        email
      },
      select: {
        username: true,
        email: true,
        name: true,
        id: true

      }
    })

    return updatedUser;
  }
  // Create user
  const user = await prisma.user.create({
    data: {
      id,
      username,
      email,
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

export async function updateUser(id: string, data: { name?: string; email?: string }) {
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Gets user profile with name, username, and email
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      username: true,
      email: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
