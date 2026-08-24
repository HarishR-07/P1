/* Divine Innovation — shared site interactions (works across every page; every
   selector is guarded so pages missing a given element simply skip that bit) */

// auto-open a details.acc panel (or scroll to any element) matching the URL hash
function openHashTarget() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === 'DETAILS') el.open = true;
  setTimeout(() => el.scrollIntoView({ behavior:'smooth', block:'start' }), 60);
}
window.addEventListener('DOMContentLoaded', openHashTarget);
window.addEventListener('hashchange', openHashTarget);

// header scroll state
const header = document.getElementById('siteHeader');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive:true });
}

// reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.14 });
  revealEls.forEach(el => io.observe(el));
}

// mobile burger -> go to the contact page (works from any page)
const burger = document.getElementById('burger');
if (burger) {
  burger.addEventListener('click', () => {
    const onContact = document.getElementById('contact');
    if (onContact) { onContact.scrollIntoView({ behavior:'smooth' }); }
    else { window.location.href = 'contact.html'; }
  });
}

// project scroller drag-to-scroll (homepage only)
const scroller = document.getElementById('projScroller');
if (scroller) {
  let isDown = false, startX, scrollLeft;
  scroller.addEventListener('mousedown', (e) => {
    isDown = true; scroller.style.cursor = 'grabbing';
    startX = e.pageX - scroller.offsetLeft;
    scrollLeft = scroller.scrollLeft;
  });
  ['mouseleave','mouseup'].forEach(evt => scroller.addEventListener(evt, () => { isDown = false; scroller.style.cursor='grab'; }));
  scroller.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scroller.offsetLeft;
    scroller.scrollLeft = scrollLeft - (x - startX) * 1.4;
  });
}

// enquiry form -> whatsapp (contact page / homepage)
const enquiryForm = document.getElementById('enquiryForm');
if (enquiryForm) {
  enquiryForm.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('f_name').value || 'there';
    const phone = document.getElementById('f_phone').value || '—';
    const email = document.getElementById('f_email').value || '—';
    const type = document.getElementById('f_type').value;
    const msg = document.getElementById('f_msg').value || '—';
    const text = `Hi Divine Innovation, I'm ${name}.%0APhone: ${phone}%0AEmail: ${email}%0AProject type: ${type}%0ADetails: ${msg}`;
    window.open(`https://api.whatsapp.com/send?phone=919810045759&text=${text}`, '_blank');
  });
}

// scroll progress bar
const progressBar = document.getElementById('scrollProgress');
if (progressBar) {
  function updateProgress(){
    const el = document.documentElement;
    const scrollTop = el.scrollTop || document.body.scrollTop;
    const height = el.scrollHeight - el.clientHeight;
    progressBar.style.width = (height > 0 ? (scrollTop / height) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive:true });
  updateProgress();
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {

  // ambient cursor glow in any dark "forest" section
  const glowSection = document.querySelector('.section.forest');
  const glow = document.getElementById('forestGlow');
  if (glowSection && glow) {
    glowSection.addEventListener('mousemove', (e) => {
      const r = glowSection.getBoundingClientRect();
      glow.style.setProperty('--gx', ((e.clientX - r.left) / r.width) * 100 + '%');
      glow.style.setProperty('--gy', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  }

  // 3D tilt on project / product / why / service-detail cards
  document.querySelectorAll('.proj-card, .product-card, .why-card, .detail-card').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  // magnetic pull on primary buttons
  document.querySelectorAll('.btn-primary, .nav-cta').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const mx = (e.clientX - r.left - r.width / 2) * 0.25;
      const my = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  // gentle scale-in parallax on any ".parallax-img" photo as it enters view
  document.querySelectorAll('.parallax-img').forEach((img) => {
    let ticking = false;
    const applyParallax = () => {
      const r = img.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      img.style.transform = `scale(${(1 + progress * 0.06).toFixed(3)})`;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive:true });
    applyParallax();
  });
}

/* ============================================================
   3D signature moments (Three.js) — each function no-ops safely
   if its canvas isn't present on the current page.
   ============================================================ */

// signature #1: wireframe blueprint tower assembling in the hero
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 980) return;

  let w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
  camera.position.set(0, 1.1, 9);

  const group = new THREE.Group();
  scene.add(group);

  const brassLight = 0x7ec8f2;
  const brassDim = 0x2f86c7;
  const floors = 9;
  const floorMeshes = [];

  for (let i = 0; i < floors; i++) {
    const depth = 2.0 - (i % 3 === 0 ? 0.25 : 0);
    const geo = new THREE.BoxGeometry(2.4, 0.46, depth);
    const edges = new THREE.EdgesGeometry(geo);
    const mat = new THREE.LineBasicMaterial({
      color: i % 4 === 0 ? brassLight : brassDim,
      transparent: true,
      opacity: 0.75
    });
    const mesh = new THREE.LineSegments(edges, mat);
    mesh.position.y = i * 0.6 - (floors * 0.6) / 2;
    mesh.scale.set(0.001, 0.001, 0.001);
    group.add(mesh);
    floorMeshes.push(mesh);
  }

  const ringGeo = new THREE.RingGeometry(3.1, 3.13, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: brassDim, transparent:true, opacity:0.22, side:THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -(floors * 0.6) / 2 - 0.35;
  group.add(ring);

  group.rotation.y = 0.6;
  group.rotation.x = 0.08;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  let start = null;
  function animateEntrance(now) {
    if (start === null) start = now;
    const t = now - start;
    floorMeshes.forEach((m, i) => {
      const delay = i * 130;
      const local = Math.max(0, Math.min(1, (t - delay) / 700));
      const eased = easeOutCubic(local);
      m.scale.set(eased, eased, eased);
    });
    if (t > 400) canvas.classList.add('ready');
  }

  let targetRotY = 0.6, targetRotX = 0.08;
  window.addEventListener('mousemove', (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    targetRotY = 0.6 + nx * 0.5;
    targetRotX = 0.08 + ny * 0.25;
  }, { passive:true });

  function loop(now) {
    animateEntrance(now);
    group.rotation.y += (targetRotY - group.rotation.y) * 0.04 + 0.0012;
    group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('resize', () => {
    if (window.innerWidth < 980) return;
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
  });
})();

// signature #2: wireframe "trust network" sphere (clients band / CTA bands)
(function () {
  const canvas = document.getElementById('clientsCanvas');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 820) return;

  let w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 0, 6);

  const group = new THREE.Group();
  scene.add(group);

  const outerGeo = new THREE.IcosahedronGeometry(2.1, 1);
  const outerMesh = new THREE.LineSegments(
    new THREE.EdgesGeometry(outerGeo),
    new THREE.LineBasicMaterial({ color: 0x7ec8f2, transparent:true, opacity:0.5 })
  );
  group.add(outerMesh);

  const innerGeo = new THREE.IcosahedronGeometry(1.25, 0);
  const innerMesh = new THREE.LineSegments(
    new THREE.EdgesGeometry(innerGeo),
    new THREE.LineBasicMaterial({ color: 0x2f86c7, transparent:true, opacity:0.4 })
  );
  group.add(innerMesh);

  const nodes = new THREE.Points(
    outerGeo,
    new THREE.PointsMaterial({ color: 0x7ec8f2, size:0.055, transparent:true, opacity:0.9 })
  );
  group.add(nodes);

  let start = null;
  function loop(now) {
    if (start === null) start = now;
    const t = (now - start) / 1000;
    group.rotation.y = t * 0.16;
    group.rotation.x = 0.28 + Math.sin(t * 0.22) * 0.1;
    innerMesh.rotation.y = -t * 0.26;
    renderer.render(scene, camera);
    if (t > 0.4) canvas.classList.add('ready');
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('resize', () => {
    if (window.innerWidth < 820) return;
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
  });
})();

// signature #3: an exploded-view wireframe desk + chair assembly (Products page hero)
(function () {
  const canvas = document.getElementById('furnitureCanvas');
  if (!canvas || typeof THREE === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 820) return;

  let w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.set(0, 1, 7.5);

  const group = new THREE.Group();
  scene.add(group);

  const brassLight = 0x7ec8f2;
  const brassDim = 0x2f86c7;
  const parts = [];

  function addPart(geo, color, pos) {
    const mesh = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color, transparent:true, opacity:0.8 })
    );
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.set(0.001, 0.001, 0.001);
    group.add(mesh);
    parts.push(mesh);
    return mesh;
  }

  // desk top
  addPart(new THREE.BoxGeometry(3.2, 0.12, 1.5), brassLight, [0, 0.9, 0]);
  // four legs
  addPart(new THREE.BoxGeometry(0.1, 1.6, 0.1), brassDim, [-1.45, 0.06, -0.6]);
  addPart(new THREE.BoxGeometry(0.1, 1.6, 0.1), brassDim, [1.45, 0.06, -0.6]);
  addPart(new THREE.BoxGeometry(0.1, 1.6, 0.1), brassDim, [-1.45, 0.06, 0.6]);
  addPart(new THREE.BoxGeometry(0.1, 1.6, 0.1), brassDim, [1.45, 0.06, 0.6]);
  // chair seat + back
  addPart(new THREE.BoxGeometry(0.85, 0.1, 0.85), brassLight, [0, -0.55, 1.9]);
  addPart(new THREE.BoxGeometry(0.85, 1.0, 0.1), brassDim, [0, 0.1, 2.3]);

  group.rotation.y = 0.5;
  group.rotation.x = 0.1;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  let start = null;
  function animateEntrance(now) {
    if (start === null) start = now;
    const t = now - start;
    parts.forEach((m, i) => {
      const delay = i * 110;
      const local = Math.max(0, Math.min(1, (t - delay) / 650));
      const eased = easeOutCubic(local);
      m.scale.set(eased, eased, eased);
    });
    if (t > 400) canvas.classList.add('ready');
  }

  let targetRotY = 0.5;
  window.addEventListener('mousemove', (e) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    targetRotY = 0.5 + nx * 0.6;
  }, { passive:true });

  function loop(now) {
    animateEntrance(now);
    group.rotation.y += (targetRotY - group.rotation.y) * 0.04 + 0.001;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('resize', () => {
    if (window.innerWidth < 820) return;
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
  });
})();
