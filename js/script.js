/* ============ REVELAÇÃO AO SCROLL ============ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ============ PARALLAX SUAVE NO HERO ============ */
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y < window.innerHeight) hero.style.backgroundPositionY = (y * 0.35) + 'px';
}, { passive: true });

/* ============ LINK ATIVO NO MENU ============ */
const navLinks = document.querySelectorAll('nav a');
navLinks.forEach(a => a.addEventListener('click', () => {
  navLinks.forEach(b => b.classList.remove('active'));
  a.classList.add('active');
}));

/* ============ TOAST ============ */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ============ CARRINHO ============ */
let cart = JSON.parse(localStorage.getItem('snora_cart') || '[]');
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const cartItems = document.getElementById('cartItems');

function renderCart() {
  cartCount.textContent = cart.length;
  if (!cart.length) {
    cartItems.innerHTML = '<p class="cart-empty">Ainda está vazio… adicione um brinquedo! 🐶</p>';
  } else {
    const counts = {};
    cart.forEach(n => counts[n] = (counts[n] || 0) + 1);
    cartItems.innerHTML = Object.entries(counts).map(([n, q]) =>
      `<div class="cart-item"><span>${n} × ${q}</span><button data-rm="${n}" title="Remover">✕</button></div>`).join('');
  }
  localStorage.setItem('snora_cart', JSON.stringify(cart));
}
document.getElementById('cartBtn').addEventListener('click', () => cartPanel.classList.toggle('open'));
cartItems.addEventListener('click', e => {
  const rm = e.target.dataset.rm;
  if (rm) { cart.splice(cart.indexOf(rm), 1); renderCart(); }
});
document.querySelectorAll('.add-cart').forEach(b => b.addEventListener('click', () => {
  if (document.body.classList.contains('editing')) return;
  cart.push(b.dataset.name);
  renderCart();
  showToast('🛒 ' + b.dataset.name + ' adicionado ao carrinho!');
}));
renderCart();

/* ============ MODO DE EDIÇÃO ============ */
const EDIT_KEY = 'snora_edits';
const fab = document.getElementById('editFab');
const picker = document.getElementById('imgPicker');
let pickTarget = null;

function applySaved() {
  const data = JSON.parse(localStorage.getItem(EDIT_KEY) || '{}');
  Object.entries(data.texts || {}).forEach(([k, v]) => {
    const el = document.querySelector(`[data-e="${k}"]`);
    if (el) el.innerHTML = v;
  });
  Object.entries(data.media || {}).forEach(([k, v]) => {
    const el = document.querySelector(`[data-img="${k}"]`);
    if (el) el.src = v;
  });
}
applySaved();

function setEditing(on) {
  document.body.classList.toggle('editing', on);
  document.querySelectorAll('[data-e]').forEach(el => el.contentEditable = on);
  fab.style.display = on ? 'none' : 'flex';
}
fab.addEventListener('click', () => { setEditing(true); showToast('✏️ Modo de edição ativo'); });
document.getElementById('etExit').addEventListener('click', () => setEditing(false));

document.getElementById('etSave').addEventListener('click', () => {
  const texts = {}, media = JSON.parse(localStorage.getItem(EDIT_KEY) || '{}').media || {};
  document.querySelectorAll('[data-e]').forEach(el => texts[el.dataset.e] = el.innerHTML);
  document.querySelectorAll('[data-img]').forEach(el => {
    if (el.src.startsWith('data:')) media[el.dataset.img] = el.src;
  });
  try {
    localStorage.setItem(EDIT_KEY, JSON.stringify({ texts, media }));
    showToast('💾 Alterações guardadas neste navegador!');
  } catch {
    showToast('⚠️ Imagem demasiado grande para guardar — usa uma mais pequena.');
  }
});

document.getElementById('etReset').addEventListener('click', () => {
  if (confirm('Repor todos os textos e imagens originais?')) {
    localStorage.removeItem(EDIT_KEY);
    location.reload();
  }
});

/* substituir imagens / vídeo em modo de edição */
document.querySelectorAll('[data-img]').forEach(el => {
  el.addEventListener('click', e => {
    if (!document.body.classList.contains('editing')) return;
    e.preventDefault(); e.stopPropagation();
    pickTarget = el;
    picker.accept = el.tagName === 'VIDEO' ? 'video/mp4,video/webm' : 'image/*';
    picker.click();
  });
});
picker.addEventListener('change', () => {
  const f = picker.files[0];
  if (!f || !pickTarget) return;
  const r = new FileReader();
  r.onload = () => { pickTarget.src = r.result; showToast('🖼️ Substituído! Carregue em Guardar para manter.'); };
  r.readAsDataURL(f);
  picker.value = '';
});

/* evitar seguir links durante a edição */
document.querySelectorAll('a[data-e]').forEach(a =>
  a.addEventListener('click', e => { if (document.body.classList.contains('editing')) e.preventDefault(); }));
