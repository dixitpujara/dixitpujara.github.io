/* ══════════════════════════════════════════════
   HERO 3D BACKGROUND — Three.js particle wave
   A field of logo-blue points rolling like a sea; the cursor lifts and
   ripples it. Touch: the ripple drifts on its own. Reduced motion: one still frame.
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
  const small = window.innerWidth <= 960;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 3.4, 10);
  camera.lookAt(0, 0, -2);

  /* ── Grid of points on the XZ plane ── */
  const COLS = small ? 90 : 170, ROWS = small ? 46 : 72;
  const W = 36, D = 22;
  const pos = new Float32Array(COLS * ROWS * 3);
  let k = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      pos[k++] = (c / (COLS - 1) - 0.5) * W;
      pos[k++] = 0;
      pos[k++] = (r / (ROWS - 1)) * -D + 6;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const uniforms = {
    uTime:  { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 2) },
    uLift:  { value: 0 },
    uColA:  { value: new THREE.Color('#0038D6') },
    uColB:  { value: new THREE.Color('#00A6FF') },
    uAlpha: { value: 0.6 },
    uSize:  { value: (small ? 34 : 30) * renderer.getPixelRatio() },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uTime, uLift, uSize;
      uniform vec2 uMouse;
      varying float vH;
      varying float vFade;
      void main() {
        vec3 p = position;
        float wave = sin(p.x * 0.32 + uTime * 0.7) * 0.32
                   + cos(p.z * 0.42 + uTime * 0.55) * 0.30
                   + sin((p.x + p.z) * 0.18 + uTime * 0.4) * 0.22;
        float d = distance(p.xz, uMouse);
        float bump = exp(-d * d * 0.22) * 1.35 * uLift;
        float ring = sin(d * 1.8 - uTime * 3.2) * 0.16 * exp(-d * 0.35) * uLift;
        p.y = wave + bump + ring;
        vH = p.y;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (1.0 + bump * 0.6) / -mv.z;
        gl_Position = projectionMatrix * mv;
        // fade towards the horizon and the side edges
        vFade = smoothstep(-16.0, -2.0, p.z) * (1.0 - smoothstep(12.0, 18.0, abs(p.x)));
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColA, uColB;
      uniform float uAlpha;
      varying float vH;
      varying float vFade;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float soft = smoothstep(0.5, 0.1, r);
        vec3 col = mix(uColA, uColB, smoothstep(-0.6, 1.4, vH));
        gl_FragColor = vec4(col, soft * uAlpha * vFade);
      }`,
  });

  const points = new THREE.Points(geo, mat);
  points.position.y = -1.6;
  scene.add(points);

  /* ── Theme ── */
  function applyTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    uniforms.uColA.value.set(dark ? '#2563EB' : '#0038D6');
    uniforms.uColB.value.set(dark ? '#38BDF8' : '#00A6FF');
    uniforms.uAlpha.value = dark ? 0.85 : 0.55;
    mat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    mat.needsUpdate = true;
    renderOnce();
  }

  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderOnce();
  }

  /* ── Cursor → point on the wave plane ── */
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.6);
  const ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const target = new THREE.Vector2(0, 2);
  let lift = 0, liftTarget = 0;

  if (finePointer) {
    hero.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) { target.set(hit.x, hit.z); liftTarget = 1; }
      else liftTarget = 0.4;
    });
    hero.addEventListener('pointerleave', () => { liftTarget = 0; });
  }

  /* ── Loop (paused off-screen / hidden tab) ── */
  const clock = new THREE.Clock();
  let running = false, visible = true, rafId = 0;

  function frame() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    if (!finePointer) {                       // touch: a slow wandering ripple
      target.set(Math.sin(t * 0.3) * 7, Math.cos(t * 0.22) * 3 + 1);
      liftTarget = 0.8;
    }
    uniforms.uMouse.value.lerp(target, 0.08);
    lift += (liftTarget - lift) * 0.05;
    uniforms.uLift.value = lift;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduceMotion) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(rafId); }
  function renderOnce() { if (!running) renderer.render(scene, camera); }

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    visible && !document.hidden ? start() : stop();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : visible && start(); });

  let resizeT = 0;
  new ResizeObserver(() => { clearTimeout(resizeT); resizeT = setTimeout(layout, 100); }).observe(hero);
  window.addEventListener('themechange', applyTheme);

  if (reduceMotion) uniforms.uTime.value = 2.0;   // a pleasant still frame
  layout();
  applyTheme();
  hero.classList.add('webgl-ready');
  if (!reduceMotion) start();
}
