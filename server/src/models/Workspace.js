import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      default: 'Event Operations',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    managers: [
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
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Slug unique within organization
workspaceSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

// Auto-generate inviteCode if not set
workspaceSchema.pre('validate', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  next();
});

export const Workspace = mongoose.model('Workspace', workspaceSchema);

