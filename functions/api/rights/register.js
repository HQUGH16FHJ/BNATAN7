const MAX_BODY_SIZE = 32 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function clean(value, max = 400) {
  return String(value || '').trim().slice(0, max);
}

function makeCode() {
  const date = new Date();
  const stamp = String(date.getFullYear()).slice(-2) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return 'BNT-REG-' + stamp + '-' + random;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

async function sendNotification(context, data, registrationCode) {
  if (!context.env.EMAIL) return { sent: false, reason: 'email_binding_missing' };
  const notifyEmails = String(context.env.RIGHTS_NOTIFY_EMAILS || context.env.RIGHTS_NOTIFY_EMAIL || 'g125668039@163.com')
    .split(/[,\s;]+/)
    .map(item => item.trim())
    .filter(Boolean);
  const fromEmail = context.env.RIGHTS_FROM_EMAIL || 'rights@bantan.online';
  const text = [
    '新的版权登记申请',
    '',
    '登记编号：' + registrationCode,
    '项目名称：' + data.projectName,
    '版权所有者：' + data.owner,
    '登记类型：' + data.recordType,
    '官方域名：' + (data.domains || '--'),
    '邮箱：' + (data.contact || '--'),
    '作品范围：' + data.works,
    '',
    '请在 https://rights.bantan.online/admin 查看完整登记单。'
  ].join('\n');
  const html = '<h2>新的版权登记申请</h2>' +
    '<p><strong>登记编号：</strong>' + escapeHtml(registrationCode) + '</p>' +
    '<p><strong>项目名称：</strong>' + escapeHtml(data.projectName) + '</p>' +
    '<p><strong>版权所有者：</strong>' + escapeHtml(data.owner) + '</p>' +
    '<p><strong>登记类型：</strong>' + escapeHtml(data.recordType) + '</p>' +
    '<p><strong>官方域名：</strong>' + escapeHtml(data.domains || '--') + '</p>' +
    '<p><strong>联系邮箱：</strong>' + escapeHtml(data.contact || '--') + '</p>' +
    '<p><strong>作品范围：</strong>' + escapeHtml(data.works) + '</p>' +
    '<p><a href="https://rights.bantan.online/admin">打开登记管理后台</a></p>';
  await context.env.EMAIL.send({
    to: notifyEmails,
    from: { email: fromEmail, name: 'Bantan Rights' },
    replyTo: data.contact ? { email: data.contact, name: data.owner } : undefined,
    subject: '版权登记申请 · ' + data.projectName,
    text,
    html
  });
  return { sent: true };
}

export async function onRequestPost(context) {
  const db = context.env.RIGHTS_DB;
  if (!db) return json({ ok: false, error: '数据库尚未绑定。' }, 500);

  const contentLength = Number(context.request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_SIZE) return json({ ok: false, error: '提交内容过大。' }, 413);

  let body;
  try {
    body = await context.request.json();
  } catch (error) {
    return json({ ok: false, error: '提交格式错误。' }, 400);
  }

  const projectName = clean(body.projectName, 160);
  const owner = clean(body.owner, 160);
  const contact = clean(body.contact, 200);
  const declared = body.declared === true;

  if (!projectName || !owner || !declared) {
    return json({ ok: false, error: '请填写项目名称、版权所有者并确认声明。' }, 400);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const registrationCode = makeCode();
  const data = {
    recordType: clean(body.recordType, 40) || '网站',
    projectStatus: clean(body.projectStatus, 40) || '已上线',
    producer: clean(body.producer, 200),
    domains: clean(body.domains, 500),
    repository: clean(body.repository, 500),
    license: clean(body.license, 80) || '专有许可证',
    releaseDate: clean(body.releaseDate, 40),
    contact,
    phone: clean(body.phone, 80),
    works: Array.isArray(body.works) ? body.works.map(item => clean(item, 40)).slice(0, 20).join('、') : clean(body.works, 500),
    description: clean(body.description, 4000)
  };

  try {
    await db.prepare(`
      INSERT INTO rights_registrations (
        id, registration_code, project_name, record_type, project_status,
        owner, producer, domains, repository, license, release_date,
        contact, phone, works, description, status, created_at, updated_at, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待审核', ?, ?, ?)
    `).bind(
      id,
      registrationCode,
      projectName,
      data.recordType,
      data.projectStatus,
      owner,
      data.producer,
      data.domains,
      data.repository,
      data.license,
      data.releaseDate,
      data.contact,
      data.phone,
      data.works,
      data.description,
      now,
      now,
      clean(context.request.headers.get('user-agent'), 500)
    ).run();
  } catch (error) {
    return json({ ok: false, error: '登记提交失败，请稍后重试。' }, 500);
  }

  let notification = { sent: false };
  try {
    notification = await sendNotification(context, { projectName, owner, ...data, contact }, registrationCode);
  } catch (error) {
    notification = { sent: false, reason: 'email_send_failed' };
  }

  return json({
    ok: true,
    registrationCode,
    status: '待审核',
    submittedAt: now,
    emailSent: notification.sent
  }, 201);
}

export async function onRequestGet() {
  return json({ ok: false, error: '请使用 POST 提交登记单。' }, 405);
}
