import crypto from 'crypto';
import { cookies } from 'next/headers';
import { query } from './db';

const COOKIE_NAME = 'nexora_food_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.DATABASE_URL ||
    'nexora-food-dev-secret'
  );
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('base64url');
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const iterations = 120000;
  const hash = crypto
    .pbkdf2Sync(String(password), salt, iterations, 32, 'sha256')
    .toString('hex');

  return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [algorithm, iterationsRaw, salt, expectedHash] = String(storedHash || '').split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterationsRaw || !salt || !expectedHash) return false;

  const actualHash = crypto
    .pbkdf2Sync(String(password), salt, Number(iterationsRaw), 32, 'sha256')
    .toString('hex');

  const actualBuffer = Buffer.from(actualHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function setAdminSession(user) {
  const payload = base64url(JSON.stringify({
    id: user.id,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  }));

  cookies().set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearAdminSession() {
  cookies().delete(COOKIE_NAME);
  cookies().delete('nexora_food_admin');
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || signature !== sign(payload)) return null;

  let session;
  try {
    session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!session.id || session.exp < Math.floor(Date.now() / 1000)) return null;

  const result = await query(
    `SELECT id, empresa_id, nome, email, papel
     FROM food_usuarios
     WHERE id = $1 AND ativo = true
     LIMIT 1`,
    [session.id]
  );

  return result.rows[0] || null;
}
