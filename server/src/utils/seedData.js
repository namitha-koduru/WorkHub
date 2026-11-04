import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Room } from '../models/Room.js';
import { RoomMember } from '../models/RoomMember.js';
import { Task } from '../models/Task.js';
import { Checkpoint } from '../models/Checkpoint.js';
import { Schedule } from '../models/Schedule.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { Comment } from '../models/Comment.js';
import { Suggestion } from '../models/Suggestion.js';
import { Approval } from '../models/Approval.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';

export const seedDatabase = async () => {
  console.log('[Seed] Starting database seeding process...');

  // 1. Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    OrganizationMember.deleteMany({}),
    Workspace.deleteMany({}),
    WorkspaceMember.deleteMany({}),
    Room.deleteMany({}),
    RoomMember.deleteMany({}),
    Task.deleteMany({}),
    Checkpoint.deleteMany({}),
    Schedule.deleteMany({}),
    DailyPlan.deleteMany({}),
    Comment.deleteMany({}),
    Suggestion.deleteMany({}),
    Approval.deleteMany({}),
    Notification.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  console.log('[Seed] Cleared old collections.');

  // 2. Create standard users
  const defaultPasswordHash = await User.hashPassword('Password123!');

  const users = await User.insertMany([
    {
      name: 'Dr. Ramesh Kumar',
      email: 'admin@workhub.com',
      passwordHash: defaultPasswordHash,
      title: 'Dean & Fest Convener',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
    {
      name: 'Priya Sharma',
      email: 'manager@workhub.com',
      passwordHash: defaultPasswordHash,
      title: 'Operations Director',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      name: 'Aditya Verma',
      email: 'leader@workhub.com',
      passwordHash: defaultPasswordHash,
      title: 'Technical Team Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      name: 'Sneha Patel',
      email: 'member1@workhub.com',
      passwordHash: defaultPasswordHash,
      title: 'Full Stack Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      name: 'Vikram Singh',
      email: 'member2@workhub.com',
      passwordHash: defaultPasswordHash,
      title: 'Logistics Coordinator',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  ]);

  const [admin, manager, leader, member1, member2] = users;

  // 3. Create Organization
  const org = await Organization.create({
    name: 'Vignan Operations Management',
    slug: 'vignan-operations-management',
    description: 'Centralized operations, workflows, and event planning authority.',
    owner: admin._id,
  });

  // Assign Org Memberships
  await OrganizationMember.insertMany([
    { organizationId: org._id, userId: admin._id, role: ROLES.ORG_OWNER },
    { organizationId: org._id, userId: manager._id, role: ROLES.ORG_ADMIN },
    { organizationId: org._id, userId: leader._id, role: ROLES.ORG_MEMBER },
    { organizationId: org._id, userId: member1._id, role: ROLES.ORG_MEMBER },
    { organizationId: org._id, userId: member2._id, role: ROLES.ORG_MEMBER },
  ]);

  // 4. Create Workspaces
  const mahotsavWorkspace = await Workspace.create({
    organizationId: org._id,
    name: 'Vignan Mahotsav 2027',
    slug: 'vignan-mahotsav-2027',
    description: 'Annual National Cultural and Technical Festival coordinating 20,000+ delegates.',
    category: 'Cultural & Tech Fest',
    status: 'ACTIVE',
    managers: [manager._id],
    createdBy: admin._id,
  });

  const symposiumWorkspace = await Workspace.create({
    organizationId: org._id,
    name: 'Technical Symposium',
    slug: 'technical-symposium',
    description: 'Inter-collegiate paper presentations, robotics challenges, and hackathon.',
    category: 'Academic Symposium',
    status: 'ACTIVE',
    managers: [manager._id],
    createdBy: admin._id,
  });

  // Workspace Members
  await WorkspaceMember.insertMany([
    { workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.WORKSPACE_MANAGER },
    { workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.WORKSPACE_MEMBER },
    { workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.WORKSPACE_MEMBER },
    { workspaceId: mahotsavWorkspace._id, userId: member2._id, role: ROLES.WORKSPACE_MEMBER },
    { workspaceId: symposiumWorkspace._id, userId: manager._id, role: ROLES.WORKSPACE_MANAGER },
    { workspaceId: symposiumWorkspace._id, userId: leader._id, role: ROLES.WORKSPACE_MEMBER },
  ]);

  // 5. Create Rooms under Vignan Mahotsav 2027
  const techRoom = await Room.create({
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Technical Team',
    slug: 'technical-team',
    description: 'Stage lighting, high-wattage sound systems, digital portals, and power grids.',
    leader: leader._id,
  });

  const prRoom = await Room.create({
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Public Relations',
    slug: 'public-relations',
    description: 'Press releases, campus outreach, social media broadcasts, and media briefings.',
    leader: manager._id,
  });

  const hospitalityRoom = await Room.create({
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Hospitality & Logistics',
    slug: 'hospitality-logistics',
    description: 'Dignitary reception, accommodation, catering logistics, and fleet transit.',
    leader: member2._id,
  });

  // Room Members
  await RoomMember.insertMany([
    { roomId: techRoom._id, workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.ROOM_LEADER },
    { roomId: techRoom._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.ROOM_MEMBER },
    { roomId: prRoom._id, workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.ROOM_LEADER },
    { roomId: hospitalityRoom._id, workspaceId: mahotsavWorkspace._id, userId: member2._id, role: ROLES.ROOM_LEADER },
  ]);

  // 6. Create Tasks in Tech Room
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const task1 = await Task.create({
    title: 'Deploy High-Density Outdoor Wi-Fi Meshes for Main Arena',
    description: 'Install 16 enterprise access points covering 8,000 square meters for live streaming.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    createdBy: leader._id,
    assignedTo: member1._id,
    priority: 'Urgent',
    status: 'In Progress',
    startDate: now,
    dueDate: tomorrow,
    tags: ['Network', 'Infrastructure', 'Wi-Fi'],
    order: 0,
  });

  const task2 = await Task.create({
    title: 'Finalize Stage Truss Lighting and DMX Controller Setup',
    description: 'Verify 48 moving-head spotlights, laser grids, and redundant power generators.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    createdBy: leader._id,
    assignedTo: leader._id,
    priority: 'High',
    status: 'Under Review',
    startDate: now,
    dueDate: nextWeek,
    tags: ['Lighting', 'Stage', 'AV'],
    order: 1,
  });

  const task3 = await Task.create({
    title: 'Fest Registration Portal Load Testing & Security Audit',
    description: 'Simulate 15,000 concurrent user registrations and benchmark payment gateway callbacks.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    createdBy: leader._id,
    assignedTo: member1._id,
    priority: 'Medium',
    status: 'To Do',
    startDate: now,
    dueDate: nextWeek,
    tags: ['Software', 'Security', 'QA'],
    order: 2,
  });

  const task4 = await Task.create({
    title: 'Main Stage Line-Array Sound Calibration',
    description: 'Complete acoustic profiling and noise level checks with regional municipal guidelines.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    createdBy: leader._id,
    assignedTo: member1._id,
    priority: 'High',
    status: 'Completed',
    startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    dueDate: now,
    tags: ['Acoustics', 'Audio', 'Stage'],
    order: 3,
  });

  // 7. Checkpoints for Task 1
  await Checkpoint.insertMany([
    {
      taskId: task1._id,
      roomId: techRoom._id,
      workspaceId: mahotsavWorkspace._id,
      organizationId: org._id,
      title: 'Run optical fiber backhaul cables to Central Server Room',
      status: 'COMPLETED',
      responsibleMember: member1._id,
      targetDate: now,
      completedAt: now,
      completedBy: member1._id,
    },
    {
      taskId: task1._id,
      roomId: techRoom._id,
      workspaceId: mahotsavWorkspace._id,
      organizationId: org._id,
      title: 'Mount and configure 16 Cisco outdoor APs with captive portal',
      status: 'IN_PROGRESS',
      responsibleMember: member1._id,
      targetDate: tomorrow,
    },
    {
      taskId: task1._id,
      roomId: techRoom._id,
      workspaceId: mahotsavWorkspace._id,
      organizationId: org._id,
      title: 'Conduct walk-through speed test and latency verification',
      status: 'PENDING',
      responsibleMember: member1._id,
      targetDate: tomorrow,
    },
  ]);

  // 8. Schedules & Milestones
  await Schedule.insertMany([
    {
      title: 'All-Hands Tech & AV Coordination Meeting',
      description: 'Comprehensive review with sound, lighting, and stage rigging teams.',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      roomId: techRoom._id,
      type: 'MEETING',
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      location: 'Central Seminar Hall A',
      participants: [admin._id, manager._id, leader._id, member1._id],
      createdBy: leader._id,
    },
    {
      title: 'Milestone: Stage Readiness & Certification',
      description: 'Safety engineer stamp and fire department clearance for all structural rigs.',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      roomId: techRoom._id,
      type: 'MILESTONE',
      startTime: nextWeek,
      endTime: nextWeek,
      isAllDay: true,
      participants: [manager._id, leader._id],
      createdBy: manager._id,
    },
  ]);

  // 9. Daily Work Plan
  const todayStr = now.toISOString().split('T')[0];
  await DailyPlan.create({
    userId: member1._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    date: todayStr,
    todayWork: {
      plannedTasks: ['Outdoor Wi-Fi Access Point mounting', 'Cisco switch configuration'],
      inProgressTasks: ['Fiber optical splicing in Sector 3'],
      completedTasks: ['Cat6 cabling in backstage sound control'],
      pendingTasks: ['Bandwidth throttling profile setup'],
      blockers: 'Awaiting scissor lift operator for light pole mounting at 2 PM.',
    },
    tomorrowPlan: {
      continueTasks: ['Complete speed test across food court area'],
      newTasks: ['Set up registration desk barcode scanners'],
      expectedCompletion: 'Tomorrow by 5:00 PM',
      notes: 'Need 4 additional industrial power extension boxes.',
    },
  });

  // 10. Suggestions
  await Suggestion.create({
    roomId: techRoom._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    author: member1._id,
    title: 'Deploy local DNS caching server to prevent latency spikes during opening ceremony',
    description: 'During peak crowds, mobile ISP cellular gateways get congested. A local caching DNS server will ensure registration scans process instantaneously.',
    status: 'ACCEPTED',
    reviewedBy: leader._id,
    reviewedAt: now,
    resolutionNotes: 'Approved. Proceed with Raspberry Pi / local Docker BIND9 instance.',
  });

  // 11. Comments
  await Comment.create({
    targetType: 'TASK',
    targetId: task1._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    author: leader._id,
    content: 'Please ensure IP67 weatherproof seals are firmly locked on access points facing the open lawn.',
    mentions: [member1._id],
  });

  // 12. Approval record for Task 2
  await Approval.create({
    taskId: task2._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    requester: leader._id,
    reviewer: manager._id,
    status: 'PENDING',
    comments: 'DMX channels programmed and verified against stage cues. Ready for management inspection.',
    history: [
      {
        status: 'PENDING',
        actor: leader._id,
        comment: 'Submitted lighting cue plans for approval.',
        timestamp: now,
      },
    ],
  });

  // 13. Notifications
  await Notification.create({
    recipient: member1._id,
    sender: leader._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: techRoom._id,
    type: 'TASK_ASSIGNED',
    title: 'New High Priority Assignment',
    message: 'You have been assigned to: "Deploy High-Density Outdoor Wi-Fi Meshes".',
    link: `/workspaces/${mahotsavWorkspace._id}/rooms/${techRoom._id}/board?taskId=${task1._id}`,
  });

  // 14. Activity Log entries
  await ActivityLog.insertMany([
    {
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      roomId: techRoom._id,
      actor: leader._id,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task1._id,
      details: { title: task1.title, priority: task1.priority },
    },
    {
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      roomId: techRoom._id,
      actor: member1._id,
      action: 'CHECKPOINT_COMPLETED',
      entityType: 'TASK',
      entityId: task1._id,
      details: { checkpointTitle: 'Run optical fiber backhaul cables' },
    },
  ]);

  console.log('[Seed] Database seeding completed successfully with rich operational dataset!');

  return {
    users: users.map((u) => ({ name: u.name, email: u.email, role: u.title })),
    organization: org.name,
    workspaces: [mahotsavWorkspace.name, symposiumWorkspace.name],
  };
};

