import { eq } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { users } from '../../shared/db/schema.js';
import { NotFoundError } from '../../shared/lib/errors.js';
import { createUserInput } from '../../shared/types/user.js';

export async function createUser(data: createUserInput) {
  const { email, name, username, id, profile_img_url } = data;

  const [existingUser] = await db.select().from(users).where(eq(users.id, id));

  if (existingUser) {
    const [updatedUser] = await db.update(users).set({ username, name, email, profile_img_url })
      .where(eq(users.id, id))
      .returning({ username: users.username, email: users.email, name: users.name, id: users.id, profile_img_url: users.profile_img_url });
    return updatedUser;
  }

  const [user] = await db.insert(users).values({ id, username, email, name, profile_img_url }).returning();
  const { password_hash, ...userWithoutPassword } = user;
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
      x_account: { columns: { connected_at: true } }
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function updateUser(id: string, data: { name?: string; email?: string }) {
  const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserProfile(userId: string) {
  const [user] = await db.select({
    name: users.name, username: users.username, email: users.email, profile_img_url: users.profile_img_url
  }).from(users).where(eq(users.id, userId));

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
