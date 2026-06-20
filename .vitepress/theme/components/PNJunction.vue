<template>
  <div class="component-container">
    <div class="canvas-wrapper">
      <canvas ref="canvasRef" :width="width" :height="height" class="component-canvas"></canvas>
    </div>
    
    <div class="component-controls">
      <div class="legend">
        <span class="legend-item"><span class="dot hole"></span> 空穴 (Holes)</span>
        <span class="legend-item"><span class="dot electron"></span> 电子 (Electrons)</span>
        <span class="legend-item"><span class="dot ion"></span> 固定离子 (Fixed Ions)</span>
      </div>
      
      <label class="component-label">
        外加电压 (External Voltage): <span class="voltage-val">{{ voltage.toFixed(1) }}V</span>
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

const width = 700;
const height = 350;
const canvasRef = ref(null);
const voltage = ref(0);
const minVoltage = -5;
const maxVoltage = 1;

let ctx = null;
let animationId = null;

const initDepletion = 80;
const builtInFieldDirection = -1;

const particles = [];
const numParticles = 120;

class Particle {
  constructor(x, y, vx, vy, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
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
    particles.push(new Particle(Math.random() * 250 + 20, Math.random() * 250 + 20, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, 'hole'));
    particles.push(new Particle(Math.random() * 250 + 430, Math.random() * 250 + 20, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, 'electron'));
  }
};

const draw = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);

  const appliedField = voltage.value * 0.1;
  const netField = builtInFieldDirection - appliedField;

  particles.forEach(p => p.update());

  // 1. Backgrounds
  ctx.fillStyle = '#E8F0FE'; // P区 浅蓝
  ctx.fillRect(0, 0, width / 2, height - 70);
  ctx.fillStyle = '#FCE8E6'; // N区 浅红
  ctx.fillRect(width / 2, 0, width / 2, height - 70);

  // 2. Depletion region
  const rawWd = initDepletion / (1 + appliedField * builtInFieldDirection);
  const currentWd = Math.max(20, Math.min(width / 2 - 40, rawWd));
  const pXStart = width / 2 - currentWd / 2;

  ctx.fillStyle = '#F1F3F4'; // 耗尽层 灰色
  ctx.fillRect(pXStart, 0, currentWd, height - 70);

  // Center dashed line
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height - 70);
  ctx.strokeStyle = '#9AA0A6';
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // 3. Render carriers
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = p.type === 'hole' ? '#4285F4' : '#EA4335';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = p.type === 'hole' ? '#4285F4' : '#EA4335';
    ctx.font = 'bold 10px Arial';
    ctx.fillText(p.type === 'hole' ? '+' : '-', p.x - 3, p.y + 3);
  });

  // 4. Fixed Ions
  const drawIon = (x, y, type) => {
    ctx.fillStyle = '#DADCE0';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9AA0A6';
    ctx.stroke();
    
    ctx.fillStyle = '#5F6368';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(type === 'p' ? '－' : '＋', x - 6, y + 4);
  };

  const ionCols = Math.max(1, Math.round(currentWd / 25));
  for (let c = 0; c < ionCols; c++) {
    for (let r = 0; r < 5; r++) {
      drawIon(pXStart + (c + 0.5) * currentWd / ionCols / 2, (height - 70) * (r + 0.5) / 5, 'p');
      drawIon(width / 2 + (c + 0.5) * currentWd / ionCols / 2, (height - 70) * (r + 0.5) / 5, 'n');
    }
  }

  // 5. Electric Fields (Arrows)
  const drawField = (label, direction, xOffset, yOffset, magnitude, color) => {
    if (magnitude === 0) return;
    const arrowLen = Math.abs(magnitude * 250);
    const headLen = 8;
    
    ctx.fillStyle = color;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, yOffset - 8);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xOffset - (direction * arrowLen)/2, yOffset);
    ctx.lineTo(xOffset + (direction * arrowLen)/2, yOffset);

    const targetX = xOffset + (direction * arrowLen)/2;
    ctx.lineTo(targetX - direction * headLen, yOffset - headLen);
    ctx.moveTo(targetX, yOffset);
    ctx.lineTo(targetX - direction * headLen, yOffset + headLen);
    ctx.stroke();
  };

  // 分离内外电场的垂直位置，避免重叠
  drawField('内建电场 (Built-in)', builtInFieldDirection, width / 2, height - 40, 0.4, '#0F9D58');
  
  if (voltage.value !== 0) {
    const appDir = -builtInFieldDirection;
    const isForward = voltage.value > 0;
    const appLabel = `外加电场: ${isForward ? '正向削弱' : '反向增强'}`;
    drawField(appLabel, appDir, width / 2, height - 10, appliedField, isForward ? '#EA4335' : '#4285F4');
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

watch(voltage, () => { initializeParticles(); });
</script>

<style scoped>
.component-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin: 20px 0;
}

.canvas-wrapper {
  border: 1px solid #5F6368;
  border-radius: 4px;
  overflow: hidden;
}

.component-canvas {
  max-width: 100%;
  display: block;
}

.component-controls {
  margin-top: 24px;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.legend {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #5F6368;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid currentColor;
}
.dot.hole { background: #fff; border-color: #4285F4; }
.dot.electron { background: #fff; border-color: #EA4335; }
.dot.ion { background: #DADCE0; border-color: #9AA0A6; }

.component-label {
  font-weight: 600;
  color: #202124;
}

.voltage-val {
  color: #1A73E8;
}

.component-slider {
  width: 100%;
  accent-color: #1A73E8;
}
</style>