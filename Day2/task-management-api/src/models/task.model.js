import { pool } from '../config/db.js';

export async function listTasks({ limit, offset, status }) {
  const values = [];
  let whereClause = '';

  if (status) {
    values.push(status);
    whereClause = `WHERE status = $${values.length}`;
  }

  values.push(limit);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  // Parameterized query prevents SQL injection for filter/pagination inputs.
  const result = await pool.query(
    `SELECT id, title, description, status, due_date, created_at, updated_at
     FROM tasks
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  );
  return result.rows;
}

export async function getTaskById(id) {
  const result = await pool.query(
    `SELECT id, title, description, status, due_date, created_at, updated_at
     FROM tasks
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createTask({ title, description, status, dueDate }) {
  const result = await pool.query(
    `INSERT INTO tasks (title, description, status, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, status, due_date, created_at, updated_at`,
    [title, description ?? null, status ?? 'todo', dueDate ?? null]
  );
  return result.rows[0];
}

export async function updateTaskFull(id, { title, description, status, dueDate }) {
  const result = await pool.query(
    `UPDATE tasks
     SET title = $2, description = $3, status = $4, due_date = $5
     WHERE id = $1
     RETURNING id, title, description, status, due_date, created_at, updated_at`,
    [id, title, description ?? null, status, dueDate ?? null]
  );
  return result.rows[0] ?? null;
}

export async function updateTaskPartial(id, patch) {
  const fields = [];
  const values = [id];

  if (patch.title !== undefined) {
    values.push(patch.title);
    fields.push(`title = $${values.length}`);
  }
  if (patch.description !== undefined) {
    values.push(patch.description ?? null);
    fields.push(`description = $${values.length}`);
  }
  if (patch.status !== undefined) {
    values.push(patch.status);
    fields.push(`status = $${values.length}`);
  }
  if (patch.dueDate !== undefined) {
    values.push(patch.dueDate ?? null);
    fields.push(`due_date = $${values.length}`);
  }

  if (fields.length === 0) return await getTaskById(id);

  const result = await pool.query(
    `UPDATE tasks
     SET ${fields.join(', ')}
     WHERE id = $1
     RETURNING id, title, description, status, due_date, created_at, updated_at`,
    values
  );
  return result.rows[0] ?? null;
}

export async function deleteTask(id) {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return result.rowCount === 1;
}

