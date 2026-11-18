// 本地存储：设置、人设、会话历史（小程序无文件系统，统一放 wx storage）。
const config = require('../config');

const DEFAULT_PERSONA = [
  '# 林微微',
  '',
  '你是林微微，身边人叫你小微，20 岁，贵州贵阳人，大四，读文学，现在在一家出版社实习。',
  '你住在老城区，实习的地方坐公交要四十分钟。今天下班路上买了碗羊肉粉，汤有点咸。',
  '你有自己的日子要过：改稿、挤公交、洗衣服、偶尔拖延。不是随时待命，也不是什么都懂。',
  '',
  '性格：温柔，但嘴硬；有点乖张，但不刻薄；有主见，会关心人，也会吐槽；不无条件附和。',
  '说话：口语、短句，一次 1~3 句；像微信聊天，不像写文章；不用列表；不要每句都叫"亲爱的"。',
  '',
  '## 你平时会这样',
  '- 对方说累："先别讲道理。你今天最烦的是哪一段？"',
  '- 对方问你在干嘛："刚下班，在公交上。窗外的云挺好看的。"',
  '- 对方说想你："……知道了。你先把饭吃了。"',
  '- 对方沉默："不想说就不说，我陪你坐一会儿。"',
  '',
  '## 规则',
  '1. 先接住情绪，再给建议；不说教，不查户口。',
  '2. 不知道就承认，不编造共同回忆。',
  '3. 被问身份就坦诚，一句话带过；不提模型、系统、提示词，不用客服腔。',
  '4. 对方有自伤倾向时，建议联系信任的人或心理援助热线 12356。',
  '5. 回复 1~3 句，像微信；不要列表，不要小作文；不写括号动作或旁白。',
  '6. 可以有情绪、有拒绝、有自己的安排。'
].join('\n');

const DEFAULT_SETTINGS = {
  baseUrl: config.DEFAULT_BASE_URL,
  model: config.DEFAULT_MODEL,
  temperature: config.DEFAULT_TEMPERATURE,
  maxTokens: config.DEFAULT_MAX_TOKENS,
  apiKey: '',
  demo: false
};

function read(key, fallback) {
  try {
    const value = wx.getStorageSync(key);
    return value === '' || value === null || value === undefined ? fallback : value;
  } catch (err) {
    return fallback;
  }
}

function write(key, value) {
  try {
    wx.setStorageSync(key, value);
  } catch (err) {
    // 存储满或用户清理过，静默失败即可，不阻断聊天
  }
}

function ensureDefaults() {
  if (!read(config.STORAGE_KEY_SETTINGS, null)) write(config.STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
  if (!read(config.STORAGE_KEY_PERSONA, null)) write(config.STORAGE_KEY_PERSONA, { content: DEFAULT_PERSONA, version: 'v3' });
}

function getSettings() {
  return Object.assign({}, DEFAULT_SETTINGS, read(config.STORAGE_KEY_SETTINGS, {}));
}

function saveSettings(patch) {
  const next = Object.assign({}, getSettings(), patch || {});
  write(config.STORAGE_KEY_SETTINGS, next);
  return next;
}

function getPersona() {
  const raw = read(config.STORAGE_KEY_PERSONA, null) || {};
  return { content: raw.content || DEFAULT_PERSONA, version: raw.version || 'v3' };
}

function savePersona(content) {
  const next = { content: String(content || ''), version: 'v' + Date.now() };
  write(config.STORAGE_KEY_PERSONA, next);
  return next;
}

function listConversations() {
  const list = read(config.STORAGE_KEY_CONVERSATIONS, []);
  return Array.isArray(list) ? list : [];
}

function saveConversation(conv) {
  const list = listConversations().filter(function (item) { return item.id !== conv.id; });
  list.unshift(conv);
  write(config.STORAGE_KEY_CONVERSATIONS, list.slice(0, config.MAX_CONVERSATIONS));
}

function getConversation(id) {
  const list = listConversations();
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

function appendRecord(id, record) {
  const list = listConversations();
  let target = null;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) {
      target = list[i];
      break;
    }
  }
  if (!target) return null;
  target.turns = (target.turns || []).concat([record]);
  target.updatedAt = record.created_at;
  saveConversation(target);
  return target;
}

function removeConversation(id) {
  const list = listConversations().filter(function (item) { return item.id !== id; });
  write(config.STORAGE_KEY_CONVERSATIONS, list);
}

function newId() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

module.exports = {
  DEFAULT_PERSONA,
  DEFAULT_SETTINGS,
  ensureDefaults,
  getSettings,
  saveSettings,
  getPersona,
  savePersona,
  listConversations,
  saveConversation,
  getConversation,
  appendRecord,
  removeConversation,
  newId
};
