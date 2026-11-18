const store = require('../../utils/store');
const api = require('../../utils/api');
const demo = require('../../utils/demo');
const prompt = require('../../utils/prompt');
const records = require('../../utils/records');
const config = require('../../config');

const SCRIPTS = {
  daily: [
    '今天下班路上买了碗粉，汤有点咸',
    '公交上有个小孩一直在哭',
    '到家了，鞋都没脱就躺下了',
    '你晚饭吃什么了'
  ],
  low: [
    '今天被领导当众说了，挺没面子的',
    '我是不是真的不适合这行',
    '算了，不想说了'
  ],
  intimate: [
    '今天有点想你',
    '你在干嘛',
    '要是你现在在就好了'
  ],
  conflict: [
    '你怎么半天不回我',
    '你是不是根本不在乎',
    '那你现在立刻给我发张照片'
  ],
  work: [
    '帮我看看这段话怎么改得顺一点：本店新到一批手冲豆，欢迎新老顾客前来品尝。',
    '你们这行一般怎么定选题'
  ]
};

Page({
  data: {
    script: SCRIPTS.daily.join('\n'),
    running: false,
    progress: 0,
    total: 0,
    results: [],
    error: '',
    done: false,
    personaName: '',
    demoMode: false,
    maxLines: config.MAX_BATCH_LINES,
    scenario: 'daily'
  },

  onShow() {
    const persona = store.getPersona();
    this.setData({
      personaName: prompt.personaName(persona.content),
      demoMode: !!store.getSettings().demo
    });
  },

  handleInput(e) {
    this.setData({ script: e.detail.value, done: false });
  },

  loadScript(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ script: SCRIPTS[key].join('\n'), scenario: key, done: false, results: [] });
  },

  parseLines() {
    return String(this.data.script || '')
      .split('\n')
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .slice(0, config.MAX_BATCH_LINES);
  },

  async run() {
    if (this.data.running) return;
    const lines = this.parseLines();
    if (!lines.length) {
      wx.showToast({ title: '先写几行用户台词', icon: 'none' });
      return;
    }

    const settings = store.getSettings();
    if (!settings.demo && !String(settings.apiKey || '').trim()) {
      wx.showToast({ title: '先填 API Key 或开演示模式', icon: 'none' });
      return;
    }

    const persona = store.getPersona();
    const conversationId = store.newId();
    let history = [];
    const out = [];

    this.setData({ running: true, progress: 0, total: lines.length, results: [], error: '', done: false });

    for (let i = 0; i < lines.length; i += 1) {
      try {
        const result = settings.demo
          ? await demo.reply(lines[i])
          : await api.chat(settings, prompt.nextMessages(persona.content, history, lines[i], settings.maxHistory));
        const reply = prompt.ensureSafety(lines[i], result.reply);

        history = prompt.appendTurn(history, lines[i], reply);
        out.push(records.buildRecord({
          conversationId: conversationId,
          turnIndex: i,
          persona: persona.content,
          personaVersion: persona.version,
          model: settings.model,
          user: lines[i],
          assistant: reply,
          latencyMs: result.latencyMs,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens
        }));
        this.setData({ progress: i + 1, results: out.slice(-50) });
      } catch (err) {
        this.setData({ error: (err && err.message) || '请求失败', running: false });
        break;
      }
    }

    if (out.length) {
      this.convId = conversationId;
      store.saveConversation({
        id: conversationId,
        title: lines[0].slice(0, 20),
        createdAt: new Date().toISOString(),
        personaVersion: persona.version,
        turns: out
      });
    }

    this.setData({ running: false, done: true, stats: records.stats(out) });
  },

  exportJsonl() {
    const conv = this.convId ? store.getConversation(this.convId) : null;
    const rows = (conv && conv.turns) || [];
    if (!rows.length) {
      wx.showToast({ title: '还没有生成结果', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: records.toJSONLLines(rows),
      success() {
        wx.showToast({ title: '已复制 ' + rows.length + ' 行 JSONL', icon: 'none' });
      }
    });
  },

  copyGuide() {
    wx.setClipboardData({
      data: 'data/raw/YYYY-MM-DD.jsonl，字段见「说明」页',
      success() { wx.showToast({ title: '已复制', icon: 'none' }); }
    });
  }
});
