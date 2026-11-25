import * as THREE from 'three';

const layer = document.getElementById('three-background');
if (!layer) throw new Error('Three.js background layer is missing.');

try {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: (window.devicePixelRatio || 1) < 1.5,
    powerPreference: 'low-power'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'three-background-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  layer.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.z = 14;

  const forms = new THREE.Group();
  scene.add(forms);

  function wireShape(geometry, color, position, scale, speed) {
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.setScalar(scale);
    mesh.userData.rotationSpeed = speed;
    forms.add(mesh);
    return mesh;
  }

  const shapes = [
    wireShape(new THREE.IcosahedronGeometry(1.15, 0), 0x8b5cf6, [0, 0, -3], 1.05, 0.13),
    wireShape(new THREE.TorusKnotGeometry(0.72, 0.018, 96, 7, 2, 3), 0x38bdf8, [0, 0, -4], 1.05, -0.1),
    wireShape(new THREE.OctahedronGeometry(0.92, 0), 0xa78bfa, [0, 0, -2], 0.9, 0.16),
    wireShape(new THREE.DodecahedronGeometry(0.85, 0), 0x60a5fa, [0, 0, -5], 1.05, -0.12)
  ];

  const particlePositions = new Float32Array(105 * 3);
  for (let i = 0; i < particlePositions.length; i += 3) {
    particlePositions[i] = (Math.random() - 0.5) * 20;
    particlePositions[i + 1] = (Math.random() - 0.5) * 12;
    particlePositions[i + 2] = -2 - Math.random() * 15;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
    color: 0x8b5cf6,
    size: 0.035,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  }));
  scene.add(particles);

  let targetX = 0;
  let targetY = 0;
  let frame = 0;
  let width = 0;
  let height = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const halfWidth = halfHeight * camera.aspect;
    const x = Math.min(halfWidth * 0.72, 6.4);
    const y = Math.min(halfHeight * 0.56, 3.7);
    shapes[0].position.set(-x, y, -3);
    shapes[1].position.set(x, y * 0.82, -4);
    shapes[2].position.set(x * 0.92, -y, -2);
    shapes[3].position.set(-x * 0.95, -y * 0.85, -5);
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate(time) {
    frame = window.requestAnimationFrame(animate);
    const seconds = time * 0.00012;
    shapes.forEach(shape => {
      shape.rotation.x += shape.userData.rotationSpeed * 0.002;
      shape.rotation.y += shape.userData.rotationSpeed * 0.003;
    });
    forms.rotation.x += (targetY * 0.035 - forms.rotation.x) * 0.025;
    forms.rotation.y += (targetX * 0.035 - forms.rotation.y) * 0.025;
    particles.rotation.y = Math.sin(seconds) * 0.035;
    render();
  }

  function startAnimation() {
    if (frame || reducedMotion.matches || document.hidden) return;
    frame = window.requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (!frame) return;
    window.cancelAnimationFrame(frame);
    frame = 0;
    render();
  }

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', event => {
    targetX = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
    targetY = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stopAnimation() : startAnimation());
  reducedMotion.addEventListener?.('change', () => reducedMotion.matches ? stopAnimation() : startAnimation());

  resize();
  startAnimation();
} catch {
  layer.classList.add('three-background-fallback');
}
