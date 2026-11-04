import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { OrganizationMember } from '../models/OrganizationMember.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Team } from '../models/Team.js';
import { TeamMember } from '../models/TeamMember.js';
import { Room } from '../models/Room.js';
import { RoomMember } from '../models/RoomMember.js';
import { Task } from '../models/Task.js';
import { Checkpoint } from '../models/Checkpoint.js';
import { Schedule } from '../models/Schedule.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { Comment } from '../models/Comment.js';
import { Suggestion } from '../models/Suggestion.js';
import { Approval } from '../models/Approval.js';
import { Announcement } from '../models/Announcement.js';
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
    Team.deleteMany({}),
    TeamMember.deleteMany({}),
    Room.deleteMany({}),
    RoomMember.deleteMany({}),
    Task.deleteMany({}),
    Checkpoint.deleteMany({}),
    Schedule.deleteMany({}),
    DailyPlan.deleteMany({}),
    Comment.deleteMany({}),
    Suggestion.deleteMany({}),
    Approval.deleteMany({}),
    Announcement.deleteMany({}),
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
      memberId: 'WH-ADM001',
      passwordHash: defaultPasswordHash,
      title: 'Dean & Fest Convener',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
    {
      name: 'Priya Sharma',
      email: 'manager@workhub.com',
      memberId: 'WH-MGR002',
      passwordHash: defaultPasswordHash,
      title: 'Operations Director',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      name: 'Aditya Verma',
      email: 'leader@workhub.com',
      memberId: 'WH-TLD003',
      passwordHash: defaultPasswordHash,
      title: 'Technical Team Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      name: 'Sneha Patel',
      email: 'member1@workhub.com',
      memberId: 'WH-DEV004',
      passwordHash: defaultPasswordHash,
      title: 'Full Stack & Media Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      name: 'Vikram Singh',
      email: 'member2@workhub.com',
      memberId: 'WH-LOG005',
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
    inviteCode: 'MAHOTSAV27',
    description: 'Annual National Cultural and Technical Festival coordinating 20,000+ delegates across 40 universities.',
    category: 'Cultural & Tech Fest',
    status: 'ACTIVE',
    managers: [manager._id],
    createdBy: admin._id,
  });

  const symposiumWorkspace = await Workspace.create({
    organizationId: org._id,
    name: 'Technical Symposium',
    slug: 'technical-symposium',
    inviteCode: 'SYMPOSIUM27',
    description: 'Inter-collegiate paper presentations, robotics challenges, and hackathon.',
    category: 'Academic Symposium',
    status: 'ACTIVE',
    managers: [manager._id],
    createdBy: admin._id,
  });

  // Workspace Members
  await WorkspaceMember.insertMany([
    { workspaceId: mahotsavWorkspace._id, userId: admin._id, role: ROLES.WORKSPACE_MANAGER },
    { workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.WORKSPACE_MANAGER },
    { workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.WORKSPACE_MEMBER },
    { workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.WORKSPACE_MEMBER },
    { workspaceId: mahotsavWorkspace._id, userId: member2._id, role: ROLES.WORKSPACE_MEMBER },
    { workspaceId: symposiumWorkspace._id, userId: manager._id, role: ROLES.WORKSPACE_MANAGER },
    { workspaceId: symposiumWorkspace._id, userId: leader._id, role: ROLES.WORKSPACE_MEMBER },
  ]);

  // 5. Create Teams under Vignan Mahotsav 2027
  const prTeam = await Team.create({
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'PR & Digital Marketing',
    slug: 'pr-digital-marketing',
    description: 'Managing public visibility, digital campaigns, media relations, campus ambassadors, and creative design.',
    responsibilities: [
      'Social Media Campaign Execution',
      'Campus Ambassador Program across 50 Colleges',
      'Media Press Releases & Influencer Coverage',
      'Creative Graphic Design & Video Production',
    ],
    leader: manager._id,
  });

  const techTeam = await Team.create({
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Technical Team',
    slug: 'technical-team',
    description: 'Stage engineering, audiovisual production, power infrastructure, high-density Wi-Fi networks, and live portal management.',
    responsibilities: [
      'High-Density Campus Wi-Fi Mesh',
      'Main Stage Truss & DMX Lighting',
      'Acoustic Calibration & Line Array Audio',
      'Real-time Delegate Registration & Scanning Portal',
    ],
    leader: leader._id,
  });

  const logisticsTeam = await Team.create({
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Hospitality & Logistics',
    slug: 'hospitality-logistics',
    description: 'Dignitary reception, judge hospitality, travel coordination, guest accommodation, and catering logistics.',
    responsibilities: [
      'Guest of Honor Escort and Protocol',
      'Accommodation for 1,200 Outstation Participants',
      'Food Courts & Catering Management',
      'Transit Shuttles Between Stations & Campus',
    ],
    leader: member2._id,
  });

  const sponsorshipTeam = await Team.create({
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Sponsorship & Finance',
    slug: 'sponsorship-finance',
    description: 'Corporate brand sponsorships, budget clearances, stalls allocation, and merchandise partnerships.',
    responsibilities: [
      'Securing Title and Platinum Sponsors',
      'Vendor Stall Allotments in Fest Arena',
      'Financial Approvals and Procurement Audits',
    ],
    leader: manager._id,
  });

  // Assign Team Memberships
  await TeamMember.insertMany([
    // PR Team
    { teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.TEAM_LEADER },
    { teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.TEAM_MEMBER },
    { teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: admin._id, role: ROLES.TEAM_MEMBER },

    // Tech Team
    { teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.TEAM_LEADER },
    { teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.TEAM_MEMBER },
    { teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.TEAM_MEMBER },

    // Logistics Team
    { teamId: logisticsTeam._id, workspaceId: mahotsavWorkspace._id, userId: member2._id, role: ROLES.TEAM_LEADER },
    { teamId: logisticsTeam._id, workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.TEAM_MEMBER },

    // Sponsorship Team
    { teamId: sponsorshipTeam._id, workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.TEAM_LEADER },
    { teamId: sponsorshipTeam._id, workspaceId: mahotsavWorkspace._id, userId: member2._id, role: ROLES.TEAM_MEMBER },
  ]);

  // 6. Create Collaborative Rooms inside Teams
  // PR Team Rooms
  const socialMediaRoom = await Room.create({
    teamId: prTeam._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Social Media Campaigns',
    slug: 'social-media-campaigns',
    description: 'Instagram reels, YouTube shorts, countdown posts, and influencer tag campaigns.',
    leader: manager._id,
  });

  const emailCommsRoom = await Room.create({
    teamId: prTeam._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Email Communications',
    slug: 'email-communications',
    description: 'Invitations to 300+ university colleges, dean letters, and delegate registration blasts.',
    leader: member1._id,
  });

  const posterApprovalRoom = await Room.create({
    teamId: prTeam._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Poster & Creative Approvals',
    slug: 'poster-creative-approvals',
    description: 'Review stage for brand banners, fest theme teaser graphics, and celebrity event creatives.',
    leader: manager._id,
  });

  // Tech Team Rooms
  const avStageRoom = await Room.create({
    teamId: techTeam._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Stage AV & Lighting',
    slug: 'stage-av-lighting',
    description: 'Truss rigging, moving-head lighting, line array acoustic tuning, and DMX sync.',
    leader: leader._id,
  });

  const networkRoom = await Room.create({
    teamId: techTeam._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Network Infrastructure',
    slug: 'network-infrastructure',
    description: 'Gigabit fiber backhaul, outdoor Wi-Fi access mesh, and live streaming video uplinks.',
    leader: leader._id,
  });

  const softwarePortalRoom = await Room.create({
    teamId: techTeam._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Registration Portal & Scanning',
    slug: 'registration-portal-scanning',
    description: 'Attendee QR code pass generation, on-gate barcode scanning, and load testing.',
    leader: member1._id,
  });

  // Logistics Team Rooms
  const receptionRoom = await Room.create({
    teamId: logisticsTeam._id,
    workspaceId: mahotsavWorkspace._id,
    organizationId: org._id,
    name: 'Dignitary Reception & Protocol',
    slug: 'dignitary-reception-protocol',
    description: 'Airport & train reception, VIP lounge arrangements, and stage felicitation logistics.',
    leader: member2._id,
  });

  // Assign Room Memberships
  await RoomMember.insertMany([
    // Social Media Room
    { roomId: socialMediaRoom._id, teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.ROOM_LEADER },
    { roomId: socialMediaRoom._id, teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.ROOM_MEMBER },

    // Email Comms Room
    { roomId: emailCommsRoom._id, teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.ROOM_LEADER },
    { roomId: emailCommsRoom._id, teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.ROOM_MEMBER },

    // Poster Approval Room
    { roomId: posterApprovalRoom._id, teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: manager._id, role: ROLES.ROOM_LEADER },
    { roomId: posterApprovalRoom._id, teamId: prTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.ROOM_MEMBER },

    // Tech Rooms
    { roomId: avStageRoom._id, teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.ROOM_LEADER },
    { roomId: avStageRoom._id, teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.ROOM_MEMBER },

    { roomId: networkRoom._id, teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.ROOM_LEADER },
    { roomId: networkRoom._id, teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.ROOM_MEMBER },

    { roomId: softwarePortalRoom._id, teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: member1._id, role: ROLES.ROOM_LEADER },
    { roomId: softwarePortalRoom._id, teamId: techTeam._id, workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.ROOM_MEMBER },

    // Logistics Room
    { roomId: receptionRoom._id, teamId: logisticsTeam._id, workspaceId: mahotsavWorkspace._id, userId: member2._id, role: ROLES.ROOM_LEADER },
    { roomId: receptionRoom._id, teamId: logisticsTeam._id, workspaceId: mahotsavWorkspace._id, userId: leader._id, role: ROLES.ROOM_MEMBER },
  ]);

  // 7. Announcements
  await Announcement.insertMany([
    {
      scope: 'WORKSPACE',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      author: admin._id,
      title: 'Vignan Mahotsav 2027 Countdown: 18 Days Remaining',
      content: 'All team leads must submit their finalized budget sheets and vendor contracts by Friday 5:00 PM. General security walk-through with local authorities is confirmed for next Monday.',
      isPinned: true,
      priority: 'URGENT',
    },
    {
      scope: 'WORKSPACE',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      author: manager._id,
      title: 'Central Control Room Operational in Admin Block 204',
      content: 'All department coordination radios and walkie-talkies can be collected from Room 204 starting tomorrow morning. Please designate one radio handler per team.',
      isPinned: false,
      priority: 'NORMAL',
    },
    {
      scope: 'TEAM',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      teamId: techTeam._id,
      author: leader._id,
      title: 'Safety Protocol: Hard Hats Mandatory in Stage Arena',
      content: 'Truss elevation starts today at 2 PM. Only authorized technicians with hard hats and safety harnesses are allowed inside the main auditorium perimeter.',
      isPinned: true,
      priority: 'URGENT',
    },
    {
      scope: 'TEAM',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      teamId: prTeam._id,
      author: manager._id,
      title: 'Celebrity Night Teaser Video Approved for Release',
      content: 'The official promo reel featuring the celebrity musical band has received clearance from the Dean office. Deploy on Instagram and YouTube at 6:00 PM today.',
      isPinned: false,
      priority: 'NORMAL',
    },
  ]);

  // 8. Tasks with Multiple Collaborators & Checkpoints
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Network Task
  const task1 = await Task.create({
    title: 'Deploy High-Density Outdoor Wi-Fi Meshes for Main Arena',
    description: 'Install 16 enterprise access points covering 8,000 square meters for live streaming and 15,000 concurrent student connections.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    roomId: networkRoom._id,
    createdBy: leader._id,
    assignedTo: member1._id,
    collaborators: [leader._id],
    priority: 'Urgent',
    status: 'In Progress',
    startDate: now,
    dueDate: tomorrow,
    tags: ['Network', 'Infrastructure', 'Wi-Fi'],
    order: 0,
  });

  // AV Task
  const task2 = await Task.create({
    title: 'Finalize Stage Truss Lighting and DMX Controller Setup',
    description: 'Verify 48 moving-head spotlights, laser grids, and redundant power generators with fire clearance.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    roomId: avStageRoom._id,
    createdBy: leader._id,
    assignedTo: leader._id,
    collaborators: [member1._id],
    priority: 'High',
    status: 'Under Review',
    startDate: now,
    dueDate: nextWeek,
    tags: ['Lighting', 'Stage', 'AV'],
    order: 1,
  });

  // Software Portal Task
  const task3 = await Task.create({
    title: 'Fest Registration Portal Load Testing & Security Audit',
    description: 'Simulate 15,000 concurrent user registrations and benchmark payment gateway webhook callbacks.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    roomId: softwarePortalRoom._id,
    createdBy: leader._id,
    assignedTo: member1._id,
    collaborators: [leader._id],
    priority: 'Medium',
    status: 'To Do',
    startDate: now,
    dueDate: nextWeek,
    tags: ['Software', 'Security', 'QA'],
    order: 2,
  });

  // PR Social Media Task
  const task4 = await Task.create({
    title: 'Launch Nationwide Campus Ambassador Referral Campaign',
    description: 'Ship promotional packages, access kits, and automated affiliate leaderboards across 45 partner colleges.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: prTeam._id,
    roomId: socialMediaRoom._id,
    createdBy: manager._id,
    assignedTo: member1._id,
    collaborators: [manager._id],
    priority: 'High',
    status: 'In Progress',
    startDate: now,
    dueDate: nextWeek,
    tags: ['PR', 'Ambassadors', 'Viral'],
    order: 0,
  });

  // Completed Task
  const task5 = await Task.create({
    title: 'Main Stage Line-Array Sound Calibration',
    description: 'Complete acoustic profiling and decibel checks adhering to regional municipal noise guidelines.',
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    roomId: avStageRoom._id,
    createdBy: leader._id,
    assignedTo: member1._id,
    collaborators: [leader._id],
    priority: 'High',
    status: 'Completed',
    startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    dueDate: now,
    tags: ['Acoustics', 'Audio', 'Stage'],
    order: 3,
  });

  // Checkpoints for Task 1
  await Checkpoint.insertMany([
    {
      taskId: task1._id,
      roomId: networkRoom._id,
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
      roomId: networkRoom._id,
      workspaceId: mahotsavWorkspace._id,
      organizationId: org._id,
      title: 'Mount and configure 16 Cisco outdoor APs with captive portal',
      status: 'IN_PROGRESS',
      responsibleMember: member1._id,
      targetDate: tomorrow,
    },
    {
      taskId: task1._id,
      roomId: networkRoom._id,
      workspaceId: mahotsavWorkspace._id,
      organizationId: org._id,
      title: 'Conduct walk-through speed test and latency verification',
      status: 'PENDING',
      responsibleMember: leader._id,
      targetDate: tomorrow,
    },
  ]);

  // 9. Multi-tier Schedules & Milestones
  await Schedule.insertMany([
    {
      title: 'All-Hands Fest Readiness Coordination Meeting',
      description: 'Comprehensive review with technical leads, PR heads, and logistics supervisors.',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      teamId: null, // Workspace scope
      roomId: null,
      type: 'MEETING',
      startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      location: 'Central Seminar Hall A',
      participants: [admin._id, manager._id, leader._id, member1._id, member2._id],
      createdBy: manager._id,
    },
    {
      title: 'Technical Rigging & AV Sync Rehearsal',
      description: 'Full electrical and audio test for the main auditorium stage.',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      teamId: techTeam._id, // Team scope
      roomId: avStageRoom._id,
      type: 'ACTIVITY',
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 28 * 60 * 60 * 1000),
      location: 'Open Air Theatre (OAT)',
      participants: [leader._id, member1._id],
      createdBy: leader._id,
    },
    {
      title: 'Milestone: Stage Readiness & Certification',
      description: 'Safety engineer stamp and fire department clearance for all structural rigs.',
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      teamId: null,
      roomId: null,
      type: 'MILESTONE',
      startTime: nextWeek,
      endTime: nextWeek,
      isAllDay: true,
      participants: [manager._id, leader._id],
      createdBy: manager._id,
    },
  ]);

  // 10. Daily Work Plans
  const todayStr = now.toISOString().split('T')[0];
  await DailyPlan.create({
    userId: member1._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    roomId: networkRoom._id,
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

  await DailyPlan.create({
    userId: leader._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    roomId: avStageRoom._id,
    date: todayStr,
    todayWork: {
      plannedTasks: ['Review lighting cue presets', 'Power generator load trial'],
      inProgressTasks: ['DMX console programming for opening dance troupe'],
      completedTasks: ['Safety barrier installation around front truss'],
      pendingTasks: ['Laser beam alignment calibration'],
      blockers: '',
    },
    tomorrowPlan: {
      continueTasks: ['Sound check with live orchestra'],
      newTasks: ['Finalize backup diesel supply arrangement'],
      expectedCompletion: 'Tomorrow by 8:00 PM',
      notes: 'Coordinate with Campus Electrical Department.',
    },
  });

  // 11. Suggestions
  await Suggestion.create({
    roomId: networkRoom._id,
    teamId: techTeam._id,
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

  // 12. Comments / Discussions
  await Comment.create({
    targetType: 'TASK',
    targetId: task1._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    roomId: networkRoom._id,
    author: leader._id,
    content: 'Please ensure IP67 weatherproof seals are firmly locked on access points facing the open lawn.',
    mentions: [member1._id],
  });

  await Comment.create({
    targetType: 'TEAM_DISCUSSION',
    targetId: techTeam._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    teamId: techTeam._id,
    author: leader._id,
    content: 'Welcome to the Technical Team hub for Mahotsav 2027! Please post all equipment requisitions here.',
    mentions: [],
  });

  // 13. Approval record for Task 2
  await Approval.create({
    taskId: task2._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: avStageRoom._id,
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

  // 14. Notifications
  await Notification.create({
    recipient: member1._id,
    sender: leader._id,
    organizationId: org._id,
    workspaceId: mahotsavWorkspace._id,
    roomId: networkRoom._id,
    type: 'TASK_ASSIGNED',
    title: 'New High Priority Assignment',
    message: 'You have been assigned to: "Deploy High-Density Outdoor Wi-Fi Meshes".',
    link: `/app/workspaces/${mahotsavWorkspace._id}/teams/${techTeam._id}/rooms/${networkRoom._id}/board?taskId=${task1._id}`,
  });

  // 15. Activity Log entries
  await ActivityLog.insertMany([
    {
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      actor: leader._id,
      action: 'TEAM_CREATED',
      entityType: 'WORKSPACE',
      entityId: techTeam._id,
      details: { teamName: techTeam.name },
    },
    {
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      roomId: networkRoom._id,
      actor: leader._id,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task1._id,
      details: { title: task1.title, priority: task1.priority },
    },
    {
      organizationId: org._id,
      workspaceId: mahotsavWorkspace._id,
      roomId: networkRoom._id,
      actor: member1._id,
      action: 'CHECKPOINT_COMPLETED',
      entityType: 'TASK',
      entityId: task1._id,
      details: { checkpointTitle: 'Run optical fiber backhaul cables' },
    },
  ]);

  console.log('[Seed] Database seeding completed successfully with rich collaborative dataset!');

  return {
    users: users.map((u) => ({ name: u.name, email: u.email, role: u.title })),
    organization: org.name,
    workspaces: [mahotsavWorkspace.name, symposiumWorkspace.name],
  };
};
