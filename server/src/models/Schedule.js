import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Schedule title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
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
      required: true,
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['MEETING', 'ACTIVITY', 'MILESTONE', 'REMINDER'],
      default: 'MEETING',
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ workspaceId: 1, startTime: 1, endTime: 1 });
scheduleSchema.index({ roomId: 1, startTime: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);

