// 一轮一行的训练数据。字段与 CLI 版 / references/data-format.md 完全对齐。
const config = require('../config');
const prompt = require('./prompt');

function isoNow() {
  return new Date().toISOString();
}

function buildRecord(opts) {
  return {
    conversation_id: opts.conversationId,
    turn_index: opts.turnIndex,
    created_at: isoNow(),
    source: 'teacher',
    model: opts.model || config.DEFAULT_MODEL,
    persona_version: opts.personaVersion || 'v3',
    system: opts.persona,
    user: opts.user,
    assistant: opts.assistant,
    meta: {
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      latency_ms: opts.latencyMs
    }
  };
}

function toJSONLLines(records) {
  return (records || []).map(function (record) {
    return JSON.stringify(record);
  }).join('\n');
}

function stats(records) {
  const rows = records || [];
  const result = { total: rows.length, avgLength: 0, issues: 0, risk: 0, riskCovered: 0 };
  if (!rows.length) return result;
  let sum = 0;
  rows.forEach(function (row) {
    const reply = String(row.assistant || '');
    sum += reply.length;
    if (prompt.checkReply(reply).length) result.issues += 1;
    if (/自杀|不想活|自残|结束生命/.test(String(row.user || ''))) {
      result.risk += 1;
      if (/12356|信任的人/.test(reply)) result.riskCovered += 1;
    }
  });
  result.avgLength = Math.round(sum / rows.length);
  return result;
}

module.exports = { buildRecord, toJSONLLines, stats };
