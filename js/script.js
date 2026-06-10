/* ============ PRODUTOS ============
   Para adicionar um brinquedo novo, basta acrescentar um objeto a esta lista.
   - id: identificador único (usado para guardar edições de texto/imagem)
   - tamanhos: lista de { nome, preco }; se não houver tamanhos usa [] e define "preco" */
const PRODUTOS = [
  {
    id: 'dogger',
    nome: 'Dogger',
    descricao: 'Alimentador interativo em borracha natural não tóxica: distribui a ração pausadamente, estimula a mente do seu cão e garante uma digestão calma.',
    img: 'assets/bola.jpg',
    tamanhos: [
      { nome: 'Pequeno', preco: 14.99 },
      { nome: 'Médio',   preco: 19.99 },
      { nome: 'Grande',  preco: 24.99 }
    ],
    destaque: true
  }
];

const fmtPreco = v => v.toFixed(2).replace('.', ',') + ' €';

const prodGrid = document.getElementById('prodGrid');
prodGrid.innerHTML = PRODUTOS.map((p, i) => {
  const precoInicial = p.tamanhos.length ? p.tamanhos[0].preco : (p.preco || 0);
  return `
  <div class="prod-card${p.destaque ? ' destaque' : ''} reveal-zoom${i ? ' d' + Math.min(i, 3) : ''}">
    <img src="${p.img}" alt="${p.nome}" data-img="prod_${p.id}">
    <h3 data-e="prod_${p.id}_t">${p.nome}</h3>
    <p data-e="prod_${p.id}_p">${p.descricao}</p>
    ${p.tamanhos.length ? `
    <div class="sizes" role="group" aria-label="Tamanho">
      <span class="sizes-label">Tamanho:</span>
      <div class="size-opts">
        ${p.tamanhos.map((t, j) => `<button class="size-btn${j === 0 ? ' selected' : ''}" data-size="${t.nome}" data-preco="${t.preco}">${t.nome}</button>`).join('')}
      </div>
    </div>` : ''}
    <div class="prod-buy">
      <span class="prod-price">${fmtPreco(precoInicial)}</span>
      <button class="btn-blue add-cart" data-name="${p.nome}" data-preco="${precoInicial}" data-e="prod_${p.id}_b">COMPRAR AGORA</button>
    </div>
  </div>`;
}).join('');

prodGrid.addEventListener('click', e => {
  const btn = e.target.closest('.size-btn');
  if (!btn || document.body.classList.contains('editing')) return;
  const card = btn.closest('.prod-card');
  card.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  card.querySelector('.prod-price').textContent = fmtPreco(+btn.dataset.preco);
});

/* ============ REVELAÇÃO AO SCROLL ============ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-zoom').forEach(el => io.observe(el));

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
/* cada item é { n: nome, p: preço }; entradas antigas em formato texto são descartadas */
let cart = (JSON.parse(localStorage.getItem('snora_cart') || '[]') || [])
  .filter(i => i && typeof i === 'object' && i.n);
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const cartItems = document.getElementById('cartItems');

function renderCart() {
  cartCount.textContent = cart.length;
  if (!cart.length) {
    cartItems.innerHTML = '<p class="cart-empty">Ainda está vazio… adicione um brinquedo! 🐶</p>';
  } else {
    const groups = {};
    cart.forEach(i => {
      const g = groups[i.n] = groups[i.n] || { q: 0, p: i.p || 0 };
      g.q++;
    });
    const total = cart.reduce((s, i) => s + (i.p || 0), 0);
    cartItems.innerHTML = Object.entries(groups).map(([n, g]) =>
      `<div class="cart-item"><span>${n} × ${g.q}</span>
        <span class="cart-line"><b>${fmtPreco(g.p * g.q)}</b><button data-rm="${n}" title="Remover">✕</button></span></div>`).join('')
      + `<div class="cart-total"><span>Total</span><b>${fmtPreco(total)}</b></div>`;
  }
  localStorage.setItem('snora_cart', JSON.stringify(cart));
}
document.getElementById('cartBtn').addEventListener('click', () => cartPanel.classList.toggle('open'));
cartItems.addEventListener('click', e => {
  const rm = e.target.dataset.rm;
  if (rm) { cart.splice(cart.findIndex(i => i.n === rm), 1); renderCart(); }
});
document.querySelectorAll('.add-cart').forEach(b => b.addEventListener('click', () => {
  if (document.body.classList.contains('editing')) return;
  const sel = b.closest('.prod-card')?.querySelector('.size-btn.selected');
  const nome = sel ? `${b.dataset.name} (${sel.dataset.size})` : b.dataset.name;
  const preco = +(sel ? sel.dataset.preco : b.dataset.preco) || 0;
  cart.push({ n: nome, p: preco });
  renderCart();
  showToast('🛒 ' + nome + ' adicionado ao carrinho!');
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

/* ============ PALETA DE CORES ============
   Para criar uma paleta nova, basta acrescentar uma entrada a PALETAS. */
const PALETAS = {
  original: {
    nome: 'Original',
    cores: {
      '--cream': '#FBFACF', '--cream-bg': '#FCFBEF',
      '--wine': '#4B0B22', '--wine-dark': '#3A0517', '--wine-hover': '#69163A',
      '--pink': '#EFE4E7',
      '--blue': '#8AC4FC', '--blue-name': '#4A7FD4', '--blue-ink': '#15355C',
      '--card-white': '#FDFCF6', '--ink': '#2A2A2A'
    }
  },
  azulbebe: {
    nome: 'Azul Bebé',
    cores: {
      '--cream': '#D9EDFB', '--cream-bg': '#F2F9FE',
      '--wine': '#1F5E8C', '--wine-dark': '#16466A', '--wine-hover': '#2D76AB',
      '--pink': '#E2F1FC',
      '--blue': '#89CFF0', '--blue-name': '#3E7BC0', '--blue-ink': '#14456B',
      '--card-white': '#FDFEFF', '--ink': '#243341'
    }
  },
  verde: {
    nome: 'Verde Campo',
    cores: {
      '--cream': '#E9F3D8', '--cream-bg': '#F7FBEF',
      '--wine': '#2F5D2E', '--wine-dark': '#224724', '--wine-hover': '#3F7A3E',
      '--pink': '#E4EFDB',
      '--blue': '#A9D8A0', '--blue-name': '#4E8B4C', '--blue-ink': '#1D4A1F',
      '--card-white': '#FCFEF8', '--ink': '#2A332A'
    }
  }
};

const PAL_KEY = 'snora_palette';
const paletteFab = document.getElementById('paletteFab');
const palettePanel = document.getElementById('palettePanel');

palettePanel.innerHTML = '<h4>Cores do site</h4>' + Object.entries(PALETAS).map(([id, p]) => `
  <button class="pal-opt" data-pal="${id}">
    <span class="pal-dots">${['--wine', '--cream', '--blue'].map(k => `<i style="background:${p.cores[k]}"></i>`).join('')}</span>
    ${p.nome}
  </button>`).join('');

function applyPalette(id) {
  const p = PALETAS[id] || PALETAS.original;
  Object.entries(p.cores).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  palettePanel.querySelectorAll('.pal-opt').forEach(b => b.classList.toggle('selected', PALETAS[b.dataset.pal] === p));
  localStorage.setItem(PAL_KEY, id);
}
applyPalette(localStorage.getItem(PAL_KEY) || 'original');

paletteFab.addEventListener('click', () => palettePanel.classList.toggle('open'));
palettePanel.addEventListener('click', e => {
  const b = e.target.closest('.pal-opt');
  if (!b) return;
  applyPalette(b.dataset.pal);
  showToast('🎨 Paleta ' + (PALETAS[b.dataset.pal] || PALETAS.original).nome + ' aplicada!');
});

/* evitar seguir links durante a edição */
document.querySelectorAll('a[data-e]').forEach(a =>
  a.addEventListener('click', e => { if (document.body.classList.contains('editing')) e.preventDefault(); }));
