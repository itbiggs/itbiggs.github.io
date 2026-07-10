// ── Globe ────────────────────────────────────────────────────────
(function initGlobe() {
  const hero = document.getElementById('hero');
  const canvas = document.getElementById('globe-canvas');

  if (!hero || !canvas) {
    console.error('Hero or canvas element not found');
    return;
  }

  if (typeof THREE === 'undefined') {
    console.error('THREE.js not loaded');
    return;
  }

  // Use getBoundingClientRect for accurate post-layout dimensions
  const rect = hero.getBoundingClientRect();
  const W = rect.width || window.innerWidth;
  const H = rect.height || (window.innerHeight - 56);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(0, 0, 2.7);

  // Dark ocean sphere
  const oceanMat = new THREE.MeshPhongMaterial({ color: 0x060d14, shininess: 30, specular: 0x0a2030 });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 64), oceanMat));

  // Atmosphere glow shells
  const atm1 = new THREE.MeshPhongMaterial({ color: 0x1a4a6a, transparent: true, opacity: 0.10, side: THREE.BackSide, depthWrite: false });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.18, 64, 64), atm1));
  const atm2 = new THREE.MeshPhongMaterial({ color: 0x2a6a90, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.32, 64, 64), atm2));

  // Lights
  scene.add(new THREE.AmbientLight(0x1a2a38, 2.5));
  const sun = new THREE.DirectionalLight(0x6aa8c8, 0.45);
  sun.position.set(5, 3, 4);
  scene.add(sun);

  // Globe group — everything geo rotates together
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Convert lon/lat to xyz on unit sphere
  function ll2xyz(lon, lat, r) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Draw a single GeoJSON coordinate ring as a LineLoop
  function addRing(coords, color, opacity) {
    const pts = coords.map(([lon, lat]) => ll2xyz(lon, lat, 1.001));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    globeGroup.add(new THREE.LineLoop(geo, mat));
  }

  // Lat/lon graticule grid
  function addGraticule() {
    const c = 0x1a3040, o = 0.6;
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 2) pts.push(ll2xyz(lon, lat, 1.001));
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o })));
    }
    for (let lon = -180; lon <= 180; lon += 20) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 2) pts.push(ll2xyz(lon, lat, 1.001));
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o })));
    }
  }
  addGraticule();

  // Country outlines from Natural Earth via CDN
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r => r.json())
    .then(world => {
      const topoScript = document.createElement('script');
      topoScript.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
      topoScript.onload = () => {
        const countries = topojson.feature(world, world.objects.countries);
        countries.features.forEach(f => {
          const rings = f.geometry.type === 'Polygon'
            ? f.geometry.coordinates
            : f.geometry.type === 'MultiPolygon'
            ? f.geometry.coordinates.flat()
            : [];
          rings.forEach(ring => {
            if (ring.length < 3) return;
            addRing(ring, 0x5ba3c9, 0.85);  // crisp outline
            addRing(ring, 0x90c8e8, 0.18);  // soft glow pass
          });
        });
      };
      document.head.appendChild(topoScript);
    });

  // UIUC marker dot + pulsing ring
  const uiucXYZ = ll2xyz(-88.2272, 40.1020, 1.012);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x90c8e8 })
  );
  dot.position.copy(uiucXYZ);
  globeGroup.add(dot);

  const ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.018, 0.022, 32),
    new THREE.MeshBasicMaterial({ color: 0x90c8e8, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  );
  ringMesh.position.copy(uiucXYZ);
  ringMesh.lookAt(uiucXYZ.clone().multiplyScalar(2));
  globeGroup.add(ringMesh);

  // Drag interaction
  let isDragging = false, prevX = 0, prevY = 0, velY = 0, velX = 0;
  const AUTO_SPEED = 0.0008;

  function dragStart(x, y) { isDragging = true; prevX = x; prevY = y; velY = 0; velX = 0; canvas.style.cursor = 'grabbing'; }
  function dragEnd()        { isDragging = false; canvas.style.cursor = 'grab'; }
  function dragMove(x, y)   {
    if (!isDragging) return;
    velY = (x - prevX) * 0.005;
    velX = (y - prevY) * 0.003;
    globeGroup.rotation.y += velY;
    globeGroup.rotation.x = Math.max(-0.7, Math.min(0.7, globeGroup.rotation.x + velX));
    prevX = x; prevY = y;
  }

  canvas.addEventListener('mousedown',  e => dragStart(e.clientX, e.clientY));
  window.addEventListener('mouseup',    dragEnd);
  window.addEventListener('mousemove',  e => dragMove(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', e => dragStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener('touchend',   dragEnd);
  window.addEventListener('touchmove',  e => dragMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  // Render loop
  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.04;
    if (!isDragging) {
      velY *= 0.93; velX *= 0.93;
      globeGroup.rotation.y += AUTO_SPEED + velY;
      globeGroup.rotation.x += velX;
      globeGroup.rotation.x *= 0.97;
    }
    // Pulse the UIUC ring
    const s = 1 + 0.4 * Math.sin(t);
    ringMesh.scale.set(s, s, s);
    ringMesh.material.opacity = 0.7 * (1 - 0.5 * Math.abs(Math.sin(t)));
    renderer.render(scene, camera);
  })();

  // Resize handler
  window.addEventListener('resize', () => {
    const r = hero.getBoundingClientRect();
    const nW = r.width || window.innerWidth;
    const nH = r.height || (window.innerHeight - 56);
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
})();

// ── Smooth scroll for nav links ──────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ── Active nav link highlight on scroll ─────────────────────────
const navLinks = document.querySelectorAll('nav ul a');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`nav ul a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('section[id]').forEach(s => navObserver.observe(s));

// ── Scroll reveal ────────────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll(
  'section:not(#hero), .card, .gis-card, .timeline-item, .campus-card, .skill-group'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});