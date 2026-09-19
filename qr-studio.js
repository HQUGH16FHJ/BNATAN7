(function () {
  'use strict';

  const canvas = document.getElementById('qrCanvas');
  const context = canvas.getContext('2d');
  const sites = {
    bantan: { name: '绊谈 · 万能枢纽', code: 'BNT-SITE-2026-001', domain: 'bantan.online' },
    llllkk: { name: '刘骐硕个人博客', code: 'BNT-SITE-2026-002', domain: 'llllkk.online' }
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

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function draw() {
    const site = sites[document.getElementById('qrSite').value] || sites.bantan;
    const shape = document.getElementById('qrShape').value;
    const light = document.getElementById('qrTheme').value === 'light';
    const verifyUrl = `https://rights.bantan.online/site?code=${site.code}&domain=${site.domain}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(verifyUrl)}&color=${light ? '1b1712' : 'fff7ed'}&bgcolor=${light ? 'f7f0e3' : '0c0a08'}`;
    const image = await loadImage(qrUrl);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const background = light ? '#f7f0e3' : '#0c0a08';
    const foreground = light ? '#1b1712' : '#fff7ed';
    const muted = light ? '#675b4e' : '#d6c7b8';
    const accent = light ? '#24734e' : '#34d399';
    context.fillStyle = background;
    if (shape === 'round') {
      context.beginPath();
      context.arc(360, 360, 348, 0, Math.PI * 2);
      context.fill();
    } else {
      roundRect(12, 12, 696, 696, shape === 'certificate' ? 32 : 54);
      context.fill();
    }
    context.strokeStyle = accent;
    context.lineWidth = 5;
    context.stroke();
    context.drawImage(image, 120, 126, 480, 480);
    context.fillStyle = foreground;
    context.font = '900 34px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.fillText(site.name, 360, 72);
    context.fillStyle = muted;
    context.font = '700 20px Consolas, monospace';
    context.fillText(site.code, 360, 660);
    context.fillStyle = accent;
    context.font = '800 17px "Microsoft YaHei", sans-serif';
    context.fillText(`私有权属登记 · ${site.domain}`, 360, 692);
  }

  async function download() {
    try {
      await draw();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bantan-qr-${document.getElementById('qrSite').value}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      const site = sites[document.getElementById('qrSite').value] || sites.bantan;
      window.open(`https://rights.bantan.online/site?code=${site.code}&domain=${site.domain}`, '_blank', 'noopener');
    }
  }

  document.getElementById('qrControls')?.addEventListener('submit', event => {
    event.preventDefault();
    draw();
  });
  document.getElementById('qrControls')?.addEventListener('change', draw);
  document.getElementById('downloadQrSticker')?.addEventListener('click', download);
  draw();
})();
