import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ['WORKSPACE', 'TEAM'],
      default: 'WORKSPACE',
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
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'URGENT'],
      default: 'NORMAL',
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ workspaceId: 1, createdAt: -1 });
announcementSchema.index({ teamId: 1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
