import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs';

const pptx = new PptxGenJS();

// Setup 16:9 widescreen presentation
pptx.layout = 'LAYOUT_16x9';
pptx.title = 'WorkHub – Team Workflow & Event Operations Management System';
pptx.author = 'WorkHub Capstone Engineering Team';
pptx.subject = 'Final Capstone Project Presentation';
pptx.company = 'Vignan University / WorkHub Platform';

// Color Palette
const COLORS = {
  primary: '4338CA', // Indigo 700
  secondary: '6366F1', // Indigo 500
  dark: '0F172A', // Slate 900
  light: 'F8FAFC', // Slate 50
  cardBg: 'FFFFFF',
  accent: '059669', // Emerald 600
  amber: 'D97706', // Amber 600
  border: 'E2E8F0',
  text: '1E293B',
  muted: '64748B',
  white: 'FFFFFF',
};

// Helper: Add consistent header to content slides
function addHeader(slide, title, category = 'CAPSTONE PROJECT PRESENTATION') {
  slide.background = { color: COLORS.light };

  // Top accent bar
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.1,
    fill: { color: COLORS.primary },
    line: { color: COLORS.primary },
  });

  // Category breadcrumb
  slide.addText(category.toUpperCase(), {
    x: 0.8,
    y: 0.35,
    w: 10,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  // Slide Title
  slide.addText(title, {
    x: 0.8,
    y: 0.65,
    w: 11.5,
    h: 0.55,
    fontSize: 22,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  // Subtle bottom footer line
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.8,
    y: 7.0,
    w: 11.733,
    h: 0.02,
    fill: { color: COLORS.border },
    line: { color: COLORS.border },
  });

  // Footer text
  slide.addText('WorkHub – Collaborative Team Workflow & Operations Platform', {
    x: 0.8,
    y: 7.08,
    w: 8.0,
    h: 0.3,
    fontSize: 8,
    fontFace: 'Arial',
    color: COLORS.muted,
  });

  slide.addText('Final Capstone Submission', {
    x: 9.533,
    y: 7.08,
    w: 3.0,
    h: 0.3,
    fontSize: 8,
    fontFace: 'Arial',
    align: 'right',
    color: COLORS.muted,
  });
}

// -------------------------------------------------------------
// SLIDE 1: Title Slide (Dark Theme)
// -------------------------------------------------------------
const slide1 = pptx.addSlide();
slide1.background = { color: '0A0F1D' };

slide1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.0,
  y: 1.2,
  w: 0.6,
  h: 0.6,
  rectRadius: 0.15,
  fill: { color: COLORS.secondary },
  line: { color: COLORS.secondary },
});
slide1.addText('W', {
  x: 1.0,
  y: 1.2,
  w: 0.6,
  h: 0.6,
  fontSize: 22,
  fontFace: 'Arial',
  bold: true,
  align: 'center',
  valign: 'middle',
  color: COLORS.white,
});

slide1.addText('WorkHub Platform', {
  x: 1.75,
  y: 1.3,
  w: 6.0,
  h: 0.4,
  fontSize: 16,
  fontFace: 'Arial',
  bold: true,
  color: 'A5B4FC',
});

slide1.addText('Team Workflow & Event Operations\nManagement System', {
  x: 1.0,
  y: 2.1,
  w: 11.3,
  h: 1.6,
  fontSize: 34,
  fontFace: 'Arial',
  bold: true,
  color: COLORS.white,
  lineSpacing: 42,
});

slide1.addText(
  'A Full-Stack MERN Collaborative Work Management Platform for Enterprise Event Portfolios, Departments & Operations',
  {
    x: 1.0,
    y: 3.8,
    w: 11.0,
    h: 0.6,
    fontSize: 14,
    fontFace: 'Arial',
    color: '94A3B8',
  }
);

// Metadata cards
slide1.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 1.0,
  y: 4.8,
  w: 11.3,
  h: 1.8,
  rectRadius: 0.15,
  fill: { color: '131C31' },
  line: { color: '233252' },
});

const metaCols = [
  { label: 'DELIVERABLE', val: 'Final Capstone Project' },
  { label: 'TECH STACK', val: 'MERN Stack (Zero AI)' },
  { label: 'DATABASE', val: 'MongoDB Atlas & Local DB' },
  { label: 'ARCHITECTURE', val: 'Org → Workspace → Team → Room' },
];

metaCols.forEach((col, idx) => {
  const xPos = 1.3 + idx * 2.8;
  slide1.addText(col.label, {
    x: xPos,
    y: 5.1,
    w: 2.6,
    h: 0.25,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: '818CF8',
  });
  slide1.addText(col.val, {
    x: xPos,
    y: 5.4,
    w: 2.6,
    h: 0.7,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.white,
  });
});

// -------------------------------------------------------------
// SLIDE 2: Project Introduction & Executive Summary
// -------------------------------------------------------------
const slide2 = pptx.addSlide();
addHeader(slide2, 'Executive Summary & Project Scope', 'PROJECT OVERVIEW');

slide2.addText(
  'WorkHub is an integrated, collaborative operations management platform built to coordinate large-scale events, department workflows, and cross-functional teams from initial concept to completion.',
  {
    x: 0.8,
    y: 1.35,
    w: 11.7,
    h: 0.65,
    fontSize: 13,
    fontFace: 'Arial',
    color: COLORS.text,
  }
);

const s2Cards = [
  {
    title: 'The Real-World Scenario',
    desc: 'Institutions organizing mega events (e.g. Vignan Mahotsav 2027 with 15,000+ participants) require seamless synergy across 10+ teams: Logistics, Stage AV, Sponsorship, PR, and Hospitality.',
    color: COLORS.primary,
  },
  {
    title: 'True Collaborative Focus',
    desc: 'Moves beyond single-user to-do lists. WorkHub provides real collaborative rooms, departmental standups, synchronized master calendars, and multi-collaborator review pipelines.',
    color: COLORS.accent,
  },
  {
    title: 'Zero AI / Strict Determinism',
    desc: 'Engineered as deterministic, production-grade enterprise software with strict 5-tier RBAC, audit trails, and data isolation between workspaces and rooms.',
    color: COLORS.secondary,
  },
];

s2Cards.forEach((c, i) => {
  const xPos = 0.8 + i * 4.0;
  slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 2.2,
    w: 3.7,
    h: 4.4,
    rectRadius: 0.15,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide2.addShape(pptx.shapes.RECTANGLE, {
    x: xPos,
    y: 2.2,
    w: 3.7,
    h: 0.08,
    fill: { color: c.color },
    line: { color: c.color },
  });

  slide2.addText(c.title, {
    x: xPos + 0.3,
    y: 2.5,
    w: 3.1,
    h: 0.5,
    fontSize: 15,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide2.addText(c.desc, {
    x: xPos + 0.3,
    y: 3.2,
    w: 3.1,
    h: 3.0,
    fontSize: 12,
    fontFace: 'Arial',
    color: COLORS.muted,
    lineSpacing: 20,
  });
});

// -------------------------------------------------------------
// SLIDE 3: Problem Statement
// -------------------------------------------------------------
const slide3 = pptx.addSlide();
addHeader(slide3, 'Problem Statement: Challenges in Modern Event & Work Operations', 'NEED FOR WORKHUB');

const problems = [
  {
    num: '01',
    title: 'Fragmented Communication Channels',
    desc: 'Teams rely on unstructured WhatsApp groups, disconnected emails, and loose notes, causing critical deadlines and responsibilities to fall through the cracks.',
  },
  {
    num: '02',
    title: 'Lack of Hierarchical Visibility',
    desc: 'Event coordinators and workspace managers cannot see department progress, room task bottlenecks, or overdue deliverables without manual, tedious daily check-ins.',
  },
  {
    num: '03',
    title: 'Static, Dead-End Spreadsheets',
    desc: 'Traditional Excel/Google sheets lack real-time accountability, status workflows, subtask checkpoint tracking, and live audit trails for approvals.',
  },
  {
    num: '04',
    title: 'Rigid Member Onboarding',
    desc: 'Existing systems either expose global data or force rigid administrative manual account creation rather than flexible invite links, unique IDs, and request workflows.',
  },
];

problems.forEach((p, i) => {
  const xPos = 0.8 + (i % 2) * 6.0;
  const yPos = 1.4 + Math.floor(i / 2) * 2.6;

  slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: yPos,
    w: 5.7,
    h: 2.3,
    rectRadius: 0.15,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide3.addText(p.num, {
    x: xPos + 0.3,
    y: yPos + 0.25,
    w: 0.8,
    h: 0.4,
    fontSize: 20,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  slide3.addText(p.title, {
    x: xPos + 1.2,
    y: yPos + 0.25,
    w: 4.1,
    h: 0.5,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide3.addText(p.desc, {
    x: xPos + 0.3,
    y: yPos + 0.85,
    w: 5.0,
    h: 1.3,
    fontSize: 11,
    fontFace: 'Arial',
    color: COLORS.muted,
    lineSpacing: 18,
  });
});

// -------------------------------------------------------------
// SLIDE 4: Proposed Solution & Key Pillars
// -------------------------------------------------------------
const slide4 = pptx.addSlide();
addHeader(slide4, 'Proposed Solution: The WorkHub Operations Engine', 'SYSTEM INNOVATION');

const pillars = [
  {
    title: 'Structured 4-Tier Hierarchy',
    items: [
      'Organization level governance',
      'Independent workspace portfolios',
      'Department / Team operational squads',
      'Isolated rooms for specific execution channels',
    ],
  },
  {
    title: 'Streamlined Collaboration',
    items: [
      'Multi-collaborator assigned tasks',
      'Drag & drop Kanban board pipeline',
      'Leader review and change request cycles',
      'Live comments and suggestion triage',
    ],
  },
  {
    title: 'Accountability & Daily Sync',
    items: [
      'Daily planner (Today WIP & Tomorrow Plan)',
      'Department daily update inspection',
      'Workspace-wide blocker triage table',
      'FullCalendar multi-level aggregation',
    ],
  },
  {
    title: 'Flexible Member Access',
    items: [
      'Shareable workspace invite links',
      'Direct add by Unique Member ID (WH-XXXXXX)',
      'Directory search & join request approval',
      'Fine-grained 5-tier RBAC authorization',
    ],
  },
];

pillars.forEach((p, i) => {
  const xPos = 0.8 + i * 3.0;
  slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.5,
    w: 2.8,
    h: 5.1,
    rectRadius: 0.12,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide4.addText(p.title, {
    x: xPos + 0.2,
    y: 1.8,
    w: 2.4,
    h: 0.7,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
  });

  p.items.forEach((item, j) => {
    slide4.addText(`•  ${item}`, {
      x: xPos + 0.2,
      y: 2.6 + j * 1.0,
      w: 2.4,
      h: 0.9,
      fontSize: 10,
      fontFace: 'Arial',
      color: COLORS.text,
      lineSpacing: 15,
    });
  });
});

// -------------------------------------------------------------
// SLIDE 5: 4-Tier Operational Hierarchy
// -------------------------------------------------------------
const slide5 = pptx.addSlide();
addHeader(slide5, 'Core Application Hierarchy: Organization → Workspace → Team → Room', 'ARCHITECTURE');

const levels = [
  {
    level: 'LEVEL 1: ORGANIZATION',
    name: 'Top-Level Entity (e.g. Vignan University)',
    desc: 'Multi-tenant foundation hosting global policies, organization settings, executive leaders, and multiple concurrent workspaces.',
    tag: 'GLOBAL GOVERNANCE',
  },
  {
    level: 'LEVEL 2: WORKSPACE',
    name: 'Event Portfolio (e.g. Vignan Mahotsav 2027)',
    desc: 'Self-contained project environment containing master event calendars, overall progress metrics, announcements, and department standup summaries.',
    tag: 'PROJECT / EVENT SCOPE',
  },
  {
    level: 'LEVEL 3: TEAM / DEPARTMENT',
    name: 'Functional Squad (e.g. PR, Tech Team, Logistics)',
    desc: 'Autonomous departmental units with assigned Team Leaders, mandate checklists, department schedules, discussion forums, and daily updates inspection.',
    tag: 'DEPARTMENTAL UNIT',
  },
  {
    level: 'LEVEL 4: ROOM / CHANNEL',
    name: 'Execution Area (e.g. Stage Sound & Lighting)',
    desc: 'Focused working spaces with Kanban boards, multi-assignee task workflows, subtask checkpoints, milestones, room discussions, and activity history.',
    tag: 'EXECUTION CELL',
  },
];

levels.forEach((lvl, i) => {
  const yPos = 1.45 + i * 1.35;
  slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8,
    y: yPos,
    w: 11.733,
    h: 1.2,
    rectRadius: 0.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide5.addText(lvl.level, {
    x: 1.1,
    y: yPos + 0.15,
    w: 3.2,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  slide5.addText(lvl.name, {
    x: 1.1,
    y: yPos + 0.45,
    w: 3.5,
    h: 0.55,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide5.addText(lvl.desc, {
    x: 4.8,
    y: yPos + 0.25,
    w: 5.6,
    h: 0.7,
    fontSize: 10,
    fontFace: 'Arial',
    color: COLORS.muted,
    lineSpacing: 15,
  });

  slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 10.6,
    y: yPos + 0.35,
    w: 1.7,
    h: 0.45,
    rectRadius: 0.08,
    fill: { color: 'EEF2FF' },
    line: { color: 'C7D2FE' },
  });
  slide5.addText(lvl.tag, {
    x: 10.6,
    y: yPos + 0.35,
    w: 1.7,
    h: 0.45,
    fontSize: 8,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    valign: 'middle',
    color: COLORS.primary,
  });
});

// -------------------------------------------------------------
// SLIDE 6: 5-Tier RBAC Role Model
// -------------------------------------------------------------
const slide6 = pptx.addSlide();
addHeader(slide6, '5-Tier Role-Based Access Control (RBAC) System', 'SECURITY & GOVERNANCE');

const roles = [
  {
    role: 'Organization Owner',
    scope: 'Enterprise',
    perm: 'Total governance, organization provisioning, org settings, archive/delete workspaces.',
  },
  {
    role: 'Organization Admin',
    scope: 'Organization',
    perm: 'Create workspaces, invite organization members, assign managers, access all event portfolios.',
  },
  {
    role: 'Workspace Manager',
    scope: 'Workspace',
    perm: 'Create teams/departments, post announcements, review all-teams daily standups, approve join requests.',
  },
  {
    role: 'Team Leader',
    scope: 'Department',
    perm: 'Create collaborative rooms, allocate room members, review member daily updates & team suggestions.',
  },
  {
    role: 'Team Member',
    scope: 'Room',
    perm: 'Execute assigned tasks, complete subtask checkpoints, submit review requests, post daily plans.',
  },
];

roles.forEach((r, i) => {
  const yPos = 1.45 + i * 1.05;
  slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8,
    y: yPos,
    w: 11.733,
    h: 0.92,
    rectRadius: 0.08,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide6.addText(r.role, {
    x: 1.1,
    y: yPos + 0.22,
    w: 3.0,
    h: 0.4,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 4.2,
    y: yPos + 0.24,
    w: 1.6,
    h: 0.4,
    rectRadius: 0.08,
    fill: { color: 'F1F5F9' },
    line: { color: 'CBD5E1' },
  });
  slide6.addText(r.scope, {
    x: 4.2,
    y: yPos + 0.24,
    w: 1.6,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    valign: 'middle',
    color: COLORS.muted,
  });

  slide6.addText(r.perm, {
    x: 6.0,
    y: yPos + 0.15,
    w: 6.2,
    h: 0.65,
    fontSize: 10,
    fontFace: 'Arial',
    color: COLORS.text,
    valign: 'middle',
  });
});

// -------------------------------------------------------------
// SLIDE 7: Technology Stack
// -------------------------------------------------------------
const slide7 = pptx.addSlide();
addHeader(slide7, 'MERN Technology Stack Specification (Zero AI)', 'TECHNICAL FOUNDATION');

const techStack = [
  {
    layer: 'FRONTEND',
    tech: 'React 18 + Vite 6',
    desc: 'Single-page application with component architecture, fast HMR bundling, and production asset optimization.',
    libs: 'Tailwind CSS, TanStack Query v5, FullCalendar, Recharts, Lucide React, Axios',
  },
  {
    layer: 'BACKEND',
    tech: 'Node.js + Express.js',
    desc: 'RESTful API server with modular controllers, centralized error handling, and robust middleware stack.',
    libs: 'Zod validation schemas, JWT, bcryptjs, Helmet, Cookie-Parser, Morgan logging',
  },
  {
    layer: 'DATABASE',
    tech: 'MongoDB + Mongoose 8.x',
    desc: 'Document-oriented database with normalized collections, indexed schemas, and relational references.',
    libs: 'Local MongoDB daemon + MongoDB Atlas cloud cluster support with failover',
  },
  {
    layer: 'REAL-TIME',
    tech: 'Socket.IO Engine',
    desc: 'Bi-directional WebSocket communication for real-time room status updates and notifications.',
    libs: 'Room-scoped broadcasts, real-time sync status indicators in Header',
  },
];

techStack.forEach((t, i) => {
  const xPos = 0.8 + i * 3.0;
  slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.5,
    w: 2.8,
    h: 5.1,
    rectRadius: 0.12,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide7.addText(t.layer, {
    x: xPos + 0.2,
    y: 1.8,
    w: 2.4,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  slide7.addText(t.tech, {
    x: xPos + 0.2,
    y: 2.15,
    w: 2.4,
    h: 0.6,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide7.addText(t.desc, {
    x: xPos + 0.2,
    y: 2.85,
    w: 2.4,
    h: 1.3,
    fontSize: 10,
    fontFace: 'Arial',
    color: COLORS.muted,
    lineSpacing: 15,
  });

  slide7.addShape(pptx.shapes.RECTANGLE, {
    x: xPos + 0.2,
    y: 4.2,
    w: 2.4,
    h: 0.02,
    fill: { color: COLORS.border },
    line: { color: COLORS.border },
  });

  slide7.addText('CORE LIBRARIES', {
    x: xPos + 0.2,
    y: 4.35,
    w: 2.4,
    h: 0.25,
    fontSize: 8,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
  });

  slide7.addText(t.libs, {
    x: xPos + 0.2,
    y: 4.65,
    w: 2.4,
    h: 1.7,
    fontSize: 9,
    fontFace: 'Arial',
    color: COLORS.text,
    lineSpacing: 14,
  });
});

// -------------------------------------------------------------
// SLIDE 8: System Architecture Flow
// -------------------------------------------------------------
const slide8 = pptx.addSlide();
addHeader(slide8, 'Full-Stack System Architecture & Data Flow', 'SYSTEM ARCHITECTURE');

const archBoxes = [
  {
    x: 0.8,
    y: 1.6,
    w: 3.4,
    h: 4.9,
    title: 'Client Layer (Browser)',
    subtitle: 'React 18 SPA + Vite',
    items: [
      'AuthContext & SocketContext',
      'TanStack Query Server State Cache',
      'Protected App / Workspace Layouts',
      'FullCalendar & Recharts Renderers',
      'Axios Interceptors with Credentials',
    ],
    color: '4338CA',
  },
  {
    x: 4.9,
    y: 1.6,
    w: 3.5,
    h: 4.9,
    title: 'API & Gateway Layer',
    subtitle: 'Node.js + Express.js',
    items: [
      'JWT Authentication & Cookies',
      '5-Tier RBAC Middleware Guard',
      'Zod Request Body Schema Validators',
      '15 Modular REST Domain Controllers',
      'Socket.IO Event Dispatcher',
    ],
    color: '6366F1',
  },
  {
    x: 9.1,
    y: 1.6,
    w: 3.4,
    h: 4.9,
    title: 'Data & Storage Layer',
    subtitle: 'MongoDB & Cloudinary',
    items: [
      '17 Normalized Mongoose Models',
      'Unique Member & Invite Code Hooks',
      'MongoDB Atlas Cloud Cluster',
      'Local MongoDB Failover Support',
      'Audit Trail & Activity Logs',
    ],
    color: '059669',
  },
];

archBoxes.forEach((b) => {
  slide8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
    rectRadius: 0.15,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide8.addShape(pptx.shapes.RECTANGLE, {
    x: b.x,
    y: b.y,
    w: b.w,
    h: 0.1,
    fill: { color: b.color },
    line: { color: b.color },
  });

  slide8.addText(b.title, {
    x: b.x + 0.25,
    y: b.y + 0.3,
    w: b.w - 0.5,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide8.addText(b.subtitle, {
    x: b.x + 0.25,
    y: b.y + 0.7,
    w: b.w - 0.5,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Arial',
    bold: true,
    color: b.color,
  });

  b.items.forEach((item, idx) => {
    slide8.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: b.x + 0.25,
      y: b.y + 1.2 + idx * 0.68,
      w: b.w - 0.5,
      h: 0.55,
      rectRadius: 0.08,
      fill: { color: 'F8FAFC' },
      line: { color: 'E2E8F0' },
    });

    slide8.addText(item, {
      x: b.x + 0.4,
      y: b.y + 1.2 + idx * 0.68,
      w: b.w - 0.8,
      h: 0.55,
      fontSize: 9,
      fontFace: 'Arial',
      color: COLORS.text,
      valign: 'middle',
    });
  });
});

// Arrows between boxes
slide8.addText('REST / JSON\n& WSS  ➔', {
  x: 4.25,
  y: 3.6,
  w: 0.65,
  h: 0.8,
  fontSize: 8,
  fontFace: 'Arial',
  bold: true,
  align: 'center',
  color: COLORS.muted,
});
slide8.addText('Mongoose\nDriver  ➔', {
  x: 8.45,
  y: 3.6,
  w: 0.65,
  h: 0.8,
  fontSize: 8,
  fontFace: 'Arial',
  bold: true,
  align: 'center',
  color: COLORS.muted,
});

// -------------------------------------------------------------
// SLIDE 9: Database Design & Schema Entities
// -------------------------------------------------------------
const slide9 = pptx.addSlide();
addHeader(slide9, 'Database Design: 17 Normalized Collections & References', 'DATA ARCHITECTURE');

const collections = [
  { name: 'Users', fields: 'name, email, memberId (WH-XXXXXX), password, role, title, avatarUrl' },
  { name: 'Organizations', fields: 'name, slug, logoUrl, createdBy' },
  { name: 'Workspaces', fields: 'organizationId, name, slug, inviteCode (INV-XXXXXX), managers, status' },
  { name: 'Teams', fields: 'workspaceId, organizationId, name, slug, leader, members, responsibilities' },
  { name: 'Rooms', fields: 'workspaceId, teamId, name, slug, leader, members, status' },
  { name: 'Tasks', fields: 'roomId, workspaceId, title, assignees, status (5 tiers), priority, checkpoints' },
  { name: 'Schedules', fields: 'workspaceId, teamId, roomId, title, startTime, endTime, type, attendees' },
  { name: 'DailyPlans', fields: 'userId, teamId, date, accomplishments, inProgress, tomorrowPlan, blockers' },
  { name: 'Approvals', fields: 'taskId, workspaceId, submittedBy, reviewer, status (APPROVED/CHANGES)' },
  { name: 'WorkspaceJoinRequests', fields: 'workspaceId, userId, status (PENDING/APPROVED/REJECTED), message' },
  { name: 'Announcements', fields: 'workspaceId, teamId, title, content, priority (URGENT/NORMAL), author' },
  { name: 'ActivityLogs', fields: 'organizationId, workspaceId, actor, action, entityType, entityId' },
];

collections.forEach((col, i) => {
  const colIdx = Math.floor(i / 6);
  const rowIdx = i % 6;
  const xPos = 0.8 + colIdx * 5.95;
  const yPos = 1.45 + rowIdx * 0.9;

  slide9.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: yPos,
    w: 5.75,
    h: 0.78,
    rectRadius: 0.08,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide9.addText(col.name, {
    x: xPos + 0.2,
    y: yPos + 0.1,
    w: 2.2,
    h: 0.3,
    fontSize: 11,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
  });

  slide9.addText(col.fields, {
    x: xPos + 0.2,
    y: yPos + 0.38,
    w: 5.35,
    h: 0.35,
    fontSize: 8.5,
    fontFace: 'Arial',
    color: COLORS.muted,
  });
});

// -------------------------------------------------------------
// SLIDE 10: Three Member Onboarding Workflows
// -------------------------------------------------------------
const slide10 = pptx.addSlide();
addHeader(slide10, 'Innovative Collaborative Onboarding Workflows', 'MEMBER ADMISSION');

const methods = [
  {
    num: 'METHOD 1',
    title: 'Shareable Invite Link',
    subtitle: '/join-workspace/:codeOrId',
    desc: 'Workspace owners share a clean invitation link with an invite code (e.g. MAHOTSAV27). Visitors view the event brief and managers, and send a request to join.',
    benefit: 'Fast viral distribution across student & faculty bodies',
  },
  {
    num: 'METHOD 2',
    title: 'Direct Add by Unique ID',
    subtitle: 'Member ID: WH-XXXXXX',
    desc: 'Every registered user has an indexed, unique Member ID. Workspace owners can immediately add users by their ID or email without invitation link dependency.',
    benefit: 'Instant addition with automatic organization enrollment',
  },
  {
    num: 'METHOD 3',
    title: 'Explore, Search & Join',
    subtitle: 'Discovery Directory',
    desc: 'Members search active workspaces by title, category, or code. Live status badges indicate membership, pending status, or one-click request submission.',
    benefit: 'Self-service discovery with manager approval gatekeeping',
  },
];

methods.forEach((m, i) => {
  const xPos = 0.8 + i * 4.0;
  slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.5,
    w: 3.7,
    h: 5.1,
    rectRadius: 0.15,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide10.addText(m.num, {
    x: xPos + 0.3,
    y: 1.8,
    w: 3.1,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  slide10.addText(m.title, {
    x: xPos + 0.3,
    y: 2.1,
    w: 3.1,
    h: 0.45,
    fontSize: 16,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide10.addText(m.subtitle, {
    x: xPos + 0.3,
    y: 2.55,
    w: 3.1,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Courier New',
    bold: true,
    color: COLORS.primary,
  });

  slide10.addText(m.desc, {
    x: xPos + 0.3,
    y: 3.0,
    w: 3.1,
    h: 2.0,
    fontSize: 11,
    fontFace: 'Arial',
    color: COLORS.muted,
    lineSpacing: 18,
  });

  slide10.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos + 0.3,
    y: 5.3,
    w: 3.1,
    h: 0.9,
    rectRadius: 0.08,
    fill: { color: 'F0FDF4' },
    line: { color: 'BBF7D0' },
  });

  slide10.addText(`Benefit:\n${m.benefit}`, {
    x: xPos + 0.4,
    y: 5.35,
    w: 2.9,
    h: 0.8,
    fontSize: 9,
    fontFace: 'Arial',
    color: COLORS.accent,
    bold: true,
    lineSpacing: 14,
  });
});

// -------------------------------------------------------------
// SLIDE 11: Task Review & Approval Pipeline
// -------------------------------------------------------------
const slide11 = pptx.addSlide();
addHeader(slide11, 'Task Review & Approval Lifecycle', 'WORKFLOW PIPELINE');

const taskStages = [
  { step: '1. TO DO', title: 'Task Allocation', desc: 'Manager or lead creates task, sets assignees, checkpoints, priority, and deadline.' },
  { step: '2. IN PROGRESS', title: 'Work Execution', desc: 'Collaborators execute deliverables, check off subtask items, and post work progress.' },
  { step: '3. UNDER REVIEW', title: 'Approval Submission', desc: 'Assignee submits task for review with delivery notes and verification attachments.' },
  { step: '4. EVALUATION', title: 'Leader Decision', desc: 'Leader reviews submission: Approves to Completed or Requests Changes with feedback.' },
  { step: '5. COMPLETED', title: 'Audit Log & KPI', desc: 'Task verified, activity audit logged, workspace & room velocity metrics updated.' },
];

taskStages.forEach((s, i) => {
  const xPos = 0.8 + i * 2.4;
  slide11.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.6,
    w: 2.2,
    h: 4.8,
    rectRadius: 0.12,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide11.addText(s.step, {
    x: xPos + 0.15,
    y: 1.9,
    w: 1.9,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  slide11.addText(s.title, {
    x: xPos + 0.15,
    y: 2.25,
    w: 1.9,
    h: 0.5,
    fontSize: 13,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide11.addText(s.desc, {
    x: xPos + 0.15,
    y: 2.9,
    w: 1.9,
    h: 3.0,
    fontSize: 10,
    fontFace: 'Arial',
    color: COLORS.muted,
    lineSpacing: 16,
  });
});

// -------------------------------------------------------------
// SLIDE 12: Daily Standups & Future Planning
// -------------------------------------------------------------
const slide12 = pptx.addSlide();
addHeader(slide12, 'Daily Work Planner, Standups & Future Planning', 'OPERATIONAL SYNC');

const syncCols = [
  {
    title: 'Individual Contributor View',
    subtitle: 'Daily Planner (/daily-planner)',
    bullets: [
      'Record today’s completed milestones',
      'Detail current work-in-progress tasks',
      'Draft tomorrow’s prioritized work plan',
      'Flag operational blockers and dependencies',
    ],
  },
  {
    title: 'Department Leader Inspection',
    subtitle: 'Team Standups (/teams/:id/daily-updates)',
    bullets: [
      'Filter standups by team member and date',
      'Track individual accomplishment logs',
      'Identify bottlenecks and delayed tasks',
      'Propose course corrections in team discussions',
    ],
  },
  {
    title: 'Executive Manager Oversight',
    subtitle: 'All-Teams Summary (/workspaces/:id/daily-standups)',
    bullets: [
      'Comprehensive cross-department status matrix',
      'Total submission compliance count',
      'Critical blocker triage table across teams',
      'Live export and report generation',
    ],
  },
];

syncCols.forEach((c, i) => {
  const xPos = 0.8 + i * 4.0;
  slide12.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.6,
    w: 3.7,
    h: 4.9,
    rectRadius: 0.15,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide12.addText(c.title, {
    x: xPos + 0.3,
    y: 1.9,
    w: 3.1,
    h: 0.45,
    fontSize: 14,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide12.addText(c.subtitle, {
    x: xPos + 0.3,
    y: 2.35,
    w: 3.1,
    h: 0.3,
    fontSize: 10,
    fontFace: 'Courier New',
    bold: true,
    color: COLORS.primary,
  });

  c.bullets.forEach((b, j) => {
    slide12.addText(`•  ${b}`, {
      x: xPos + 0.3,
      y: 2.9 + j * 0.85,
      w: 3.1,
      h: 0.75,
      fontSize: 11,
      fontFace: 'Arial',
      color: COLORS.text,
      lineSpacing: 16,
    });
  });
});

// -------------------------------------------------------------
// SLIDE 13: Screenshots 1 - Dashboard & My Tasks
// -------------------------------------------------------------
const slide13 = pptx.addSlide();
addHeader(slide13, 'Application Showcase: Executive Dashboard & Task Hub', 'ACTUAL IMPLEMENTATION');

const img03 = path.resolve('docs/screenshots/03_personal_dashboard.png');
const img04 = path.resolve('docs/screenshots/04_my_tasks.png');

if (fs.existsSync(img03)) {
  slide13.addImage({ path: img03, x: 0.8, y: 1.5, w: 5.7, h: 4.8 });
  slide13.addText('Figure 1: Personal Dashboard with Recharts KPI Visualizers & Recent Activity', {
    x: 0.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

if (fs.existsSync(img04)) {
  slide13.addImage({ path: img04, x: 6.8, y: 1.5, w: 5.7, h: 4.8 });
  slide13.addText('Figure 2: Unified Cross-Workspace Task Responsibility List', {
    x: 6.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

// -------------------------------------------------------------
// SLIDE 14: Screenshots 2 - Workspaces & Discovery
// -------------------------------------------------------------
const slide14 = pptx.addSlide();
addHeader(slide14, 'Application Showcase: Workspaces & Onboarding Discovery', 'ACTUAL IMPLEMENTATION');

const img05 = path.resolve('docs/screenshots/05_workspaces_directory.png');
const img06 = path.resolve('docs/screenshots/06_explore_workspaces.png');

if (fs.existsSync(img05)) {
  slide14.addImage({ path: img05, x: 0.8, y: 1.5, w: 5.7, h: 4.8 });
  slide14.addText('Figure 3: Active Workspaces Directory (Portfolio & Progress Cards)', {
    x: 0.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

if (fs.existsSync(img06)) {
  slide14.addImage({ path: img06, x: 6.8, y: 1.5, w: 5.7, h: 4.8 });
  slide14.addText('Figure 4: Explore & Search Workspaces with Live Join Request Triggers', {
    x: 6.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

// -------------------------------------------------------------
// SLIDE 15: Screenshots 3 - Workspace Operations & Staff
// -------------------------------------------------------------
const slide15 = pptx.addSlide();
addHeader(slide15, 'Application Showcase: Event Operations & Personnel Management', 'ACTUAL IMPLEMENTATION');

const img08 = path.resolve('docs/screenshots/08_workspace_overview.png');
const img09 = path.resolve('docs/screenshots/09_workspace_members_and_invite.png');

if (fs.existsSync(img08)) {
  slide15.addImage({ path: img08, x: 0.8, y: 1.5, w: 5.7, h: 4.8 });
  slide15.addText('Figure 5: Workspace Overview (Event KPIs, Quick Navigation & Activity)', {
    x: 0.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

if (fs.existsSync(img09)) {
  slide15.addImage({ path: img09, x: 6.8, y: 1.5, w: 5.7, h: 4.8 });
  slide15.addText('Figure 6: Shareable Workspace Join Link & Staff Management Hub', {
    x: 6.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

// -------------------------------------------------------------
// SLIDE 16: Screenshots 4 - Kanban & Calendar
// -------------------------------------------------------------
const slide16 = pptx.addSlide();
addHeader(slide16, 'Application Showcase: Collaborative Kanban Board & Master Calendar', 'ACTUAL IMPLEMENTATION');

const img17 = path.resolve('docs/screenshots/17_room_kanban_board.png');
const img12 = path.resolve('docs/screenshots/12_workspace_calendar.png');

if (fs.existsSync(img17)) {
  slide16.addImage({ path: img17, x: 0.8, y: 1.5, w: 5.7, h: 4.8 });
  slide16.addText('Figure 7: Room Kanban Board with Multi-Collaborators & Subtask Badges', {
    x: 0.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

if (fs.existsSync(img12)) {
  slide16.addImage({ path: img12, x: 6.8, y: 1.5, w: 5.7, h: 4.8 });
  slide16.addText('Figure 8: Master Event Calendar with Task Deadlines & Meeting Agendas', {
    x: 6.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

// -------------------------------------------------------------
// SLIDE 17: Screenshots 5 - Standups & Reports
// -------------------------------------------------------------
const slide17 = pptx.addSlide();
addHeader(slide17, 'Application Showcase: Standups & Operational Intelligence', 'ACTUAL IMPLEMENTATION');

const img13 = path.resolve('docs/screenshots/13_workspace_daily_standups.png');
const img14 = path.resolve('docs/screenshots/14_workspace_reports_analytics.png');

if (fs.existsSync(img13)) {
  slide17.addImage({ path: img13, x: 0.8, y: 1.5, w: 5.7, h: 4.8 });
  slide17.addText('Figure 9: All-Teams Consolidated Daily Standup & Blocker Matrix', {
    x: 0.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

if (fs.existsSync(img14)) {
  slide17.addImage({ path: img14, x: 6.8, y: 1.5, w: 5.7, h: 4.8 });
  slide17.addText('Figure 10: Operational Reports, Milestone Burndown & Team Velocity', {
    x: 6.8,
    y: 6.4,
    w: 5.7,
    h: 0.4,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    align: 'center',
    color: COLORS.muted,
  });
}

// -------------------------------------------------------------
// SLIDE 18: Testing & Verification Results
// -------------------------------------------------------------
const slide18 = pptx.addSlide();
addHeader(slide18, 'Automated Test Verification: 20/20 Test Suites Passing (100%)', 'QUALITY ASSURANCE');

const testStats = [
  { label: 'TOTAL TESTS', val: '20' },
  { label: 'TESTS PASSED', val: '20 (100%)' },
  { label: 'FAILED / SKIPPED', val: '0' },
  { label: 'EXECUTION TIME', val: '11.8s' },
];

testStats.forEach((s, i) => {
  const xPos = 0.8 + i * 3.0;
  slide18.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.5,
    w: 2.7,
    h: 1.2,
    rectRadius: 0.12,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide18.addText(s.label, {
    x: xPos + 0.2,
    y: 1.65,
    w: 2.3,
    h: 0.25,
    fontSize: 8.5,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  slide18.addText(s.val, {
    x: xPos + 0.2,
    y: 1.95,
    w: 2.3,
    h: 0.5,
    fontSize: 16,
    fontFace: 'Arial',
    bold: true,
    color: s.label.includes('PASSED') ? COLORS.accent : COLORS.dark,
  });
});

const verifiedModules = [
  '1. Health Check & DB Ping',
  '2. Admin Login & JWT Issuance',
  '3. Session Verification (/auth/me)',
  '4. Workspace Portfolio Listing',
  '5. Team Department Metrics',
  '6. Team Roster & Permissions',
  '7. Team Calendar & Task Aggregation',
  '8. Announcements Publishing & Broadcast',
  '9. Collaborative Rooms Isolation',
  '10. Kanban Task Status Pipeline',
  '11. Multi-Scope FullCalendar Sync',
  '12. Operational Analytics & Velocity',
  '13. Live Notification Streaming',
  '14. Daily Work Planner & Tomorrow Plans',
  '15. All-Teams Blocker Summary',
  '16. Suggestions & Proposals Triage',
  '17. Threaded Room Discussions',
  '18. Workspace Onboarding: Search API',
  '19. Invite Link & Join Request Flow',
  '20. Direct Add by Unique Member ID',
];

verifiedModules.forEach((m, idx) => {
  const colIdx = Math.floor(idx / 10);
  const rowIdx = idx % 10;
  const xPos = 0.8 + colIdx * 5.95;
  const yPos = 2.95 + rowIdx * 0.38;

  slide18.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: yPos,
    w: 5.75,
    h: 0.32,
    rectRadius: 0.05,
    fill: { color: COLORS.cardBg },
    line: { color: 'E2E8F0' },
  });

  slide18.addText(`✓  ${m}`, {
    x: xPos + 0.2,
    y: yPos,
    w: 5.35,
    h: 0.32,
    fontSize: 8.5,
    fontFace: 'Arial',
    bold: true,
    color: '047857',
    valign: 'middle',
  });
});

// -------------------------------------------------------------
// SLIDE 19: Deployment Architecture
// -------------------------------------------------------------
const slide19 = pptx.addSlide();
addHeader(slide19, 'Production Cloud Deployment Architecture', 'DEPLOYMENT');

const deployPillars = [
  {
    target: 'FRONTEND DEPLOYMENT',
    service: 'Vercel Platform',
    desc: 'High-availability React Single Page Application deployed with automatic edge caching, HTTPS, and SPA client routing rewrites via vercel.json.',
    configs: 'Framework: Vite React\nRoot: client\nEnvironment: VITE_API_URL',
    color: '0F172A',
  },
  {
    target: 'BACKEND DEPLOYMENT',
    service: 'Render Web Service',
    desc: 'Containerized Node.js Express service running REST endpoints and Socket.IO engine with automated health-checks and zero-downtime rolling deploys.',
    configs: 'Runtime: Node.js 20+\nRoot: server\nStart: npm start',
    color: '4338CA',
  },
  {
    target: 'DATABASE CLOUD',
    service: 'MongoDB Atlas',
    desc: 'Distributed M0 cloud cluster with automated daily snapshots, multi-region replication, and IP access list whitelist configuration for Render.',
    configs: 'Cluster: cluster0.etprdfz.mongodb.net\nDB: workhub\nProtocol: mongodb+srv://',
    color: '059669',
  },
];

deployPillars.forEach((d, i) => {
  const xPos = 0.8 + i * 4.0;
  slide19.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.5,
    w: 3.7,
    h: 5.1,
    rectRadius: 0.15,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide19.addText(d.target, {
    x: xPos + 0.3,
    y: 1.8,
    w: 3.1,
    h: 0.3,
    fontSize: 9,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.secondary,
  });

  slide19.addText(d.service, {
    x: xPos + 0.3,
    y: 2.1,
    w: 3.1,
    h: 0.45,
    fontSize: 16,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.dark,
  });

  slide19.addText(d.desc, {
    x: xPos + 0.3,
    y: 2.7,
    w: 3.1,
    h: 2.0,
    fontSize: 11,
    fontFace: 'Arial',
    color: COLORS.muted,
    lineSpacing: 18,
  });

  slide19.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos + 0.3,
    y: 4.8,
    w: 3.1,
    h: 1.4,
    rectRadius: 0.08,
    fill: { color: 'F8FAFC' },
    line: { color: 'E2E8F0' },
  });

  slide19.addText(d.configs, {
    x: xPos + 0.45,
    y: 4.9,
    w: 2.8,
    h: 1.2,
    fontSize: 9,
    fontFace: 'Courier New',
    color: COLORS.text,
    lineSpacing: 16,
  });
});

// -------------------------------------------------------------
// SLIDE 20: Conclusion & Future Scope
// -------------------------------------------------------------
const slide20 = pptx.addSlide();
addHeader(slide20, 'Conclusion & Future Enhancements Roadmap', 'FUTURE ROADMAP');

const futureItems = [
  {
    title: 'Capstone Objectives Achieved',
    points: [
      'Delivered full-stack MERN WorkHub platform without synthetic mock data or shortcuts.',
      'Implemented full 4-tier operational hierarchy (Org → Workspace → Team → Room).',
      'Engineered all 3 collaborative member onboarding workflows (Link, Unique ID, Search).',
      'Verified with 20 passing integration test suites and 0 Vite compilation warnings.',
    ],
  },
  {
    title: 'Future Roadmap & Extensions',
    points: [
      'Gantt Chart & Critical Path Dependency Visualizer for event milestone scheduling.',
      'Offline Progressive Web App (PWA) caching for zero-connectivity field operations.',
      'SMS & WhatsApp Webhook notifications for urgent stage and logistics announcements.',
      'Granular Sub-Organization Billing & Multi-Campus University federation.',
    ],
  },
];

futureItems.forEach((f, i) => {
  const xPos = 0.8 + i * 6.0;
  slide20.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: xPos,
    y: 1.6,
    w: 5.7,
    h: 4.9,
    rectRadius: 0.15,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.border },
  });

  slide20.addText(f.title, {
    x: xPos + 0.4,
    y: 1.9,
    w: 5.0,
    h: 0.5,
    fontSize: 16,
    fontFace: 'Arial',
    bold: true,
    color: COLORS.primary,
  });

  f.points.forEach((pt, j) => {
    slide20.addText(`•  ${pt}`, {
      x: xPos + 0.4,
      y: 2.6 + j * 0.95,
      w: 4.9,
      h: 0.85,
      fontSize: 11,
      fontFace: 'Arial',
      color: COLORS.text,
      lineSpacing: 17,
    });
  });
});

// -------------------------------------------------------------
// SLIDE 21: Q&A / Thank You Slide (Dark Theme)
// -------------------------------------------------------------
const slide21 = pptx.addSlide();
slide21.background = { color: '0A0F1D' };

slide21.addText('Thank You!', {
  x: 1.0,
  y: 2.0,
  w: 11.3,
  h: 1.0,
  fontSize: 44,
  fontFace: 'Arial',
  bold: true,
  align: 'center',
  color: COLORS.white,
});

slide21.addText('WorkHub – Team Workflow & Event Operations Management System', {
  x: 1.0,
  y: 3.2,
  w: 11.3,
  h: 0.5,
  fontSize: 16,
  fontFace: 'Arial',
  bold: true,
  align: 'center',
  color: 'A5B4FC',
});

slide21.addText('Ready for Live Demonstration & Technical Q&A', {
  x: 1.0,
  y: 3.8,
  w: 11.3,
  h: 0.5,
  fontSize: 13,
  fontFace: 'Arial',
  align: 'center',
  color: '94A3B8',
});

slide21.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
  x: 3.666,
  y: 4.8,
  w: 6.0,
  h: 1.3,
  rectRadius: 0.12,
  fill: { color: '131C31' },
  line: { color: '233252' },
});

slide21.addText('GitHub Repository: https://github.com/namitha-koduru/WorkHub.git\nTechnology: MongoDB • Express.js • React.js • Node.js', {
  x: 3.8,
  y: 4.95,
  w: 5.7,
  h: 1.0,
  fontSize: 10,
  fontFace: 'Arial',
  align: 'center',
  color: 'CBD5E1',
  lineSpacing: 18,
});

// Write to file
const outputPath = path.resolve('docs/WorkHub_Final_Presentation.pptx');
pptx
  .writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`[Presentation] Generated successfully at: ${outputPath}`);
  })
  .catch((err) => {
    console.error('[Presentation Error]', err);
  });
