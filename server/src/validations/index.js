import { z } from 'zod';
import { TASK_STATUSES } from '../constants/taskStatuses.js';
import { TASK_PRIORITIES } from '../constants/priorities.js';
import { ORG_ROLES, WORKSPACE_ROLES, ROOM_ROLES } from '../constants/roles.js';

// Auth Validations
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  title: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(30).optional(),
  title: z.string().max(100).optional(),
  avatarUrl: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Organization Validations
export const createOrgSchema = z.object({
  name: z.string().min(2, 'Organization name is required').max(100),
  description: z.string().max(500).optional(),
  logoUrl: z.string().optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().optional(),
});

export const addOrgMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(ORG_ROLES).default('ORG_MEMBER'),
});

// Workspace Validations
export const createWorkspaceSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(2, 'Workspace name is required').max(120),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  managers: z.array(z.string()).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  managers: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export const addWorkspaceMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(WORKSPACE_ROLES).default('WORKSPACE_MEMBER'),
});

// Room Validations
export const createRoomSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(2, 'Room name is required').max(100),
  description: z.string().max(500).optional(),
  leader: z.string().min(1, 'Leader ID is required'),
});

export const updateRoomSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  leader: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export const addRoomMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(ROOM_ROLES).default('ROOM_MEMBER'),
});

// Task Validations
export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required').max(200),
  description: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  assignedTo: z.string().nullable().optional(),
  collaborators: z.array(z.string()).optional(),
  priority: z.enum(TASK_PRIORITIES).default('Medium'),
  status: z.enum(TASK_STATUSES).default('To Do'),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  checkpoints: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      targetDate: z.string().nullable().optional(),
      responsibleMember: z.string().nullable().optional(),
    })
  ).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
  collaborators: z.array(z.string()).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

// Checkpoint Validations
export const createCheckpointSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(2).max(150),
  description: z.string().optional(),
  responsibleMember: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
});

export const updateCheckpointSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  responsibleMember: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
});

// Schedule Validations
export const createScheduleSchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().optional(),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  roomId: z.string().nullable().optional(),
  type: z.enum(['MEETING', 'ACTIVITY', 'MILESTONE', 'REMINDER']).default('MEETING'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  participants: z.array(z.string()).optional(),
});

// Daily Plan Validations
export const saveDailyPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  organizationId: z.string().min(1),
  workspaceId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  todayWork: z.object({
    plannedTasks: z.array(z.string()).default([]),
    inProgressTasks: z.array(z.string()).default([]),
    completedTasks: z.array(z.string()).default([]),
    pendingTasks: z.array(z.string()).default([]),
    blockers: z.string().default(''),
  }),
  tomorrowPlan: z.object({
    continueTasks: z.array(z.string()).default([]),
    newTasks: z.array(z.string()).default([]),
    expectedCompletion: z.string().default(''),
    notes: z.string().default(''),
  }),
});

// Comment & Suggestion Validations
export const createCommentSchema = z.object({
  targetType: z.enum(['TASK', 'ROOM_DISCUSSION']),
  targetId: z.string().min(1),
  organizationId: z.string().min(1),
  workspaceId: z.string().min(1),
  roomId: z.string().min(1),
  content: z.string().min(1, 'Comment cannot be empty'),
  mentions: z.array(z.string()).optional(),
});

export const createSuggestionSchema = z.object({
  roomId: z.string().min(1),
  workspaceId: z.string().min(1),
  organizationId: z.string().min(1),
  title: z.string().min(2).max(150),
  description: z.string().min(5),
});

export const decideSuggestionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
  resolutionNotes: z.string().optional(),
});

// Approval Validations
export const submitApprovalSchema = z.object({
  taskId: z.string().min(1),
  comments: z.string().optional(),
});

export const decideApprovalSchema = z.object({
  decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
  comments: z.string().optional(),
});

