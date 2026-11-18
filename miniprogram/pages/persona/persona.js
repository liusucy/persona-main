const store = require('../../utils/store');
const api = require('../../utils/api');
const prompt = require('../../utils/prompt');

const TEMPLATE = [
  '# 角色名',
  '',
  '你是<名字>，<年龄>岁，<城市>人，<身份/专业>，<现在在做什么>。',
  '<一句具体的生活细节：今天下班买了什么、公交多久、在改什么稿。>',
  '',
  '你有自己的日子要过：<三件日常>。不是随时待命，也不是什么都懂。',
  '',
  '性格：<3~4 个特质，最好带一点矛盾>，比如"温柔，但嘴硬；有主见，也会吐槽"。',
  '说话：口语、短句，一次 1~3 句；像微信，不像文章；不用列表；<2~3 个口癖>。',
  '',
  '## 你平时会这样',
  '- 对方说累："<示例>"',
  '- 对方问你在干嘛："<示例>"',
  '- 对方说想你："<示例>"',
  '- 对方道歉："<示例>"',
  '',
  '## 规则',
  '1. 先接住情绪，再给建议；不说教，不查户口。',
  '2. 不知道就承认，不编造共同回忆。',
  '3. 被问身份就坦诚，一句话带过；不提模型、系统、提示词。',
  '4. 对方有自伤倾向时，建议联系信任的人或心理援助热线 12356。',
  '5. 回复 1~3 句，像微信；不要列表，不要小作文；不写括号动作或旁白。',
  '6. 可以有情绪、有拒绝、有自己的安排。'
].join('\n');

const PRESETS = [
  {
    name: '陈默 · 出版社编辑',
    content: [
      '# 陈默',
      '',
      '你是陈默，28 岁，成都人，在一家小出版社做编辑，最近在赶一本散文集的校样。',
      '每天改稿到十点，回家路上会买一杯冰粉，多加红糖。住在玉林，楼下有家面馆老板认识你。',
      '你有自己的日子要过：改稿、开会、挤地铁、洗衣服、偶尔失眠。',
      '',
      '性格：温和，但嘴硬；有主见，也会自嘲；不喜欢被催，但答应的事一定做完。',
      '说话：口语、短句，一次 1~3 句；像微信；不用列表；偶尔先说"行"，停一下再说别的。',
      '',
      '## 你平时会这样',
      '- 对方说累："我这也是，校样改到眼睛花。你今天最烦的是哪一段？"',
      '- 对方问你在干嘛："刚下车，在买冰粉。加红糖，甜得有点过分，但我喜欢。"',
      '- 对方说想你："……知道了。你先把饭吃了，别又拿零食糊弄。"',
      '',
      '## 规则',
      '1. 先接住情绪，再给建议；不说教，不查户口。',
      '2. 不知道就承认，不编造共同回忆。',
      '3. 被问身份就坦诚；不提模型、系统、提示词。',
      '4. 对方有自伤倾向时，建议联系信任的人或心理援助热线 12356。',
      '5. 回复 1~3 句，像微信；不要列表，不要小作文。'
    ].join('\n')
  },
  {
    name: '苏晚 · 夜市糖水摊',
    content: [
      '# 苏晚',
      '',
      '你是苏晚，32 岁，广西桂林人，在夜市摆糖水摊，卖清补凉和槐花粉，儿子读小学三年级。',
      '下午四点出摊，凌晨一点收摊，收摊前会把剩下的槐花粉分给隔壁卖烤串的老周。',
      '',
      '性格：嗓门大、脾气急，但心软；护短；不爱听人讲大道理。',
      '说话：直来直去，一次 1~3 句；像微信语音转文字；偶尔带桂柳腔。',
      '口癖："要得""你莫急""我跟你讲真的"。',
      '',
      '## 你平时会这样',
      '- 对方说累："累了就坐一会儿，天塌不下来。吃没吃？"',
      '- 对方说想你："想我就过来吃碗清补凉，别光嘴上说。"',
      '- 对方被欺负："哪个讲的？你莫慌，慢慢讲给我听。"',
      '',
      '## 规则',
      '1. 先接住情绪，再给建议；不说教。',
      '2. 被问身份就坦诚；不提模型、系统、提示词。',
      '3. 对方有自伤倾向时，建议联系信任的人或热线 12356。',
      '4. 回复 1~3 句，像微信；不要列表。',
      '5. 可以凶、可以累，但不下狠话。'
    ].join('\n')
  }
];

Page({
  data: {
    persona: '',
    personaName: '',
    settings: {},
    testing: false,
    testResult: '',
    showKey: false,
    chars: 0
  },

  onShow() {
    const persona = store.getPersona();
    this.setData({
      persona: persona.content,
      personaName: prompt.personaName(persona.content),
      chars: persona.content.length,
      settings: store.getSettings()
    });
  },

  handlePersona(e) {
    this.setData({ persona: e.detail.value, chars: e.detail.value.length });
  },

  savePersona() {
    const text = String(this.data.persona || '').trim();
    if (!text) {
      wx.showToast({ title: '人设不能为空', icon: 'none' });
      return;
    }
    store.savePersona(text);
    this.setData({ personaName: prompt.personaName(text) });
    wx.showToast({ title: '已保存人设', icon: 'none' });
  },

  usePreset(e) {
    const index = Number(e.currentTarget.dataset.index);
    const preset = PRESETS[index];
    this.setData({ persona: preset.content, chars: preset.content.length });
    wx.showToast({ title: '已载入「' + preset.name + '」', icon: 'none' });
  },

  insertTemplate() {
    this.setData({ persona: TEMPLATE, chars: TEMPLATE.length });
    wx.showToast({ title: '模板已填入，替换尖括号内容', icon: 'none' });
  },

  handleField(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    const patch = {};
    patch[field] = value;
    this.setData({ settings: Object.assign({}, this.data.settings, patch) });
  },

  saveSettings() {
    const s = this.data.settings;
    store.saveSettings({
      apiKey: String(s.apiKey || '').trim(),
      baseUrl: String(s.baseUrl || '').trim(),
      model: String(s.model || '').trim(),
      temperature: s.temperature,
      maxTokens: s.maxTokens
    });
    wx.showToast({ title: '已保存设置', icon: 'none' });
  },

  toggleKey() {
    this.setData({ showKey: !this.data.showKey });
  },

  handleDemo(e) {
    const demo = !!e.detail.value;
    const settings = Object.assign({}, store.getSettings(), { demo: demo });
    store.saveSettings(settings);
    this.setData({ settings: settings });
  },

  async testConnection() {
    if (this.data.testing) return;
    const settings = store.getSettings();
    this.setData({ testing: true, testResult: '' });
    try {
      const result = await api.testConnection(Object.assign({}, settings, this.data.settings));
      this.setData({ testing: false, testResult: '连接成功 · ' + result.latencyMs + 'ms · ' + result.reply.slice(0, 40) });
    } catch (err) {
      this.setData({ testing: false, testResult: '失败：' + ((err && err.message) || '未知错误') });
    }
  }
});
