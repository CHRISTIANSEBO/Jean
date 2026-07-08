// Lightweight canvas confetti burst, used to celebrate successful sends.
export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#8c50f0', '#a78bfa', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#fff'];
  const particles = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.35 - 10,
    vx: (Math.random() - 0.5) * 5, vy: Math.random() * 3 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    w: Math.random() * 9 + 4, h: Math.random() * 5 + 3,
    angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.18, opacity: 1,
  }));
  let raf: number;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.angle += p.spin; p.opacity -= 0.007;
      if (p.opacity > 0 && p.y < canvas.height + 20) alive = true;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) raf = requestAnimationFrame(tick); else canvas.remove();
  };
  raf = requestAnimationFrame(tick);
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove(); }, 4500);
}
