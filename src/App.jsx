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

function Loader(x, y) {
  this.x = x;
  this.y = y;

  this.r = 24;
  this._progress = 0;

  this.complete = false;
}

Loader.prototype = {
  reset() {
    this._progress = 0;
    this.complete = false;
  },
  set progress(p) {
    this._progress = p < 0 ? 0 : p > 1 ? 1 : p;
    this.complete = this._progress === 1;
  },
  get progress() {
    return this._progress;
  },
  draw(ctx) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, -HALF_PI, TWO_PI * this._progress - HALF_PI);
    ctx.lineTo(this.x, this.y);
    ctx.closePath();
    ctx.fill();
  },
};

function Exploader(x, y) {
  this.x = x;
  this.y = y;

  this.startRadius = 24;

  this.time = 0;
  this.duration = 0.4;
  this.progress = 0;

  this.complete = false;
}

Exploader.prototype = {
  reset() {
    this.time = 0;
    this.progress = 0;
    this.complete = false;
  },
  update(timeStep) {
    this.time = Math.min(this.duration, this.time + timeStep);
    this.progress = Ease.inBack(this.time, 0, 1, this.duration);

    this.complete = this.time === this.duration;
  },
  draw(ctx) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.startRadius * (1 - this.progress), 0, TWO_PI);
    ctx.fill();
  },
};

const Ease = {
  outCubic(t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t + 1) + b;
  },
  inBack(t, b, c, d, s) {
    s = s || 1.70158;
    return c * (t /= d) * t * ((s + 1) * t - s) + b;
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
  let loader;
  let exploader;
  const timeStep = 1 / 60;
  let phase = 0;

  function resizeCanvas() {
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;
    canvas.width = viewWidth;
    canvas.height = viewHeight;
  }

  function createLoader() {
    loader = new Loader(window.innerWidth * 0.5, window.innerHeight * 0.5);
  }

  function createExploader() {
    exploader = new Exploader(window.innerWidth * 0.5, window.innerHeight * 0.5);
  }

  function createParticles() {
    for (let i = 0; i < 128; i++) {
      const p0 = new Point(window.innerWidth * 0.5, window.innerHeight * 0.5);
      const p1 = new Point(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
      const p2 = new Point(Math.random() * window.innerWidth, Math.random() * window.innerHeight);
      const p3 = new Point(Math.random() * window.innerWidth, window.innerHeight + 64);

      particles.push(new Particle(p0, p1, p2, p3));
    }
  }

  function update() {
    switch (phase) {
      case 0:
        loader.progress += 1 / 45;
        break;
      case 1:
        exploader.update(timeStep);
        break;
      case 2:
        particles.forEach((p) => p.update(timeStep));
        break;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    switch (phase) {
      case 0:
        loader.draw(ctx);
        break;
      case 1:
        exploader.draw(ctx);
        break;
      case 2:
        particles.forEach((p) => p.draw(ctx));
        break;
    }
  }

  function checkParticlesComplete() {
    return particles.every((p) => p.complete);
  }

  function loop() {
    update();
    draw();

    if (phase === 0 && loader.complete) {
      phase = 1;
    } else if (phase === 1 && exploader.complete) {
      phase = 2;
    } else if (phase === 2 && checkParticlesComplete()) {
      exploader.reset();
      particles.length = 0;
      createParticles();
    }

    requestAnimationFrame(loop);
  }

  onMount(() => {
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    createLoader();
    createExploader();
    createParticles();
    loop();
  });

  onCleanup(() => {
    window.removeEventListener("resize", resizeCanvas);
  });

  return <canvas id="drawing_canvas" ref={canvas}></canvas>;
}

export default App;
