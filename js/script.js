/* ============ PRODUTOS ============
   Para adicionar um brinquedo novo, basta acrescentar um objeto a esta lista.
   - id: identificador único (usado para guardar edições de texto/imagem)
   - tamanhos: lista de tamanhos disponíveis (pode ficar vazia se não houver) */
const PRODUTOS = [
  {
    id: 'dogger',
    nome: 'Dogger',
    descricao: 'Alimentador interativo em borracha natural não tóxica: distribui a ração pausadamente, estimula a mente do seu cão e garante uma digestão calma.',
    img: 'assets/bola.jpg',
    tamanhos: ['Pequeno', 'Médio', 'Grande'],
    destaque: true
  }
];

const prodGrid = document.getElementById('prodGrid');
prodGrid.innerHTML = PRODUTOS.map((p, i) => `
  <div class="prod-card${p.destaque ? ' destaque' : ''} reveal${i ? ' d' + Math.min(i, 3) : ''}">
    <img src="${p.img}" alt="${p.nome}" data-img="prod_${p.id}">
    <h3 data-e="prod_${p.id}_t">${p.nome}</h3>
    <p data-e="prod_${p.id}_p">${p.descricao}</p>
    ${p.tamanhos.length ? `
    <div class="sizes" role="group" aria-label="Tamanho">
      <span class="sizes-label">Tamanho:</span>
      ${p.tamanhos.map((t, j) => `<button class="size-btn${j === 0 ? ' selected' : ''}" data-size="${t}">${t}</button>`).join('')}
    </div>` : ''}
    <button class="btn-blue add-cart" data-name="${p.nome}" data-e="prod_${p.id}_b">COMPRAR AGORA</button>
  </div>`).join('');

prodGrid.addEventListener('click', e => {
  const btn = e.target.closest('.size-btn');
  if (!btn || document.body.classList.contains('editing')) return;
  btn.closest('.sizes').querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
});

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
  const size = b.closest('.prod-card')?.querySelector('.size-btn.selected')?.dataset.size;
  const item = size ? `${b.dataset.name} (${size})` : b.dataset.name;
  cart.push(item);
  renderCart();
  showToast('🛒 ' + item + ' adicionado ao carrinho!');
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
