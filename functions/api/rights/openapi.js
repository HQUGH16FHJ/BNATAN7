function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*'
    }
  });
}

export async function onRequestGet() {
  return json({
    openapi: '3.1.0',
    info: {
      title: 'Bantan Rights API',
      version: '1.0.0',
      description: '绊谈私有网站权属声明登记与版权登记查询接口。该接口不代表国家、政府或司法认证。'
    },
    servers: [{ url: 'https://rights.bantan.online' }],
    paths: {
      '/api/rights/health': {
        get: { summary: '服务与数据库状态', responses: { 200: { description: 'OK' } } }
      },
      '/api/rights/site-status': {
        get: {
          summary: '按官网编号和域名查询登记信息',
          parameters: [
            { name: 'code', in: 'query', schema: { type: 'string' } },
            { name: 'domain', in: 'query', schema: { type: 'string' } }
          ],
          responses: { 200: { description: '登记信息' }, 404: { description: '未找到或不匹配' } }
        }
      },
      '/api/rights/site-verify': {
        get: { summary: '读取 DNS 验证记录', responses: { 200: { description: 'DNS 记录' } } },
        post: { summary: '检测 DNS 所有权', responses: { 200: { description: '检测结果' } } }
      },
      '/api/rights/status': {
        get: {
          summary: '查询登记申请进度',
          parameters: [
            { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'email', in: 'query', required: true, schema: { type: 'string', format: 'email' } }
          ],
          responses: { 200: { description: '申请状态' } }
        }
      },
      '/api/rights/site-badge': {
        get: {
          summary: '生成动态 SVG 认证徽章',
          parameters: [
            { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'domain', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'theme', in: 'query', schema: { type: 'string', enum: ['dark', 'amber', 'light', 'mono'] } }
          ],
          responses: { 200: { description: 'SVG 徽章', content: { 'image/svg+xml': {} } } }
        }
      }
    }
  });
}
