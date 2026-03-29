import mongoose from 'mongoose';
import { Task } from '../models/task.model.js';
import { redis } from '../config/redis.js';

const CACHE_TTL_SECONDS = 60;

function listCacheKey(version, query) {
  const limit = query.limit ?? '';
  const offset = query.offset ?? '';
  const status = query.status ?? '';
  return `tasks:list:v${version}:l=${limit}:o=${offset}:s=${status}`;
}

async function listVersion() {
  const value = await redis.get('tasks:list:version');
  return value ? Number(value) : 1;
}

async function bumpListVersion() {
  await redis.incr('tasks:list:version');
}

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

  const version = await listVersion();
  const key = listCacheKey(version, { limit, offset, status });
  const cached = await redis.get(key);
  if (cached) return response.json(JSON.parse(cached));

  const filter = status ? { status } : {};
  const items = await Task.find(filter)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  const payload = { items, limit, offset };
  await redis.set(key, JSON.stringify(payload), 'EX', CACHE_TTL_SECONDS);
  return response.json(payload);
}

export async function getTask(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) return response.status(404).json({ error: 'NotFound' });

  const key = `tasks:id:${id}`;
  const cached = await redis.get(key);
  if (cached) return response.json(JSON.parse(cached));

  const task = await Task.findById(id).lean();
  if (!task) return response.status(404).json({ error: 'NotFound' });

  await redis.set(key, JSON.stringify(task), 'EX', CACHE_TTL_SECONDS);
  return response.json(task);
}

export async function postTask(request, response) {
  const created = await Task.create({
    title: request.validatedBody.title,
    description: request.validatedBody.description ?? null,
    status: request.validatedBody.status ?? 'todo',
    dueDate: request.validatedBody.dueDate ? new Date(request.validatedBody.dueDate) : null
  });

  await bumpListVersion();
  return response.status(201).json(created.toObject());
}

export async function putTask(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) return response.status(404).json({ error: 'NotFound' });

  const updated = await Task.findByIdAndUpdate(
    id,
    {
      title: request.validatedBody.title,
      description: request.validatedBody.description ?? null,
      status: request.validatedBody.status,
      dueDate: request.validatedBody.dueDate ? new Date(request.validatedBody.dueDate) : null
    },
    { new: true }
  ).lean();

  if (!updated) return response.status(404).json({ error: 'NotFound' });
  await redis.del(`tasks:id:${id}`);
  await bumpListVersion();
  return response.json(updated);
}

export async function patchTask(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) return response.status(404).json({ error: 'NotFound' });

  const update = {};
  if (request.validatedBody.title !== undefined) update.title = request.validatedBody.title;
  if (request.validatedBody.description !== undefined) update.description = request.validatedBody.description ?? null;
  if (request.validatedBody.status !== undefined) update.status = request.validatedBody.status;
  if (request.validatedBody.dueDate !== undefined) {
    update.dueDate = request.validatedBody.dueDate ? new Date(request.validatedBody.dueDate) : null;
  }

  const updated = await Task.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!updated) return response.status(404).json({ error: 'NotFound' });

  await redis.del(`tasks:id:${id}`);
  await bumpListVersion();
  return response.json(updated);
}

export async function removeTask(request, response) {
  const { id } = request.params;
  if (!mongoose.isValidObjectId(id)) return response.status(404).json({ error: 'NotFound' });

  const deleted = await Task.findByIdAndDelete(id).lean();
  if (!deleted) return response.status(404).json({ error: 'NotFound' });

  await redis.del(`tasks:id:${id}`);
  await bumpListVersion();
  return response.status(204).send();
}

