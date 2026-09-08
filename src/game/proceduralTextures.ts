import * as THREE from 'three';

/**
 * Procedural canvas-based textures for the outdoor dark forest environment.
 * Generates forest floor, pine bark, weathered cabin timber, generator console,
 * national park signs, spark plugs, and rustic trail artifacts.
 */

function makeCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  isColorTexture = true
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  texture.colorSpace = isColorTexture ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  return texture;
}

// 1. Forest Ground Texture: Pine needles, dark soil, damp moss, leaves, and twigs
export function createForestGroundTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Base dark forest loam
    ctx.fillStyle = '#141712';
    ctx.fillRect(0, 0, 512, 512);

    // Broad, irregular tonal breakup keeps the ground from reading as a tiled flat color.
    for (let p = 0; p < 90; p++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const radiusX = 18 + Math.random() * 70;
      const radiusY = 10 + Math.random() * 48;
      const patch = ctx.createRadialGradient(px, py, 0, px, py, Math.max(radiusX, radiusY));
      const tone = Math.random() > 0.5 ? 'rgba(73, 68, 48, 0.10)' : 'rgba(2, 5, 3, 0.16)';
      patch.addColorStop(0, tone);
      patch.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.random() * Math.PI);
      ctx.scale(radiusX / Math.max(radiusX, radiusY), radiusY / Math.max(radiusX, radiusY));
      ctx.fillStyle = patch;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(radiusX, radiusY), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Patches of damp soil & moss
    for (let p = 0; p < 24; p++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const rad = 25 + Math.random() * 60;
      const isMoss = Math.random() > 0.45;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, rad);
      grad.addColorStop(0, isMoss ? 'rgba(28, 42, 22, 0.7)' : 'rgba(18, 14, 10, 0.8)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thousands of pine needles (slender reddish-brown & golden needles)
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const angle = Math.random() * Math.PI;
      const len = 7 + Math.random() * 9;
      const r = 55 + Math.floor(Math.random() * 45);
      const g = 35 + Math.floor(Math.random() * 30);
      const b = 15 + Math.floor(Math.random() * 15);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.5 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    // Dirt noise & pebbles
    for (let d = 0; d < 3000; d++) {
      const dx = Math.random() * 512;
      const dy = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(38, 32, 26, 0.35)' : 'rgba(10, 12, 10, 0.45)';
      ctx.fillRect(dx, dy, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
  });
}

// 2. Weathered Pine / Cedar Cabin Planks Texture
export function createCabinWoodTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Base weathered wood tone
    ctx.fillStyle = '#27221d';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 64;
    for (let y = 0; y < 512; y += plankHeight) {
      // Wood plank base with slight tone variations
      const tone = (Math.random() * 14) - 7;
      ctx.fillStyle = `rgb(${40 + tone}, ${34 + tone}, ${28 + tone})`;
      ctx.fillRect(0, y + 2, 512, plankHeight - 4);

      // Deep groove shadow between planks
      ctx.fillStyle = '#100d0a';
      ctx.fillRect(0, y, 512, 2);
      ctx.fillRect(0, y + plankHeight - 2, 512, 2);

      // Horizontal wood grain lines
      for (let g = 0; g < 16; g++) {
        const gy = y + 4 + Math.random() * (plankHeight - 8);
        ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(18, 14, 10, 0.4)' : 'rgba(56, 48, 40, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(150, gy + Math.random() * 4 - 2, 350, gy + Math.random() * 4 - 2, 512, gy);
        ctx.stroke();
      }

      // Uneven pale sapwood streaks catch the flashlight like real worn timber.
      for (let streak = 0; streak < 3; streak++) {
        const sy = y + 8 + Math.random() * (plankHeight - 16);
        ctx.strokeStyle = 'rgba(126, 103, 78, 0.13)';
        ctx.lineWidth = 2 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.bezierCurveTo(120, sy - 3, 330, sy + 5, 512, sy - 2);
        ctx.stroke();
      }

      // Occasional knot holes
      if (Math.random() > 0.5) {
        const kx = 80 + Math.random() * 350;
        const ky = y + plankHeight / 2;
        ctx.fillStyle = '#120f0c';
        ctx.beginPath();
        ctx.ellipse(kx, ky, 6, 12, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rusted nail heads at edges
      for (let nx of [20, 256, 492]) {
        ctx.fillStyle = '#4a2f1c';
        ctx.beginPath();
        ctx.arc(nx, y + 10, 3, 0, Math.PI * 2);
        ctx.arc(nx, y + plankHeight - 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// 3. Tree Bark Texture (Deep vertical furrows)
export function createBarkTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 512, (ctx) => {
    ctx.fillStyle = '#1e1a17';
    ctx.fillRect(0, 0, 256, 512);

    for (let x = 0; x < 256; x += 12) {
      const furrowWidth = 6 + Math.random() * 6;
      ctx.fillStyle = Math.random() > 0.4 ? '#161311' : '#28231e';
      ctx.fillRect(x, 0, furrowWidth, 512);

      // Vertical bark ridges
      for (let i = 0; i < 20; i++) {
        const sy = Math.random() * 512;
        ctx.strokeStyle = 'rgba(10, 8, 7, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 2, sy);
        ctx.lineTo(x + 3 + Math.random() * 4, sy + 30 + Math.random() * 40);
        ctx.stroke();
      }

      // Broken highlight ridges make the bark respond to grazing light instead of looking painted.
      ctx.strokeStyle = 'rgba(104, 83, 62, 0.24)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + furrowWidth * 0.65, 0);
      ctx.lineTo(x + furrowWidth * 0.65 + Math.random() * 4, 512);
      ctx.stroke();
    }
  });
}

export function createBarkBumpMap(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 512, (ctx) => {
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 0, 256, 512);
    for (let x = 0; x < 256; x += 8) {
      ctx.strokeStyle = `rgb(${90 + Math.floor(Math.random() * 90)}, ${90 + Math.floor(Math.random() * 90)}, ${90 + Math.floor(Math.random() * 90)})`;
      ctx.lineWidth = 2 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + Math.random() * 8 - 4, 150, x + Math.random() * 8 - 4, 350, x + Math.random() * 8 - 4, 512);
      ctx.stroke();
    }
    for (let i = 0; i < 420; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 512;
      ctx.fillStyle = `rgba(20, 20, 20, ${0.25 + Math.random() * 0.4})`;
      ctx.fillRect(x, y, 1 + Math.random() * 3, 5 + Math.random() * 18);
    }
  }, false);
}

// 4. Forestry Road Gate Texture (Heavy timber & rusted steel warning)
export function createGateTexture(title: string): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Weathered timber background
    ctx.fillStyle = '#221c17';
    ctx.fillRect(0, 0, 512, 512);

    // Cross brace beams
    ctx.fillStyle = '#181410';
    ctx.fillRect(20, 20, 472, 40);
    ctx.fillRect(20, 452, 472, 40);
    ctx.fillRect(20, 20, 40, 472);
    ctx.fillRect(452, 20, 40, 472);

    // Diagonal heavy timbers
    ctx.lineWidth = 32;
    ctx.strokeStyle = '#181410';
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(482, 482);
    ctx.stroke();

    // Steel chain link wire mesh in center
    ctx.strokeStyle = 'rgba(130, 140, 150, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = -500; i < 1000; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 512, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 512);
      ctx.lineTo(i + 512, 0);
      ctx.stroke();
    }

    // Warning Sign board attached in center
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(86, 176, 340, 160);
    ctx.strokeStyle = '#fef2f2';
    ctx.lineWidth = 4;
    ctx.strokeRect(96, 186, 320, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EMERGENCY PERIMETER GATE', 256, 230);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(title, 256, 265);

    ctx.fillStyle = '#fef08a';
    ctx.font = '13px monospace';
    ctx.fillText('[ELECTRIFIED LOCK - NEEDS GENERATOR]', 256, 300);
  });
}

// 5. Diesel Generator Console Texture (3 Spark Plug sockets)
export function createGeneratorTexture(plugsInstalled: number): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Weathered green/grey military industrial steel
    ctx.fillStyle = '#1e2621';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#151a17';
    ctx.fillRect(20, 20, 472, 472);

    // Generator Header
    ctx.fillStyle = '#b45309';
    ctx.fillRect(40, 36, 432, 58);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DIESEL GENERATOR MANIFOLD', 256, 72);

    // Warning subheader
    ctx.fillStyle = '#9ca3af';
    ctx.font = '15px monospace';
    ctx.fillText('3x HEAVY-DUTY SPARK PLUGS REQUIRED', 256, 126);

    // 3 Spark Plug Sockets
    const slotX = [120, 256, 392];
    for (let i = 0; i < 3; i++) {
      const x = slotX[i];
      const isInstalled = i < plugsInstalled;

      // Socket recess
      ctx.fillStyle = '#0b0e0c';
      ctx.fillRect(x - 45, 160, 90, 190);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 45, 160, 90, 190);

      // Brass terminal hex
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x - 22, 175, 44, 20);
      ctx.fillRect(x - 22, 315, 44, 20);

      if (isInstalled) {
        // Glowing installed plug
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x - 18, 200, 36, 110);
        // Indicator LED
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(x, 385, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ecfdf5';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('FIRING', x, 422);
      } else {
        // Missing plug
        ctx.fillStyle = '#4b5563';
        ctx.font = '13px monospace';
        ctx.fillText('MISSING', x, 265);
        // Red LED
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, 385, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('NO SPARK', x, 422);
      }
    }

    // Status footer
    ctx.fillStyle = plugsInstalled >= 3 ? '#10b981' : '#ef4444';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(
      plugsInstalled >= 3 ? '[READY: CRANK GENERATOR TO ESCAPE]' : `[SPARK PLUGS SEATED: ${plugsInstalled} / 3]`,
      256,
      472
    );
  });
}

// 6. Spark Plug Item Texture for 3D item pickup
export function createSparkPlugTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 256, 256);

    // White ceramic insulator center with ridges
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(60, 40, 136, 110);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(60, 80, 136, 12);

    // Hex nut steel base
    ctx.fillStyle = '#71717a';
    ctx.fillRect(40, 150, 176, 40);

    // Threaded electrode tip
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(70, 190, 116, 50);
    for (let y = 195; y < 240; y += 8) {
      ctx.fillStyle = '#52525b';
      ctx.fillRect(70, y, 116, 3);
    }

    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHAMPION 14mm', 128, 120);
  });
}

// 7. Ranger Key Texture
export function createRangerKeyTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 160, (ctx) => {
    // Leather keychain tag
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 256, 160);

    // Stitched edge
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 236, 140);

    // Brass key graphic
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(60, 80, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(60, 80, 14, 0, Math.PI * 2);
    ctx.fill();

    // Key stem & teeth
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(80, 74, 90, 12);
    ctx.fillRect(150, 86, 8, 16);
    ctx.fillRect(162, 86, 8, 20);

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('RANGER OUTPOST', 30, 138);
  });
}

// 8. Field Note document texture
export function createFieldNoteTexture(title: string): THREE.CanvasTexture {
  return makeCanvasTexture(256, 320, (ctx) => {
    // Aged yellow paper
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, 256, 320);

    // Weathered water stained borders
    ctx.fillStyle = 'rgba(146, 64, 14, 0.2)';
    ctx.fillRect(0, 0, 256, 20);
    ctx.fillRect(0, 300, 256, 20);
    ctx.fillRect(0, 0, 20, 320);
    ctx.fillRect(236, 0, 20, 320);

    // Title
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(title.substring(0, 20), 28, 45);

    // Lines of scribbled field notes
    ctx.fillStyle = '#44403c';
    for (let y = 70; y < 290; y += 16) {
      const len = 130 + Math.random() * 70;
      ctx.fillRect(28, y, len, 4);
    }
  });
}

// 9. Industrial Heavy-Duty Battery Texture (Copper & black jacket with polarity markings)
export function createBatteryTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Matte dark graphite body
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, 512, 512);

    // Iconic metallic copper top band
    const copperGrad = ctx.createLinearGradient(0, 0, 512, 0);
    copperGrad.addColorStop(0, '#9a3412');
    copperGrad.addColorStop(0.35, '#ea580c');
    copperGrad.addColorStop(0.55, '#fdba74');
    copperGrad.addColorStop(0.75, '#c2410c');
    copperGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = copperGrad;
    ctx.fillRect(0, 0, 512, 170);

    // Dividing gold pin-stripe
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 168, 512, 4);

    // Polarity sign on copper band
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+', 256, 110);

    // Black battery body brand details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('PROCELL INDUSTRIAL', 256, 260);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('HEAVY DUTY 1.5V D-CELL', 256, 310);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '18px monospace';
    ctx.fillText('LR20 // ALKALINE SYSTEM', 256, 360);
    ctx.fillText('CAUTION: DO NOT RECHARGE OR INCINERATE', 256, 400);

    // Negative terminal indicator at bottom
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(0, 470, 512, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('-', 256, 502);
  });
}

// 9b. Orion Magnesium Emergency Signal Flare Texture
export function createOrionFlareTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 256, (ctx) => {
    // Red waxed waterproof paper casing
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 512, 256);

    // Black & white diagonal warning chevrons
    ctx.fillStyle = '#ffffff';
    for (let x = -50; x < 550; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 30, 0);
      ctx.lineTo(x + 10, 50);
      ctx.lineTo(x - 20, 50);
      ctx.fill();
    }

    // Black striker safety cap section
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 75, 256);
    ctx.fillStyle = '#475569';
    for (let y = 10; y < 250; y += 12) {
      ctx.fillRect(5, y, 65, 4); // grip ridges
    }

    // High visibility warning label
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(90, 70, 400, 160);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ORION 30-MIN HIGH OUTPUT', 105, 110);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('MAGNESIUM SIGNAL FLARE', 105, 140);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#1e293b';
    ctx.fillText('• 2000 CANDLEPOWER INTENSE LIGHT', 105, 175);
    ctx.fillText('• BLINDS PREDATORY ANOMALIES', 105, 205);
  });
}

// 9c. Authentic Topographic Geological Survey Map Texture
export function createTopographicMapTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(1024, 1024, (ctx) => {
    // Vintage aged survey paper parchment
    ctx.fillStyle = '#e8dec8';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle paper crease shadows (quad fold)
    ctx.fillStyle = 'rgba(60, 45, 30, 0.12)';
    ctx.fillRect(508, 0, 8, 1024); // vertical fold
    ctx.fillRect(0, 508, 1024, 8); // horizontal fold

    // Grid lines
    ctx.strokeStyle = 'rgba(100, 90, 80, 0.2)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 1024; g += 64) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(1024, g);
      ctx.stroke();
    }

    // Topographic brown elevation contour lines
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1.6;
    for (let c = 50; c < 500; c += 28) {
      ctx.beginPath();
      for (let th = 0; th <= Math.PI * 2 + 0.1; th += 0.2) {
        const noise = Math.sin(th * 4) * 22 + Math.cos(th * 6) * 14;
        const rad = c + noise;
        const x = 512 + Math.cos(th) * rad;
        const y = 480 + Math.sin(th) * rad * 0.85;
        if (th === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Water streams / wetlands in blue
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, 100);
    ctx.bezierCurveTo(340, 280, 260, 600, 480, 950);
    ctx.stroke();

    // Red dashed trail paths
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(512, 180);
    ctx.lineTo(512, 850);
    ctx.lineTo(820, 720);
    ctx.stroke();
    ctx.setLineDash([]);

    // Landmarks & Annotations
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BLACKWOOD RIDGE STATE FOREST', 512, 70);
    ctx.font = '16px monospace';
    ctx.fillText('U.S. GEOLOGICAL SURVEY // SECTOR 7-B', 512, 105);

    // North Arrow
    ctx.fillStyle = '#7f1d1d';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('▲ N', 940, 120);

    // Key points
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('■ RANGER STATION [CABIN 01]', 750, 240);
    ctx.fillText('▲ LOOKOUT TOWER [BLUFF]', 860, 480);
    ctx.fillText('⚡ DIESEL GENERATOR [SOUTH]', 740, 780);
    ctx.fillText('⛺ CAMPSITE [WEST RIDGE]', 260, 460);
    ctx.fillText('⚠ HIGHWAY 9 PERIMETER GATE', 512, 920);
  });
}

// 9d. Vintage Whiskey / Medicinal Bottle Label
export function createVintageBottleLabelTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#fef3c7'; // aged parchment paper
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 236, 236);
    ctx.strokeRect(16, 16, 224, 224);

    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('OLD CROW', 128, 55);
    ctx.font = '14px serif';
    ctx.fillText('KENTUCKY BOURBON', 128, 80);

    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('90 PROOF • 750 ML', 128, 120);

    ctx.fillStyle = '#78350f';
    ctx.font = '11px monospace';
    ctx.fillText('DISTILLED & BOTTLED IN 1978', 128, 155);
    ctx.fillText('HIGHLY FLAMMABLE // ALCOHOL', 128, 180);
  });
}

// 9e. 1980s Pickup Truck Dashboard & Instrument Cluster Texture
export function createTruckDashboardTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 256, (ctx) => {
    ctx.fillStyle = '#1c1917'; // matte vinyl dashboard
    ctx.fillRect(0, 0, 512, 256);

    // Instrument gauge cluster bezel
    ctx.fillStyle = '#292524';
    ctx.fillRect(40, 30, 240, 180);
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 30, 240, 180);

    // Speedometer Dial
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.arc(110, 120, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(110, 120, 44, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();

    // Needle
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(110, 120);
    ctx.lineTo(80, 95);
    ctx.stroke();

    // Tachometer / Fuel Gauge
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.arc(210, 120, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY', 210, 125);

    // Center Console & Radio Cassette Deck
    ctx.fillStyle = '#18181b';
    ctx.fillRect(310, 40, 170, 120);
    ctx.fillStyle = '#22c55e';
    ctx.font = '14px monospace';
    ctx.fillText('AM 1040 kHz', 395, 80);

    // Glovebox
    ctx.fillStyle = '#292524';
    ctx.fillRect(310, 180, 170, 60);
  });
}

// 9f. Occult Spiral Rune Petroglyphs Texture for Standing Megaliths
export function createOccultRuneTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 1024, (ctx) => {
    ctx.fillStyle = '#23272d'; // ancient granite
    ctx.fillRect(0, 0, 512, 1024);

    // Granite speckle & lichen noise
    for (let i = 0; i < 6000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 1024;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(15, 17, 20, 0.4)' : 'rgba(160, 175, 190, 0.2)';
      ctx.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }

    // Moss / lichen patches
    for (let m = 0; m < 14; m++) {
      const mx = Math.random() * 512;
      const my = Math.random() * 1024;
      const rad = 20 + Math.random() * 45;
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, rad);
      grad.addColorStop(0, 'rgba(40, 60, 35, 0.6)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Deeply carved ancient occult spiral
    ctx.strokeStyle = '#0a0d11'; // carved shadow
    ctx.lineWidth = 8;
    ctx.beginPath();
    const cx = 256;
    const cy = 400;
    for (let a = 0; a < Math.PI * 9; a += 0.1) {
      const r = 4 + a * 6;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Glowing moonlit inner chiseled edge
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cryptic archaic cuneiform runes carved down the pillar
    ctx.strokeStyle = '#0e1116';
    ctx.lineWidth = 6;
    const runes = [
      [[220, 650], [290, 650], [255, 620], [255, 690]],
      [[210, 740], [256, 710], [300, 740], [256, 780]],
      [[220, 830], [290, 830], [220, 880], [290, 880], [256, 830], [256, 880]],
    ];
    runes.forEach((rune) => {
      ctx.beginPath();
      for (let i = 0; i < rune.length - 1; i += 2) {
        ctx.moveTo(rune[i][0], rune[i][1]);
        ctx.lineTo(rune[i + 1][0], rune[i + 1][1]);
      }
      ctx.stroke();
    });
  });
}

// 10. Weathered Cedar Shingle Roof Texture
export function createCabinShingleTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const rowHeight = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowHeight;
      const offset = (r % 2) * 24;
      for (let x = -30; x < 540; x += 48) {
        const sx = x + offset + ((r * 13) % 11);
        const w = 44 + ((r * 7) % 7);
        // Cedar shingle color variation
        const tone = 28 + ((r * 17 + x) % 18);
        ctx.fillStyle = `rgb(${tone + 6}, ${tone + 4}, ${tone})`;
        ctx.fillRect(sx, y, w, rowHeight - 2);

        // Shadow under shingle edge
        ctx.fillStyle = 'rgba(10, 12, 14, 0.7)';
        ctx.fillRect(sx, y + rowHeight - 3, w, 3);

        // Vertical grain slashes
        ctx.fillStyle = 'rgba(15, 17, 20, 0.4)';
        ctx.fillRect(sx + 10, y + 2, 2, rowHeight - 6);
        ctx.fillRect(sx + 24, y + 4, 1.5, rowHeight - 8);
      }
    }
  });
}

// 11. Rustic River Rock / Masonry Chimney Texture
export function createStoneChimneyTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#17191d'; // dark mortar
    ctx.fillRect(0, 0, 512, 512);

    for (let y = 0; y < 512; y += 36) {
      const rowOffset = ((y / 36) % 2) * 32;
      for (let x = -20; x < 530; x += 64) {
        const stoneW = 54 + ((x * 3 + y) % 14);
        const stoneH = 28 + ((x + y * 7) % 8);
        const g = 45 + ((x * 11 + y * 13) % 35);
        ctx.fillStyle = `rgb(${g + 4}, ${g + 5}, ${g + 8})`;
        ctx.beginPath();
        ctx.roundRect(x + rowOffset, y + 3, stoneW, stoneH, 6);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(200, 210, 220, 0.12)';
        ctx.fillRect(x + rowOffset + 4, y + 5, stoneW - 8, 4);
      }
    }
  });
}

// 12. Weathered Interior Wood Floor Planks
export function createWoodPlankFloorTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = '#261b12';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 32;
    for (let y = 0; y < 512; y += plankHeight) {
      const hue = 32 + ((y * 7) % 16);
      ctx.fillStyle = `rgb(${hue + 14}, ${hue + 6}, ${hue - 8})`;
      ctx.fillRect(0, y, 512, plankHeight - 2);

      // Dark seam
      ctx.fillStyle = '#110c08';
      ctx.fillRect(0, y + plankHeight - 2, 512, 2);

      // Random nail heads
      for (let n = 20; n < 512; n += 90) {
        ctx.fillStyle = '#0a0806';
        ctx.beginPath();
        ctx.arc(n, y + 8, 2, 0, Math.PI * 2);
        ctx.arc(n, y + plankHeight - 8, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// 13. Window Glass with Dirt and Grime
export function createWindowGlassTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = 'rgba(30, 45, 60, 0.4)';
    ctx.fillRect(0, 0, 256, 256);

    // Weathered grime edges
    ctx.fillStyle = 'rgba(25, 20, 15, 0.55)';
    ctx.fillRect(0, 0, 256, 12);
    ctx.fillRect(0, 244, 256, 12);
    ctx.fillRect(0, 0, 12, 256);
    ctx.fillRect(244, 0, 12, 256);

    // Diagonal rain streaks
    ctx.strokeStyle = 'rgba(180, 200, 220, 0.2)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 15; i++) {
      const sx = Math.random() * 240;
      const sy = Math.random() * 200;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 8, sy + 35);
      ctx.stroke();
    }
  });
}

// 14. Real-life Dense Pine / Fir Foliage Texture
export function createPineFoliageTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Deep nocturnal forest evergreen backdrop
    ctx.fillStyle = '#0a160d';
    ctx.fillRect(0, 0, 512, 512);

    // Radiating branch stems with dense needle sprays
    for (let b = 0; b < 48; b++) {
      const bx = Math.random() * 512;
      const by = Math.random() * 512;
      const bAngle = Math.random() * Math.PI * 2;
      const bLen = 35 + Math.random() * 65;

      // Stem woody core
      ctx.strokeStyle = '#221a12';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      const ex = bx + Math.cos(bAngle) * bLen;
      const ey = by + Math.sin(bAngle) * bLen;
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Dense needle clusters shooting off each branch stem
      for (let n = 0; n < 35; n++) {
        const t = n / 35;
        const nx = bx + Math.cos(bAngle) * (bLen * t);
        const ny = by + Math.sin(bAngle) * (bLen * t);
        const spread = (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.4);
        const nAngle = bAngle + spread;
        const nLen = 14 + Math.random() * 18;

        const shade = Math.floor(Math.random() * 4);
        // Rich organic evergreen tones
        const colors = [
          'rgba(14, 34, 20, 0.85)',
          'rgba(19, 44, 26, 0.85)',
          'rgba(26, 58, 34, 0.9)',
          'rgba(34, 76, 44, 0.75)',
        ];
        ctx.strokeStyle = colors[shade];
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + Math.cos(nAngle) * nLen, ny + Math.sin(nAngle) * nLen);
        ctx.stroke();
      }
    }

    // Micro needle tips highlight for flashlight specular response
    for (let i = 0; i < 600; i++) {
      const tx = Math.random() * 512;
      const ty = Math.random() * 512;
      ctx.fillStyle = 'rgba(52, 108, 64, 0.45)';
      ctx.beginPath();
      ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// 15. Pine Foliage Bump / Depth Map
export function createPineFoliageBumpMap(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const len = 6 + Math.random() * 12;
      const ang = Math.random() * Math.PI * 2;
      const brightness = Math.floor(80 + Math.random() * 140);
      ctx.strokeStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    }
  }, false);
}

// 16. Real-life Packed Forest Dirt Trail Texture
export function createDirtTrailTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Packed dark forest clay & earth
    ctx.fillStyle = '#1e1812';
    ctx.fillRect(0, 0, 512, 512);

    // Center trail footway wear gradient
    const centerGrad = ctx.createLinearGradient(0, 0, 512, 0);
    centerGrad.addColorStop(0, 'rgba(18, 14, 10, 0.6)');
    centerGrad.addColorStop(0.2, 'rgba(38, 30, 22, 0.75)');
    centerGrad.addColorStop(0.5, 'rgba(48, 38, 28, 0.9)');
    centerGrad.addColorStop(0.8, 'rgba(38, 30, 22, 0.75)');
    centerGrad.addColorStop(1, 'rgba(18, 14, 10, 0.6)');
    ctx.fillStyle = centerGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Ruts / packed parallel trail tracks
    for (let rutX of [140, 370]) {
      ctx.fillStyle = 'rgba(16, 12, 8, 0.55)';
      ctx.fillRect(rutX - 18, 0, 36, 512);

      // Faint vehicle / boot impressions
      for (let y = 0; y < 512; y += 32) {
        ctx.strokeStyle = 'rgba(56, 44, 32, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(rutX - 14, y);
        ctx.lineTo(rutX + 14, y + 8);
        ctx.stroke();
      }
    }

    // Gravel stones, pebbles, and scattered pine needles
    for (let p = 0; p < 800; p++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const size = 1.5 + Math.random() * 3.5;
      const shade = 40 + Math.floor(Math.random() * 45);
      ctx.fillStyle = `rgb(${shade + 4}, ${shade}, ${shade - 4})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fallen twigs and dry pine needles along the trail
    ctx.lineWidth = 1.4;
    for (let n = 0; n < 1200; n++) {
      const nx = Math.random() * 512;
      const ny = Math.random() * 512;
      const ang = Math.random() * Math.PI;
      const len = 8 + Math.random() * 10;
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(78, 48, 24, 0.65)' : 'rgba(28, 22, 16, 0.7)';
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + Math.cos(ang) * len, ny + Math.sin(ang) * len);
      ctx.stroke();
    }
  });
}

// 17. Real-life Mountain Granite Boulder Texture
export function createRockBoulderTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx) => {
    // Weathered dark mountain granite base
    ctx.fillStyle = '#23272b';
    ctx.fillRect(0, 0, 512, 512);

    // Natural stone vein fractures & strata
    for (let s = 0; s < 18; s++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      const sLen = 80 + Math.random() * 180;
      const sAng = -0.4 + (Math.random() - 0.5) * 0.5;

      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(15, 17, 19, 0.75)' : 'rgba(54, 60, 68, 0.5)';
      ctx.lineWidth = 1.5 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(sAng) * sLen, sy + Math.sin(sAng) * sLen);
      ctx.stroke();
    }

    // Mineral specks (quartz flecks and dark biotite flakes)
    for (let i = 0; i < 4000; i++) {
      const fx = Math.random() * 512;
      const fy = Math.random() * 512;
      const isQuartz = Math.random() > 0.75;
      ctx.fillStyle = isQuartz ? 'rgba(180, 195, 210, 0.4)' : 'rgba(10, 12, 14, 0.6)';
      ctx.fillRect(fx, fy, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }

    // Dark damp moss patches on stone crevices
    for (let m = 0; m < 14; m++) {
      const mx = Math.random() * 512;
      const my = Math.random() * 512;
      const mRad = 15 + Math.random() * 35;
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, mRad);
      grad.addColorStop(0, 'rgba(24, 38, 22, 0.65)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, mRad, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// 18. Photorealistic Soft Exhalation Breath Vapor Cloud Texture
export function createBreathVaporTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Billowing organic multi-lobed puff
  const lobes = [
    { x: 128, y: 128, r: 105, a: 0.55 },
    { x: 110, y: 118, r: 85, a: 0.45 },
    { x: 146, y: 115, r: 80, a: 0.42 },
    { x: 120, y: 145, r: 90, a: 0.48 },
    { x: 142, y: 138, r: 82, a: 0.44 },
    { x: 98, y: 132, r: 65, a: 0.35 },
    { x: 154, y: 125, r: 68, a: 0.36 },
  ];

  for (const lobe of lobes) {
    const grad = ctx.createRadialGradient(lobe.x, lobe.y, 0, lobe.x, lobe.y, lobe.r);
    grad.addColorStop(0, `rgba(255, 255, 255, ${lobe.a})`);
    grad.addColorStop(0.35, `rgba(245, 250, 255, ${lobe.a * 0.75})`);
    grad.addColorStop(0.7, `rgba(220, 235, 245, ${lobe.a * 0.3})`);
    grad.addColorStop(1, 'rgba(200, 220, 235, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lobe.x, lobe.y, lobe.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft internal wisps and micro-turbulence
  for (let i = 0; i < 350; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.7) * 95;
    const px = 128 + Math.cos(angle) * dist;
    const py = 128 + Math.sin(angle) * dist;
    const pRad = 4 + Math.random() * 12;
    const pAlpha = (1.0 - dist / 110) * (0.08 + Math.random() * 0.12);
    if (pAlpha > 0) {
      const grad = ctx.createRadialGradient(px, py, 0, px, py, pRad);
      grad.addColorStop(0, `rgba(255, 255, 255, ${pAlpha})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pRad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 19. Flashlight Volumetric Dust Mote / Frost Fleck Texture
export function createDustMoteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 64, 64);
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  grad.addColorStop(0.3, 'rgba(235, 245, 255, 0.6)');
  grad.addColorStop(0.7, 'rgba(190, 220, 245, 0.15)');
  grad.addColorStop(1, 'rgba(150, 180, 210, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

