const records = require('../../utils/records');
const store = require('../../utils/store');
const prompt = require('../../utils/prompt');

const SAMPLE_MESSAGES = [
  {
    role: 'system',
    content: '# 林微微\n\n你是林微微，20 岁，贵州贵阳人，大四，在一家出版社实习……'
  },
  { role: 'user', content: '今天加班到十点，老板还临时改需求' },
  { role: 'assistant', content: '改需求最烦。你先到家没？' }
];

Page({
  data: {
    personaName: '',
    version: '',
    sample: JSON.stringify(SAMPLE_MESSAGES, null, 2),
    schema: [
      { key: 'conversation_id', desc: '会话 id，同一次进入页面的多轮共用一个' },
      { key: 'turn_index', desc: '从 0 开始的轮次' },
      { key: 'created_at', desc: 'UTC ISO 时间，如 2026-11-18T13:20:01Z' },
      { key: 'source', desc: '固定 teacher' },
      { key: 'model', desc: '模型名，如 deepseek-chat' },
      { key: 'persona_version', desc: '随人设自动变化，改了人设就变' },
      { key: 'system', desc: '当轮完整人设（提示词）' },
      { key: 'user', desc: '用户这一句' },
      { key: 'assistant', desc: '她这一句' },
      { key: 'meta', desc: 'temperature / max_tokens / latency_ms' }
    ]
  },

  onShow() {
    const persona = store.getPersona();
    this.setData({
      personaName: prompt.personaName(persona.content),
      version: persona.version
    });
  },

  copySample() {
    wx.setClipboardData({
      data: this.data.sample,
      success() { wx.showToast({ title: '已复制 messages 示例', icon: 'none' }); }
    });
  },

  copySchema() {
    const rows = this.data.schema.map(function (row) { return row.key + '\t' + row.desc; }).join('\n');
    wx.setClipboardData({
      data: rows,
      success() { wx.showToast({ title: '已复制字段表', icon: 'none' }); }
    });
  }
});
