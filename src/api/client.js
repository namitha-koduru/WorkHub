import {
  getStore,
  saveStore,
  getCurrentSession,
  setCurrentSession,
  SEED_DATA,
} from './mockDataStore';

// Helper to populate user details on entities
function populateUser(store, userId) {
  if (!userId) return null;
  const user = store.users.find((u) => u._id === userId || u.id === userId);
  if (!user) return { _id: userId, name: 'Team Member', email: '', memberId: 'WH-MEM000' };
  const { password, ...safeUser } = user;
  return safeUser;
}

// Router for all API requests
async function mockHandleRequest(method, url, data) {
  // Artificial mini delay (40ms) for realistic UX transitions
  await new Promise((r) => setTimeout(r, 40));

  const store = getStore();
  let session = getCurrentSession();
  const currentUserId = session?.user?._id || 'user-admin';

  // Normalize path and query params
  const [pathname, queryString] = url.split('?');
  const params = new URLSearchParams(queryString || '');
  const cleanPath = pathname.replace(/^\/api\/v1/, '').replace(/^\/+/, '/');

  // 1. AUTHENTICATION
  if (cleanPath === '/auth/login' && method === 'post') {
    const { email, password } = data || {};
    const user = store.users.find(
      (u) => u.email.toLowerCase() === (email || '').toLowerCase().trim()
    );

    // Accept if user exists (for smooth demo experience, allow standard seeded password or any valid user)
    if (!user) {
      const err = new Error('No account found with this email address.');
      err.response = { data: { success: false, message: 'No account found with this email address.' } };
      throw err;
    }

    // Find user's active organization
    let userOrg = store.organizations.find((o) => o.owner === user._id);
    if (!userOrg) {
      const membership = store.organizationMembers.find((om) => om.userId === user._id);
      if (membership) {
        userOrg = store.organizations.find((o) => o._id === membership.organizationId);
      }
    }
    if (!userOrg) {
      userOrg = store.organizations[0];
    }

    const { password: _, ...safeUser } = user;
    const newSession = { user: safeUser, activeOrg: userOrg, token: 'mock-jwt-token-' + user._id };
    setCurrentSession(newSession);

    return {
      success: true,
      message: 'Authentication successful',
      data: newSession,
    };
  }

  if (cleanPath === '/auth/register' && method === 'post') {
    const { name, email, password, title } = data || {};
    if (!name || !email) {
      const err = new Error('Name and email are required.');
      err.response = { data: { success: false, message: 'Name and email are required.' } };
      throw err;
    }

    const existing = store.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.response = { data: { success: false, message: 'An account with this email already exists.' } };
      throw err;
    }

    // Auto-generate Unique Member ID
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const memberId = `WH-${randomSuffix}${Math.floor(10 + Math.random() * 90)}`;
    const newUserId = 'user-' + Date.now();

    const newUser = {
      _id: newUserId,
      id: newUserId,
      name,
      email: email.trim(),
      memberId,
      title: title || 'Operations Specialist',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      password: password || 'Password123!',
      createdAt: new Date().toISOString(),
    };

    // Create user's organization
    const newOrgId = 'org-' + Date.now();
    const newOrg = {
      _id: newOrgId,
      id: newOrgId,
      name: `${name}'s Operations`,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-ops',
      description: 'Centralized workspace and collaborative operations hub.',
      owner: newUserId,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    store.organizations.push(newOrg);
    store.organizationMembers.push({
      _id: 'om-' + Date.now(),
      organizationId: newOrgId,
      userId: newUserId,
      role: 'ORG_OWNER',
    });

    // Also enroll into the primary Vignan Mahotsav 2027 workspace so new users immediately explore real data!
    store.organizationMembers.push({
      _id: 'om-vignan-' + Date.now(),
      organizationId: 'org-vignan',
      userId: newUserId,
      role: 'ORG_MEMBER',
    });
    store.workspaceMembers.push({
      _id: 'wm-mahotsav-' + Date.now(),
      workspaceId: 'ws-mahotsav',
      userId: newUserId,
      role: 'WORKSPACE_MEMBER',
    });

    saveStore(store);

    const { password: _, ...safeUser } = newUser;
    const newSession = { user: safeUser, activeOrg: newOrg, token: 'mock-jwt-token-' + newUserId };
    setCurrentSession(newSession);

    return {
      success: true,
      message: 'Account registered successfully',
      data: newSession,
    };
  }

  if (cleanPath === '/auth/me') {
    if (!session || !session.user) {
      // Default to admin for seamless instant preview if not logged in
      const defaultUser = store.users[0];
      const defaultOrg = store.organizations[0];
      const { password, ...safeUser } = defaultUser;
      session = { user: safeUser, activeOrg: defaultOrg };
      setCurrentSession(session);
    }

    const latestUser = store.users.find((u) => u._id === session.user._id) || session.user;
    const { password, ...safeUser } = latestUser;
    const latestOrg =
      store.organizations.find((o) => o._id === session.activeOrg?._id) ||
      session.activeOrg ||
      store.organizations[0];

    return {
      success: true,
      data: {
        user: safeUser,
        activeOrg: latestOrg,
      },
    };
  }

  if (cleanPath === '/auth/logout') {
    setCurrentSession(null);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  if (cleanPath === '/users/profile' && method === 'put') {
    const userIndex = store.users.findIndex((u) => u._id === currentUserId);
    if (userIndex !== -1) {
      store.users[userIndex] = { ...store.users[userIndex], ...data };
      saveStore(store);
      const { password, ...safeUser } = store.users[userIndex];
      if (session) {
        session.user = safeUser;
        setCurrentSession(session);
      }
      return { success: true, data: safeUser };
    }
    return { success: true, data: session?.user };
  }

  if (cleanPath === '/users/change-password') {
    return { success: true, message: 'Password updated successfully' };
  }

  if (cleanPath === '/users/search') {
    const q = (params.get('query') || '').toLowerCase();
    const matches = store.users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.memberId && u.memberId.toLowerCase().includes(q))
      )
      .map(({ password, ...u }) => u);
    return { success: true, data: matches };
  }

  // 2. WORKSPACES
  if (cleanPath === '/workspaces' && method === 'get') {
    const orgId = params.get('orgId');
    let list = store.workspaces;
    if (orgId) {
      list = list.filter((w) => w.organizationId === orgId);
    }

    // Attach computed stats (total tasks, completed tasks, progress percentage)
    const enriched = list.map((ws) => {
      const wsTasks = store.tasks.filter((t) => t.workspaceId === ws._id);
      const completed = wsTasks.filter((t) => t.status === 'Completed').length;
      const progress = wsTasks.length > 0 ? Math.round((completed / wsTasks.length) * 100) : 0;
      const memberCount = store.workspaceMembers.filter((m) => m.workspaceId === ws._id).length;
      const teamCount = store.teams.filter((t) => t.workspaceId === ws._id).length;
      return {
        ...ws,
        taskCount: wsTasks.length,
        completedTaskCount: completed,
        progress,
        memberCount,
        teamCount,
      };
    });

    return { success: true, data: enriched };
  }

  if (cleanPath === '/workspaces' && method === 'post') {
    const newWsId = 'ws-' + Date.now();
    const inviteCode =
      (data.name || 'WS')
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .substring(0, 8) + Math.floor(10 + Math.random() * 90);

    const newWs = {
      _id: newWsId,
      id: newWsId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      name: data.name,
      slug: (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      inviteCode,
      description: data.description || '',
      category: data.category || 'General Operations',
      status: 'ACTIVE',
      managers: [currentUserId],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    };

    store.workspaces.push(newWs);
    store.workspaceMembers.push({
      _id: 'wm-' + Date.now(),
      workspaceId: newWsId,
      userId: currentUserId,
      role: 'WORKSPACE_MANAGER',
    });
    saveStore(store);

    return { success: true, message: 'Workspace created successfully', data: newWs };
  }

  if (cleanPath === '/workspaces/search') {
    const q = (params.get('q') || '').toLowerCase();
    const results = store.workspaces
      .filter(
        (w) =>
          !q ||
          w.name.toLowerCase().includes(q) ||
          (w.category && w.category.toLowerCase().includes(q)) ||
          (w.inviteCode && w.inviteCode.toLowerCase().includes(q))
      )
      .map((w) => {
        const isMember = store.workspaceMembers.some(
          (m) => m.workspaceId === w._id && m.userId === currentUserId
        );
        const hasPending = store.joinRequests.some(
          (r) => r.workspaceId === w._id && r.userId === currentUserId && r.status === 'PENDING'
        );
        let membershipStatus = 'NONE';
        if (isMember) membershipStatus = 'JOINED';
        else if (hasPending) membershipStatus = 'PENDING';

        const memberCount = store.workspaceMembers.filter((m) => m.workspaceId === w._id).length;
        const managers = (w.managers || []).map((mId) => populateUser(store, mId)).filter(Boolean);

        return {
          ...w,
          membershipStatus,
          memberCount,
          managers,
        };
      });

    return { success: true, data: results };
  }

  // Invite lookup
  const inviteMatch = cleanPath.match(/^\/workspaces\/invite\/([^/]+)$/);
  if (inviteMatch) {
    const codeOrId = inviteMatch[1];
    const ws = store.workspaces.find(
      (w) => w.inviteCode === codeOrId || w._id === codeOrId || w.id === codeOrId
    );
    if (!ws) {
      const err = new Error('Workspace invitation link is invalid or expired.');
      err.response = { data: { success: false, message: 'Workspace invitation not found.' } };
      throw err;
    }

    const memberCount = store.workspaceMembers.filter((m) => m.workspaceId === ws._id).length;
    const isMember = store.workspaceMembers.some(
      (m) => m.workspaceId === ws._id && m.userId === currentUserId
    );
    const hasPending = store.joinRequests.some(
      (r) => r.workspaceId === ws._id && r.userId === currentUserId && r.status === 'PENDING'
    );
    const managers = (ws.managers || []).map((mId) => populateUser(store, mId)).filter(Boolean);

    return {
      success: true,
      data: {
        workspace: {
          ...ws,
          memberCount,
          isMember,
          hasPending,
          managers,
        },
      },
    };
  }

  // Join request submission
  const joinReqPostMatch = cleanPath.match(/^\/workspaces\/([^/]+)\/join-request$/);
  if (joinReqPostMatch && method === 'post') {
    const wsId = joinReqPostMatch[1];
    const newReq = {
      _id: 'req-' + Date.now(),
      id: 'req-' + Date.now(),
      workspaceId: wsId,
      userId: currentUserId,
      note: data?.note || 'Requesting to join operations team.',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    store.joinRequests.push(newReq);
    saveStore(store);
    return { success: true, message: 'Join request sent to workspace managers' };
  }

  // Join requests list
  const joinReqListMatch = cleanPath.match(/^\/workspaces\/([^/]+)\/join-requests$/);
  if (joinReqListMatch && method === 'get') {
    const wsId = joinReqListMatch[1];
    const reqs = store.joinRequests
      .filter((r) => r.workspaceId === wsId && r.status === 'PENDING')
      .map((r) => ({
        ...r,
        user: populateUser(store, r.userId),
      }));
    return { success: true, data: reqs };
  }

  // Join request decision
  const joinReqDecideMatch = cleanPath.match(/^\/workspaces\/([^/]+)\/join-requests\/([^/]+)$/);
  if (joinReqDecideMatch && (method === 'patch' || method === 'put')) {
    const [_, wsId, reqId] = joinReqDecideMatch;
    const req = store.joinRequests.find((r) => r._id === reqId || r.id === reqId);
    if (req) {
      req.status = data?.status || 'APPROVED';
      if (req.status === 'APPROVED') {
        const alreadyMember = store.workspaceMembers.some(
          (m) => m.workspaceId === wsId && m.userId === req.userId
        );
        if (!alreadyMember) {
          store.workspaceMembers.push({
            _id: 'wm-' + Date.now(),
            workspaceId: wsId,
            userId: req.userId,
            role: 'WORKSPACE_MEMBER',
          });
        }
      }
      saveStore(store);
    }
    return { success: true, message: `Request ${data?.status?.toLowerCase() || 'updated'}` };
  }

  // Workspace members
  const wsMembersMatch = cleanPath.match(/^\/workspaces\/([^/]+)\/members$/);
  if (wsMembersMatch) {
    const wsId = wsMembersMatch[1];
    if (method === 'get') {
      const members = store.workspaceMembers
        .filter((m) => m.workspaceId === wsId)
        .map((m) => ({
          ...m,
          user: populateUser(store, m.userId),
        }));
      return { success: true, data: members };
    }
    if (method === 'post') {
      // Add member by Member ID or Email
      const { identifier, role = 'WORKSPACE_MEMBER' } = data || {};
      const targetUser = store.users.find(
        (u) =>
          u.memberId?.toUpperCase() === identifier?.toUpperCase() ||
          u.email?.toLowerCase() === identifier?.toLowerCase() ||
          u._id === identifier
      );

      if (!targetUser) {
        const err = new Error(`User with Member ID or Email "${identifier}" not found.`);
        err.response = { data: { success: false, message: err.message } };
        throw err;
      }

      const existing = store.workspaceMembers.find(
        (m) => m.workspaceId === wsId && m.userId === targetUser._id
      );
      if (existing) {
        return { success: true, message: 'User is already a member', data: existing };
      }

      const newMember = {
        _id: 'wm-' + Date.now(),
        workspaceId: wsId,
        userId: targetUser._id,
        role,
      };
      store.workspaceMembers.push(newMember);
      saveStore(store);

      return {
        success: true,
        message: 'Member added successfully',
        data: { ...newMember, user: populateUser(store, targetUser._id) },
      };
    }
  }

  // Workspace detail
  const wsDetailMatch = cleanPath.match(/^\/workspaces\/([^/]+)$/);
  if (wsDetailMatch) {
    const wsId = wsDetailMatch[1];
    const ws = store.workspaces.find((w) => w._id === wsId || w.id === wsId);
    if (!ws) {
      return { success: true, data: store.workspaces[0] };
    }

    if (method === 'put') {
      Object.assign(ws, data);
      saveStore(store);
      return { success: true, data: ws };
    }

    const wsTasks = store.tasks.filter((t) => t.workspaceId === ws._id);
    const completed = wsTasks.filter((t) => t.status === 'Completed').length;
    const progress = wsTasks.length > 0 ? Math.round((completed / wsTasks.length) * 100) : 0;
    const teams = store.teams.filter((t) => t.workspaceId === ws._id);

    return {
      success: true,
      data: {
        ...ws,
        teams,
        taskCount: wsTasks.length,
        completedTaskCount: completed,
        progress,
      },
    };
  }

  // Workspace Calendar
  const wsCalMatch = cleanPath.match(/^\/workspaces\/([^/]+)\/calendar$/);
  if (wsCalMatch) {
    const wsId = wsCalMatch[1];
    const scheds = store.schedules.filter((s) => s.workspaceId === wsId);
    const tasks = store.tasks
      .filter((t) => t.workspaceId === wsId && t.dueDate)
      .map((t) => ({
        _id: 'cal-task-' + t._id,
        title: `Task Deadline: ${t.title}`,
        startTime: t.dueDate,
        endTime: t.dueDate,
        type: 'TASK_DEADLINE',
        isAllDay: true,
        task: t,
      }));
    return { success: true, data: [...scheds, ...tasks] };
  }

  // 3. TEAMS / DEPARTMENTS
  if (cleanPath === '/teams' && method === 'get') {
    const wsId = params.get('workspaceId');
    let list = store.teams;
    if (wsId) {
      list = list.filter((t) => t.workspaceId === wsId);
    }
    const enriched = list.map((team) => {
      const leader = populateUser(store, team.leader);
      const memberCount = store.teamMembers.filter((tm) => tm.teamId === team._id).length;
      const roomCount = store.rooms.filter((r) => r.teamId === team._id).length;
      const teamTasks = store.tasks.filter((t) => t.teamId === team._id);
      const completed = teamTasks.filter((t) => t.status === 'Completed').length;
      const progress = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0;
      return {
        ...team,
        leader,
        memberCount,
        roomCount,
        taskCount: teamTasks.length,
        progress,
      };
    });
    return { success: true, data: enriched };
  }

  if (cleanPath === '/teams' && method === 'post') {
    const newTeamId = 'team-' + Date.now();
    const newTeam = {
      _id: newTeamId,
      id: newTeamId,
      workspaceId: data.workspaceId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      name: data.name,
      slug: (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: data.description || '',
      responsibilities: Array.isArray(data.responsibilities)
        ? data.responsibilities
        : (data.responsibilities || '').split('\n').filter(Boolean),
      leader: data.leader || currentUserId,
      createdAt: new Date().toISOString(),
    };
    store.teams.push(newTeam);
    store.teamMembers.push({
      _id: 'tm-' + Date.now(),
      teamId: newTeamId,
      workspaceId: data.workspaceId,
      userId: data.leader || currentUserId,
      role: 'TEAM_LEADER',
    });
    saveStore(store);
    return { success: true, message: 'Team created successfully', data: newTeam };
  }

  const teamDetailMatch = cleanPath.match(/^\/teams\/([^/]+)$/);
  if (teamDetailMatch) {
    const teamId = teamDetailMatch[1];
    const team = store.teams.find((t) => t._id === teamId || t.id === teamId);
    if (!team) return { success: true, data: store.teams[0] };
    if (method === 'put') {
      Object.assign(team, data);
      saveStore(store);
      return { success: true, data: team };
    }
    return {
      success: true,
      data: {
        ...team,
        leader: populateUser(store, team.leader),
      },
    };
  }

  const teamMembersMatch = cleanPath.match(/^\/teams\/([^/]+)\/members$/);
  if (teamMembersMatch) {
    const teamId = teamMembersMatch[1];
    if (method === 'get') {
      const members = store.teamMembers
        .filter((tm) => tm.teamId === teamId)
        .map((tm) => ({
          ...tm,
          user: populateUser(store, tm.userId),
        }));
      return { success: true, data: members };
    }
    if (method === 'post') {
      const newMember = {
        _id: 'tm-' + Date.now(),
        teamId,
        workspaceId: data.workspaceId,
        userId: data.userId,
        role: data.role || 'TEAM_MEMBER',
      };
      store.teamMembers.push(newMember);
      saveStore(store);
      return { success: true, data: { ...newMember, user: populateUser(store, data.userId) } };
    }
  }

  const teamCalMatch = cleanPath.match(/^\/teams\/([^/]+)\/calendar$/);
  if (teamCalMatch) {
    const teamId = teamCalMatch[1];
    const scheds = store.schedules.filter((s) => s.teamId === teamId);
    const tasks = store.tasks
      .filter((t) => t.teamId === teamId && t.dueDate)
      .map((t) => ({
        _id: 'cal-task-' + t._id,
        title: `Task Deadline: ${t.title}`,
        startTime: t.dueDate,
        endTime: t.dueDate,
        type: 'TASK_DEADLINE',
        isAllDay: true,
        task: t,
      }));
    return { success: true, data: [...scheds, ...tasks] };
  }

  // 4. ROOMS / CHANNELS
  if (cleanPath === '/rooms' && method === 'get') {
    const wsId = params.get('workspaceId');
    const teamId = params.get('teamId');
    let list = store.rooms;
    if (wsId) list = list.filter((r) => r.workspaceId === wsId);
    if (teamId) list = list.filter((r) => r.teamId === teamId);

    const enriched = list.map((room) => {
      const leader = populateUser(store, room.leader);
      const team = store.teams.find((t) => t._id === room.teamId);
      const memberCount = store.roomMembers.filter((rm) => rm.roomId === room._id).length;
      const roomTasks = store.tasks.filter((t) => t.roomId === room._id);
      const completed = roomTasks.filter((t) => t.status === 'Completed').length;
      const progress = roomTasks.length > 0 ? Math.round((completed / roomTasks.length) * 100) : 0;
      return {
        ...room,
        leader,
        team,
        memberCount,
        taskCount: roomTasks.length,
        progress,
      };
    });
    return { success: true, data: enriched };
  }

  if (cleanPath === '/rooms' && method === 'post') {
    const newRoomId = 'room-' + Date.now();
    const newRoom = {
      _id: newRoomId,
      id: newRoomId,
      teamId: data.teamId,
      workspaceId: data.workspaceId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      name: data.name,
      slug: (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: data.description || '',
      leader: data.leader || currentUserId,
      createdAt: new Date().toISOString(),
    };
    store.rooms.push(newRoom);
    store.roomMembers.push({
      _id: 'rm-' + Date.now(),
      roomId: newRoomId,
      teamId: data.teamId,
      workspaceId: data.workspaceId,
      userId: data.leader || currentUserId,
      role: 'ROOM_LEADER',
    });
    saveStore(store);
    return { success: true, message: 'Room created successfully', data: newRoom };
  }

  const roomDetailMatch = cleanPath.match(/^\/rooms\/([^/]+)$/);
  if (roomDetailMatch) {
    const roomId = roomDetailMatch[1];
    const room = store.rooms.find((r) => r._id === roomId || r.id === roomId);
    if (!room) return { success: true, data: store.rooms[0] };
    if (method === 'put') {
      Object.assign(room, data);
      saveStore(store);
      return { success: true, data: room };
    }
    const team = store.teams.find((t) => t._id === room.teamId);
    return {
      success: true,
      data: {
        ...room,
        leader: populateUser(store, room.leader),
        team,
      },
    };
  }

  const roomMembersMatch = cleanPath.match(/^\/rooms\/([^/]+)\/members$/);
  if (roomMembersMatch) {
    const roomId = roomMembersMatch[1];
    if (method === 'get') {
      const members = store.roomMembers
        .filter((rm) => rm.roomId === roomId)
        .map((rm) => ({
          ...rm,
          user: populateUser(store, rm.userId),
        }));
      return { success: true, data: members };
    }
    if (method === 'post') {
      const newMember = {
        _id: 'rm-' + Date.now(),
        roomId,
        teamId: data.teamId,
        workspaceId: data.workspaceId,
        userId: data.userId,
        role: data.role || 'ROOM_MEMBER',
      };
      store.roomMembers.push(newMember);
      saveStore(store);
      return { success: true, data: { ...newMember, user: populateUser(store, data.userId) } };
    }
  }

  const roomCalMatch = cleanPath.match(/^\/rooms\/([^/]+)\/calendar$/);
  if (roomCalMatch) {
    const roomId = roomCalMatch[1];
    const scheds = store.schedules.filter((s) => s.roomId === roomId);
    const tasks = store.tasks
      .filter((t) => t.roomId === roomId && t.dueDate)
      .map((t) => ({
        _id: 'cal-task-' + t._id,
        title: `Task Deadline: ${t.title}`,
        startTime: t.dueDate,
        endTime: t.dueDate,
        type: 'TASK_DEADLINE',
        isAllDay: true,
        task: t,
      }));
    return { success: true, data: [...scheds, ...tasks] };
  }

  // 5. TASKS & CHECKPOINTS
  if (cleanPath === '/tasks/my-tasks') {
    const myTasks = store.tasks
      .filter(
        (t) =>
          t.assignedTo === currentUserId ||
          (t.collaborators && t.collaborators.includes(currentUserId))
      )
      .map((t) => ({
        ...t,
        assignedTo: populateUser(store, t.assignedTo),
        collaborators: (t.collaborators || []).map((cId) => populateUser(store, cId)),
        checkpoints: store.checkpoints.filter((cp) => cp.taskId === t._id),
        workspace: store.workspaces.find((w) => w._id === t.workspaceId),
        team: store.teams.find((tm) => tm._id === t.teamId),
        room: store.rooms.find((r) => r._id === t.roomId),
      }));
    return { success: true, data: myTasks };
  }

  if (cleanPath === '/tasks' && method === 'get') {
    const roomId = params.get('roomId');
    const wsId = params.get('workspaceId');
    const teamId = params.get('teamId');

    let list = store.tasks;
    if (roomId) list = list.filter((t) => t.roomId === roomId);
    if (teamId) list = list.filter((t) => t.teamId === teamId);
    if (wsId) list = list.filter((t) => t.workspaceId === wsId);

    const enriched = list.map((t) => ({
      ...t,
      assignedTo: populateUser(store, t.assignedTo),
      collaborators: (t.collaborators || []).map((cId) => populateUser(store, cId)),
      checkpoints: store.checkpoints.filter((cp) => cp.taskId === t._id),
      workspace: store.workspaces.find((w) => w._id === t.workspaceId),
      team: store.teams.find((tm) => tm._id === t.teamId),
      room: store.rooms.find((r) => r._id === t.roomId),
    }));

    return { success: true, data: enriched };
  }

  if (cleanPath === '/tasks' && method === 'post') {
    const newTaskId = 'task-' + Date.now();
    const newTask = {
      _id: newTaskId,
      id: newTaskId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      workspaceId: data.workspaceId,
      teamId: data.teamId,
      roomId: data.roomId,
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'Medium',
      status: data.status || 'To Do',
      assignedTo: data.assignedTo || currentUserId,
      collaborators: data.collaborators || [],
      startDate: data.startDate || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      tags: data.tags || [],
      order: store.tasks.length,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    };

    store.tasks.push(newTask);
    saveStore(store);

    return {
      success: true,
      message: 'Task created successfully',
      data: {
        ...newTask,
        assignedTo: populateUser(store, newTask.assignedTo),
        checkpoints: [],
      },
    };
  }

  const taskStatusMatch = cleanPath.match(/^\/tasks\/([^/]+)\/status$/);
  if (taskStatusMatch && method === 'patch') {
    const taskId = taskStatusMatch[1];
    const task = store.tasks.find((t) => t._id === taskId || t.id === taskId);
    if (task) {
      task.status = data.status;
      saveStore(store);
      return { success: true, message: 'Status updated', data: task };
    }
  }

  const taskDetailMatch = cleanPath.match(/^\/tasks\/([^/]+)$/);
  if (taskDetailMatch) {
    const taskId = taskDetailMatch[1];
    const taskIndex = store.tasks.findIndex((t) => t._id === taskId || t.id === taskId);
    if (taskIndex !== -1) {
      if (method === 'put') {
        store.tasks[taskIndex] = { ...store.tasks[taskIndex], ...data };
        saveStore(store);
        return { success: true, data: store.tasks[taskIndex] };
      }
      if (method === 'delete') {
        store.tasks.splice(taskIndex, 1);
        saveStore(store);
        return { success: true, message: 'Task deleted' };
      }
      const t = store.tasks[taskIndex];
      return {
        success: true,
        data: {
          ...t,
          assignedTo: populateUser(store, t.assignedTo),
          collaborators: (t.collaborators || []).map((cId) => populateUser(store, cId)),
          checkpoints: store.checkpoints.filter((cp) => cp.taskId === t._id),
        },
      };
    }
  }

  // Checkpoints
  if (cleanPath === '/checkpoints' && method === 'post') {
    const newCpId = 'cp-' + Date.now();
    const newCp = {
      _id: newCpId,
      id: newCpId,
      taskId: data.taskId,
      roomId: data.roomId,
      title: data.title,
      status: 'PENDING',
      responsibleMember: data.responsibleMember || currentUserId,
      targetDate: data.targetDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.checkpoints.push(newCp);
    saveStore(store);
    return { success: true, data: newCp };
  }

  const cpDetailMatch = cleanPath.match(/^\/checkpoints\/([^/]+)$/);
  if (cpDetailMatch) {
    const cpId = cpDetailMatch[1];
    const cpIndex = store.checkpoints.findIndex((c) => c._id === cpId || c.id === cpId);
    if (cpIndex !== -1) {
      if (method === 'patch' || method === 'put') {
        store.checkpoints[cpIndex] = { ...store.checkpoints[cpIndex], ...data };
        saveStore(store);
        return { success: true, data: store.checkpoints[cpIndex] };
      }
      if (method === 'delete') {
        store.checkpoints.splice(cpIndex, 1);
        saveStore(store);
        return { success: true, message: 'Checkpoint deleted' };
      }
    }
  }

  // 6. SCHEDULES & CALENDAR
  if (cleanPath === '/schedules' && method === 'post') {
    const newSchId = 'sch-' + Date.now();
    const newSch = {
      _id: newSchId,
      id: newSchId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      workspaceId: data.workspaceId,
      teamId: data.teamId || null,
      roomId: data.roomId || null,
      title: data.title,
      description: data.description || '',
      type: data.type || 'MEETING',
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date(Date.now() + 3600000).toISOString(),
      location: data.location || '',
      isAllDay: !!data.isAllDay,
      participants: data.participants || [currentUserId],
      createdBy: currentUserId,
    };
    store.schedules.push(newSch);
    saveStore(store);
    return { success: true, message: 'Schedule created', data: newSch };
  }

  if (cleanPath === '/schedules/personal') {
    const myScheds = store.schedules.filter(
      (s) =>
        s.createdBy === currentUserId ||
        (s.participants && s.participants.includes(currentUserId))
    );
    const myTasks = store.tasks
      .filter((t) => t.assignedTo === currentUserId && t.dueDate)
      .map((t) => ({
        _id: 'cal-task-' + t._id,
        title: `Task Deadline: ${t.title}`,
        startTime: t.dueDate,
        endTime: t.dueDate,
        type: 'TASK_DEADLINE',
        isAllDay: true,
        task: t,
      }));
    return { success: true, data: [...myScheds, ...myTasks] };
  }

  const schDetailMatch = cleanPath.match(/^\/schedules\/([^/]+)$/);
  if (schDetailMatch) {
    const schId = schDetailMatch[1];
    const schIndex = store.schedules.findIndex((s) => s._id === schId || s.id === schId);
    if (schIndex !== -1) {
      if (method === 'put') {
        store.schedules[schIndex] = { ...store.schedules[schIndex], ...data };
        saveStore(store);
        return { success: true, data: store.schedules[schIndex] };
      }
      if (method === 'delete') {
        store.schedules.splice(schIndex, 1);
        saveStore(store);
        return { success: true, message: 'Schedule deleted' };
      }
    }
  }

  // 7. DAILY PLANS & STANDUPS
  if (cleanPath === '/daily-plans' && method === 'post') {
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const existingIndex = store.dailyPlans.findIndex(
      (dp) => dp.userId === currentUserId && dp.date === dateStr
    );
    const planObj = {
      _id: existingIndex !== -1 ? store.dailyPlans[existingIndex]._id : 'dp-' + Date.now(),
      id: existingIndex !== -1 ? store.dailyPlans[existingIndex]._id : 'dp-' + Date.now(),
      userId: currentUserId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      workspaceId: data.workspaceId || 'ws-mahotsav',
      teamId: data.teamId || null,
      roomId: data.roomId || null,
      date: dateStr,
      todayWork: data.todayWork || {},
      tomorrowPlan: data.tomorrowPlan || {},
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      store.dailyPlans[existingIndex] = planObj;
    } else {
      store.dailyPlans.push(planObj);
    }
    saveStore(store);
    return { success: true, message: 'Daily plan saved', data: planObj };
  }

  if (cleanPath === '/daily-plans/me') {
    const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
    const plan = store.dailyPlans.find(
      (dp) => dp.userId === currentUserId && dp.date === dateStr
    );
    return { success: true, data: plan || null };
  }

  if (cleanPath === '/daily-plans/history') {
    const plans = store.dailyPlans
      .filter((dp) => dp.userId === currentUserId)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
    return { success: true, data: plans };
  }

  const dpSummaryMatch = cleanPath.match(/^\/daily-plans\/workspace\/([^/]+)\/summary$/);
  if (dpSummaryMatch) {
    const wsId = dpSummaryMatch[1];
    const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
    const wsPlans = store.dailyPlans.filter(
      (dp) => dp.workspaceId === wsId && (!dateStr || dp.date === dateStr)
    );

    const enriched = wsPlans.map((dp) => {
      const user = populateUser(store, dp.userId);
      const team = store.teams.find((t) => t._id === dp.teamId);
      const room = store.rooms.find((r) => r._id === dp.roomId);
      return {
        ...dp,
        user,
        team,
        room,
      };
    });

    const blockers = enriched
      .filter((dp) => dp.todayWork?.blockers && dp.todayWork.blockers.trim().length > 0)
      .map((dp) => ({
        user: dp.user,
        teamName: dp.team?.name || 'General',
        blocker: dp.todayWork.blockers,
        date: dp.date,
      }));

    return {
      success: true,
      data: {
        plans: enriched,
        blockers,
        totalSubmitted: enriched.length,
      },
    };
  }

  const dpTeamMatch = cleanPath.match(/^\/daily-plans\/team\/([^/]+)$/);
  if (dpTeamMatch) {
    const teamId = dpTeamMatch[1];
    const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
    const plans = store.dailyPlans
      .filter((dp) => dp.teamId === teamId && (!dateStr || dp.date === dateStr))
      .map((dp) => ({
        ...dp,
        user: populateUser(store, dp.userId),
      }));
    return { success: true, data: plans };
  }

  const dpRoomMatch = cleanPath.match(/^\/daily-plans\/room\/([^/]+)$/);
  if (dpRoomMatch) {
    const roomId = dpRoomMatch[1];
    const dateStr = params.get('date') || new Date().toISOString().split('T')[0];
    const plans = store.dailyPlans
      .filter((dp) => dp.roomId === roomId && (!dateStr || dp.date === dateStr))
      .map((dp) => ({
        ...dp,
        user: populateUser(store, dp.userId),
      }));
    return { success: true, data: plans };
  }

  // 8. ANNOUNCEMENTS
  if (cleanPath === '/announcements' && method === 'get') {
    const wsId = params.get('workspaceId');
    const teamId = params.get('teamId');
    const scope = params.get('scope');

    let list = store.announcements;
    if (wsId) list = list.filter((a) => a.workspaceId === wsId);
    if (teamId) list = list.filter((a) => a.teamId === teamId);
    if (scope) list = list.filter((a) => a.scope === scope);

    const enriched = list
      .map((a) => ({
        ...a,
        author: populateUser(store, a.author),
      }))
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    return { success: true, data: enriched };
  }

  if (cleanPath === '/announcements' && method === 'post') {
    const newAnnId = 'ann-' + Date.now();
    const newAnn = {
      _id: newAnnId,
      id: newAnnId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      workspaceId: data.workspaceId,
      teamId: data.teamId || null,
      scope: data.scope || (data.teamId ? 'TEAM' : 'WORKSPACE'),
      author: currentUserId,
      title: data.title,
      content: data.content,
      isPinned: !!data.isPinned,
      priority: data.priority || 'NORMAL',
      createdAt: new Date().toISOString(),
    };
    store.announcements.push(newAnn);
    saveStore(store);
    return {
      success: true,
      message: 'Announcement published',
      data: { ...newAnn, author: populateUser(store, currentUserId) },
    };
  }

  const annDetailMatch = cleanPath.match(/^\/announcements\/([^/]+)$/);
  if (annDetailMatch && method === 'delete') {
    const annId = annDetailMatch[1];
    const idx = store.announcements.findIndex((a) => a._id === annId || a.id === annId);
    if (idx !== -1) {
      store.announcements.splice(idx, 1);
      saveStore(store);
    }
    return { success: true, message: 'Announcement deleted' };
  }

  // 9. COMMENTS & DISCUSSIONS
  if (cleanPath === '/comments' && method === 'get') {
    const targetId = params.get('targetId');
    const targetType = params.get('targetType');

    let list = store.comments;
    if (targetId) list = list.filter((c) => c.targetId === targetId);
    if (targetType) list = list.filter((c) => c.targetType === targetType);

    const enriched = list.map((c) => ({
      ...c,
      author: populateUser(store, c.author),
    }));

    return { success: true, data: enriched };
  }

  if (cleanPath === '/comments' && method === 'post') {
    const newCommId = 'comm-' + Date.now();
    const newComm = {
      _id: newCommId,
      id: newCommId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      workspaceId: data.workspaceId,
      teamId: data.teamId || null,
      roomId: data.roomId || null,
      targetType: data.targetType || 'TASK',
      targetId: data.targetId,
      author: currentUserId,
      content: data.content,
      mentions: data.mentions || [],
      createdAt: new Date().toISOString(),
    };
    store.comments.push(newComm);
    saveStore(store);
    return {
      success: true,
      data: { ...newComm, author: populateUser(store, currentUserId) },
    };
  }

  // 10. SUGGESTIONS
  if (cleanPath === '/suggestions' && method === 'get') {
    const roomId = params.get('roomId');
    const teamId = params.get('teamId');
    const wsId = params.get('workspaceId');
    const status = params.get('status');

    let list = store.suggestions;
    if (roomId) list = list.filter((s) => s.roomId === roomId);
    if (teamId) list = list.filter((s) => s.teamId === teamId);
    if (wsId) list = list.filter((s) => s.workspaceId === wsId);
    if (status) list = list.filter((s) => s.status === status);

    const enriched = list.map((s) => ({
      ...s,
      author: populateUser(store, s.author),
      reviewedBy: populateUser(store, s.reviewedBy),
    }));
    return { success: true, data: enriched };
  }

  if (cleanPath === '/suggestions' && method === 'post') {
    const newSugId = 'sug-' + Date.now();
    const newSug = {
      _id: newSugId,
      id: newSugId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      workspaceId: data.workspaceId,
      teamId: data.teamId || null,
      roomId: data.roomId || null,
      author: currentUserId,
      title: data.title,
      description: data.description,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    store.suggestions.push(newSug);
    saveStore(store);
    return { success: true, message: 'Suggestion posted', data: newSug };
  }

  const sugStatusMatch = cleanPath.match(/^\/suggestions\/([^/]+)\/status$/);
  if (sugStatusMatch && (method === 'patch' || method === 'put')) {
    const sugId = sugStatusMatch[1];
    const sug = store.suggestions.find((s) => s._id === sugId || s.id === sugId);
    if (sug) {
      sug.status = data.status || 'ACCEPTED';
      sug.reviewedBy = currentUserId;
      sug.reviewedAt = new Date().toISOString();
      sug.resolutionNotes = data.resolutionNotes || 'Reviewed by leader.';
      saveStore(store);
      return { success: true, message: 'Suggestion resolved', data: sug };
    }
  }

  // 11. APPROVALS
  if (cleanPath === '/approvals/submit' && method === 'post') {
    const task = store.tasks.find((t) => t._id === data.taskId || t.id === data.taskId);
    if (task) {
      task.status = 'Under Review';
    }
    const newApprId = 'appr-' + Date.now();
    const newAppr = {
      _id: newApprId,
      id: newApprId,
      taskId: data.taskId,
      organizationId: session?.activeOrg?._id || 'org-vignan',
      workspaceId: data.workspaceId || task?.workspaceId,
      roomId: data.roomId || task?.roomId,
      requester: currentUserId,
      reviewer: data.reviewer || 'user-manager',
      status: 'PENDING',
      comments: data.comments || 'Task completed and submitted for review.',
      history: [
        {
          status: 'PENDING',
          actor: currentUserId,
          comment: data.comments || 'Submitted for approval.',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };
    store.approvals.push(newAppr);
    saveStore(store);
    return { success: true, message: 'Task submitted for review', data: newAppr };
  }

  const apprDecideMatch = cleanPath.match(/^\/approvals\/([^/]+)\/decide$/);
  if (apprDecideMatch && method === 'post') {
    const apprId = apprDecideMatch[1];
    const appr = store.approvals.find((a) => a._id === apprId || a.id === apprId);
    if (appr) {
      const decision = data.decision; // 'APPROVED' or 'CHANGES_REQUESTED'
      appr.status = decision;
      const task = store.tasks.find((t) => t._id === appr.taskId);
      if (task) {
        task.status = decision === 'APPROVED' ? 'Completed' : 'Changes Requested';
      }
      appr.history = appr.history || [];
      appr.history.push({
        status: decision,
        actor: currentUserId,
        comment: data.comments || '',
        timestamp: new Date().toISOString(),
      });
      saveStore(store);
      return { success: true, message: `Review decision: ${decision}`, data: appr };
    }
  }

  const apprTaskMatch = cleanPath.match(/^\/approvals\/task\/([^/]+)$/);
  if (apprTaskMatch) {
    const taskId = apprTaskMatch[1];
    const appr = store.approvals.find((a) => a.taskId === taskId);
    return { success: true, data: appr || null };
  }

  // 12. NOTIFICATIONS
  if (cleanPath === '/notifications' && method === 'get') {
    const notifs = store.notifications
      .filter((n) => n.recipient === currentUserId || !n.recipient)
      .map((n) => ({
        ...n,
        sender: populateUser(store, n.sender),
      }));
    return { success: true, data: notifs };
  }

  if (cleanPath.startsWith('/notifications/') && cleanPath.endsWith('/read')) {
    const nId = cleanPath.split('/')[2];
    const n = store.notifications.find((notif) => notif._id === nId || notif.id === nId);
    if (n) {
      n.isRead = true;
      saveStore(store);
    }
    return { success: true, message: 'Notification marked read' };
  }

  if (cleanPath === '/notifications/read-all') {
    store.notifications.forEach((n) => {
      if (n.recipient === currentUserId) n.isRead = true;
    });
    saveStore(store);
    return { success: true, message: 'All notifications marked read' };
  }

  // 13. ACTIVITIES
  if (cleanPath === '/activities') {
    const wsId = params.get('workspaceId');
    const roomId = params.get('roomId');
    let list = store.activities;
    if (wsId) list = list.filter((a) => a.workspaceId === wsId);
    if (roomId) list = list.filter((a) => a.roomId === roomId);
    const enriched = list.map((a) => ({
      ...a,
      actor: populateUser(store, a.actor),
    }));
    return { success: true, data: enriched };
  }

  // 14. REPORTS & ANALYTICS
  if (cleanPath.startsWith('/reports/workspace/')) {
    const wsId = cleanPath.split('/')[3];
    const wsTasks = store.tasks.filter((t) => t.workspaceId === wsId);
    const teams = store.teams.filter((t) => t.workspaceId === wsId);

    const statusCounts = {
      'To Do': 0,
      'In Progress': 0,
      'Under Review': 0,
      'Changes Requested': 0,
      'Completed': 0,
    };
    wsTasks.forEach((t) => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
      else statusCounts['In Progress']++;
    });

    const teamVelocity = teams.map((tm) => {
      const tmTasks = wsTasks.filter((t) => t.teamId === tm._id);
      const done = tmTasks.filter((t) => t.status === 'Completed').length;
      return {
        team: tm.name,
        completed: done,
        total: tmTasks.length,
        velocity: tmTasks.length > 0 ? Math.round((done / tmTasks.length) * 100) : 0,
      };
    });

    return {
      success: true,
      data: {
        totalTasks: wsTasks.length,
        completedTasks: statusCounts['Completed'],
        inProgressTasks: statusCounts['In Progress'],
        underReviewTasks: statusCounts['Under Review'],
        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        teamVelocity,
        burndownData: [
          { day: 'Day 1', remaining: 25, ideal: 25 },
          { day: 'Day 3', remaining: 22, ideal: 20 },
          { day: 'Day 5', remaining: 17, ideal: 15 },
          { day: 'Day 7', remaining: 12, ideal: 10 },
          { day: 'Day 10', remaining: 6, ideal: 5 },
          { day: 'Day 14 (Target)', remaining: 1, ideal: 0 },
        ],
      },
    };
  }

  if (cleanPath === '/reports/personal') {
    const myTasks = store.tasks.filter(
      (t) =>
        t.assignedTo === currentUserId ||
        (t.collaborators && t.collaborators.includes(currentUserId))
    );
    const completed = myTasks.filter((t) => t.status === 'Completed').length;
    const inProgress = myTasks.filter((t) => t.status === 'In Progress').length;
    const pending = myTasks.filter((t) => t.status === 'To Do').length;

    return {
      success: true,
      data: {
        totalTasks: myTasks.length,
        completed,
        inProgress,
        pending,
        velocity: myTasks.length > 0 ? Math.round((completed / myTasks.length) * 100) : 100,
      },
    };
  }

  // 15. ORGANIZATIONS
  if (cleanPath === '/organizations' && method === 'get') {
    return { success: true, data: store.organizations };
  }

  const orgDetailMatch = cleanPath.match(/^\/organizations\/([^/]+)$/);
  if (orgDetailMatch) {
    const orgId = orgDetailMatch[1];
    const org = store.organizations.find((o) => o._id === orgId || o.id === orgId) || store.organizations[0];
    if (method === 'put') {
      Object.assign(org, data);
      saveStore(store);
      return { success: true, data: org };
    }
    return { success: true, data: org };
  }

  const orgMembersMatch = cleanPath.match(/^\/organizations\/([^/]+)\/members$/);
  if (orgMembersMatch) {
    const orgId = orgMembersMatch[1];
    const members = store.organizationMembers
      .filter((om) => om.organizationId === orgId)
      .map((om) => ({
        ...om,
        user: populateUser(store, om.userId),
      }));
    return { success: true, data: members };
  }

  // Default fallback
  return { success: true, data: null };
}

// Emulated axios client matching the existing interface exactly
const api = {
  get: (url, config) => mockHandleRequest('get', url, null),
  post: (url, data, config) => mockHandleRequest('post', url, data),
  put: (url, data, config) => mockHandleRequest('put', url, data),
  patch: (url, data, config) => mockHandleRequest('patch', url, data),
  delete: (url, config) => mockHandleRequest('delete', url, null),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};

export default api;
