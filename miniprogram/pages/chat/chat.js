const store = require('../../utils/store');
const api = require('../../utils/api');
const demo = require('../../utils/demo');
const prompt = require('../../utils/prompt');
const records = require('../../utils/records');

Page({
  data: {
    messages: [],
    input: '',
    pending: false,
    demoMode: false,
    personaName: '',
    personaVersion: '',
    turns: 0,
    anchor: '',
    lastIssues: []
  },

  onLoad() {
    this.history = [];
    this.conversationId = '';
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const settings = store.getSettings();
    const persona = store.getPersona();
    this.persona = persona;
    this.setData({
      demoMode: !!settings.demo,
      personaName: prompt.personaName(persona.content),
      personaVersion: persona.version
    });
    if (!this.conversationId) this.startNewConversation();
  },

  startNewConversation() {
    const conv = {
      id: store.newId(),
      title: '',
      createdAt: new Date().toISOString(),
      personaVersion: this.persona ? this.persona.version : 'v3',
      turns: []
    };
    store.saveConversation(conv);
    this.conversationId = conv.id;
    this.history = [];
    this.setData({ messages: [], turns: 0, lastIssues: [] });
  },

  handleInput(e) {
    this.setData({ input: e.detail.value });
  },

  async send() {
    const text = String(this.data.input || '').trim();
    if (this.data.pending || !text) return;

    const settings = store.getSettings();
    if (!settings.demo && !String(settings.apiKey || '').trim()) {
      wx.showToast({ title: '先填 API Key 或开演示模式', icon: 'none', duration: 2200 });
      return;
    }

    const messages = this.data.messages.concat([
      { id: 'u' + Date.now(), role: 'user', content: text }
    ]);
    this.setData({ messages: messages, input: '', pending: true, anchor: 'anchor-' + messages.length });

    try {
      const result = settings.demo
        ? await demo.reply(text)
        : await api.chat(settings, prompt.nextMessages(this.persona.content, this.history, text, settings.maxHistory));

      const reply = prompt.ensureSafety(text, result.reply);
      const issues = prompt.checkReply(reply);
      this.history = prompt.appendTurn(this.history, text, reply);
      const turnIndex = this.history.length / 2 - 1;

      const record = records.buildRecord({
        conversationId: this.conversationId,
        turnIndex: turnIndex,
        persona: this.persona.content,
        personaVersion: this.persona.version,
        model: settings.model,
        user: text,
        assistant: reply,
        latencyMs: result.latencyMs,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens
      });
      store.appendRecord(this.conversationId, record);

      const nextMessages = this.data.messages.concat([
        { id: 'a' + Date.now(), role: 'assistant', content: reply }
      ]);
      this.setData({
        messages: nextMessages,
        turns: turnIndex + 1,
        pending: false,
        anchor: 'anchor-' + nextMessages.length,
        lastIssues: issues
      });
    } catch (err) {
      this.setData({
        messages: this.data.messages.concat([
          { id: 'e' + Date.now(), role: 'error', content: (err && err.message) || '请求失败' }
        ]),
        pending: false
      });
    }
  },

  async toggleDemo() {
    const settings = store.getSettings();
    const next = store.saveSettings({ demo: !settings.demo });
    this.setData({ demoMode: !!next.demo });
  },

  newChat() {
    this.startNewConversation();
    wx.showToast({ title: '已开始新会话', icon: 'none' });
  },

  exportJsonl() {
    const conv = store.getConversation(this.conversationId);
    const turns = (conv && conv.turns) || [];
    if (!turns.length) {
      wx.showToast({ title: '还没有可导出的对话', icon: 'none' });
      return;
    }
    const text = records.toJSONLLines(turns);
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: '已复制 ' + turns.length + ' 行 JSONL', icon: 'none' });
      }
    });
  },

  previewIssues() {
    const issues = this.data.lastIssues || [];
    if (!issues.length) {
      wx.showToast({ title: '这条回复通过了质检', icon: 'none' });
      return;
    }
    wx.showModal({ title: '质检提示', content: issues.join('、'), showCancel: false });
  }
});
