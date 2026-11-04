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
let testRoomId;
let testTaskId;

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
  // Pick Vignan Mahotsav 2027 which has the rooms
  const mahotsav = data.data.find((w) => w.slug.includes('mahotsav')) || data.data[0];
  testWorkspaceId = mahotsav._id;
});

test('5. Rooms: List rooms inside workspace', async () => {
  const res = await fetch(`${baseUrl}/rooms?workspaceId=${testWorkspaceId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.length > 0);
  testRoomId = data.data[0]._id;
});

test('6. Tasks: List tasks and update status (Kanban drag-drop)', async () => {
  const res = await fetch(`${baseUrl}/tasks?roomId=${testRoomId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.length > 0);

  testTaskId = data.data[0]._id;

  // Test status change
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

test('7. Calendar: Retrieve personal schedules & aggregated task deadlines', async () => {
  const res = await fetch(`${baseUrl}/schedules/personal`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.data));
});

test('8. Reports: Generate workspace analytics report', async () => {
  const res = await fetch(`${baseUrl}/reports/workspace/${testWorkspaceId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.data.kpi);
  assert.ok(Array.isArray(data.data.roomPerformance));
  assert.ok(Array.isArray(data.data.statusDistribution));
});

test('9. Notifications: Retrieve user notification stream', async () => {
  const res = await fetch(`${baseUrl}/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(data.data.notifications));
});

test('10. Daily Planner: Create and fetch daily work plan', async () => {
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
      todayWork: {
        plannedTasks: ['Test Task A'],
        inProgressTasks: ['Test Task B'],
        completedTasks: ['Test Task C'],
        pendingTasks: [],
        blockers: 'None',
      },
      tomorrowPlan: {
        continueTasks: ['Test Task B'],
        newTasks: ['Test Task D'],
        expectedCompletion: 'Tomorrow 5 PM',
        notes: 'Integration test plan',
      },
    }),
  });
  const saveData = await saveRes.json();
  assert.equal(saveRes.status, 200);
  assert.equal(saveData.data.date, today);

  const getRes = await fetch(`${baseUrl}/daily-plans/me?date=${today}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const getData = await getRes.json();
  assert.equal(getRes.status, 200);
  assert.equal(getData.data.date, today);
});

test('11. Suggestions & Discussions: Post and accept suggestion', async () => {
  const suggRes = await fetch(`${baseUrl}/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      roomId: testRoomId,
      workspaceId: testWorkspaceId,
      organizationId: testOrgId,
      title: 'Automate Audio Level Checks',
      description: 'Implement automated gain control to prevent feedback loops.',
    }),
  });
  const suggData = await suggRes.json();
  assert.equal(suggRes.status, 201);
  assert.equal(suggData.data.status, 'OPEN');

  // Decide suggestion
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

test('12. Comments: Post task comment and retrieve thread', async () => {
  const commentRes = await fetch(`${baseUrl}/comments`, {
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
      roomId: testRoomId,
      content: 'Critical test verification comment for automated QA.',
    }),
  });
  const commentData = await commentRes.json();
  assert.equal(commentRes.status, 201);
  assert.ok(commentData.data._id);

  const listRes = await fetch(`${baseUrl}/comments?targetId=${testTaskId}&targetType=TASK`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const listData = await listRes.json();
  assert.equal(listRes.status, 200);
  assert.ok(listData.data.length > 0);
});
