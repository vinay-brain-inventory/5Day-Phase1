import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTaskFull,
  updateTaskPartial
} from '../models/task.model.js';

function parsePagination(request) {
  const limitRaw = request.query.limit;
  const offsetRaw = request.query.offset;

  const limit = Math.min(Math.max(Number(limitRaw ?? 20), 1), 100);
  const offset = Math.max(Number(offsetRaw ?? 0), 0);

  return { limit, offset };
}

export async function getTasks(request, response) {
  const { limit, offset } = parsePagination(request);
  const status = request.query.status;
  const allowed = new Set(['todo', 'in_progress', 'done']);
  if (status !== undefined && !allowed.has(String(status))) {
    return response.status(400).json({ error: 'ValidationError', details: [{ path: 'status', message: 'Invalid status' }] });
  }

  const rows = await listTasks({ limit, offset, status });
  return response.json({ items: rows, limit, offset });
}

export async function getTask(request, response) {
  const { id } = request.params;
  const task = await getTaskById(id);
  if (!task) return response.status(404).json({ error: 'NotFound' });
  return response.json(task);
}

export async function postTask(request, response) {
  const created = await createTask(request.validatedBody);
  return response.status(201).json(created);
}

export async function putTask(request, response) {
  const { id } = request.params;
  const updated = await updateTaskFull(id, request.validatedBody);
  if (!updated) return response.status(404).json({ error: 'NotFound' });
  return response.json(updated);
}

export async function patchTask(request, response) {
  const { id } = request.params;
  const updated = await updateTaskPartial(id, request.validatedBody);
  if (!updated) return response.status(404).json({ error: 'NotFound' });
  return response.json(updated);
}

export async function removeTask(request, response) {
  const { id } = request.params;
  const ok = await deleteTask(id);
  if (!ok) return response.status(404).json({ error: 'NotFound' });
  return response.status(204).send();
}

