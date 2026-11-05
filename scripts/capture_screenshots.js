import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('[Setup] Querying backend for seed entity IDs...');
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@workhub.com', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  let wsId, teamId, roomId, inviteCode;
  if (token) {
    const meRes = await fetch('http://localhost:5000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    const orgId = meData.data?.organizations?.[0]?._id;

    if (orgId) {
      const wsRes = await fetch(`http://localhost:5000/api/v1/workspaces?orgId=${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const wsData = await wsRes.json();
      const ws = wsData.data?.find((w) => w.name.includes('Mahotsav')) || wsData.data?.[0];
      wsId = ws?._id;
      inviteCode = ws?.inviteCode || 'MAHOTSAV27';

      if (wsId) {
        const teamsRes = await fetch(`http://localhost:5000/api/v1/teams?workspaceId=${wsId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const teamsData = await teamsRes.json();
        teamId = teamsData.data?.[0]?._id;

        const roomsRes = await fetch(`http://localhost:5000/api/v1/rooms?workspaceId=${wsId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const roomsData = await roomsRes.json();
        roomId = roomsData.data?.[0]?._id;
      }
    }
  }

  console.log('[Setup] Entity IDs:', { wsId, teamId, roomId, inviteCode });

  console.log('[Screenshots] Launching headless browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  async function snap(filename, delay = 1500) {
    await new Promise((r) => setTimeout(r, delay));
    const target = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: target, fullPage: false });
    console.log(`[Snap] Captured: ${filename}`);
  }

  try {
    // 1. Login Page
    console.log('[Nav] Opening /login');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await snap('01_login_page.png');

    // 2. Register Page
    console.log('[Nav] Opening /register');
    await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded' });
    await snap('02_register_page.png');

    // 3. Perform Login
    console.log('[Auth] Logging in as admin@workhub.com...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@workhub.com');
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await new Promise((r) => setTimeout(r, 2500));
    console.log('[Auth] Logged in. Current URL:', page.url());
    await snap('03_personal_dashboard.png', 2000);

    // 4. My Tasks Page
    console.log('[Nav] Opening /app/my-tasks');
    await page.goto('http://localhost:5173/app/my-tasks', { waitUntil: 'domcontentloaded' });
    await snap('04_my_tasks.png', 1500);

    // 5. Workspaces Directory (My Workspaces)
    console.log('[Nav] Opening /app/workspaces');
    await page.goto('http://localhost:5173/app/workspaces', { waitUntil: 'domcontentloaded' });
    await snap('05_workspaces_directory.png', 1500);

    // 6. Explore & Search All Workspaces Tab
    console.log('[Nav] Clicking Explore & Search All Workspaces tab');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.includes('Explore & Search All Workspaces'));
      if (btn) btn.click();
    });
    await snap('06_explore_workspaces.png', 1500);

    // 7. Workspace Invite Landing Page
    console.log(`[Nav] Opening /join-workspace/${inviteCode}`);
    await page.goto(`http://localhost:5173/join-workspace/${inviteCode}`, {
      waitUntil: 'domcontentloaded',
    });
    await snap('07_invite_landing_page.png', 1500);

    if (wsId) {
      // 8. Workspace Overview
      console.log(`[Nav] Opening /app/workspaces/${wsId}/overview`);
      await page.goto(`http://localhost:5173/app/workspaces/${wsId}/overview`, {
        waitUntil: 'domcontentloaded',
      });
      await snap('08_workspace_overview.png', 1800);

      // 9. Workspace Staff Allocation & Join Link Management
      console.log(`[Nav] Opening /app/workspaces/${wsId}/members`);
      await page.goto(`http://localhost:5173/app/workspaces/${wsId}/members`, {
        waitUntil: 'domcontentloaded',
      });
      await snap('09_workspace_members_and_invite.png', 1500);

      // 10. Teams & Departments List
      console.log(`[Nav] Opening /app/workspaces/${wsId}/teams`);
      await page.goto(`http://localhost:5173/app/workspaces/${wsId}/teams`, {
        waitUntil: 'domcontentloaded',
      });
      await snap('10_workspace_teams_departments.png', 1500);

      // 11. Workspace Announcements Board
      console.log(`[Nav] Opening /app/workspaces/${wsId}/announcements`);
      await page.goto(`http://localhost:5173/app/workspaces/${wsId}/announcements`, {
        waitUntil: 'domcontentloaded',
      });
      await snap('11_workspace_announcements.png', 1500);

      // 12. Master Workspace Calendar
      console.log(`[Nav] Opening /app/workspaces/${wsId}/calendar`);
      await page.goto(`http://localhost:5173/app/workspaces/${wsId}/calendar`, {
        waitUntil: 'domcontentloaded',
      });
      await snap('12_workspace_calendar.png', 2000);

      // 13. All-Teams Daily Standups
      console.log(`[Nav] Opening /app/workspaces/${wsId}/daily-standups`);
      await page.goto(`http://localhost:5173/app/workspaces/${wsId}/daily-standups`, {
        waitUntil: 'domcontentloaded',
      });
      await snap('13_workspace_daily_standups.png', 1500);

      // 14. Operational Reports & Analytics
      console.log(`[Nav] Opening /app/workspaces/${wsId}/reports`);
      await page.goto(`http://localhost:5173/app/workspaces/${wsId}/reports`, {
        waitUntil: 'domcontentloaded',
      });
      await snap('14_workspace_reports_analytics.png', 2000);

      // 15. Team Overview & Roster
      if (teamId) {
        console.log(`[Nav] Opening /app/workspaces/${wsId}/teams/${teamId}/overview`);
        await page.goto(
          `http://localhost:5173/app/workspaces/${wsId}/teams/${teamId}/overview`,
          { waitUntil: 'domcontentloaded' }
        );
        await snap('15_team_department_overview.png', 1500);

        console.log(`[Nav] Opening /app/workspaces/${wsId}/teams/${teamId}/rooms`);
        await page.goto(
          `http://localhost:5173/app/workspaces/${wsId}/teams/${teamId}/rooms`,
          { waitUntil: 'domcontentloaded' }
        );
        await snap('16_team_rooms_channels.png', 1500);
      }

      // 16. Room Kanban Board
      if (roomId) {
        console.log(`[Nav] Opening /app/workspaces/${wsId}/rooms/${roomId}/board`);
        await page.goto(
          `http://localhost:5173/app/workspaces/${wsId}/rooms/${roomId}/board`,
          { waitUntil: 'domcontentloaded' }
        );
        await snap('17_room_kanban_board.png', 1800);

        // 17. Room Task List View
        console.log(`[Nav] Opening /app/workspaces/${wsId}/rooms/${roomId}/list`);
        await page.goto(
          `http://localhost:5173/app/workspaces/${wsId}/rooms/${roomId}/list`,
          { waitUntil: 'domcontentloaded' }
        );
        await snap('18_room_task_list_view.png', 1500);

        // 18. Room Milestones
        console.log(`[Nav] Opening /app/workspaces/${wsId}/rooms/${roomId}/milestones`);
        await page.goto(
          `http://localhost:5173/app/workspaces/${wsId}/rooms/${roomId}/milestones`,
          { waitUntil: 'domcontentloaded' }
        );
        await snap('19_room_milestones.png', 1500);
      }
    }

    // 19. Profile Settings with Unique Member ID
    console.log('[Nav] Opening /app/settings');
    await page.goto('http://localhost:5173/app/settings', { waitUntil: 'domcontentloaded' });
    await snap('20_profile_unique_member_id.png', 1500);

    console.log('[Screenshots] All actual application screenshots captured successfully!');
  } catch (err) {
    console.error('[Screenshots Error]', err);
  } finally {
    await browser.close();
  }
}

run();
