import { createSignal, onCleanup, onMount } from "solid-js";

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI * 0.5;

function Point(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

function Particle(p0, p1, p2, p3) {
  this.p0 = p0;
  this.p1 = p1;
  this.p2 = p2;
  this.p3 = p3;

  this.time = 0;
  this.duration = 3 + Math.random() * 2;
  this.color = "#" + Math.floor(Math.random() * 0xffffff).toString(16);

  this.w = 8;
  this.h = 6;

  this.complete = false;
}

Particle.prototype = {
  update(timeStep) {
    this.time = Math.min(this.duration, this.time + timeStep);

    const f = Ease.outCubic(this.time, 0, 1, this.duration);
    const p = cubeBezier(this.p0, this.p1, this.p2, this.p3, f);

    const dx = p.x - this.x;
    const dy = p.y - this.y;

    this.r = Math.atan2(dy, dx) + HALF_PI;
    this.sy = Math.sin(Math.PI * f * 10);
    this.x = p.x;
    this.y = p.y;

    this.complete = this.time === this.duration;
  },
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    ctx.scale(1, this.sy);

    ctx.fillStyle = this.color;
    ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);

    ctx.restore();
  },
};

const Ease = {
  outCubic: function (t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  },
};

function cubeBezier(p0, c0, c1, p1, t) {
  const p = new Point();
  const nt = 1 - t;

  p.x = nt * nt * nt * p0.x + 3 * nt * nt * t * c0.x + 3 * nt * t * t * c1.x + t * t * t * p1.x;
  p.y = nt * nt * nt * p0.y + 3 * nt * nt * t * c0.y + 3 * nt * t * t * c1.y + t * t * t * p1.y;

  return p;
}

function App() {
  let canvas;
  let ctx;
  let particles = [];
  const [phase, setPhase] = createSignal(0);
  const timeStep = 1 / 60;

  function createParticles() {
    for (let i = 0; i < 128; i++) {
      const p0 = new Point(256, 175);
      const p1 = new Point(Math.random() * 512, Math.random() * 350);
      const p2 = new Point(Math.random() * 512, Math.random() * 350);
      const p3 = new Point(Math.random() * 512, 350 + 64);

      particles.push(new Particle(p0, p1, p2, p3));
    }
  }

  function update() {
    if (phase() === 0) {
      setPhase(1);
    } else if (phase() === 1) {
      particles.forEach((p) => p.update(timeStep));
      if (particles.every((p) => p.complete)) {
        setPhase(2);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, 512, 350);
    if (phase() === 1) {
      particles.forEach((p) => p.draw(ctx));
    }
  }

  function resetAnimation() {
    setPhase(0);
    particles = [];
    createParticles();
  }

  function loop() {
    update();
    draw();
    if (phase() === 2) {
      setTimeout(resetAnimation, 2000); // 2 second delay before resetting
    } else {
      requestAnimationFrame(loop);
    }
  }

  onMount(() => {
    ctx = canvas.getContext("2d");
    createParticles();
    loop();
  });

  return (
    <div id="container">
      <h1>Beautiful SolidJS Animation</h1>
      <canvas id="drawing_canvas" ref={canvas} width="512" height="350"></canvas>
    </div>
  );
}

export default App;
