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

test('18. Workspace Onboarding: Search Workspaces', async () => {
  const res = await fetch(`${baseUrl}/workspaces/search?q=Mahotsav`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length > 0);
  assert.ok(data.data[0].inviteCode);
  assert.equal(data.data[0].isMember, true);
});

test('19. Workspace Onboarding: Invite Link & Join Request Flow', async () => {
  // 1. Register a new prospective user
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sharma',
      email: `priya_${Date.now()}@example.com`,
      password: 'Password123!',
      title: 'Hospitality Executive',
    }),
  });
  const regData = await regRes.json();
  assert.equal(regRes.status, 201);
  assert.ok(regData.data.token);
  assert.ok(regData.data.user.memberId);
  const priyaToken = regData.data.token;
  const priyaMemberId = regData.data.user.memberId;

  // 2. Resolve workspace invite using inviteCode
  const wsRes = await fetch(`${baseUrl}/workspaces/${testWorkspaceId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const wsData = await wsRes.json();
  const inviteCode = wsData.data.inviteCode;
  assert.ok(inviteCode);

  const inviteRes = await fetch(`${baseUrl}/workspaces/invite/${inviteCode}`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  const inviteInfo = await inviteRes.json();
  assert.equal(inviteRes.status, 200);
  assert.equal(inviteInfo.data.isMember, false);
  assert.equal(inviteInfo.data.hasPendingRequest, false);

  // 3. Priya submits join request via invite
  const joinReqRes = await fetch(`${baseUrl}/workspaces/${testWorkspaceId}/join-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${priyaToken}`,
    },
    body: JSON.stringify({
      message: 'Hello, I would like to assist the Hospitality team for Vignan Mahotsav.',
    }),
  });
  const joinReqData = await joinReqRes.json();
  assert.equal(joinReqRes.status, 201);
  assert.equal(joinReqData.data.status, 'PENDING');
  const requestId = joinReqData.data._id;

  // 4. Workspace owner lists pending join requests
  const listReqRes = await fetch(`${baseUrl}/workspaces/${testWorkspaceId}/join-requests?status=PENDING`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const listReqData = await listReqRes.json();
  assert.equal(listReqRes.status, 200);
  const foundReq = listReqData.data.find((r) => r._id === requestId);
  assert.ok(foundReq);
  assert.equal(foundReq.userId.memberId, priyaMemberId);

  // 5. Workspace owner approves join request
  const decideRes = await fetch(
    `${baseUrl}/workspaces/${testWorkspaceId}/join-requests/${requestId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    }
  );
  const decideData = await decideRes.json();
  assert.equal(decideRes.status, 200);
  assert.equal(decideData.data.status, 'APPROVED');

  // 6. Verify Priya is now an active member
  const verifyRes = await fetch(`${baseUrl}/workspaces/invite/${inviteCode}`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  const verifyData = await verifyRes.json();
  assert.equal(verifyRes.status, 200);
  assert.equal(verifyData.data.isMember, true);
});

test('20. Workspace Onboarding: Owner directly adds member by Unique Member ID', async () => {
  // Register another user
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Vikram Singh',
      email: `vikram_${Date.now()}@example.com`,
      password: 'Password123!',
      title: 'Sound & Stage Lead',
    }),
  });
  const regData = await regRes.json();
  assert.equal(regRes.status, 201);
  const vikramMemberId = regData.data.user.memberId;
  assert.ok(vikramMemberId);

  // Directly add Vikram to workspace using his Unique Member ID
  const addRes = await fetch(`${baseUrl}/workspaces/${testWorkspaceId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      identifier: vikramMemberId,
      role: 'WORKSPACE_MEMBER',
    }),
  });
  const addData = await addRes.json();
  assert.equal(addRes.status, 201);
  assert.equal(addData.data.userId.memberId, vikramMemberId);
});
