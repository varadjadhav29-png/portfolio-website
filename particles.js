/* =========================================================
   particles.js — Canvas-based neural network particle system
   Creates floating dots connected by lines, reacts to mouse
   ========================================================= */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas  = document.getElementById(canvasId);
    this.ctx     = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse   = { x: -9999, y: -9999 };
    this.animId  = null;
    this.theme   = document.documentElement.getAttribute('data-theme');

    /* Config */
    this.cfg = {
      count:         80,         // number of particles
      maxDist:       140,        // max distance to draw connection line
      mouseRadius:   160,        // mouse repulsion/attraction radius
      mouseStrength: 0.025,      // strength of mouse force
      baseSpeed:     0.35,       // base movement speed
      minRadius:     1.2,        // min particle radius
      maxRadius:     3.2,        // max particle radius
      lineWidth:     0.7,        // connection line width
    };

    this.init();
    this.bindEvents();
    this.loop();
  }

  /* ── resize canvas to full viewport ── */
  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /* ── colour helpers ── */
  get accentRGB() {
    return this.theme === 'dark'
      ? { r: 99, g: 102, b: 241 }
      : { r: 99, g: 102, b: 241 };
  }

  particleColor(alpha) {
    const c = this.accentRGB;
    return `rgba(${c.r},${c.g},${c.b},${alpha})`;
  }

  /* ── create one particle ── */
  makeParticle(x, y) {
    const speed = (Math.random() * 0.6 + 0.1) * this.cfg.baseSpeed;
    const angle = Math.random() * Math.PI * 2;
    return {
      x: x ?? Math.random() * this.canvas.width,
      y: y ?? Math.random() * this.canvas.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r:  Math.random() * (this.cfg.maxRadius - this.cfg.minRadius) + this.cfg.minRadius,
      alpha: Math.random() * 0.5 + 0.3,
    };
  }

  /* ── initialise particle array ── */
  init() {
    this.resize();
    this.particles = [];
    for (let i = 0; i < this.cfg.count; i++) {
      this.particles.push(this.makeParticle());
    }
  }

  /* ── update one particle per frame ── */
  update(p) {
    /* Mouse force */
    const dx = p.x - this.mouse.x;
    const dy = p.y - this.mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.cfg.mouseRadius && dist > 0) {
      const force = (this.cfg.mouseRadius - dist) / this.cfg.mouseRadius;
      /* Gentle repulsion */
      p.vx += (dx / dist) * force * this.cfg.mouseStrength * 3;
      p.vy += (dy / dist) * force * this.cfg.mouseStrength * 3;
    }

    /* Soft speed cap */
    const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSpd = this.cfg.baseSpeed * 2.5;
    if (spd > maxSpd) {
      p.vx = (p.vx / spd) * maxSpd;
      p.vy = (p.vy / spd) * maxSpd;
    }

    /* Apply tiny friction so particles slow toward base speed */
    p.vx *= 0.992;
    p.vy *= 0.992;

    p.x += p.vx;
    p.y += p.vy;

    /* Wrap edges */
    const pad = 10;
    if (p.x < -pad)  p.x = this.canvas.width  + pad;
    if (p.x > this.canvas.width  + pad) p.x = -pad;
    if (p.y < -pad)  p.y = this.canvas.height + pad;
    if (p.y > this.canvas.height + pad) p.y = -pad;
  }

  /* ── draw connections between close particles ── */
  drawConnections() {
    const pts = this.particles;
    const maxD = this.cfg.maxDist;
    const maxD2 = maxD * maxD;

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d2 = dx * dx + dy * dy;

        if (d2 < maxD2) {
          const alpha = (1 - Math.sqrt(d2) / maxD) * 0.35;
          this.ctx.beginPath();
          this.ctx.moveTo(pts[i].x, pts[i].y);
          this.ctx.lineTo(pts[j].x, pts[j].y);
          this.ctx.strokeStyle = this.particleColor(alpha);
          this.ctx.lineWidth = this.cfg.lineWidth;
          this.ctx.stroke();
        }
      }
    }
  }

  /* ── draw single particle dot ── */
  drawParticle(p) {
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    this.ctx.fillStyle = this.particleColor(p.alpha);
    this.ctx.fill();

    /* Soft glow halo */
    const grd = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
    grd.addColorStop(0, this.particleColor(p.alpha * 0.3));
    grd.addColorStop(1, this.particleColor(0));
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
    this.ctx.fillStyle = grd;
    this.ctx.fill();
  }

  /* ── main animation loop ── */
  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    /* Sync theme each frame (handles toggle) */
    this.theme = document.documentElement.getAttribute('data-theme');

    /* Update + draw */
    this.drawConnections();
    for (const p of this.particles) {
      this.update(p);
      this.drawParticle(p);
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  /* ── event listeners ── */
  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });

    /* Touch support */
    window.addEventListener('touchmove', (e) => {
      this.mouse.x = e.touches[0].clientX;
      this.mouse.y = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
  }

  /* ── pause/resume (pause when tab hidden) ── */
  pause() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  resume() {
    if (!this.animId) this.loop();
  }

  /* ── destroy ── */
  destroy() {
    this.pause();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}

/* ── Pause when tab not visible (battery / perf) ── */
document.addEventListener('visibilitychange', () => {
  if (window.__particles) {
    document.hidden ? window.__particles.pause() : window.__particles.resume();
  }
});

/* ── Boot ── */
window.addEventListener('DOMContentLoaded', () => {
  /* Skip on reduced-motion or if canvas not present */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('particle-canvas');
  if (!canvas || prefersReduced) return;

  window.__particles = new ParticleSystem('particle-canvas');
});
