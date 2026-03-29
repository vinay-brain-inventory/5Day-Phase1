import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { taskCreateSchema, taskPatchSchema, taskPutSchema } from '../utils/schemas.js';
import {
  getTask,
  getTasks,
  patchTask,
  postTask,
  putTask,
  removeTask
} from '../controllers/tasks.controller.js';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get('/', getTasks);
tasksRouter.get('/:id', getTask);
tasksRouter.post('/', validateBody(taskCreateSchema), postTask);
tasksRouter.put('/:id', validateBody(taskPutSchema), putTask);
tasksRouter.patch('/:id', validateBody(taskPatchSchema), patchTask);
tasksRouter.delete('/:id', removeTask);

