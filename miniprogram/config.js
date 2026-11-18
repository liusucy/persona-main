// 所有可调参数集中在这里，改完保存、重新编译即可生效。
module.exports = {
  VERSION: '1.0.0',

  // 默认接口：任意 OpenAI 兼容网关都可以，末尾不要带 /
  DEFAULT_BASE_URL: 'https://api.deepseek.com',
  DEFAULT_MODEL: 'deepseek-chat',

  // 生成参数：与 CLI 版保持一致
  DEFAULT_TEMPERATURE: 1.2,
  DEFAULT_MAX_TOKENS: 300,
  MAX_HISTORY: 20,

  // 单次批量生成的上限，防止手滑把 Key 刷爆
  MAX_BATCH_LINES: 30,

  // 小程序端没有文件系统，会话历史存微信本地缓存
  STORAGE_KEY_SETTINGS: 'pdg.settings.v1',
  STORAGE_KEY_PERSONA: 'pdg.persona.v1',
  STORAGE_KEY_CONVERSATIONS: 'pdg.conversations.v1',
  MAX_CONVERSATIONS: 20
};
