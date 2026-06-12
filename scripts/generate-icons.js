/**
 * generate-icons.js
 * Generates all app icon variants from assets/icon.png
 *
 * Outputs:
 *   assets/icon.png              — 1024×1024  (App Store / Play Store)
 *   assets/splash-icon.png       — 1024×1024  brain+bubble on transparent bg (splash)
 *   assets/android-icon-foreground.png  — 1024×1024 transparent bg (adaptive layer)
 *   assets/android-icon-background.png — 1024×1024 solid purple (#6C63FF)
 *   assets/android-icon-monochrome.png  — 1024×1024 white silhouette on black
 *   assets/favicon.png           — 48×48
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets');
const SRC = path.join(ASSETS, 'icon.png');
const PURPLE = '#6C63FF';

async function run() {
  console.log('📐 Reading source icon…');
  const src = sharp(SRC);
  const meta = await src.metadata();
  console.log(`   ${meta.width}×${meta.height} ${meta.format}`);

  // ── 1. icon.png — ensure 1024×1024, keep as-is ──────────────────────────
  const iconBuf = await sharp(SRC)
    .resize(1024, 1024, { fit: 'cover' })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(ASSETS, 'icon.png'), iconBuf);
  console.log('✅ icon.png (1024×1024)');

  // ── 2. splash-icon.png — rounded square logo on transparent bg ──────────
  // We extract the inner graphic portion, resize to 512px, center on 1024
  const inner = await sharp(SRC)
    .resize(640, 640, { fit: 'inside' })
    .toBuffer();

  const splashCanvas = {
    create: {
      width: 1024, height: 1024,
      channels: 4,
      background: { r: 108, g: 99, b: 255, alpha: 1 }, // #6C63FF
    }
  };

  await sharp(splashCanvas)
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('✅ splash-icon.png (1024×1024 centered on purple)');

  // ── 3. android-icon-foreground.png — just the graphic, transparent bg ───
  // Remove the rounded-rect background: resize to 80% of 1024, transparent surround
  const fgGraphic = await sharp(SRC)
    .resize(820, 820, { fit: 'inside' })
    .toBuffer();

  const transparentCanvas = {
    create: {
      width: 1024, height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }
  };

  await sharp(transparentCanvas)
    .composite([{ input: fgGraphic, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('✅ android-icon-foreground.png (transparent bg)');

  // ── 4. android-icon-background.png — solid purple ───────────────────────
  await sharp({
    create: {
      width: 1024, height: 1024,
      channels: 3,
      background: { r: 108, g: 99, b: 255 },
    }
  })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));
  console.log('✅ android-icon-background.png (solid purple)');

  // ── 5. android-icon-monochrome.png — white silhouette on black bg ────────
  // Android expects: white/light icon on black background (no transparency)
  const monoGraphic = await sharp(SRC)
    .resize(820, 820, { fit: 'inside' })
    .greyscale()
    .normalise()
    .toBuffer();

  const blackCanvas = {
    create: {
      width: 1024, height: 1024,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    }
  };

  await sharp(blackCanvas)
    .composite([{ input: monoGraphic, gravity: 'center' }])
    .png()
    .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('✅ android-icon-monochrome.png (white silhouette on black)');

  // ── 6. favicon.png — 48×48 ───────────────────────────────────────────────
  await sharp(SRC)
    .resize(48, 48, { fit: 'cover' })
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));
  console.log('✅ favicon.png (48×48)');

  console.log('\n🎉 All icons generated!');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
