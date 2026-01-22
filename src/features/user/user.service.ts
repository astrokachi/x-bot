import { NotFoundError, AuthenticationError } from '../../shared/lib/errors.js';
import { prisma } from '../../shared/lib/prisma.js';
import { Tokens, XUser } from '../../shared/types/auth.js';
import { X_USER_DETAILS_URL } from '../../shared/const.js';

export async function createUser(data: any) {
  const { email, name } = data;

  // Validate email constraints
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return existingUser;
  }
  // Create user
  const user = await prisma.user.create({
    data: {
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


export async function getXUserDetails(tokens: Tokens): Promise<XUser> {
  try {
    const resp = await fetch(X_USER_DETAILS_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    if (!resp.ok) {
      throw new AuthenticationError()
    }
    const user = ((await resp.json() as any).data) as XUser;
    console.log(user)
    return user;
  } catch (err) {
    throw err;
  }
}


