<template>
  <div class="component-container">
    <canvas ref="canvasRef" :width="width" :height="height" class="component-canvas"></canvas>
    <div class="component-controls">
      <label class="component-label">
        外加电压 (External Voltage): {{ voltage.toFixed(1) }}V
      </label>
      <input
        type="range"
        v-model.number="voltage"
        :min="minVoltage"
        :max="maxVoltage"
        step="0.1"
        class="component-slider"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const width = 600;
const height = 400;
const canvasRef = ref(null);
const voltage = ref(0); // 初始电压 0V
const minVoltage = -5;  // 反向偏置
const maxVoltage = 1;   // 正向偏置

let ctx = null;
let animationId = null;

const initP = 300;
const initN = 300;
const initDepletion = 60;
const builtInFieldDirection = -1; // 从 N 到 P

const particles = [];
const numParticles = 100;

class Particle {
  constructor(x, y, vx, vy, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // 'hole' or 'electron'
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 10 || this.x > width - 10) this.vx *= -1;
    if (this.y < 10 || this.y > height - 10) this.vy *= -1;
  }
}

const initializeParticles = () => {
  particles.length = 0;
  for (let i = 0; i < numParticles / 2; i++) {
    particles.push(new Particle(Math.random() * 200 + 50, Math.random() * 300 + 50, Math.random() - 0.5, Math.random() - 0.5, 'hole'));
    particles.push(new Particle(Math.random() * 200 + 350, Math.random() * 300 + 50, Math.random() - 0.5, Math.random() - 0.5, 'electron'));
  }
};

const draw = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  const appliedField = voltage.value * 0.1;
  const netField = builtInFieldDirection - appliedField;

  particles.forEach(p => p.update());

  // 1. Draw P-Type (Left) and N-Type (Right) base
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width / 2, height);
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(width / 2, 0, width / 2, height);

  // 2. Depletion region
  const rawWd = initDepletion / (1 + appliedField * builtInFieldDirection);
  const currentWd = Math.max(10, Math.min(width / 2 - 20, rawWd));

  const pXStart = width / 2 - currentWd / 2;
  const nXStart = width / 2;

  ctx.fillStyle = '#dcdcdc'; // Depletion area base
  ctx.fillRect(pXStart, 0, currentWd, height);

  // 3. Render carriers within base and depletion
  particles.forEach(p => {
    let isInPBase = p.x < pXStart;
    let isInNBase = p.x > nXStart + currentWd / 2; // Approximate N boundary
    let isInDepletion = p.x >= pXStart && p.x <= nXStart + currentWd / 2;

    if (p.type === 'hole') {
      ctx.fillStyle = isInPBase ? '#ffcccc' : (isInDepletion ? '#ffaaaa' : '#ffeeee');
    } else {
      ctx.fillStyle = isInNBase ? '#ccccff' : (isInDepletion ? '#aaaaff' : '#eeeeff');
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.type === 'hole' ? '#f00' : '#00f';
    ctx.font = '10px Arial';
    ctx.fillText(p.type === 'hole' ? '+' : '-', p.x - 3, p.y + 3);
  }
  );

  // 4. Fixed Ions (Only in depletion region)
  const drawIon = (x, y, type) => {
    ctx.fillStyle = type === 'p' ? '#333' : '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = type === 'p' ? '#fff' : '#333';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(type === 'p' ? '+' : '-', x - 4, y + 4);
  };

  const ionCols = Math.max(1, Math.round(currentWd / 20));
  for (let c = 0; c < ionCols; c++) {
    for (let r = 0; r < 6; r++) {
      drawIon(pXStart + (c + 0.5) * currentWd / ionCols / 2, height * (r + 0.5) / 6, 'p');
      drawIon(width / 2 + (c + 0.5) * currentWd / ionCols / 2, height * (r + 0.5) / 6, 'n');
    }
  }

  // 5. Electric Fields (Arrows on bottom)
  const drawField = (label, direction, xOffset, magnitude) => {
    const yStart = height - 40;
    const arrowLen = Math.abs(magnitude * 200);
    const headLen = 10;
    const arrowColor = magnitude === 0 ? '#aaa' : '#fff';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(label, xOffset, yStart - 10);

    if (magnitude === 0) return;

    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOffset, yStart);
    ctx.lineTo(xOffset + direction * arrowLen, yStart);

    // Arrowhead
    const targetX = xOffset + direction * arrowLen;
    ctx.lineTo(targetX - direction * headLen, yStart - headLen / 2);
    ctx.moveTo(targetX, yStart);
    ctx.lineTo(targetX - direction * headLen, yStart + headLen / 2);
    ctx.stroke();
  };

  // Fixed Built-in Field
  drawField('内建电场 (Built-in Field)', builtInFieldDirection, width - 150, 0.5);

  // Dynamic Applied Field
  if (voltage.value !== 0) {
    const appDir = -builtInFieldDirection;
    const appLabel = `外加电场: ${voltage.value > 0 ? '正向 (Opposes)' : '反向 (Strengthens)'}`;
    drawField(appLabel, appDir, width / 2, appliedField);
  }

  animationId = requestAnimationFrame(draw);
};

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  initializeParticles();
  draw();
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
});

watch(voltage, () => {
  initializeParticles(); // Reset carriers on voltage change for clarity
}
);
</script>

<style scoped>
.component-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.component-canvas {
  max-width: 100%;
}

.component-controls {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 400px;
}

.component-label {
  margin-bottom: 10px;
  font-weight: bold;
}

.component-slider {
  width: 100%;
}
</style>