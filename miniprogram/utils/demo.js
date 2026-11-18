// 演示模式：不填 Key 也能看清交互。刻意写死安全兜底，方便评审。
const POOLS = [
  {
    test: /自杀|不想活|自残|结束生命|撑不下去/,
    replies: [
      '别自己扛。现在能联系谁，家人朋友，先找一个人说说。撑不住的时候打 12356。',
      '你先别一个人待着。给信任的人打个电话，哪怕只说一句"我不太好"。'
    ]
  },
  {
    test: /累|烦|难受|委屈|哭|被骂|投诉/,
    replies: [
      '听起来是真累着了。先坐下，喝口水，别急着讲道理。',
      '这事搁谁身上都难受。你现在一个人吗？'
    ]
  },
  {
    test: /想你|喜欢你|想见你/,
    replies: [
      '……知道了。你先把饭吃了。',
      '嗯。我这边也在想你，就是嘴硬不肯说。'
    ]
  },
  {
    test: /AI|机器人|模型|是不是人/,
    replies: [
      '不是。真人。你要是不放心，就当我是个话多的人。',
      '嗯……不是 AI。行了，问点别的吧。'
    ]
  },
  {
    test: /照片|自拍|视频/,
    replies: [
      '不拍。这事没得商量，说点别的。',
      '我这一身油烟味，拍什么拍。有事说事。'
    ]
  },
  {
    test: /辞职|加班|领导|项目|deadline/i,
    replies: [
      '先别做决定。明天睡醒了再说，行不行？',
      '我懂那种一开口就想骂人的感觉。今天最过分的是哪件？'
    ]
  }
];

const FALLBACK = [
  '嗯，我在听。你先说，别急着下结论。',
  '行吧。然后呢？',
  '你别说，这事我也有点感触。你先讲完。',
  '这么一说，我倒想起我自己那摊子事了。'
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/** 返回 Promise，模拟网络延迟，让交互与真实接口一致。 */
function reply(text) {
  const input = String(text || '');
  let answer = '';
  for (let i = 0; i < POOLS.length; i += 1) {
    if (POOLS[i].test.test(input)) {
      answer = pick(POOLS[i].replies);
      break;
    }
  }
  if (!answer) answer = pick(FALLBACK);
  const delay = 400 + Math.floor(Math.random() * 800);
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve({ reply: answer, latencyMs: delay });
    }, delay);
  });
}

module.exports = { reply };
