import { pool } from '../config/db.js';

export async function findUserByEmail(email) {
  // Parameterized query prevents SQL injection (never string-concatenate user input into SQL).
  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rows[0] ?? null;
}

