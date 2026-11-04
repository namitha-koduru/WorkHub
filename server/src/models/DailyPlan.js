import mongoose from 'mongoose';

const dailyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    todayWork: {
      plannedTasks: [
        {
          type: String,
          trim: true,
        },
      ],
      inProgressTasks: [
        {
          type: String,
          trim: true,
        },
      ],
      completedTasks: [
        {
          type: String,
          trim: true,
        },
      ],
      pendingTasks: [
        {
          type: String,
          trim: true,
        },
      ],
      blockers: {
        type: String,
        default: '',
        trim: true,
      },
    },
    tomorrowPlan: {
      continueTasks: [
        {
          type: String,
          trim: true,
        },
      ],
      newTasks: [
        {
          type: String,
          trim: true,
        },
      ],
      expectedCompletion: {
        type: String,
        default: '',
        trim: true,
      },
      notes: {
        type: String,
        default: '',
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique index: One plan per user per day
dailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyPlanSchema.index({ roomId: 1, date: 1 });

export const DailyPlan = mongoose.model('DailyPlan', dailyPlanSchema);

