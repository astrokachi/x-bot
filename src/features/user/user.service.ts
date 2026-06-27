import { eq } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { users } from '../../shared/db/schema.js';
import { NotFoundError } from '../../shared/lib/errors.js';
import { createUserInput } from '../../shared/types/user.js';

export async function createUser(data: createUserInput) {
  const { email, name, username, id } = data;

  const [existingUser] = await db.select().from(users).where(eq(users.id, id));

  if (existingUser) {
    const [updatedUser] = await db.update(users).set({ username, name, email })
      .where(eq(users.id, id))
      .returning({ username: users.username, email: users.email, name: users.name, id: users.id });
    return updatedUser;
  }

  const [user] = await db.insert(users).values({ id, username, email, name }).returning();
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

export async function findUserById(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      xAccount: { columns: { connectedAt: true } }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateUser(id: string, data: { name?: string; email?: string }) {
  const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserProfile(userId: string) {
  const [user] = await db.select({
    name: users.name, username: users.username, email: users.email
  }).from(users).where(eq(users.id, userId));

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
