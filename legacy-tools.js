(function () {
  'use strict';

  const worldZones = [
    ['北京', 8], ['东京', 9], ['纽约', -5], ['伦敦', 0],
    ['巴黎', 1], ['悉尼', 11], ['迪拜', 4], ['洛杉矶', -8]
  ];
  let legacyTimerInterval = null;
  let legacyTimerEnd = 0;

  window.legacyGenGradient = function () {
    const first = document.getElementById('legacy-grad-c1').value;
    const second = document.getElementById('legacy-grad-c2').value;
    const type = document.getElementById('legacy-grad-type').value;
    const css = type === 'linear'
      ? 'linear-gradient(135deg, ' + first + ', ' + second + ')'
      : type === 'radial'
        ? 'radial-gradient(circle, ' + first + ', ' + second + ')'
        : 'conic-gradient(' + first + ', ' + second + ', ' + first + ')';
    document.getElementById('legacy-grad-preview').style.background = css;
    document.getElementById('legacy-grad-result').textContent = 'background: ' + css + ';';
  };

  window.legacyDecodeJWT = function () {
    const token = document.getElementById('legacy-jwt-input').value.trim();
    const result = document.getElementById('legacy-jwt-result');
    if (!token) {
      result.textContent = '等待输入';
      return;
    }
    try {
      const parts = token.split('.');
      if (parts.length < 2) throw new Error('JWT 格式错误');
      const decode = value => {
        let normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        while (normalized.length % 4) normalized += '=';
        const binary = atob(normalized);
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
      };
      const header = decode(parts[0]);
      const payload = decode(parts[1]);
      result.innerHTML = '<strong style="color:var(--accent);">Header</strong><pre style="white-space:pre-wrap;font-size:10px;">' +
        JSON.stringify(header, null, 2) + '</pre><strong style="color:var(--accent-2);">Payload</strong><pre style="white-space:pre-wrap;font-size:10px;">' +
        JSON.stringify(payload, null, 2) + '</pre>';
    } catch (error) {
      result.innerHTML = '<span style="color:#ef4444;">JWT 解码失败：' + error.message + '</span>';
    }
  };

  window.legacyTestRegex = function () {
    const pattern = document.getElementById('legacy-regex-pattern').value;
    const text = document.getElementById('legacy-regex-text').value;
    const result = document.getElementById('legacy-regex-result');
    let flags = '';
    if (document.getElementById('legacy-regex-g').checked) flags += 'g';
    if (document.getElementById('legacy-regex-i').checked) flags += 'i';
    try {
      const regex = new RegExp(pattern, flags);
      const matches = text.match(regex);
      result.innerHTML = matches
        ? '<strong style="color:#34d399;">匹配 ' + matches.length + ' 个结果</strong><br>' + matches.map(item => '“' + item + '”').join('、')
        : '<span style="color:#f59e0b;">无匹配结果</span>';
    } catch (error) {
      result.innerHTML = '<span style="color:#ef4444;">正则表达式错误：' + error.message + '</span>';
    }
  };

  window.legacyGenLorem = function () {
    const count = Math.max(1, parseInt(document.getElementById('legacy-lorem-count').value, 10) || 3);
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'eiusmod', 'tempor', 'incididunt'];
    const result = document.getElementById('legacy-lorem-result');
    result.textContent = Array.from({ length: count }, () => {
      const sentence = Array.from({ length: 9 + Math.floor(Math.random() * 7) }, () => words[Math.floor(Math.random() * words.length)]);
      sentence[0] = sentence[0].charAt(0).toUpperCase() + sentence[0].slice(1);
      return sentence.join(' ') + '.';
    }).join(' ');
  };

  window.legacyGenerateQR = function () {
    const text = document.getElementById('legacy-qr-input').value.trim();
    const result = document.getElementById('legacy-qr-result');
    if (!text) {
      result.textContent = '输入内容后生成';
      return;
    }
    result.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' +
      encodeURIComponent(text) + '" alt="二维码" style="max-width:180px;width:100%;border-radius:10px;">';
  };

  window.legacyCalcBMI = function () {
    const height = parseFloat(document.getElementById('legacy-bmi-height').value);
    const weight = parseFloat(document.getElementById('legacy-bmi-weight').value);
    const result = document.getElementById('legacy-bmi-result');
    if (!height || !weight) {
      result.textContent = '请输入身高和体重';
      return;
    }
    const bmi = weight / Math.pow(height / 100, 2);
    const category = bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '偏胖' : '肥胖';
    result.innerHTML = '<strong style="color:var(--accent);font-size:20px;">' + bmi.toFixed(1) + '</strong><br>' +
      '<span style="color:var(--accent-2);">' + category + '</span>';
  };

  function updateLegacyTimerDisplay(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const minutes = String(Math.floor(total / 60)).padStart(2, '0');
    const seconds = String(total % 60).padStart(2, '0');
    document.getElementById('legacy-timer-display').textContent = minutes + ':' + seconds;
  }

  window.legacyStartTimer = function () {
    if (legacyTimerInterval) clearInterval(legacyTimerInterval);
    const minutes = parseInt(document.getElementById('legacy-timer-minutes').value, 10) || 0;
    const seconds = parseInt(document.getElementById('legacy-timer-seconds').value, 10) || 0;
    legacyTimerEnd = Date.now() + (minutes * 60 + seconds) * 1000;
    if (legacyTimerEnd <= Date.now()) {
      updateLegacyTimerDisplay(0);
      return;
    }
    legacyTimerInterval = setInterval(() => {
      const left = legacyTimerEnd - Date.now();
      updateLegacyTimerDisplay(left);
      if (left <= 0) {
        clearInterval(legacyTimerInterval);
        legacyTimerInterval = null;
        document.getElementById('legacy-timer-display').textContent = '时间到';
      }
    }, 250);
  };

  window.legacyResetTimer = function () {
    if (legacyTimerInterval) clearInterval(legacyTimerInterval);
    legacyTimerInterval = null;
    document.getElementById('legacy-timer-minutes').value = 5;
    document.getElementById('legacy-timer-seconds').value = 0;
    updateLegacyTimerDisplay(5 * 60 * 1000);
  };

  window.legacyRandomPicker = function () {
    const items = document.getElementById('legacy-picker-input').value
      .split('\n').map(item => item.trim()).filter(Boolean);
    const result = document.getElementById('legacy-picker-result');
    result.textContent = items.length
      ? '选中：' + items[Math.floor(Math.random() * items.length)]
      : '请先输入选项';
  };

  function renderLegacyExams() {
    const list = document.getElementById('legacy-exam-list');
    if (!list) return;
    let exams = [];
    try { exams = JSON.parse(localStorage.getItem('legacy_exams') || '[]'); } catch (error) {}
    if (!exams.length) {
      list.innerHTML = '<span style="color:var(--sub);font-size:11px;">暂无考试安排</span>';
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    list.innerHTML = exams.map((exam, index) => {
      const days = Math.ceil((new Date(exam.date + 'T00:00:00') - today) / 86400000);
      return '<div style="display:flex;align-items:center;gap:6px;padding:5px 0;font-size:11px;">' +
        '<span>' + exam.name + '</span><span style="color:var(--sub);">' + exam.date + '</span>' +
        '<strong style="margin-left:auto;color:var(--accent);">' + days + '天</strong>' +
        '<button type="button" onclick="legacyDeleteExam(' + index + ')" style="border:0;background:none;color:#f87171;cursor:pointer;">×</button></div>';
    }).join('');
  }

  window.legacyAddExam = function () {
    const name = document.getElementById('legacy-exam-name').value.trim();
    const date = document.getElementById('legacy-exam-date').value;
    if (!name || !date) {
      if (window.showToast) window.showToast('请填写考试名称和日期');
      return;
    }
    let exams = [];
    try { exams = JSON.parse(localStorage.getItem('legacy_exams') || '[]'); } catch (error) {}
    exams.push({ name, date });
    localStorage.setItem('legacy_exams', JSON.stringify(exams));
    document.getElementById('legacy-exam-name').value = '';
    document.getElementById('legacy-exam-date').value = '';
    renderLegacyExams();
  };

  window.legacyDeleteExam = function (index) {
    let exams = [];
    try { exams = JSON.parse(localStorage.getItem('legacy_exams') || '[]'); } catch (error) {}
    exams.splice(index, 1);
    localStorage.setItem('legacy_exams', JSON.stringify(exams));
    renderLegacyExams();
  };

  function updateLegacyWorldClock() {
    const element = document.getElementById('legacy-world-clock');
    if (!element) return;
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    element.innerHTML = worldZones.map(([city, offset]) => {
      const date = new Date(utc + offset * 3600000);
      const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
        .map(value => String(value).padStart(2, '0')).join(':');
      return '<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;">' +
        '<span>' + city + '</span><strong style="color:var(--accent);">' + time + '</strong></div>';
    }).join('');
  }

  function init() {
    updateLegacyWorldClock();
    setInterval(updateLegacyWorldClock, 1000);
    renderLegacyExams();
    updateLegacyTimerDisplay(5 * 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
