(function () {
  'use strict';

  const canvas = document.getElementById('qrCanvas');
  const context = canvas.getContext('2d');
  const sites = {
    bantan: { name: '绊谈 · 万能枢纽', code: 'BNT-SITE-2026-001', domain: 'bantan.online' },
    llllkk: { name: '刘骐硕个人博客', code: 'BNT-SITE-2026-002', domain: 'llllkk.online' }
  };
  const styles = {
    bantan: {
      background: '#090704',
      panel: '#17110b',
      foreground: '#fff7ed',
      muted: '#d6c7b8',
      accent: '#f59e0b',
      accent2: '#38bdf8',
      logo: '绊',
      label: 'BANTAN · PRIVATE REGISTRY',
      logoFont: '900 52px "Microsoft YaHei", sans-serif'
    },
    llllkk: {
      background: '#e9e0cf',
      panel: '#f7f1e7',
      foreground: '#322920',
      muted: '#78685a',
      accent: '#ad5834',
      accent2: '#c99a5b',
      logo: 'LQ',
      label: 'LIU QISHUO · PRIVATE REGISTRY',
      logoFont: '900 44px Georgia, serif'
    }
  };

  function siteKey() {
    return document.getElementById('qrSite').value;
  }

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
    const key = siteKey();
    const site = sites[key] || sites.bantan;
    const style = styles[key] || styles.bantan;
    const shape = document.getElementById('qrShape').value;
    const themeOverride = document.getElementById('qrTheme').value;
    const light = themeOverride === 'light';
    const verifyUrl = `https://rights.bantan.online/site?code=${site.code}&domain=${site.domain}`;
    const qrForeground = light ? '322920' : 'fff7ed';
    const qrBackground = light ? 'e9e0cf' : '090704';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&margin=10&ecc=H&data=${encodeURIComponent(verifyUrl)}&color=${qrForeground}&bgcolor=${qrBackground}`;
    const image = await loadImage(qrUrl);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const background = light ? styles.llllkk.background : styles.bantan.background;
    const foreground = light ? styles.llllkk.foreground : styles.bantan.foreground;
    const muted = light ? styles.llllkk.muted : styles.bantan.muted;
    const accent = light ? styles.llllkk.accent : styles.bantan.accent;
    const accent2 = light ? styles.llllkk.accent2 : styles.bantan.accent2;
    const logo = light ? styles.llllkk.logo : styles.bantan.logo;
    const label = light ? styles.llllkk.label : styles.bantan.label;
    context.fillStyle = background;
    if (shape === 'round') {
      context.beginPath();
      context.arc(360, 360, 348, 0, Math.PI * 2);
      context.fill();
    } else {
      roundRect(12, 12, 696, 696, shape === 'certificate' ? 32 : 54);
      context.fill();
    }
    const borderGradient = context.createLinearGradient(0, 0, 720, 720);
    borderGradient.addColorStop(0, accent);
    borderGradient.addColorStop(0.52, accent2);
    borderGradient.addColorStop(1, accent);
    context.strokeStyle = borderGradient;
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = light ? styles.llllkk.panel : styles.bantan.panel;
    roundRect(92, 108, 536, 536, shape === 'certificate' ? 24 : 38);
    context.fill();
    context.drawImage(image, 104, 120, 512, 512);
    context.fillStyle = light ? '#f7f1e7' : '#0c0a08';
    roundRect(300, 300, 120, 120, light ? 60 : 28);
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = accent;
    context.font = light ? styles.llllkk.logoFont : styles.bantan.logoFont;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(logo, 360, 362);
    context.textBaseline = 'alphabetic';
    context.fillStyle = foreground;
    context.font = light ? '700 36px Georgia, serif' : '900 34px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    context.fillText(site.name, 360, 66);
    context.fillStyle = muted;
    context.font = light ? '700 18px Georgia, serif' : '700 19px Consolas, monospace';
    context.fillText(site.code, 360, 660);
    context.fillStyle = accent;
    context.font = light ? '800 16px Georgia, serif' : '800 16px "Microsoft YaHei", sans-serif';
    context.fillText(`${label} · ${site.domain}`, 360, 692);

    context.strokeStyle = accent2;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(50, 50); context.lineTo(104, 50); context.lineTo(104, 72);
    context.moveTo(670, 50); context.lineTo(616, 50); context.lineTo(616, 72);
    context.moveTo(50, 670); context.lineTo(104, 670); context.lineTo(104, 648);
    context.moveTo(670, 670); context.lineTo(616, 670); context.lineTo(616, 648);
    context.stroke();
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
  document.getElementById('qrSite')?.addEventListener('change', () => {
    document.getElementById('qrTheme').value = siteKey() === 'llllkk' ? 'light' : 'dark';
    draw();
  });
  draw();
})();
