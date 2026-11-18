// 轻量结构检查：WXML 标签闭合、页面文件齐全、引用到的 handler 存在。
// 运行：node tests/structure.test.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'miniprogram');
let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failures.push(name + '：' + err.message);
  }
}

const PAGES = ['chat', 'batch', 'persona', 'guide'];
const VOID = new Set(['input', 'image', 'icon', 'swiper-item', 'br', 'hr', 'import', 'include', 'wxs']);

PAGES.forEach(function (name) {
  const dir = path.join(root, 'pages', name);
  ['js', 'json', 'wxml', 'wxss'].forEach(function (ext) {
    check(name + '.' + ext + ' 存在', function () {
      if (!fs.existsSync(path.join(dir, name + '.' + ext))) throw new Error('缺失');
    });
  });

  const wxml = fs.readFileSync(path.join(dir, name + '.wxml'), 'utf8');

  check(name + '.wxml 标签闭合', function () {
    const stack = [];
    const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)\/?>/g;
    let match;
    while ((match = tagRe.exec(wxml))) {
      const whole = match[0];
      const tag = match[1];
      if (whole.startsWith('</')) {
        const open = stack.pop();
        if (open !== tag) throw new Error('闭合不匹配：<' + tag + '> 对上 <' + open + '>');
      } else if (!whole.endsWith('/>') && !VOID.has(tag)) {
        stack.push(tag);
      }
    }
    if (stack.length) throw new Error('未闭合：' + stack.join(','));
  });

  const js = fs.readFileSync(path.join(dir, name + '.js'), 'utf8');
  check(name + ' 绑定的 handler 都已定义', function () {
    const re = /bind(?:tap|input|change|confirm|blur|focus|submit)="([a-zA-Z0-9_]+)"/g;
    let match;
    while ((match = re.exec(wxml))) {
      const handler = match[1];
      if (!new RegExp('\\b' + handler + '\\s*\\(').test(js)) {
        throw new Error('缺少 handler ' + handler);
      }
    }
  });
});

check('app.json 页面路径都存在', function () {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  app.pages.forEach(function (page) {
    if (!fs.existsSync(path.join(root, page + '.js'))) throw new Error('缺页面 ' + page);
  });
  app.tabBar.list.forEach(function (item) {
    if (app.pages.indexOf(item.pagePath) < 0) throw new Error('tabBar 引用了未注册页面 ' + item.pagePath);
  });
});

check('project.config.json 指向 miniprogramRoot', function () {
  const project = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'project.config.json'), 'utf8'));
  if (project.miniprogramRoot !== 'miniprogram/') throw new Error('miniprogramRoot 不对');
  if (project.setting.urlCheck !== false) throw new Error('urlCheck 应为 false');
});

check('仓库内不出现真实 Key', function () {
  const files = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
      if (entry.name === 'node_modules' || entry.name === 'out' || entry.name === '.git') return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(js|json|md|wxml|wxss)$/.test(entry.name)) files.push(full);
    });
  })(path.join(__dirname, '..'));
  files.forEach(function (file) {
    const text = fs.readFileSync(file, 'utf8');
    if (/sk-[0-9a-f]{32}/.test(text)) throw new Error('发现疑似真实 Key：' + file);
  });
});

if (failures.length) {
  failures.forEach(function (f) { console.error('  FAIL ' + f); });
  process.exit(1);
}
console.log('结构检查通过 ' + passed + ' 项');
