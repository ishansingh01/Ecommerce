const API = 'https://ecomm-api-204c.onrender.com';
let allProducts = [];
let cart = [];
let currentFilter = 'all';

// ─── PRODUCTS ──────────────────────────────────────────────────────────
const EMOJIS = { electronics:'📱', clothing:'👗', food:'🍎', books:'📚', sports:'⚽', home:'🏡', beauty:'💄', toys:'🧸', default:'📦' };
function emoji(cat) {
  if (!cat) return '📦';
  const k = cat.toLowerCase();
  for (const [key,val] of Object.entries(EMOJIS)) if (k.includes(key)) return val;
  return '📦';
}

async function loadProducts() {
  const grid = document.getElementById('products-container');
  grid.innerHTML = `<div class="state-box" style="grid-column:1/-1"><div class="spinner"></div><p>Loading products…</p></div>`;
  try {
    const r = await fetch(`${API}/products`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    allProducts = await r.json();
    buildFilters();
    renderProducts(allProducts);
  } catch (e) {
    grid.innerHTML = `<div class="state-box" style="grid-column:1/-1">
      <div class="icon">⚠️</div>
      <h3>Could not load products</h3>
      <p>We could not load the products from the server. Please try again later.</p>
      <p style="margin-top:8px;font-size:0.8rem;color:#999">${e.message}</p>
      <button onclick="loadProducts()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:var(--font-body)">Try Again</button>
    </div>`;
  }
}

function buildFilters() {
  const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const bar = document.getElementById('filter-bar');
  bar.innerHTML = `<button class="filter-chip active" onclick="setFilter('all',this)">All</button>` +
    cats.map(c => `<button class="filter-chip" onclick="setFilter('${c}',this)">${c}</button>`).join('');
}

function setFilter(cat, el) {
  currentFilter = cat;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterProducts();
}

function filterProducts() {
  const q = document.getElementById('search-input').value.toLowerCase();
  let list = allProducts;
  if (currentFilter !== 'all') list = list.filter(p => p.category === currentFilter);
  if (q) list = list.filter(p => (p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  renderProducts(list);
}

function renderProducts(list) {
  const grid = document.getElementById('products-container');
  if (!list.length) {
    grid.innerHTML = `<div class="state-box" style="grid-column:1/-1"><div class="icon">🔍</div><h3>No products found</h3><p>Try a different search or category.</p></div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const price = p.price ?? p.amount ?? 0;
    const orig = p.originalPrice ?? p.mrp;
    return `<div class="product-card" onclick="openModal(${p.id})">
      <div class="product-img">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <span style="font-size:3.5rem">${emoji(p.category)}</span>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category || 'Uncategorized'}</div>
        <div class="product-name">${p.name || 'Product'}</div>
        <div class="product-desc">${(p.description||'').slice(0,70)}${(p.description||'').length>70?'…':''}</div>
        <div class="product-foot">
          <div class="product-price">
            ${orig ? `<span>₹${orig}</span>` : ''}₹${price.toLocaleString('en-IN')}
          </div>
          <button class="add-btn" onclick="event.stopPropagation();addToCart(${p.id})">+ Add</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ─── PRODUCT MODAL ─────────────────────────────────────────────────────
function openModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const price = p.price ?? p.amount ?? 0;
  document.getElementById('modal-img').innerHTML = `<span>${emoji(p.category)}</span>`;
  document.getElementById('modal-cat').textContent = p.category || '';
  document.getElementById('modal-name').textContent = p.name || 'Product';
  document.getElementById('modal-price').textContent = `₹${price.toLocaleString('en-IN')}`;
  document.getElementById('modal-desc').textContent = p.description || 'No description available.';
  document.getElementById('modal-add-btn').onclick = () => { addToCart(id); closeModal(); };
  document.getElementById('product-modal').classList.add('open');
}
function closeModal() { document.getElementById('product-modal').classList.remove('open'); }
function closeModalOnOverlay(e) { if (e.target.id === 'product-modal') closeModal(); }

// ─── CART ──────────────────────────────────────────────────────────────
function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...p, qty: 1 });
  updateCartUI();
  showToast(`${p.name} added to cart`);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + (c.price ?? c.amount ?? 0) * c.qty, 0);
  document.getElementById('cart-count').textContent = cart.reduce((s,c) => s+c.qty, 0);
  document.getElementById('cart-total-val').textContent = `₹${total.toLocaleString('en-IN')}`;
  const list = document.getElementById('cart-items-list');
  if (!cart.length) {
    list.innerHTML = `<div class="cart-empty">Your cart is empty.<br/>Browse products and add some!</div>`;
  } else {
    list.innerHTML = cart.map(c => {
      const price = (c.price ?? c.amount ?? 0);
      return `<div class="cart-item">
        <div class="ci-img">${emoji(c.category)}</div>
        <div class="ci-info">
          <div class="ci-name">${c.name}</div>
          <div class="ci-price">₹${price.toLocaleString('en-IN')} each</div>
          <div class="ci-qty">
            <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
            <span style="font-size:0.875rem;font-weight:500">${c.qty}</span>
            <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
          </div>
        </div>
        <button class="ci-remove" onclick="removeFromCart(${c.id})">Remove</button>
      </div>`;
    }).join('');
  }
}

function openCart() { document.getElementById('cart-overlay').classList.add('open'); updateCartUI(); }
function closeCart() { document.getElementById('cart-overlay').classList.remove('open'); }
function closeCartOnOverlay(e) { if (e.target.id === 'cart-overlay') closeCart(); }

async function checkout() {
  if (!cart.length) { showToast('Your cart is empty!'); return; }
  const order = { items: cart.map(c => ({ productId: c.id, quantity: c.qty, price: c.price ?? c.amount ?? 0 })) };
  try {
    const r = await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (r.ok) {
      cart = [];
      updateCartUI();
      closeCart();
      showToast('Order placed successfully! 🎉');
    } else {
      showToast(`Order failed: HTTP ${r.status}`);
    }
  } catch {
    showToast('Could not place order — is the backend running?');
  }
}

// ─── ORDERS ────────────────────────────────────────────────────────────
async function loadOrders() {
  const c = document.getElementById('orders-container');
  c.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Loading orders…</p></div>`;
  try {
    const r = await fetch(`${API}/orders/all-orders`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const orders = await r.json();
    if (!orders.length) {
      c.innerHTML = `<div class="state-box"><div class="icon">📭</div><h3>No orders yet</h3><p>Place your first order from the Products page.</p></div>`;
      return;
    }
    c.innerHTML = orders.map(o => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem 1.5rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:600;margin-bottom:4px">Order #${o.id}</div>
          <div style="font-size:0.85rem;color:var(--muted)">${o.createdAt || o.date || 'Recent'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:1.1rem;font-weight:700;color:var(--accent)">₹${(o.total||o.amount||0).toLocaleString('en-IN')}</div>
          <div style="font-size:0.8rem;margin-top:4px;padding:2px 10px;border-radius:20px;display:inline-block;background:${o.status==='DELIVERED'?'var(--success-bg)':'#FFF8E1'};color:${o.status==='DELIVERED'?'var(--success)':'#7B5E00'}">${o.status||'Pending'}</div>
        </div>
      </div>`).join('');
  } catch (e) {
    c.innerHTML = `<div class="state-box"><div class="icon">⚠️</div><h3>Could not load orders</h3><p>${e.message}</p></div>`;
  }
}

// ─── ADMIN: ADD PRODUCT ────────────────────────────────────────────────
async function addProduct() {
  const name  = document.getElementById('new-name').value.trim();
  const cat   = document.getElementById('new-cat').value.trim();
  const price = parseFloat(document.getElementById('new-price').value);
  const stock = parseInt(document.getElementById('new-stock').value);
  const desc  = document.getElementById('new-desc').value.trim();
  if (!name || !price) { showToast('Name and price are required'); return; }
  try {
    const r = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category: cat, price, stock, description: desc })
    });
    if (r.ok) {
      showToast(`"${name}" added!`);
      ['new-name','new-cat','new-price','new-stock','new-desc'].forEach(id => document.getElementById(id).value = '');
      loadProducts();
    } else {
      showToast(`Failed: HTTP ${r.status}`);
    }
  } catch {
    showToast('Could not add product — backend unreachable');
  }
}

// ─── PAGES ─────────────────────────────────────────────────────────────
function showPage(page) {
  ['products','orders','admin'].forEach(p => {
    document.getElementById(`page-${p}`).style.display = p === page ? '' : 'none';
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (page === 'orders') loadOrders();
}

// ─── TOAST ─────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ─── INIT ──────────────────────────────────────────────────────────────
loadProducts();