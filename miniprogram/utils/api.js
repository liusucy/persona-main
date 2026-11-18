// DeepSeek / 任意 OpenAI 兼容接口的 wx.request 封装。
const config = require('../config');
const prompt = require('./prompt');

function endpoint(settings) {
  const base = String((settings && settings.baseUrl) || config.DEFAULT_BASE_URL).replace(/\/+$/, '');
  return base + '/chat/completions';
}

function toNumber(value, fallback) {
  const n = Number(value);
  return isNaN(n) ? fallback : n;
}

/**
 * 调用一次聊天补全。
 * @returns Promise<{ reply: string, latencyMs: number }>
 */
function chat(settings, messages) {
  return new Promise(function (resolve, reject) {
    if (!settings || !String(settings.apiKey || '').trim()) {
      reject(new Error('还没有填 API Key，请到「人设」页填写'));
      return;
    }
    const started = Date.now();
    wx.request({
      url: endpoint(settings),
      method: 'POST',
      timeout: 60000,
      header: {
        Authorization: 'Bearer ' + String(settings.apiKey).trim(),
        'Content-Type': 'application/json'
      },
      data: {
        model: settings.model || config.DEFAULT_MODEL,
        messages: messages,
        temperature: toNumber(settings.temperature, config.DEFAULT_TEMPERATURE),
        max_tokens: toNumber(settings.maxTokens, config.DEFAULT_MAX_TOKENS)
      },
      success: function (res) {
        const latencyMs = Date.now() - started;
        if (res.statusCode === 401) { reject(new Error('API Key 无效或已过期')); return; }
        if (res.statusCode === 402) { reject(new Error('账户余额不足')); return; }
        if (res.statusCode === 429) { reject(new Error('请求太频繁，等一会儿再试')); return; }
        if (res.statusCode >= 500) { reject(new Error('模型服务异常（HTTP ' + res.statusCode + '）')); return; }
        if (res.statusCode !== 200) {
          const body = res.data ? JSON.stringify(res.data).slice(0, 160) : '';
          reject(new Error('请求失败（HTTP ' + res.statusCode + '）：' + body));
          return;
        }
        try {
          resolve({ reply: prompt.extractReply(res.data), latencyMs: latencyMs });
        } catch (err) {
          reject(err);
        }
      },
      fail: function (err) {
        reject(new Error('网络错误：' + ((err && err.errMsg) || '请求失败')));
      }
    });
  });
}

/** 设置页的“测试连接”：发一句最短的话，验证 Key 与地址。 */
function testConnection(settings) {
  return chat(settings, [
    { role: 'system', content: '你是一个连接测试助手，只用一句话回答。' },
    { role: 'user', content: '在吗' }
  ]);
}

module.exports = { chat, testConnection, endpoint };
