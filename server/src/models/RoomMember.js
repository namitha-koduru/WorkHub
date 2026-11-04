import mongoose from 'mongoose';
import { ROLES, ROOM_ROLES } from '../constants/roles.js';

const roomMemberSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ROOM_ROLES,
      default: ROLES.ROOM_MEMBER,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export const RoomMember = mongoose.model('RoomMember', roomMemberSchema);

