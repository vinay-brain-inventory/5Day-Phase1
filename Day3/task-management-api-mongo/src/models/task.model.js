import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null, maxlength: 10_000 },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo', index: true },
    dueDate: { type: Date, default: null }
  },
  { timestamps: true }
);

// Compound indexes for common queries: list by status, sorted by recent.
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ dueDate: 1, status: 1 });

export const Task = mongoose.model('Task', taskSchema);

