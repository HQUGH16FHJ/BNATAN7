/**
 * 绊谈万能枢纽 - Cloudflare Worker + KV 后台服务
 * 功能：用户系统 + AI代理 + 兑换码管理 + 数据统计 + 反馈收集 + 管理员后台
 * 部署：Cloudflare Workers，需绑定 KV 命名空间 BANTAN_KV
 * 
 * 环境变量配置：
 *   ADMIN_USERNAME  - 管理员账号（默认 BANTAN7）
 *   ADMIN_PASSWORD  - 管理员密码（默认 BANTAN777）
 *   API_KEY         - DeepSeek API Key（加密存储）
 *   DAILY_LIMIT     - 每日免费对话次数（默认 100）
 * 
 * KV 数据结构：
 *   config:settings            - 系统配置 JSON
 *   stats:pv:<date>            - 每日 PV 计数
 *   stats:uv:<date>:<ip>       - 访客标记
 *   stats:chat:<date>          - 每日对话数
 *   code:<code>                - 兑换码信息
 *   code:used:<code>           - 已使用兑换码标记
 *   feedback:<id>              - 用户反馈
 *   announce:list              - 公告列表 JSON
 *   user:<username>            - 用户信息 {password, createdAt, lastLogin, balance, totalUsed}
 *   user:online:<username>     - 在线用户心跳
 *   user:token:<token>         - 用户登录 token
 */

const DEFAULT_DAILY_LIMIT = 100;
const RATE_LIMIT_PER_MIN = 10;
const ONLINE_TIMEOUT = 60; // 在线心跳超时（秒）

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return jsonResponse(null, 204, origin);
    }

    // ===== 用户接口 =====
    if (path === '/api/user/register' && request.method === 'POST') {
      return handleUserRegister(request, env, origin);
    }
    if (path === '/api/user/login' && request.method === 'POST') {
      return handleUserLogin(request, env, origin);
    }
    if (path === '/api/user/info' && request.method === 'GET') {
      return handleUserInfo(request, env, origin);
    }
    if (path === '/api/user/logout' && request.method === 'POST') {
      return handleUserLogout(request, env, origin);
    }
    if (path === '/api/user/heartbeat' && request.method === 'POST') {
      return handleUserHeartbeat(request, env, origin);
    }
    if (path === '/api/user/online' && request.method === 'GET') {
      return handleOnlineCount(env, origin);
    }

    // ===== AI 代理 =====
    if (path === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env, origin);
    }

    // ===== 兑换码 =====
    if (path === '/api/code/redeem' && request.method === 'POST') {
      return handleRedeemCode(request, env, origin);
    }

    // ===== 反馈 =====
    if (path === '/api/feedback' && request.method === 'POST') {
      return handleFeedback(request, env, origin);
    }

    // ===== 公告 =====
    if (path === '/api/announce' && request.method === 'GET') {
      return handleGetAnnounce(env, origin);
    }

    // ===== 统计 =====
    if (path === '/api/stats/pv' && request.method === 'POST') {
      return handlePvStats(request, env, origin);
    }

    // ===== 管理员接口 =====
    const isAdmin = await verifyAdmin(request, env);

    if (path === '/api/admin/login' && request.method === 'POST') {
      return handleAdminLogin(request, env, origin);
    }

    if (!isAdmin && path.startsWith('/api/admin/')) {
      return jsonResponse({ error: '未授权', code: 401 }, 401, origin);
    }

    // 仪表盘
    if (path === '/api/admin/dashboard' && request.method === 'GET') {
      return handleDashboard(env, origin);
    }

    // 兑换码管理
    if (path === '/api/admin/codes' && request.method === 'GET') {
      return handleCodeList(env, url, origin);
    }
    if (path === '/api/admin/codes/generate' && request.method === 'POST') {
      return handleGenerateCodes(request, env, origin);
    }
    if (path.startsWith('/api/admin/codes/') && request.method === 'DELETE') {
      const code = path.split('/').pop();
      return handleDeleteCode(env, code, origin);
    }
    if (path === '/api/admin/codes/stats' && request.method === 'GET') {
      return handleCodeStats(env, origin);
    }

    // 用户管理
    if (path === '/api/admin/users' && request.method === 'GET') {
      return handleUserList(env, url, origin);
    }
    if (path === '/api/admin/users/count' && request.method === 'GET') {
      return handleUserCount(env, origin);
    }
    if (path.startsWith('/api/admin/users/') && path.endsWith('/password') && request.method === 'POST') {
      const username = path.replace('/api/admin/users/', '').replace('/password', '');
      return handleAdminResetPassword(env, username, request, origin);
    }
    if (path.startsWith('/api/admin/users/') && request.method === 'DELETE') {
      const username = path.split('/').pop();
      return handleDeleteUser(env, username, origin);
    }
    if (path.startsWith('/api/admin/users/') && path.endsWith('/balance') && request.method === 'POST') {
      const username = path.replace('/api/admin/users/', '').replace('/balance', '');
      return handleAdminAdjustBalance(env, username, request, origin);
    }
    if (path.startsWith('/api/admin/users/') && path.endsWith('/vip') && request.method === 'POST') {
      const username = path.replace('/api/admin/users/', '').replace('/vip', '');
      return handleAdminSetVip(env, username, request, origin);
    }
    if (path === '/api/admin/users' && request.method === 'POST') {
      return handleAdminCreateUser(request, env, origin);
    }

    // 反馈管理
    if (path === '/api/admin/feedback' && request.method === 'GET') {
      return handleFeedbackList(env, url, origin);
    }
    if (path.startsWith('/api/admin/feedback/') && request.method === 'DELETE') {
      const id = path.split('/').pop();
      return handleDeleteFeedback(env, id, origin);
    }

    // 公告管理
    if (path === '/api/admin/announce' && request.method === 'GET') {
      return handleAdminGetAnnounce(env, origin);
    }
    if (path === '/api/admin/announce' && request.method === 'POST') {
      return handleAdminSaveAnnounce(request, env, origin);
    }

    // 系统设置
    if (path === '/api/admin/settings' && request.method === 'GET') {
      return handleGetSettings(env, origin);
    }
    if (path === '/api/admin/settings' && request.method === 'POST') {
      return handleSaveSettings(request, env, origin);
    }

    // 导出
    if (path === '/api/admin/export' && request.method === 'GET') {
      return handleExportData(env, origin);
    }

    // 健康检查
    if (path === '/api/health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', time: Date.now() }, 200, origin);
    }

    // 初始化VIP管理员用户（一键创建）
    if (path === '/api/init-vip' && request.method === 'POST') {
      return handleInitVipUser(request, env, origin);
    }

    return jsonResponse({ error: 'Not Found' }, 404, origin);
  },
};

// ==================== 工具函数 ====================

function jsonResponse(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token, X-User-Token',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

function streamResponse(readable, origin = '*') {
  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

function getKV(env) {
  return env.BANTAN_KV;
}

// 简单密码哈希（生产环境建议用 bcrypt，Worker 环境用 Web Crypto）
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode('bantan_salt_' + password + '_salt2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== 用户系统 ====================

async function handleUserRegister(request, env, origin) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';
    const kv = getKV(env);

    if (!username || username.length < 3 || username.length > 20) {
      return jsonResponse({ success: false, error: '用户名长度需在 3-20 位之间' }, 400, origin);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return jsonResponse({ success: false, error: '用户名只能包含字母、数字和下划线' }, 400, origin);
    }
    if (!password || password.length < 6) {
      return jsonResponse({ success: false, error: '密码至少 6 位' }, 400, origin);
    }

    // 检查账号是否已存在
    const exists = await kv.get('user:' + username);
    if (exists) {
      return jsonResponse({ success: false, error: '该用户名已被注册' }, 400, origin);
    }

    const hashedPwd = await hashPassword(password);
    const dailyLimit = parseInt(env.DAILY_LIMIT || DEFAULT_DAILY_LIMIT);

    const user = {
      username,
      password: hashedPwd,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      registerIP: getClientIP(request),
      balance: 0, // 赠送余额
      totalUsed: 0, // 累计使用次数
      dailyUsed: 0, // 今日已用
      dailyResetDate: getToday(),
      isVip: false, // 是否VIP
      vipLevel: 0, // VIP等级 0=普通 1=青铜 2=白银 3=黄金 4=钻石 5=至尊
      vipExpire: 0, // VIP到期时间
    };

    await kv.put('user:' + username, JSON.stringify(user));

    // 生成登录 token
    const token = generateToken();
    await kv.put('user:token:' + token, JSON.stringify({ username, expires: Date.now() + 7 * 24 * 3600 * 1000 }), { expirationTtl: 7 * 24 * 3600 });

    return jsonResponse({
      success: true,
      message: '注册成功',
      token,
      user: { username, balance: user.balance, dailyUsed: 0, dailyLimit, isVip: false, vipLevel: 0 }
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleUserLogin(request, env, origin) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';
    const kv = getKV(env);

    if (!username || !password) {
      return jsonResponse({ success: false, error: '请输入账号和密码' }, 400, origin);
    }

    const userStr = await kv.get('user:' + username);
    if (!userStr) {
      return jsonResponse({ success: false, error: '账号不存在' }, 400, origin);
    }

    const user = JSON.parse(userStr);
    const hashedPwd = await hashPassword(password);

    if (user.password !== hashedPwd) {
      return jsonResponse({ success: false, error: '密码错误' }, 400, origin);
    }

    // 更新最后登录时间
    user.lastLogin = Date.now();
    user.lastLoginIP = getClientIP(request);

    // 检查每日重置
    const today = getToday();
    if (user.dailyResetDate !== today) {
      user.dailyUsed = 0;
      user.dailyResetDate = today;
    }

    await kv.put('user:' + username, JSON.stringify(user));

    // 生成 token
    const token = generateToken();
    await kv.put('user:token:' + token, JSON.stringify({ username, expires: Date.now() + 7 * 24 * 3600 * 1000 }), { expirationTtl: 7 * 24 * 3600 });

    const dailyLimit = parseInt(env.DAILY_LIMIT || DEFAULT_DAILY_LIMIT);

    return jsonResponse({
      success: true,
      token,
      user: {
        username,
        balance: user.balance || 0,
        dailyUsed: user.dailyUsed || 0,
        dailyLimit,
        totalUsed: user.totalUsed || 0,
        createdAt: user.createdAt,
        isVip: user.isVip || false,
        vipLevel: user.vipLevel || 0,
        vipExpire: user.vipExpire || 0,
      }
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function verifyUser(request, env) {
  const token = request.headers.get('X-User-Token') || '';
  if (!token) return null;
  const kv = getKV(env);
  const tokenInfo = await kv.get('user:token:' + token, { type: 'json' });
  if (!tokenInfo) return null;
  if (tokenInfo.expires < Date.now()) return null;
  const user = await kv.get('user:' + tokenInfo.username, { type: 'json' });
  return user;
}

async function handleUserInfo(request, env, origin) {
  const user = await verifyUser(request, env);
  if (!user) {
    return jsonResponse({ success: false, error: '未登录' }, 401, origin);
  }
  const dailyLimit = parseInt(env.DAILY_LIMIT || DEFAULT_DAILY_LIMIT);
  return jsonResponse({
    success: true,
    user: {
      username: user.username,
      balance: user.balance || 0,
      dailyUsed: user.dailyUsed || 0,
      dailyLimit,
      totalUsed: user.totalUsed || 0,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isVip: user.isVip || false,
      vipLevel: user.vipLevel || 0,
      vipExpire: user.vipExpire || 0,
    }
  }, 200, origin);
}

async function handleUserLogout(request, env, origin) {
  const token = request.headers.get('X-User-Token') || '';
  if (token) {
    const kv = getKV(env);
    await kv.delete('user:token:' + token);
  }
  return jsonResponse({ success: true }, 200, origin);
}

async function handleUserHeartbeat(request, env, origin) {
  const user = await verifyUser(request, env);
  if (!user) {
    return jsonResponse({ success: false, error: '未登录' }, 401, origin);
  }
  const kv = getKV(env);
  await kv.put('user:online:' + user.username, Date.now().toString(), { expirationTtl: ONLINE_TIMEOUT * 2 });
  return jsonResponse({ success: true }, 200, origin);
}

async function handleOnlineCount(env, origin) {
  const kv = getKV(env);
  const list = await kv.list({ prefix: 'user:online:', limit: 1000 });
  return jsonResponse({ success: true, count: list.keys.length }, 200, origin);
}

// ==================== 管理员鉴权 ====================

async function verifyAdmin(request, env) {
  try {
    const token = request.headers.get('X-Admin-Token') || '';
    if (!token) return false;
    const decoded = atob(token);
    const [username, pwd, tsStr] = decoded.split(':');
    const ts = parseInt(tsStr);
    if (ts < Date.now()) return false;
    const adminUser = env.ADMIN_USERNAME || 'BANTAN7';
    const adminPwd = env.ADMIN_PASSWORD || 'BANTAN777';
    return username === adminUser && pwd === adminPwd;
  } catch (e) {
    return false;
  }
}

async function handleAdminLogin(request, env, origin) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';
    const adminUser = env.ADMIN_USERNAME || 'BANTAN7';
    const adminPwd = env.ADMIN_PASSWORD || 'BANTAN777';

    if (username === adminUser && password === adminPwd) {
      const ts = Date.now() + 24 * 3600 * 1000;
      const token = btoa(adminUser + ':' + adminPwd + ':' + ts);
      return jsonResponse({ success: true, token, expires: ts }, 200, origin);
    } else {
      return jsonResponse({ success: false, error: '账号或密码错误' }, 401, origin);
    }
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== AI 代理 ====================

async function handleChat(request, env, origin) {
  const kv = getKV(env);
  const ip = getClientIP(request);
  const dailyLimit = parseInt(env.DAILY_LIMIT || DEFAULT_DAILY_LIMIT);

  // 速率限制
  const rateKey = `rate:${ip}:${Math.floor(Date.now() / 60000)}`;
  const rateCount = parseInt(await kv.get(rateKey) || '0');
  if (rateCount >= RATE_LIMIT_PER_MIN) {
    return jsonResponse({ error: '请求过于频繁，请稍后再试' }, 429, origin);
  }
  await kv.put(rateKey, (rateCount + 1).toString(), { expirationTtl: 120 });

  try {
    const body = await request.json();
    const userToken = request.headers.get('X-User-Token') || '';
    let user = null;

    // 验证用户
    if (userToken) {
      const tokenInfo = await kv.get('user:token:' + userToken, { type: 'json' });
      if (tokenInfo && tokenInfo.expires > Date.now()) {
        user = await kv.get('user:' + tokenInfo.username, { type: 'json' });
      }
    }

    const mode = body.mode || 'proxy';

    if (mode === 'proxy') {
      if (user) {
        // 检查VIP状态
        const vipActive = user.isVip && (!user.vipExpire || user.vipExpire > Date.now());

        if (vipActive) {
          // VIP用户：无限次数，只统计使用量
          user.totalUsed = (user.totalUsed || 0) + 1;
          await kv.put('user:' + user.username, JSON.stringify(user));
        } else {
          // 普通用户：先扣每日额度，再扣余额
          const today = getToday();
          if (user.dailyResetDate !== today) {
            user.dailyUsed = 0;
            user.dailyResetDate = today;
          }
          const dailyRemain = dailyLimit - user.dailyUsed;
          const totalRemain = dailyRemain + (user.balance || 0);

          if (totalRemain <= 0) {
            return jsonResponse({ error: '今日额度已用完，请使用兑换码充值或升级VIP' }, 429, origin);
          }

          // 扣除次数
          if (dailyRemain > 0) {
            user.dailyUsed++;
          } else {
            user.balance--;
          }
          user.totalUsed = (user.totalUsed || 0) + 1;
          await kv.put('user:' + user.username, JSON.stringify(user));
        }
      } else {
        // 未登录用户：使用全局每日限额
        const dailyKey = `stats:chat:${getToday()}`;
        const dailyCount = parseInt(await kv.get(dailyKey) || '0');
        if (dailyCount >= dailyLimit) {
          return jsonResponse({ error: '今日免费额度已用完，请登录或使用兑换码' }, 429, origin);
        }
        await kv.put(dailyKey, (dailyCount + 1).toString(), { expirationTtl: 86400 * 30 });
      }
    }

    const apiUrl = env.API_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions';
    const apiKey = env.API_KEY;

    if (!apiKey) {
      return jsonResponse({ error: 'API key 未配置，请联系管理员' }, 500, origin);
    }

    const forwardBody = {
      model: body.model || 'deepseek-chat',
      messages: body.messages,
      stream: body.stream !== false,
      temperature: body.temperature ?? 0.7,
      max_tokens: Math.min(body.max_tokens || 1024, 2048),
    };

    if (body.stream !== false) {
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify(forwardBody),
      });

      if (!apiResponse.ok) {
        const errText = await apiResponse.text();
        return jsonResponse({ error: 'API 错误: ' + errText.substring(0, 200) }, apiResponse.status, origin);
      }

      const { readable, writable } = new TransformStream();
      apiResponse.body.pipeTo(writable);
      return streamResponse(readable, origin);
    } else {
      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey,
        },
        body: JSON.stringify(forwardBody),
      });
      const data = await apiResponse.json();
      return jsonResponse(data, apiResponse.status, origin);
    }
  } catch (err) {
    return jsonResponse({ error: '服务器错误: ' + err.message }, 500, origin);
  }
}

// ==================== 兑换码系统 ====================

const CODE_TIERS = {
  'BT': 5, 'BM': 10, 'BS': 20, 'BZ': 50,
  'V1': 100, 'V2': 200, 'VX': 500
};
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function calcCodeChecksum(body) {
  let total = 0;
  for (let i = 0; i < body.length; i++) total += body.charCodeAt(i);
  const rem = total % 1296;
  return CODE_CHARS[Math.floor(rem / 36)] + CODE_CHARS[rem % 36];
}

function generateOneCode(amount) {
  let prefix = 'BT';
  for (let p in CODE_TIERS) {
    if (CODE_TIERS[p] === amount) { prefix = p; break; }
  }
  let middle = '';
  for (let i = 0; i < 6; i++) {
    middle += CODE_CHARS[Math.floor(Math.random() * 36)];
  }
  const body = prefix + middle;
  return body + calcCodeChecksum(body);
}

function validateCode(code) {
  if (!code || code.length !== 10) return false;
  const prefix = code.substring(0, 2);
  if (!CODE_TIERS[prefix]) return false;
  const body = code.substring(0, 8);
  const checksum = code.substring(8, 10);
  return calcCodeChecksum(body) === checksum;
}

async function handleRedeemCode(request, env, origin) {
  try {
    const body = await request.json();
    const code = (body.code || '').toUpperCase().trim();
    const kv = getKV(env);

    // 需要登录
    const user = await verifyUser(request, env);
    if (!user) {
      return jsonResponse({ success: false, error: '请先登录后再使用兑换码' }, 401, origin);
    }

    if (!validateCode(code)) {
      return jsonResponse({ success: false, error: '兑换码格式错误' }, 400, origin);
    }

    const used = await kv.get('code:used:' + code);
    if (used) {
      return jsonResponse({ success: false, error: '该兑换码已被使用' }, 400, origin);
    }

    const codeInfo = await kv.get('code:' + code, { type: 'json' });
    if (!codeInfo) {
      return jsonResponse({ success: false, error: '兑换码无效或不存在' }, 400, origin);
    }

    // 标记已使用
    await kv.put('code:used:' + code, JSON.stringify({
      usedAt: Date.now(),
      usedBy: user.username,
      amount: codeInfo.amount
    }));

    codeInfo.used = true;
    codeInfo.usedAt = Date.now();
    codeInfo.usedBy = user.username;
    await kv.put('code:' + code, JSON.stringify(codeInfo));

    // 增加用户余额
    user.balance = (user.balance || 0) + codeInfo.amount;
    await kv.put('user:' + user.username, JSON.stringify(user));

    return jsonResponse({
      success: true,
      amount: codeInfo.amount,
      newBalance: user.balance,
      message: `兑换成功，获得 ${codeInfo.amount} 次对话机会`
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleGenerateCodes(request, env, origin) {
  try {
    const body = await request.json();
    const amount = parseInt(body.amount || 20);
    const count = parseInt(body.count || 10);
    const kv = getKV(env);

    if (count < 1 || count > 500) {
      return jsonResponse({ success: false, error: '数量应在 1-500 之间' }, 400, origin);
    }

    const codes = [];
    const generated = new Set();
    let attempts = 0;

    while (codes.length < count && attempts < count * 100) {
      const code = generateOneCode(amount);
      if (!generated.has(code)) {
        const exists = await kv.get('code:' + code);
        if (!exists) {
          generated.add(code);
          codes.push(code);
          await kv.put('code:' + code, JSON.stringify({
            amount,
            used: false,
            createdAt: Date.now(),
            prefix: code.substring(0, 2)
          }));
        }
      }
      attempts++;
    }

    return jsonResponse({ success: true, codes, count: codes.length }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleCodeList(env, url, origin) {
  try {
    const kv = getKV(env);
    const tier = url.searchParams.get('tier') || '';
    const status = url.searchParams.get('status') || 'all';
    const search = (url.searchParams.get('search') || '').toUpperCase();
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const list = await kv.list({ prefix: 'code:', limit: Math.min(limit, 200) });
    let codes = [];

    for (const key of list.keys) {
      const code = key.name.replace('code:', '');
      if (code.startsWith('used:')) continue;
      if (search && !code.includes(search)) continue;
      if (tier && !code.startsWith(tier)) continue;

      const info = await kv.get(key.name, { type: 'json' });
      if (!info) continue;
      if (status === 'used' && !info.used) continue;
      if (status === 'unused' && info.used) continue;

      codes.push({
        code,
        amount: info.amount,
        tier: code.substring(0, 2),
        used: info.used || false,
        createdAt: info.createdAt,
        usedAt: info.usedAt || null,
        usedBy: info.usedBy || null,
      });
    }

    codes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return jsonResponse({
      success: true,
      codes: codes.slice(0, limit),
      total: codes.length
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleDeleteCode(env, code, origin) {
  try {
    const kv = getKV(env);
    await kv.delete('code:' + code);
    await kv.delete('code:used:' + code);
    return jsonResponse({ success: true }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleCodeStats(env, origin) {
  try {
    const kv = getKV(env);
    const list = await kv.list({ prefix: 'code:' });

    let total = 0, used = 0, totalValue = 0;
    const byTier = {};

    for (const key of list.keys) {
      const code = key.name.replace('code:', '');
      if (code.startsWith('used:')) continue;
      const info = await kv.get(key.name, { type: 'json' });
      if (!info) continue;
      total++;
      totalValue += info.amount || 0;
      if (info.used) used++;
      const tier = code.substring(0, 2);
      if (!byTier[tier]) byTier[tier] = { total: 0, used: 0 };
      byTier[tier].total++;
      if (info.used) byTier[tier].used++;
    }

    return jsonResponse({ success: true, total, used, unused: total - used, totalValue, byTier }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== 仪表盘 ====================

async function handleDashboard(env, origin) {
  try {
    const kv = getKV(env);
    const today = getToday();

    const pvToday = parseInt(await kv.get('stats:pv:' + today) || '0');
    const chatToday = parseInt(await kv.get('stats:chat:' + today) || '0');

    // 用户数
    const userList = await kv.list({ prefix: 'user:' });
    let userCount = 0;
    for (const key of userList.keys) {
      const name = key.name.replace('user:', '');
      if (name.startsWith('token:') || name.startsWith('online:')) continue;
      userCount++;
    }

    // 在线人数
    const onlineList = await kv.list({ prefix: 'user:online:' });
    const onlineCount = onlineList.keys.length;

    // 近7天数据
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const pv = parseInt(await kv.get('stats:pv:' + dateStr) || '0');
      const chat = parseInt(await kv.get('stats:chat:' + dateStr) || '0');
      weekData.push({ date: dateStr, pv, chat });
    }

    // 兑换码统计
    const codeList = await kv.list({ prefix: 'code:' });
    let codeTotal = 0, codeUsed = 0;
    for (const key of codeList.keys) {
      const code = key.name.replace('code:', '');
      if (code.startsWith('used:')) continue;
      codeTotal++;
      const info = await kv.get(key.name, { type: 'json' });
      if (info && info.used) codeUsed++;
    }

    // 反馈数量
    const fbList = await kv.list({ prefix: 'feedback:' });

    return jsonResponse({
      success: true,
      pv: pvToday,
      chat: chatToday,
      userCount,
      onlineCount,
      codeTotal,
      codeUsed,
      feedbackCount: fbList.keys.length,
      weekData,
      dailyLimit: parseInt(env.DAILY_LIMIT || DEFAULT_DAILY_LIMIT),
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== 用户管理（管理员） ====================

async function handleUserCount(env, origin) {
  try {
    const kv = getKV(env);
    const list = await kv.list({ prefix: 'user:' });
    let total = 0;
    for (const key of list.keys) {
      const name = key.name.replace('user:', '');
      if (name.startsWith('token:') || name.startsWith('online:')) continue;
      total++;
    }
    return jsonResponse({ success: true, total }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleUserList(env, url, origin) {
  try {
    const kv = getKV(env);
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const list = await kv.list({ prefix: 'user:', limit: 200 });
    const users = [];

    for (const key of list.keys) {
      const name = key.name.replace('user:', '');
      if (name.startsWith('token:') || name.startsWith('online:')) continue;
      if (search && !name.toLowerCase().includes(search)) continue;

      const user = await kv.get(key.name, { type: 'json' });
      if (!user) continue;

      // 检查是否在线
      const online = await kv.get('user:online:' + name);

      users.push({
        username: user.username,
        balance: user.balance || 0,
        totalUsed: user.totalUsed || 0,
        dailyUsed: user.dailyUsed || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        registerIP: user.registerIP || '',
        online: !!online,
        isVip: user.isVip || false,
        vipLevel: user.vipLevel || 0,
        vipExpire: user.vipExpire || 0,
      });
    }

    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return jsonResponse({
      success: true,
      users: users.slice(0, limit),
      total: users.length
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleAdminResetPassword(env, username, request, origin) {
  try {
    const body = await request.json();
    const newPassword = body.newPassword || '';
    const kv = getKV(env);

    if (!newPassword || newPassword.length < 6) {
      return jsonResponse({ success: false, error: '新密码至少 6 位' }, 400, origin);
    }

    const userStr = await kv.get('user:' + username);
    if (!userStr) {
      return jsonResponse({ success: false, error: '用户不存在' }, 404, origin);
    }

    const user = JSON.parse(userStr);
    user.password = await hashPassword(newPassword);
    await kv.put('user:' + username, JSON.stringify(user));

    // 清除该用户的所有登录 token（简单方式：靠过期）
    return jsonResponse({ success: true, message: '密码已重置' }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleAdminAdjustBalance(env, username, request, origin) {
  try {
    const body = await request.json();
    const delta = parseInt(body.delta || 0);
    const kv = getKV(env);

    const userStr = await kv.get('user:' + username);
    if (!userStr) {
      return jsonResponse({ success: false, error: '用户不存在' }, 404, origin);
    }

    const user = JSON.parse(userStr);
    user.balance = Math.max(0, (user.balance || 0) + delta);
    await kv.put('user:' + username, JSON.stringify(user));

    return jsonResponse({ success: true, newBalance: user.balance }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleAdminSetVip(env, username, request, origin) {
  try {
    const body = await request.json();
    const isVip = body.isVip !== false;
    const vipLevel = parseInt(body.vipLevel || 5);
    const vipDays = parseInt(body.vipDays || 0); // 0=永久
    const kv = getKV(env);

    const userStr = await kv.get('user:' + username);
    if (!userStr) {
      return jsonResponse({ success: false, error: '用户不存在' }, 404, origin);
    }

    const user = JSON.parse(userStr);
    user.isVip = isVip;
    user.vipLevel = isVip ? vipLevel : 0;
    if (isVip && vipDays > 0) {
      user.vipExpire = Date.now() + vipDays * 24 * 3600 * 1000;
    } else if (isVip) {
      user.vipExpire = 0; // 永久
    } else {
      user.vipExpire = 0;
    }
    await kv.put('user:' + username, JSON.stringify(user));

    return jsonResponse({ success: true, message: isVip ? '已设置为VIP' : '已取消VIP' }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleAdminCreateUser(request, env, origin) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';
    const balance = parseInt(body.balance || 0);
    const isVip = body.isVip || false;
    const vipLevel = parseInt(body.vipLevel || 0);
    const kv = getKV(env);

    if (!username || username.length < 3 || username.length > 20) {
      return jsonResponse({ success: false, error: '用户名长度需在 3-20 位之间' }, 400, origin);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return jsonResponse({ success: false, error: '用户名只能包含字母、数字和下划线' }, 400, origin);
    }
    if (!password || password.length < 6) {
      return jsonResponse({ success: false, error: '密码至少 6 位' }, 400, origin);
    }

    // 检查账号是否已存在
    const exists = await kv.get('user:' + username);
    if (exists) {
      return jsonResponse({ success: false, error: '该用户名已存在' }, 400, origin);
    }

    const hashedPwd = await hashPassword(password);

    const user = {
      username,
      password: hashedPwd,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      registerIP: 'admin-create',
      balance: balance,
      totalUsed: 0,
      dailyUsed: 0,
      dailyResetDate: getToday(),
      isVip: isVip,
      vipLevel: isVip ? vipLevel : 0,
      vipExpire: isVip ? 0 : 0, // 永久VIP
    };

    await kv.put('user:' + username, JSON.stringify(user));

    return jsonResponse({ success: true, message: '用户创建成功', user: { username, balance, isVip, vipLevel } }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// 一键初始化VIP管理员用户
async function handleInitVipUser(request, env, origin) {
  try {
    const body = await request.json();
    const adminPwd = body.adminPassword || '';
    const username = (body.username || 'BANTAN7').trim();
    const password = body.password || 'BANTAN777';
    const vipLevel = parseInt(body.vipLevel || 5);
    const balance = parseInt(body.balance || 99999);
    
    const kv = getKV(env);
    const correctAdminPwd = env.ADMIN_PASSWORD || 'BANTAN777';
    
    // 验证管理员密码
    if (adminPwd !== correctAdminPwd) {
      return jsonResponse({ success: false, error: '管理员密码错误' }, 401, origin);
    }
    
    // 检查用户是否已存在
    const exists = await kv.get('user:' + username);
    if (exists) {
      // 用户已存在，直接升级为VIP
      const user = JSON.parse(exists);
      user.isVip = true;
      user.vipLevel = vipLevel;
      user.vipExpire = 0; // 永久
      user.balance = Math.max(user.balance || 0, balance);
      await kv.put('user:' + username, JSON.stringify(user));
      return jsonResponse({ 
        success: true, 
        message: '用户已升级为至尊VIP', 
        user: { username, isVip: true, vipLevel, balance: user.balance } 
      }, 200, origin);
    }
    
    // 创建新的VIP用户
    const hashedPwd = await hashPassword(password);
    const user = {
      username,
      password: hashedPwd,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      registerIP: 'vip-init',
      balance: balance,
      totalUsed: 0,
      dailyUsed: 0,
      dailyResetDate: getToday(),
      isVip: true,
      vipLevel: vipLevel,
      vipExpire: 0, // 永久VIP
    };
    
    await kv.put('user:' + username, JSON.stringify(user));
    
    return jsonResponse({ 
      success: true, 
      message: '至尊VIP用户创建成功！', 
      user: { username, isVip: true, vipLevel, balance, vipName: '至尊VIP' } 
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleDeleteUser(env, username, origin) {
  try {
    const kv = getKV(env);
    await kv.delete('user:' + username);
    await kv.delete('user:online:' + username);
    // 注意：token 会自动过期，不用手动删
    return jsonResponse({ success: true }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== PV 统计 ====================

async function handlePvStats(request, env, origin) {
  try {
    const kv = getKV(env);
    const today = getToday();
    const ip = getClientIP(request);

    const pvKey = 'stats:pv:' + today;
    const pv = parseInt(await kv.get(pvKey) || '0');
    await kv.put(pvKey, (pv + 1).toString(), { expirationTtl: 86400 * 90 });

    const uvKey = 'stats:uv:' + today + ':' + ip;
    const uvExists = await kv.get(uvKey);
    if (!uvExists) {
      await kv.put(uvKey, '1', { expirationTtl: 86400 * 2 });
    }

    return jsonResponse({ success: true, pv: pv + 1 }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== 反馈 ====================

async function handleFeedback(request, env, origin) {
  try {
    const body = await request.json();
    const kv = getKV(env);
    const ip = getClientIP(request);

    const user = await verifyUser(request, env);

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const feedback = {
      id,
      content: body.content || '',
      contact: body.contact || '',
      type: body.type || 'suggestion',
      username: user ? user.username : null,
      ip,
      createdAt: Date.now(),
      read: false,
    };

    await kv.put('feedback:' + id, JSON.stringify(feedback));
    return jsonResponse({ success: true, message: '反馈提交成功' }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleFeedbackList(env, url, origin) {
  try {
    const kv = getKV(env);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const list = await kv.list({ prefix: 'feedback:', limit: Math.min(limit, 200) });
    const feedbacks = [];

    for (const key of list.keys) {
      const fb = await kv.get(key.name, { type: 'json' });
      if (fb) feedbacks.push(fb);
    }

    feedbacks.sort((a, b) => b.createdAt - a.createdAt);

    return jsonResponse({ success: true, list: feedbacks, total: feedbacks.length }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleDeleteFeedback(env, id, origin) {
  try {
    const kv = getKV(env);
    await kv.delete('feedback:' + id);
    return jsonResponse({ success: true }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== 公告 ====================

async function handleGetAnnounce(env, origin) {
  try {
    const kv = getKV(env);
    const data = await kv.get('announce:list', { type: 'json' });
    return jsonResponse({ success: true, list: data || [] }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, list: [] }, 200, origin);
  }
}

async function handleAdminGetAnnounce(env, origin) {
  return handleGetAnnounce(env, origin);
}

async function handleAdminSaveAnnounce(request, env, origin) {
  try {
    const body = await request.json();
    const kv = getKV(env);
    await kv.put('announce:list', JSON.stringify(body.list || []));
    return jsonResponse({ success: true }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== 系统设置 ====================

async function handleGetSettings(env, origin) {
  try {
    const kv = getKV(env);
    const settings = await kv.get('config:settings', { type: 'json' }) || {};
    return jsonResponse({
      success: true,
      settings: {
        dailyLimit: parseInt(env.DAILY_LIMIT || DEFAULT_DAILY_LIMIT),
        siteName: settings.siteName || '绊谈万能枢纽',
        ...settings
      }
    }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

async function handleSaveSettings(request, env, origin) {
  try {
    const body = await request.json();
    const kv = getKV(env);
    const settings = await kv.get('config:settings', { type: 'json' }) || {};
    const newSettings = { ...settings, ...body.settings };
    await kv.put('config:settings', JSON.stringify(newSettings));
    return jsonResponse({ success: true }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}

// ==================== 数据导出 ====================

async function handleExportData(env, origin) {
  try {
    const kv = getKV(env);
    const allData = {};
    let cursor = '';
    do {
      const list = await kv.list({ cursor, limit: 1000 });
      for (const key of list.keys) {
        const val = await kv.get(key.name);
        allData[key.name] = val;
      }
      cursor = list.list_complete ? '' : list.cursor;
    } while (cursor);

    return jsonResponse({ success: true, data: allData, exportedAt: Date.now() }, 200, origin);
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500, origin);
  }
}
