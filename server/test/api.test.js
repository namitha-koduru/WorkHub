import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

let server;
let baseUrl;
let authToken;
let testOrgId;
let testWorkspaceId;
let testTeamId;
let testRoomId;
let testTaskId;
let testUserId;

test.before(async () => {
  await connectDB();
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/v1`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) server.close();
  await mongoose.disconnect();
});

test('1. System Health Check', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.data.status, 'UP');
  assert.equal(data.data.database.connected, true);
});

test('2. Authentication: Login with seeded admin credentials', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@workhub.com',
      password: 'Password123!',
    }),
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.token);
  assert.equal(data.data.user.email, 'admin@workhub.com');

  authToken = data.data.token;
  testUserId = data.data.user._id;
});

test('3. Authentication: Verify session via /auth/me', async () => {
  const res = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.data.organizations.length > 0);
  testOrgId = data.data.organizations[0]._id;
});

test('4. Workspaces: List workspaces for organization', async () => {
  const res = await fetch(`${baseUrl}/workspaces?orgId=${testOrgId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.length > 0);
  const mahotsav = data.data.find((w) => w.slug.includes('mahotsav')) || data.data[0];
  testWorkspaceId = mahotsav._id;
});

test('5. Teams: List teams inside workspace and verify departmental metrics', async () => {
  const res = await fetch(`${baseUrl}/teams?workspaceId=${testWorkspaceId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.length > 0);
  testTeamId = data.data[0]._id;
  assert.ok(data.data[0].name);
  assert.ok(typeof data.data[0].progress === 'number');
  assert.ok(typeof data.data[0].roomCount === 'number');
});

test('6. Teams: Retrieve team details & member roster', async () => {
  const res = await fetch(`${baseUrl}/teams/${testTeamId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.name);
  assert.ok(data.data.leader);

  const membersRes = await fetch(`${baseUrl}/teams/${testTeamId}/members`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const membersData = await membersRes.json();
  assert.equal(membersRes.status, 200);
  assert.ok(membersData.data.length > 0);
});

test('7. Teams: Retrieve team calendar schedule & task aggregation', async () => {
  const res = await fetch(`${baseUrl}/teams/${testTeamId}/calendar`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.data));
});

test('8. Announcements: Publish and list workspace & team announcements', async () => {
  const createRes = await fetch(`${baseUrl}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      scope: 'WORKSPACE',
      organizationId: testOrgId,
      workspaceId: testWorkspaceId,
      title: 'Automated Test Notice: All-Hands Ready',
      content: 'Live verification notice published during automated integration test run.',
      priority: 'URGENT',
      isPinned: true,
    }),
  });
  const createData = await createRes.json();
  assert.equal(createRes.status, 201);
  assert.equal(createData.data.title, 'Automated Test Notice: All-Hands Ready');

  const listRes = await fetch(`${baseUrl}/announcements?workspaceId=${testWorkspaceId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const listData = await listRes.json();
  assert.equal(listRes.status, 200);
  assert.ok(listData.data.length > 0);
});

test('9. Rooms: List rooms inside team & workspace', async () => {
  const res = await fetch(`${baseUrl}/rooms?workspaceId=${testWorkspaceId}&teamId=${testTeamId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.length > 0);
  testRoomId = data.data[0]._id;
  assert.ok(data.data[0].teamId);
});

test('10. Tasks: Multi-collaborator task management & status updates', async () => {
  const res = await fetch(`${baseUrl}/tasks?roomId=${testRoomId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.length > 0);
  testTaskId = data.data[0]._id;

  // Verify collaborators array exists
  assert.ok(Array.isArray(data.data[0].collaborators));

  // Update task status
  const patchRes = await fetch(`${baseUrl}/tasks/${testTaskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ status: 'In Progress' }),
  });
  const patchData = await patchRes.json();
  assert.equal(patchRes.status, 200);
  assert.equal(patchData.data.status, 'In Progress');
});

test('11. Calendar: Retrieve personal schedules & aggregated task deadlines', async () => {
  const res = await fetch(`${baseUrl}/schedules/personal`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.data));
});

test('12. Reports: Generate workspace analytics report with team-wise velocity', async () => {
  const res = await fetch(`${baseUrl}/reports/workspace/${testWorkspaceId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.kpi);
  assert.ok(Array.isArray(data.data.teamPerformance));
  assert.ok(Array.isArray(data.data.roomPerformance));
  assert.ok(Array.isArray(data.data.statusDistribution));
});

test('13. Notifications: Retrieve user notification stream', async () => {
  const res = await fetch(`${baseUrl}/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.data.notifications));
});

test('14. Daily Planner: Create personal plan and fetch team daily plans', async () => {
  const today = new Date().toISOString().split('T')[0];
  const saveRes = await fetch(`${baseUrl}/daily-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      date: today,
      organizationId: testOrgId,
      workspaceId: testWorkspaceId,
      teamId: testTeamId,
      todayWork: {
        plannedTasks: ['Outdoor Wi-Fi mesh tuning'],
        inProgressTasks: ['Stage AV calibration'],
        completedTasks: ['Fiber optical link verification'],
        pendingTasks: [],
        blockers: 'None',
      },
      tomorrowPlan: {
        continueTasks: ['Stage AV calibration'],
        newTasks: ['Registration portal stress test'],
        expectedCompletion: 'Tomorrow 5 PM',
        notes: 'Integration test verified',
      },
    }),
  });
  const saveData = await saveRes.json();
  assert.equal(saveRes.status, 200);
  assert.equal(saveData.data.date, today);

  // Fetch team member plans
  const teamPlansRes = await fetch(`${baseUrl}/daily-plans/team/${testTeamId}?date=${today}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const teamPlansData = await teamPlansRes.json();
  assert.equal(teamPlansRes.status, 200);
  assert.ok(Array.isArray(teamPlansData.data));
});

test('15. Daily Planner: Workspace manager summary across all teams', async () => {
  const today = new Date().toISOString().split('T')[0];
  const res = await fetch(`${baseUrl}/daily-plans/workspace/${testWorkspaceId}/summary?date=${today}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(typeof data.data.overallSubmissionRate === 'number');
  assert.ok(Array.isArray(data.data.teamSummaries));
  assert.ok(Array.isArray(data.data.allBlockers));
});

test('16. Suggestions: Post and accept team suggestion', async () => {
  const suggRes = await fetch(`${baseUrl}/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      teamId: testTeamId,
      workspaceId: testWorkspaceId,
      organizationId: testOrgId,
      title: 'Deploy Local Docker DNS Caching Node',
      description: 'Caches lookup records to eliminate cellular latency during festival rush.',
    }),
  });
  const suggData = await suggRes.json();
  assert.equal(suggRes.status, 201);
  assert.equal(suggData.data.status, 'OPEN');

  const patchRes = await fetch(`${baseUrl}/suggestions/${suggData.data._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      status: 'ACCEPTED',
      resolutionNotes: 'Approved during test run.',
    }),
  });
  const patchData = await patchRes.json();
  assert.equal(patchRes.status, 200);
  assert.equal(patchData.data.status, 'ACCEPTED');
});

test('17. Comments: Post team-level and task-level discussions', async () => {
  // Task discussion
  const taskCommentRes = await fetch(`${baseUrl}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      targetType: 'TASK',
      targetId: testTaskId,
      organizationId: testOrgId,
      workspaceId: testWorkspaceId,
      teamId: testTeamId,
      content: 'Critical test comment on task.',
    }),
  });
  const taskCommentData = await taskCommentRes.json();
  assert.equal(taskCommentRes.status, 201);
  assert.ok(taskCommentData.data._id);

  // Team discussion
  const teamCommentRes = await fetch(`${baseUrl}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      targetType: 'TEAM_DISCUSSION',
      targetId: testTeamId,
      organizationId: testOrgId,
      workspaceId: testWorkspaceId,
      teamId: testTeamId,
      content: 'Departmental coordination memo: All leads report to stage at 3 PM.',
    }),
  });
  const teamCommentData = await teamCommentRes.json();
  assert.equal(teamCommentRes.status, 201);
  assert.ok(teamCommentData.data._id);
});
