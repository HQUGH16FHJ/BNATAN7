/* =====================================================================
   OMNI UI v5 — CYBER NEON 赛博霓虹动画层
   霓虹绿/品红/电蓝极光 · 粒子系统 · 赛博扫描线 · 光标拖尾
   ===================================================================== */
(function () {
    'use strict';
    var isFine = window.matchMedia('(pointer: fine)').matches;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ===== 强制深色主题 ===== */
    try {
        var html = document.documentElement;
        html.setAttribute('data-theme', 'dark');
        html.style.colorScheme = 'dark';
        if (window.toggleTheme) {
            window.toggleTheme = function () {
                html.setAttribute('data-theme', 'dark');
                html.style.colorScheme = 'dark';
                localStorage.setItem('theme', 'dark');
            };
        }
    } catch (e) {}

    /* ===== 注入辅助元素 ===== */
    function ensure(id, tag) {
        if (!document.getElementById(id)) {
            var el = document.createElement(tag || 'div');
            el.id = id;
            document.body.appendChild(el);
        }
    }
    ensure('omni-scroll-progress');
    ensure('omni-noise');
    ensure('omni-grid');
    ensure('omni-scanlines');

    /* ===== 霓虹色板 ===== */
    var NEON_GREEN = [245, 158, 11];
    var NEON_PINK = [251, 113, 133];
    var NEON_BLUE = [56, 189, 248];

    /* ===== Aurora 画布（霓虹三色）===== */
    var hasOwnBg = document.getElementById('aurora-canvas') || document.getElementById('cosmic-bg') ||
                   document.querySelector('.cosmos-bg, #starfield, #meteor-shower, .cosmic-orb');
    if (!reduce) {
        var cv = document.createElement('canvas');
        cv.id = hasOwnBg ? 'omni-aurora-overlay' : 'omni-aurora';
        cv.style.cssText = 'position:fixed;inset:0;z-index:-6;pointer-events:none;';
        if (hasOwnBg) cv.style.opacity = '0.3';
        document.body.appendChild(cv);
        (function () {
            var c = cv, x = c.getContext('2d');
            var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
            var blobs = [
                { r: 0.96, g: 0.62, b: 0.04, a: 0.45 },     // 琥珀金
                { r: 0.98, g: 0.44, b: 0.52, a: 0.38 },      // 珊瑚玫
                { r: 0.22, g: 0.74, b: 0.97, a: 0.32 },      // 天空蓝
                { r: 0.96, g: 0.62, b: 0.04, a: 0.3 },       // 琥珀金2
                { r: 0.98, g: 0.44, b: 0.52, a: 0.25 }       // 珊瑚玫2
            ].map(function (b) { return Object.assign({}, b, { sp: 0.12 + Math.random() * 0.3, ph: Math.random() * 6.28 }); });
            function resize() {
                w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
                c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
            }
            var t = 0;
            function draw() {
                t += 0.003;
                x.clearRect(0, 0, w, h);
                x.globalCompositeOperation = 'lighter';
                blobs.forEach(function (b) {
                    b.rx = Math.sin(t * b.sp + b.ph) * 0.5 + 0.5;
                    b.ry = Math.cos(t * b.sp * 0.7 + b.ph) * 0.5 + 0.5;
                    var cx = w * (0.12 + b.rx * 0.76), cy = h * (0.08 + b.ry * 0.84);
                    var rad = Math.max(1, Math.min(w, h) * (0.28 + 0.14 * Math.sin(t * 1.5 + b.ph)));
                    var g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
                    var rr = (b.r * 255) | 0, gg = (b.g * 255) | 0, bb = (b.b * 255) | 0;
                    g.addColorStop(0, 'rgba(' + rr + ',' + gg + ',' + bb + ',' + b.a + ')');
                    g.addColorStop(1, 'rgba(' + rr + ',' + gg + ',' + bb + ',0)');
                    x.fillStyle = g; x.fillRect(0, 0, w, h);
                });
                x.globalCompositeOperation = 'source-over';
                x.fillStyle = 'rgba(0,0,5,0.5)'; x.fillRect(0, 0, w, h);
                requestAnimationFrame(draw);
            }
            addEventListener('resize', resize); resize(); draw();
        })();
    }

    /* ===== 浮动粒子系统（霓虹色）===== */
    if (!reduce) {
        var pc = document.createElement('canvas');
        pc.id = 'omni-particles';
        pc.style.cssText = 'position:fixed;inset:0;z-index:-4;pointer-events:none;';
        document.body.appendChild(pc);
        (function () {
            var c = pc, x = c.getContext('2d');
            var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
            var N = Math.min(90, Math.floor(innerWidth * innerHeight / 16000));
            var P = [];
            var colors = [NEON_GREEN, NEON_PINK, NEON_BLUE, [255, 255, 255]];
            for (var i = 0; i < N; i++) {
                var col = colors[i % colors.length];
                P.push({
                    x: Math.random(), y: Math.random(),
                    vx: (Math.random() - 0.5) * 0.0004,
                    vy: (Math.random() - 0.5) * 0.0004,
                    r: 1 + Math.random() * 3,
                    a: 0.3 + Math.random() * 0.5,
                    col: col, ph: Math.random() * 6.28
                });
            }
            function resize() {
                w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
                c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
            }
            var t = 0;
            function draw() {
                t += 0.01;
                x.clearRect(0, 0, w, h);
                P.forEach(function (p) {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
                    if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
                    var px = p.x * w, py = p.y * h;
                    var glow = 0.5 + 0.5 * Math.sin(t + p.ph);
                    var rr = p.r * dpr;
                    var g = x.createRadialGradient(px, py, 0, px, py, rr * 5);
                    var R = p.col[0], G = p.col[1], B = p.col[2];
                    var al = p.a * glow;
                    g.addColorStop(0, 'rgba(' + R + ',' + G + ',' + B + ',' + al + ')');
                    g.addColorStop(0.4, 'rgba(' + R + ',' + G + ',' + B + ',' + al * 0.3 + ')');
                    g.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',0)');
                    x.fillStyle = g;
                    x.beginPath(); x.arc(px, py, rr * 5, 0, 6.283); x.fill();
                    x.fillStyle = 'rgba(' + R + ',' + G + ',' + B + ',' + al + ')';
                    x.beginPath(); x.arc(px, py, rr, 0, 6.283); x.fill();
                });
                requestAnimationFrame(draw);
            }
            addEventListener('resize', resize); resize(); draw();
        })();
    }

    /* ===== 自定义光标（霓虹绿 + 品红拖尾）===== */
    if (isFine && !reduce) {
        var dot = document.createElement('div');
        dot.id = 'omni-cursor-dot';
        var ring = document.createElement('div');
        ring.id = 'omni-cursor-ring';
        var trail = document.createElement('canvas');
        trail.id = 'omni-cursor-trail';
        trail.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
        document.body.appendChild(trail);
        document.body.appendChild(ring);
        document.body.appendChild(dot);

        var mx = innerWidth / 2, my = innerHeight / 2;
        var rx = mx, ry = my;
        var parts = [];
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        trail.width = innerWidth * dpr; trail.height = innerHeight * dpr;
        trail.style.width = innerWidth + 'px'; trail.style.height = innerHeight + 'px';
        var tx = trail.getContext('2d');

        document.addEventListener('mousemove', function (e) {
            mx = e.clientX; my = e.clientY;
            dot.style.left = mx + 'px'; dot.style.top = my + 'px';
            if (Math.random() > 0.35) {
                var col = Math.random() > 0.5 ? NEON_GREEN : NEON_PINK;
                if (Math.random() > 0.8) col = NEON_BLUE;
                parts.push({
                    x: mx * dpr, y: my * dpr, vx: (Math.random() - 0.5) * 2.5,
                    vy: (Math.random() - 0.5) * 2.5, r: 2 + Math.random() * 3,
                    life: 1, col: col
                });
            }
        });

        function loop() {
            rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
            ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
            tx.clearRect(0, 0, trail.width, trail.height);
            parts = parts.filter(function (p) {
                p.x += p.vx; p.y += p.vy; p.life -= 0.025; p.r *= 0.97;
                if (p.life <= 0) return false;
                var g = tx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
                g.addColorStop(0, 'rgba(' + p.col[0] + ',' + p.col[1] + ',' + p.col[2] + ',' + p.life + ')');
                g.addColorStop(1, 'rgba(' + p.col[0] + ',' + p.col[1] + ',' + p.col[2] + ',0)');
                tx.fillStyle = g; tx.beginPath(); tx.arc(p.x, p.y, p.r * 3, 0, 6.283); tx.fill();
                return true;
            });
            requestAnimationFrame(loop);
        }
        loop();

        function bindHover() {
            document.querySelectorAll('a, button, [class*="card"], [class*="btn"], .bento-item, .tool-card, input, select').forEach(function (el) {
                if (el.dataset.omniHover) return;
                el.dataset.omniHover = '1';
                el.addEventListener('mouseenter', function () { ring.classList.add('omni-hover'); });
                el.addEventListener('mouseleave', function () { ring.classList.remove('omni-hover'); });
            });
        }
        setInterval(bindHover, 2000); bindHover();
        document.addEventListener('click', function () {
            ring.style.transform = 'translate(-50%, -50%) scale(0.75)';
            setTimeout(function () { ring.style.transform = 'translate(-50%, -50%) scale(1)'; }, 200);
        });
    }

    /* ===== 滚动进度条 ===== */
    var prog = document.getElementById('omni-scroll-progress');
    function updateProg() {
        var st = document.documentElement.scrollTop || document.body.scrollTop;
        var sh = (document.documentElement.scrollHeight || document.body.scrollHeight) - innerHeight;
        if (sh > 0) prog.style.width = (st / sh * 100) + '%';
    }
    addEventListener('scroll', updateProg, { passive: true });
    updateProg();

    /* ===== 导航栏滚动 ===== */
    var nav = document.querySelector('.nav, .sidebar, header[class*="nav"], .top-nav, .navbar');
    if (nav) {
        addEventListener('scroll', function () {
            if (scrollY > 40) nav.classList.add('omni-scrolled');
            else nav.classList.remove('omni-scrolled');
        }, { passive: true });
    }

    /* ===== 滚动揭示 ===== */
    function reveal() {
        var els = document.querySelectorAll('.glass-card, .holo-card, .version-card, .vip-card, .highlight-item, .stat-card, .bento-item, .tool-card, .tool-item, .data-card, .card, .featured-version, .faq-item, .faq-q, .rank, .cat, .fcard, .hot-tool-card');
        els.forEach(function (el, i) {
            if (el.classList.contains('omni-reveal')) return;
            el.classList.add('omni-reveal');
            el.style.transitionDelay = (i % 8) * 60 + 'ms';
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { e.target.classList.add('omni-visible'); io.unobserve(e.target); }
                });
            }, { threshold: 0.1 });
            io.observe(el);
        });
    }
    setTimeout(reveal, 300);
    setInterval(reveal, 3000);

    /* ===== 3D 倾斜 ===== */
    if (!reduce && !('ontouchstart' in window)) {
        function bindTilt() {
            document.querySelectorAll('.glass-card, .holo-card, .vip-card, .version-card, .highlight-item, .bento-item, .tool-card').forEach(function (el) {
                if (el.dataset.omniTilt) return;
                el.dataset.omniTilt = '1';
                el.addEventListener('mousemove', function (e) {
                    var r = el.getBoundingClientRect();
                    var cx = e.clientX - r.left, cy = e.clientY - r.top;
                    var rxT = (cy / r.height - 0.5) * -8;
                    var ryT = (cx / r.width - 0.5) * 8;
                    el.style.transform = 'perspective(1000px) rotateX(' + rxT + 'deg) rotateY(' + ryT + 'deg) translateY(-6px)';
                    if (el.classList.contains('bento-item')) {
                        el.style.setProperty('--mx', (cx / r.width * 100) + '%');
                        el.style.setProperty('--my', (cy / r.height * 100) + '%');
                    }
                });
                el.addEventListener('mouseleave', function () { el.style.transform = ''; });
            });
        }
        setTimeout(bindTilt, 500);
        setInterval(bindTilt, 3000);
    }

    /* ===== 磁吸按钮 ===== */
    if (!reduce && isFine) {
        function bindMagnetic() {
            document.querySelectorAll('[data-magnetic], .btn.primary, .btn-primary, .hero-search-btn, .nav-login-btn, .create-btn').forEach(function (el) {
                if (el.dataset.omniMag) return;
                el.dataset.omniMag = '1';
                el.addEventListener('mousemove', function (e) {
                    var r = el.getBoundingClientRect();
                    var cx = e.clientX - r.left - r.width / 2;
                    var cy = e.clientY - r.top - r.height / 2;
                    el.style.transform = 'translate(' + cx * 0.25 + 'px, ' + cy * 0.25 + 'px)';
                });
                el.addEventListener('mouseleave', function () { el.style.transform = ''; });
            });
        }
        setTimeout(bindMagnetic, 500);
        setInterval(bindMagnetic, 3000);
    }

    /* ===== 涟漪 ===== */
    document.addEventListener('click', function (e) {
        var t = e.target.closest('button, .btn, a[class*="btn"], [class*="card"]');
        if (!t) return;
        var r = t.getBoundingClientRect();
        var s = document.createElement('span');
        s.className = 'omni-ripple';
        s.style.left = (e.clientX - r.left) + 'px';
        s.style.top = (e.clientY - r.top) + 'px';
        s.style.width = s.style.height = '6px';
        t.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.remove(); }, 600);
    });

    /* ===== 页面加载淡入 ===== */
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s ease';
    requestAnimationFrame(function () {
        setTimeout(function () { document.body.style.opacity = '1'; }, 50);
    });

})();
