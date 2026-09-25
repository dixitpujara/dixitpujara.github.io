/* ══════════════════════════════════════════════
   HERO 3D SCENE — Three.js
   Crystal core + orbit rings + floating shapes + particle field.
   Desktop: follows the cursor. Touch: gyroscope or slow auto-sway.
   Reduced motion: a single static frame.
══════════════════════════════════════════════ */
import * as THREE from './vendor/three.module.min.js';

const hero   = document.getElementById('home');
const canvas = document.getElementById('heroCanvas');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (hero && canvas && webglAvailable()) init();

function init() {
  const isSmall = () => window.innerWidth <= 960;

  /* ── Renderer / scene / camera ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  /* ── Lights ── */
  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  const key     = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 8);
  const rimA = new THREE.PointLight(0xffffff, 40, 30);
  rimA.position.set(-6, 2, 4);
  const rimB = new THREE.PointLight(0xffffff, 30, 30);
  rimB.position.set(6, -4, 3);
  scene.add(ambient, key, rimA, rimB);

  /* ── Rig: everything that follows the cursor ── */
  const anchor = new THREE.Group();   // positioned/scaled to the layout
  const rig    = new THREE.Group();   // rotated by the cursor
  anchor.add(rig);
  scene.add(anchor);

  // Crystal core
  const coreGeo = new THREE.IcosahedronGeometry(1.35, 0);
  const coreMat = new THREE.MeshStandardMaterial({ flatShading: true, metalness: 0.35, roughness: 0.22 });
  const core    = new THREE.Mesh(coreGeo, coreMat);
  rig.add(core);

  // Inner glow
  const innerMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35 });
  const inner    = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), innerMat);
  rig.add(inner);

  // Wireframe shell
  const shellMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.45 });
  const shell    = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.05, 1)), shellMat);
  rig.add(shell);

  // Shell vertices as small nodes
  const nodeMat = new THREE.PointsMaterial({ size: 0.065, transparent: true, opacity: 0.9, sizeAttenuation: true });
  const nodes   = new THREE.Points(new THREE.IcosahedronGeometry(2.05, 1), nodeMat);
  rig.add(nodes);

  // Orbit rings
  const ringMatA = new THREE.MeshStandardMaterial({ metalness: 0.6, roughness: 0.3 });
  const ringMatB = new THREE.MeshStandardMaterial({ metalness: 0.6, roughness: 0.3 });
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.025, 12, 160), ringMatA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.018, 12, 160), ringMatB);
  ringA.rotation.set(Math.PI * 0.42, 0.25, 0);
  ringB.rotation.set(Math.PI * 0.62, -0.5, 0.3);
  rig.add(ringA, ringB);

  // Satellites riding the rings
  const satMat = new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.35, flatShading: true });
  const satA = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), satMat);
  const satB = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), satMat);
  ringA.add(satA);
  ringB.add(satB);

  // Floating shapes around the core
  const shapeGeos = [
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.BoxGeometry(0.34, 0.34, 0.34),
    new THREE.TetrahedronGeometry(0.3, 0),
    new THREE.TorusGeometry(0.2, 0.07, 10, 28),
    new THREE.DodecahedronGeometry(0.24, 0),
  ];
  const shapeMats = [0, 1, 2].map(() => new THREE.MeshStandardMaterial({ metalness: 0.25, roughness: 0.3, flatShading: true }));
  const floaters  = [];
  const floatCount = isSmall() ? 8 : 14;
  for (let i = 0; i < floatCount; i++) {
    const m = new THREE.Mesh(shapeGeos[i % shapeGeos.length], shapeMats[i % shapeMats.length]);
    const theta = (i / floatCount) * Math.PI * 2 + Math.random() * 0.4;
    const r     = 3.0 + Math.random() * 0.9;
    const y     = (Math.random() - 0.5) * 3.4;
    m.userData = {
      base: new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r * 0.6),
      speed: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.8),
    };
    m.position.copy(m.userData.base);
    m.scale.setScalar(0.7 + Math.random() * 0.7);
    rig.add(m);
    floaters.push(m);
  }

  // Particle field (whole hero, independent of the rig)
  const count = isSmall() ? 500 : 1300;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 6 + Math.random() * 12;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(p) * Math.cos(t);
    pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.7;
    pos[i * 3 + 2] = r * Math.cos(p) - 6;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ size: 0.045, transparent: true, opacity: 0.7, sizeAttenuation: true, depthWrite: false });
  const dust    = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ── Theme colours from CSS tokens ── */
  function cssColor(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    try { return new THREE.Color(v || fallback); } catch (e) { return new THREE.Color(fallback); }
  }
  function applyTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const a1 = cssColor('--accent', '#5B5BF0');
    const a2 = cssColor('--accent-2', '#8B5CF6');
    const a3 = cssColor('--accent-3', '#06B6D4');

    coreMat.color.copy(a1).lerp(a2, 0.35);
    coreMat.emissive.copy(a1).multiplyScalar(dark ? 0.28 : 0.08);
    innerMat.color.copy(a3);
    shellMat.color.copy(dark ? a3 : a1);
    shellMat.opacity = dark ? 0.5 : 0.35;
    nodeMat.color.copy(dark ? a3 : a2);
    ringMatA.color.copy(a3);
    ringMatB.color.copy(a2);
    satMat.color.copy(a3);
    shapeMats[0].color.copy(a1);
    shapeMats[1].color.copy(a2);
    shapeMats[2].color.copy(a3);
    shapeMats.forEach(m => m.emissive.copy(m.color).multiplyScalar(dark ? 0.18 : 0.03));

    dustMat.color.copy(dark ? new THREE.Color('#C7CBFF') : a1);
    dustMat.opacity = dark ? 0.75 : 0.45;
    dustMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    dustMat.needsUpdate = true;

    rimA.color.copy(a2);
    rimB.color.copy(a3);
    ambient.intensity = dark ? 0.35 : 0.8;
    key.intensity     = dark ? 1.3 : 1.7;
    renderOnce();
  }

  /* ── Layout: place the object in pixel space, convert to world units ── */
  const rigRadius = 3.4; // approx. visual radius of core + rings
  function layout() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    const vh   = Math.min(window.innerHeight, h);

    let cx, cy, size;
    if (isSmall()) {
      const band = Math.min(w * 0.46, 320);        // matches .hero-content padding-top
      cx = w * 0.5;
      cy = 100 + band * 0.5;
      size = Math.min(band * 1.25, w * 0.9);
    } else {
      cx = w * 0.73;
      cy = vh * 0.46;
      size = Math.min(w * 0.42, vh * 0.72, 600);
    }
    anchor.position.set((cx / w - 0.5) * visW, (0.5 - cy / h) * visH, 0);
    anchor.scale.setScalar(((size / h) * visH) / (rigRadius * 2));
    renderOnce();
  }

  /* ── Input ── */
  const target = { x: 0, y: 0 };   // -1..1
  const eased  = { x: 0, y: 0 };
  let hover = 0, hoverEased = 0, gyro = false;

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  if (finePointer) {
    window.addEventListener('pointermove', e => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      hover = raycaster.intersectObject(core, false).length ? 1 : 0;
      hero.style.cursor = hover ? 'grab' : '';
    }, { passive: true });
  } else if (!reduceMotion && 'DeviceOrientationEvent' in window) {
    // Android/most browsers deliver this without a permission prompt; iOS falls back to auto-sway.
    window.addEventListener('deviceorientation', e => {
      if (e.beta == null || e.gamma == null) return;
      gyro = true;
      target.x = THREE.MathUtils.clamp(e.gamma / 30, -1, 1);
      target.y = THREE.MathUtils.clamp((e.beta - 45) / 30, -1, 1);
    }, { passive: true });
  }

  /* ── Render loop (paused off-screen / hidden tab) ── */
  const clock = new THREE.Clock();
  let running = false, visible = true, rafId = 0, spin = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.elapsedTime;

    if (!finePointer && !gyro) {           // touch without gyro: slow sway
      target.x = Math.sin(t * 0.35) * 0.6;
      target.y = Math.cos(t * 0.27) * 0.4;
    }
    eased.x += (target.x - eased.x) * 0.06;
    eased.y += (target.y - eased.y) * 0.06;
    hoverEased += (hover - hoverEased) * 0.08;

    spin += dt * (0.18 + hoverEased * 0.9);
    rig.rotation.y = spin * 0.6 + eased.x * 0.75;
    rig.rotation.x = eased.y * 0.5 + Math.sin(t * 0.4) * 0.05;

    core.rotation.x += dt * 0.25;
    core.rotation.y += dt * 0.35;
    core.scale.setScalar(1 + hoverEased * 0.14 + Math.sin(t * 1.6) * 0.015);
    inner.rotation.y -= dt * 0.8;
    shell.rotation.y -= dt * 0.08;
    nodes.rotation.y = shell.rotation.y;

    ringA.rotation.z += dt * 0.35;
    ringB.rotation.z -= dt * 0.25;
    satA.position.set(2.75, 0, 0);
    satB.position.set(-3.15, 0, 0);
    satA.rotation.x += dt; satB.rotation.y += dt;

    floaters.forEach(m => {
      const d = m.userData;
      m.position.y = d.base.y + Math.sin(t * d.speed + d.phase) * 0.25;
      m.rotation.x += d.spin.x * dt;
      m.rotation.y += d.spin.y * dt;
    });

    // Parallax: the dust drifts opposite to the cursor for depth
    dust.rotation.y = t * 0.012 - eased.x * 0.12;
    dust.rotation.x = -eased.y * 0.08;
    camera.position.x = eased.x * 0.35;
    camera.position.y = -eased.y * 0.25;
    camera.lookAt(0, 0, 0);

    // Scroll: lift and tilt the object as the hero scrolls away
    const s = Math.min(window.scrollY / Math.max(hero.clientHeight, 1), 1);
    anchor.rotation.z = s * 0.4;
    rig.position.y = s * 1.6;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    clock.getDelta();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }
  function renderOnce() {
    if (!running) renderer.render(scene, camera);
  }

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    visible && !document.hidden ? start() : stop();
  }).observe(hero);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : visible && start();
  });

  let resizeT = 0;
  // Hero height also changes when fonts load, so watch the element, not the window
  new ResizeObserver(() => {
    clearTimeout(resizeT);
    resizeT = setTimeout(layout, 100);
  }).observe(hero);
  window.addEventListener('themechange', applyTheme);

  // Static pose for reduced motion
  if (reduceMotion) {
    rig.rotation.set(0.25, -0.5, 0);
    satA.position.set(2.75, 0, 0);
    satB.position.set(-3.15, 0, 0);
  }

  layout();
  applyTheme();
  hero.classList.add('webgl-ready');
  if (!reduceMotion) start();
}
