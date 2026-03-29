import { Task } from '../models/task.model.js';

export async function taskStatusSummary(request, response) {
  const status = request.query.status;
  const match = {};
  if (status) match.status = status;

  const pipeline = [
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
    { $limit: 10 }
  ];

  const data = await Task.aggregate(pipeline);
  return response.json({ pipeline, data });
}

export async function taskStatusSummaryExplain(request, response) {
  const status = request.query.status;
  const match = {};
  if (status) match.status = status;

  const pipeline = [
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
    { $limit: 10 }
  ];

  const explain = await Task.aggregate(pipeline).explain('executionStats');
  return response.json({ pipeline, explain });
}

