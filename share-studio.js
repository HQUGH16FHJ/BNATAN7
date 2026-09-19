(function () {
  'use strict';

  const canvas = document.getElementById('shareCanvas');
  const context = canvas.getContext('2d');
  const themes = {
    dark: { background: '#090704', panel: '#17110b', title: '#fff7ed', sub: '#d6c7b8', accent: '#f59e0b', accent2: '#38bdf8' },
    amber: { background: '#251507', panel: '#341d0b', title: '#fff7ed', sub: '#f8d9a5', accent: '#fbbf24', accent2: '#fb7185' },
    light: { background: '#f7f0e3', panel: '#fffaf1', title: '#1b1712', sub: '#675b4e', accent: '#24734e', accent2: '#f59e0b' }
  };

  function roundRect(x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  function draw() {
    const title = document.getElementById('shareTitle').value.trim() || '绊谈 · 万能枢纽';
    const subtitle = document.getElementById('shareSubtitle').value.trim() || '600+ 免费在线工具一站直达';
    const type = document.getElementById('shareType').value;
    const theme = themes[document.getElementById('shareTheme').value] || themes.dark;
    context.fillStyle = theme.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const glow = context.createRadialGradient(960, 90, 0, 960, 90, 520);
    glow.addColorStop(0, theme.accent + '42');
    glow.addColorStop(0.55, theme.accent2 + '18');
    glow.addColorStop(1, 'transparent');
    context.fillStyle = glow;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = theme.panel;
    roundRect(54, 54, 1092, 522, 36);
    context.fill();
    context.strokeStyle = theme.accent + '55';
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = theme.accent;
    roundRect(92, 92, 68, 68, 20);
    context.fill();
    context.fillStyle = theme.background;
    context.font = '900 38px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.fillText('绊', 126, 141);
    context.textAlign = 'left';

    context.fillStyle = theme.sub;
    context.font = '700 24px "Microsoft YaHei", sans-serif';
    context.fillText('BANTAN · 绊谈', 184, 122);
    context.fillStyle = theme.accent;
    context.font = '800 19px "Microsoft YaHei", sans-serif';
    context.fillText(type === 'release' ? 'VERSION RELEASE' : type === 'rights' ? 'PRIVATE REGISTRY' : 'OFFICIAL SITE', 184, 151);

    context.fillStyle = theme.title;
    context.font = '900 68px "Microsoft YaHei", sans-serif';
    fitText(title, 100, 300, 990, 68, 42);
    context.fillStyle = theme.sub;
    context.font = '500 30px "Microsoft YaHei", sans-serif';
    fitText(subtitle, 102, 366, 940, 30, 21);

    context.fillStyle = theme.accent;
    roundRect(100, 438, 260, 58, 18);
    context.fill();
    context.fillStyle = theme.background;
    context.font = '900 22px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.fillText('bantan.online', 230, 475);
    context.fillStyle = theme.sub;
    context.font = '500 20px "Microsoft YaHei", sans-serif';
    context.textAlign = 'right';
    context.fillText('连接需求，点亮可能', 1098, 475);
    context.textAlign = 'left';
  }

  function fitText(text, x, y, maxWidth, size, minSize) {
    let current = size;
    while (current > minSize && context.measureText(text).width > maxWidth) {
      current -= 2;
      context.font = context.font.replace(/\d+px/, current + 'px');
    }
    context.fillText(text, x, y);
  }

  document.getElementById('shareControls')?.addEventListener('submit', event => {
    event.preventDefault();
    draw();
  });
  document.getElementById('shareControls')?.addEventListener('input', draw);
  document.getElementById('shareControls')?.addEventListener('change', draw);
  document.getElementById('downloadShareImage')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'bantan-share-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
  draw();
})();
