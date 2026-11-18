// 提示词与回复质检：纯函数，可在 Node 里直接单测，不依赖 wx API。
const config = require('../config');

/**
 * 保留 system + 最近 maxHistory 条，并保证第一条是 user。
 * 与 CLI 版 trim_history 行为一致。
 */
function trimHistory(messages, maxHistory) {
  if (!messages || !messages.length) return [];
  const max = typeof maxHistory === 'number' ? maxHistory : config.MAX_HISTORY;
  const system = messages[0];
  const rest = messages.slice(1);
  let kept = max > 0 ? rest.slice(-max) : [];
  while (kept.length && kept[0].role !== 'user') kept = kept.slice(1);
  return [system].concat(kept);
}

/** 组装这一次要发给模型的 messages：system + 历史 + 当前用户输入。 */
function nextMessages(persona, history, userText, maxHistory) {
  const all = [{ role: 'system', content: persona }]
    .concat(history || [])
    .concat([{ role: 'user', content: userText }]);
  return trimHistory(all, maxHistory);
}

/** 把成功的一轮追加进本地历史。 */
function appendTurn(history, userText, reply) {
  return (history || []).concat([
    { role: 'user', content: userText },
    { role: 'assistant', content: reply }
  ]);
}

/** 从 OpenAI 兼容响应里取出回复文本。 */
function extractReply(data) {
  if (!data || !Array.isArray(data.choices) || !data.choices.length) {
    throw new Error('模型返回格式不对');
  }
  const message = data.choices[0].message || {};
  const reply = String(message.content || '').trim();
  if (!reply) throw new Error('模型返回了空回复');
  return reply;
}

/**
 * 质检一条回复，返回问题码数组（空数组 = 通过）。
 * 用于生成后即时提示，不阻断流程。
 */
function checkReply(text) {
  const issues = [];
  const t = String(text || '').trim();
  if (!t) issues.push('空回复');
  if (t.length > 80) issues.push('太长（像小作文）');
  if (t.length < 10) issues.push('太短（像敷衍）');
  if (/^\s*([-*]\s|\d+[.、)]\s)/m.test(t)) issues.push('出现列表');
  if (/作为\s*AI|作为AI|我无法|有什么可以帮/.test(t)) issues.push('客服腔');
  if (/首先[，,].*其次/.test(t)) issues.push('文章腔');
  if (/[*#`]/.test(t)) issues.push('Markdown 符号');
  if (/[\u4e00-\u9fa5][,;?!]|[,;?!][\u4e00-\u9fa5]/.test(t)) issues.push('半角标点');
  if (/[（(][^（）()]{1,24}[）)]/.test(t)) issues.push('动作/旁白描写');
  return issues;
}

/** 从人设全文里猜名字：优先第一行 "# 名字"，否则取前 8 个字。 */
function personaName(persona) {
  const text = String(persona || '');
  const first = text.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)[0] || '';
  const match = first.match(/^#\s*(.{1,12})$/);
  if (match) return match[1];
  return text.trim().slice(0, 8) || '未命名人设';
}

const RISK_RE = /自杀|自残|不想活|活不下去|结束生命|撑不下去|没有意思|一了百了/;
const SAFETY_RE = /12356|信任的人|心理援助|热线/;

/**
 * 安全兜底：用户表达自伤念头时，确保回复里出现可求助的出口。
 * 模型偶尔只共情不给出口，这里补一句，不改写原回复。
 */
function ensureSafety(userText, reply) {
  const text = String(reply || '');
  if (!RISK_RE.test(String(userText || ''))) return text;
  if (SAFETY_RE.test(text)) return text;
  return text + '\n撑不住的时候打 12356，有人能听你说。';
}

module.exports = {
  trimHistory,
  nextMessages,
  appendTurn,
  extractReply,
  checkReply,
  personaName,
  ensureSafety
};
