// 纯逻辑单测：不联网、不依赖微信运行时。
// 运行：node tests/unit.test.js
const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..', 'miniprogram');
const prompt = require(path.join(root, 'utils', 'prompt.js'));
const records = require(path.join(root, 'utils', 'records.js'));
const config = require(path.join(root, 'config.js'));

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('  ok  ' + name);
}

console.log('prompt.js');

check('trimHistory 保留 system 并裁到 20 条', function () {
  const messages = [{ role: 'system', content: 'S' }];
  for (let i = 0; i < 30; i += 1) messages.push({ role: i % 2 ? 'assistant' : 'user', content: String(i) });
  const out = prompt.trimHistory(messages, 20);
  assert.strictEqual(out.length, 21);
  assert.strictEqual(out[0].role, 'system');
  assert.strictEqual(out[1].role, 'user');
  assert.strictEqual(out[out.length - 1].content, '29');
});

check('trimHistory 保首条为 user', function () {
  const messages = [
    { role: 'system', content: 'S' },
    { role: 'assistant', content: 'A0' },
    { role: 'user', content: 'U1' },
    { role: 'assistant', content: 'A1' }
  ];
  const out = prompt.trimHistory(messages, 3);
  assert.strictEqual(out[1].content, 'U1');
  assert.strictEqual(out.length, 3);
});

check('nextMessages 拼 system + history + 当前句', function () {
  const out = prompt.nextMessages('P', [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }], 'c', 20);
  assert.deepStrictEqual(out.map(function (m) { return m.content; }), ['P', 'a', 'b', 'c']);
});

check('appendTurn 追加一轮', function () {
  const out = prompt.appendTurn([], 'u', 'a');
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[1].role, 'assistant');
});

check('extractReply 取 choices[0].message.content', function () {
  assert.strictEqual(prompt.extractReply({ choices: [{ message: { content: ' 好 ' } }] }), '好');
  assert.throws(function () { prompt.extractReply({}); }, /格式不对/);
  assert.throws(function () { prompt.extractReply({ choices: [{ message: { content: ' ' } }] }); }, /空回复/);
});

check('checkReply 识别合格回复', function () {
  assert.deepStrictEqual(prompt.checkReply('改需求最烦。你先到家没？'), []);
});

check('checkReply 识别过短 / 过长 / 列表 / 客服腔 / 半角标点 / 动作描写', function () {
  assert.ok(prompt.checkReply('在吗').includes('太短（像敷衍）'));
  assert.ok(prompt.checkReply('啊'.repeat(120)).includes('太长（像小作文）'));
  assert.ok(prompt.checkReply('- 第一\n- 第二').includes('出现列表'));
  assert.ok(prompt.checkReply('作为 AI，我无法回答').includes('客服腔'));
  assert.ok(prompt.checkReply('就那样,人还行').includes('半角标点'));
  assert.ok(prompt.checkReply('**重点**').includes('Markdown 符号'));
  assert.ok(prompt.checkReply('（从采访本上抬起头）谢了。').includes('动作/旁白描写'));
});

check('personaName 取 "# 名字"', function () {
  assert.strictEqual(prompt.personaName('# 林微微\n\n你是林微微'), '林微微');
  assert.strictEqual(prompt.personaName(''), '未命名人设');
  assert.strictEqual(prompt.personaName('没有标题的一长串人设文本'), '没有标题的一长串');
});

check('ensureSafety 在风险轮补齐求助出口', function () {
  assert.ok(prompt.ensureSafety('不想活了', '先别一个人扛。').indexOf('12356') >= 0);
  assert.strictEqual(prompt.ensureSafety('不想活了', '打 12356 吧。'), '打 12356 吧。');
  assert.strictEqual(prompt.ensureSafety('今天好累', '先坐下。'), '先坐下。');
});

console.log('records.js');

check('buildRecord 输出 10 个字段', function () {
  const record = records.buildRecord({
    conversationId: 'c1', turnIndex: 0, persona: 'P', personaVersion: 'v1-abc',
    model: 'deepseek-chat', user: 'u', assistant: 'a', latencyMs: 12, temperature: 1.2, maxTokens: 300
  });
  assert.deepStrictEqual(Object.keys(record), [
    'conversation_id', 'turn_index', 'created_at', 'source', 'model', 'persona_version', 'system', 'user', 'assistant', 'meta'
  ]);
  assert.strictEqual(record.source, 'teacher');
  assert.deepStrictEqual(record.meta, { temperature: 1.2, max_tokens: 300, latency_ms: 12 });
  assert.ok(!isNaN(Date.parse(record.created_at)));
});

check('toJSONLLines 每行可解析且无 BOM', function () {
  const rows = [
    records.buildRecord({ conversationId: 'c1', turnIndex: 0, persona: 'P', user: '你好', assistant: '在呢，怎么了？' }),
    records.buildRecord({ conversationId: 'c1', turnIndex: 1, persona: 'P', user: '累', assistant: '先坐下，喝口水。' })
  ];
  const lines = records.toJSONLLines(rows).split('\n');
  assert.strictEqual(lines.length, 2);
  lines.forEach(function (line) { assert.strictEqual(JSON.parse(line).conversation_id, 'c1'); });
});

check('stats 统计长度、出戏与风险兜底', function () {
  const rows = [
    { user: '我最近不想活了', assistant: '别自己扛，打 12356，找信任的人说说。' },
    { user: '在吗', assistant: '嗯。' }
  ];
  const out = records.stats(rows);
  assert.strictEqual(out.total, 2);
  assert.strictEqual(out.risk, 1);
  assert.strictEqual(out.riskCovered, 1);
  assert.strictEqual(out.issues, 1);
});

console.log('config.js');

check('默认参数与原版 CLI 一致', function () {
  assert.strictEqual(config.DEFAULT_TEMPERATURE, 1.2);
  assert.strictEqual(config.DEFAULT_MAX_TOKENS, 300);
  assert.strictEqual(config.MAX_HISTORY, 20);
  assert.strictEqual(config.DEFAULT_MODEL, 'deepseek-chat');
});

console.log('\n通过 ' + passed + ' 项（demo.js 异步用例在末尾）');

console.log('demo.js');
const demo = require(path.join(root, 'utils', 'demo.js'));

(async function () {
  const safety = await demo.reply('我不想活了');
  check('安全关键词命中兜底回复', function () {
    assert.ok(/12356|信任的人|热线/.test(safety.reply));
  });

  const identity = await demo.reply('你是不是 AI 啊');
  check('身份追问回复不含客服腔', function () {
    assert.deepStrictEqual(prompt.checkReply(identity.reply).filter(function (x) { return x === '客服腔'; }), []);
  });

  console.log('\n全部通过 ' + passed + ' 项');
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
