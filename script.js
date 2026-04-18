// ─────────────────────────────────────────
//  CarFlow — Système de Gestion de Location
//  Version française
// ─────────────────────────────────────────

// ── State ──
let rentals  = JSON.parse(localStorage.getItem('cf_rentals')  || '[]');
let company  = JSON.parse(localStorage.getItem('cf_company')  || '{}');
let currency = company.currency || 'MAD';
let activeFilter = 'all';
let searchQuery  = '';

const $ = id => document.getElementById(id);

// ── Demo data ──
function initDemo() {
  if (rentals.length > 0) return;
  const today = new Date();
  const ago = n => { const d = new Date(today); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; };
  const fwd = n => { const d = new Date(today); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; };
  rentals = [
    { id:'cf001', name:'Youssef Alami',   phone:'+212 661 234 567', cin:'AB123456', car:'Dacia Logan',   plate:'12345-A-1', pickup:ago(3),  days:5,  price:300, returnDate:fwd(2),  fuel:'Plein', notes:'',                   returned:false, createdAt:ago(3) },
    { id:'cf002', name:'Sara Benali',     phone:'+212 655 987 321', cin:'CD789012', car:'Renault Clio',  plate:'78901-B-3', pickup:ago(7),  days:3,  price:350, returnDate:ago(4),  fuel:'3/4',   notes:'Légère rayure',       returned:false, createdAt:ago(7) },
    { id:'cf003', name:'Ahmed Karimi',    phone:'+212 670 111 222', cin:'EF345678', car:'Hyundai i10',   plate:'54321-C-2', pickup:ago(12), days:6,  price:280, returnDate:ago(6),  fuel:'Plein', notes:'',                   returned:true,  createdAt:ago(12) },
    { id:'cf004', name:'Fatima Zahra',    phone:'+212 678 444 555', cin:'GH901234', car:'Peugeot 208',   plate:'33210-D-5', pickup:ago(1),  days:7,  price:400, returnDate:fwd(6),  fuel:'Plein', notes:'Client VIP',          returned:false, createdAt:ago(1) },
    { id:'cf005', name:'Khalid Mansouri', phone:'+212 662 999 888', cin:'IJ567890', car:'Dacia Sandero', plate:'99887-E-4', pickup:ago(15), days:4,  price:260, returnDate:ago(11), fuel:'1/2',   notes:'',                   returned:true,  createdAt:ago(15) },
    { id:'cf006', name:'Nadia El Fassi',  phone:'+212 690 333 111', cin:'KL123456', car:'Fiat Tipo',     plate:'11223-F-7', pickup:fwd(1),  days:3,  price:320, returnDate:fwd(4),  fuel:'Plein', notes:'Aéroport Mohammed V', returned:false, createdAt:new Date().toISOString() },
  ];
  company = { name:'Auto Location Maroc', address:'12 Rue Hassan II, Casablanca', phone:'+212 522 000 000', email:'contact@autolocation.ma', tax:'ICE: 001234567000012', currency:'MAD' };
  currency = 'MAD';
  save();
}

// ── Helpers ──
function fmt(d) {
  if (!d) return '—';
  const [y,m,dd] = d.split('-');
  return `${dd}/${m}/${y}`;
}
function addDays(d, n) {
  const date = new Date(d);
  date.setDate(date.getDate() + parseInt(n));
  return date.toISOString().split('T')[0];
}
function money(v) {
  return parseFloat(v).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + currency;
}
function uid() { return 'cf' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
function initials(name) { return name.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function getStatus(r) {
  if (r.returned) return 'returned';
  return r.returnDate < new Date().toISOString().split('T')[0] ? 'overdue' : 'active';
}
function badgeHTML(status) {
  const map = {
    active:   ['b-active',   'En cours'],
    overdue:  ['b-overdue',  'En retard'],
    returned: ['b-returned', 'Retournée'],
  };
  const [cls, label] = map[status];
  return `<span class="badge ${cls}">${label}</span>`;
}
function save() {
  localStorage.setItem('cf_rentals', JSON.stringify(rentals));
  localStorage.setItem('cf_company', JSON.stringify(company));
}

// ── Date ──
function setDate() {
  const now = new Date();
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  if ($('sidebarDate')) $('sidebarDate').textContent = now.toLocaleDateString('fr-FR', opts);
}

// ── Navigation ──
const pageTitles = {
  dashboard: 'Tableau de bord',
  rentals:   'Locations',
  add:       'Nouvelle location',
  settings:  'Paramètres',
};
function navigate(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const view = $(`view-${viewName}`);
  if (view) view.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (nav) nav.classList.add('active');
  if ($('topbarTitle')) $('topbarTitle').textContent = pageTitles[viewName] || '';
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'rentals')   renderTable();
  if (viewName === 'settings')  loadSettings();
  document.getElementById('sidebar').classList.remove('open');
}

// ── Nav clicks ──
document.querySelectorAll('[data-view]').forEach(el => {
  el.addEventListener('click', () => navigate(el.dataset.view));
});

// ── Mobile menu ──
$('menuBtn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

// ── Auto-calc ──
function recalc() {
  const p = $('pickupDate').value, d = $('rentalDays').value, pr = $('pricePerDay').value;
  $('returnDate').value = (p && d) ? fmt(addDays(p, d)) : '';
  const days = parseInt(d)||0, price = parseFloat(pr)||0;
  $('totalPrice').value = (days && price) ? money(days * price) : '';
}
['pickupDate','rentalDays','pricePerDay'].forEach(id => $(id)?.addEventListener('input', recalc));
$('pickupDate').value = new Date().toISOString().split('T')[0];
recalc();

// ── Validation shake ──
function shake(el, msg) {
  el.classList.add('shake');
  el.focus();
  const prev = el.placeholder;
  el.placeholder = msg;
  setTimeout(() => { el.classList.remove('shake'); el.placeholder = prev; }, 700);
}

// ── Add rental ──
$('addRentalBtn').addEventListener('click', () => {
  const name   = $('clientName').value.trim();
  const phone  = $('clientPhone').value.trim();
  const cin    = $('clientCIN').value.trim();
  const car    = $('carModel').value.trim();
  const plate  = $('plateNumber').value.trim();
  const pickup = $('pickupDate').value;
  const days   = parseInt($('rentalDays').value);
  const price  = parseFloat($('pricePerDay').value);
  const fuel   = $('fuelLevel').value;
  const notes  = $('notes').value.trim();

  if (!name)              return shake($('clientName'),  'Entrez le nom du client');
  if (!car)               return shake($('carModel'),    'Entrez le modèle du véhicule');
  if (!plate)             return shake($('plateNumber'), 'Entrez la plaque');
  if (!pickup)            return shake($('pickupDate'),  'Sélectionnez la date de départ');
  if (!days || days < 1)  return shake($('rentalDays'),  'Minimum 1 jour');
  if (!price || price < 0)return shake($('pricePerDay'), 'Entrez le prix journalier');

  const rental = {
    id: uid(), name, phone, cin, car, plate, pickup, days, price,
    returnDate: addDays(pickup, days), fuel, notes,
    returned: false, createdAt: new Date().toISOString()
  };

  rentals.unshift(rental);
  save();

  // Success state
  const btn = $('addRentalBtn');
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Location ajoutée !';
  btn.style.background = '#10b981';

  const msg = $('formMsg');
  msg.textContent = '✓ La location a été enregistrée avec succès';
  msg.classList.add('show');

  setTimeout(() => {
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v16m-8-8h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg> Ajouter la location';
    btn.style.background = '';
    msg.classList.remove('show');
    resetForm();
    navigate('rentals');
  }, 1800);
});

function resetForm() {
  ['clientName','clientPhone','clientCIN','carModel','plateNumber','notes'].forEach(id => $(id).value = '');
  $('pricePerDay').value = '300';
  $('rentalDays').value  = '3';
  $('fuelLevel').value   = 'Plein';
  $('pickupDate').value  = new Date().toISOString().split('T')[0];
  recalc();
}

// ── Dashboard ──
function renderDashboard() {
  const today   = new Date().toISOString().split('T')[0];
  const total   = rentals.length;
  const active  = rentals.filter(r => !r.returned && r.returnDate >= today).length;
  const overdue = rentals.filter(r => !r.returned && r.returnDate < today).length;
  const returned= rentals.filter(r => r.returned).length;
  const revenue = rentals.reduce((s,r) => s + r.days * r.price, 0);

  $('kpiTotal').textContent   = total;
  $('kpiActive').textContent  = active;
  $('kpiOverdue').textContent = overdue;
  $('kpiRevenue').textContent = money(revenue);
  if ($('companyChip')) $('companyChip').textContent = company.name || 'CarFlow Agency';

  // Recent
  $('recentList').innerHTML = rentals.slice(0,5).map(r => `
    <div class="recent-item">
      <div class="recent-avatar">${initials(r.name)}</div>
      <div class="recent-info">
        <div class="recent-name">${r.name}</div>
        <div class="recent-car">${r.car} · ${r.plate}</div>
      </div>
      <div class="recent-amt">${money(r.days * r.price)}</div>
    </div>
  `).join('') || '<p style="font-size:13px;color:#9ca3af;padding:1rem 0;text-align:center">Aucune location</p>';

  // Stats
  $('statsPanel').innerHTML = `
    <div class="stat-row">
      <span class="stat-label">En cours</span>
      <div class="stat-bar-w"><div class="stat-bar" style="width:${total?active/total*100:0}%;background:#f59e0b"></div></div>
      <span class="stat-count">${active}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">En retard</span>
      <div class="stat-bar-w"><div class="stat-bar" style="width:${total?overdue/total*100:0}%;background:#ef4444"></div></div>
      <span class="stat-count">${overdue}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Retournées</span>
      <div class="stat-bar-w"><div class="stat-bar" style="width:${total?returned/total*100:0}%;background:#10b981"></div></div>
      <span class="stat-count">${returned}</span>
    </div>
    <div style="margin-top:18px;padding-top:16px;border-top:1px solid #f3f4f6">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;margin-bottom:6px">Chiffre d'affaires total</div>
      <div style="font-size:22px;font-weight:700;color:#059669">${money(revenue)}</div>
    </div>
  `;
}

// ── Rentals table ──
function renderTable() {
  const today = new Date().toISOString().split('T')[0];
  let list = rentals.filter(r => {
    const s = getStatus(r);
    if (activeFilter === 'active')   return s === 'active';
    if (activeFilter === 'overdue')  return s === 'overdue';
    if (activeFilter === 'returned') return s === 'returned';
    return true;
  });
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.car.toLowerCase().includes(q)  ||
      r.plate.toLowerCase().includes(q)
    );
  }

  const count = list.length;
  $('rentalsCount').textContent = `${count} location${count > 1 ? 's' : ''}`;

  const body  = $('rentalsBody');
  const empty = $('emptyState');

  if (list.length === 0) {
    body.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = list.map(r => {
    const status = getStatus(r);
    const total  = r.days * r.price;
    return `
    <tr data-id="${r.id}" class="row-in">
      <td>
        <div class="cell-name">${r.name}</div>
        <div class="cell-sub">${r.phone || ''}${r.cin ? ' · ' + r.cin : ''}</div>
      </td>
      <td>${r.car}</td>
      <td><span class="plate-tag">${r.plate}</span></td>
      <td>${fmt(r.pickup)}</td>
      <td>${fmt(r.returnDate)}</td>
      <td>${r.days}j</td>
      <td class="amount-cell">${money(total)}</td>
      <td>${r.fuel}</td>
      <td>${badgeHTML(status)}</td>
      <td>
        <div class="act-wrap">
          <button class="act-btn act-inv" data-action="invoice" data-id="${r.id}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            Facture
          </button>
          ${!r.returned ? `
          <button class="act-btn act-ret" data-action="return" data-id="${r.id}">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 0 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 4v4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Retour
          </button>` : ''}
          <button class="act-btn act-del" data-action="delete" data-id="${r.id}" title="Supprimer">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M1.75 3.5H12.25M5.25 3.5V2.625C5.25 2.14 5.64 1.75 6.125 1.75H7.875C8.36 1.75 8.75 2.14 8.75 2.625V3.5M10.5 3.5V11.375C10.5 11.86 10.11 12.25 9.625 12.25H4.375C3.89 12.25 3.5 11.86 3.5 11.375V3.5H10.5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── Table actions ──
$('rentalsBody').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'invoice') openInvoice(id);
  if (action === 'return')  markReturned(id);
  if (action === 'delete')  deleteRental(id, btn.closest('tr'));
});

function markReturned(id) {
  const r = rentals.find(x => x.id === id);
  if (r) { r.returned = true; r.returnedAt = new Date().toISOString(); }
  save(); renderTable();
}
function deleteRental(id, row) {
  if (!row) return;
  row.classList.add('row-out');
  setTimeout(() => { rentals = rentals.filter(x => x.id !== id); save(); renderTable(); }, 200);
}

// ── Filters ──
$('filterTabs').addEventListener('click', e => {
  const btn = e.target.closest('.ftab');
  if (!btn) return;
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.f;
  renderTable();
});

// ── Search ──
$('searchInput').addEventListener('input', e => { searchQuery = e.target.value; renderTable(); });

// ── Invoice ──
function invNum(r) {
  const idx = rentals.slice().reverse().findIndex(x => x.id === r.id) + 1;
  return 'FAC-' + String(idx).padStart(4, '0');
}

function openInvoice(id) {
  const r = rentals.find(x => x.id === id);
  if (!r) return;
  const total = r.days * r.price;
  const date  = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
  const co    = company;

  $('invoiceBody').innerHTML = `
    <div class="inv-header">
      <div>
        <div class="inv-co-name">${co.name || 'CarFlow Agency'}</div>
        <div class="inv-co-meta">
          ${co.address ? co.address + '<br>' : ''}
          ${co.phone   ? 'Tél : ' + co.phone + '<br>' : ''}
          ${co.email   ? co.email + '<br>' : ''}
          ${co.tax     ? co.tax : ''}
        </div>
      </div>
      <div class="inv-title-block">
        <div class="inv-title">FACTURE</div>
        <div class="inv-meta">
          N° ${invNum(r)}<br>
          Date : ${date}
        </div>
      </div>
    </div>

    <hr class="inv-divider"/>

    <div class="inv-client">
      <div class="inv-client-lbl">Facturé à</div>
      <div class="inv-client-name">${r.name}</div>
      <div class="inv-client-meta">
        ${r.phone ? 'Tél : ' + r.phone : ''}
        ${r.cin   ? ' · CIN : ' + r.cin : ''}
      </div>
    </div>

    <table class="inv-table">
      <thead>
        <tr>
          <th style="width:45%">Description</th>
          <th style="text-align:center">Qté</th>
          <th style="text-align:center">Prix unitaire</th>
          <th style="text-align:right">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="inv-item-title">Location de véhicule</div>
            <div class="inv-item-sub">
              ${r.car} — Immat. ${r.plate}<br>
              Du ${fmt(r.pickup)} au ${fmt(r.returnDate)}
              ${r.notes ? '<br>Note : ' + r.notes : ''}
            </div>
          </td>
          <td style="text-align:center">${r.days} j</td>
          <td style="text-align:center">${money(r.price)}</td>
          <td style="text-align:right;font-weight:700">${money(total)}</td>
        </tr>
      </tbody>
    </table>

    <div class="inv-totals">
      <div class="inv-total-row">
        <span>Total TTC</span>
        <span>${money(total)}</span>
      </div>
    </div>

    <div class="inv-footer">
      <div>Niveau carburant à la remise : <strong>${r.fuel}</strong></div>
      <div style="margin-top:4px;font-weight:600;color:#111827">Merci pour votre confiance.</div>
      <div style="margin-top:2px;color:#9ca3af">Document émis le ${date} · ${co.name || 'CarFlow'}</div>
    </div>
  `;

  $('invoiceOverlay').style.display = 'flex';
}

$('closeInvoice').addEventListener('click',  () => $('invoiceOverlay').style.display = 'none');
$('invoiceOverlay').addEventListener('click', e => { if (e.target === $('invoiceOverlay')) $('invoiceOverlay').style.display = 'none'; });
$('printBtn').addEventListener('click', () => window.print());

// ── Settings ──
function loadSettings() {
  $('setCompany').value  = company.name     || '';
  $('setAddress').value  = company.address  || '';
  $('setPhone').value    = company.phone    || '';
  $('setEmail').value    = company.email    || '';
  $('setTax').value      = company.tax      || '';
  $('setCurrency').value = company.currency || 'MAD';
}

$('saveSettingsBtn').addEventListener('click', () => {
  company = {
    name:     $('setCompany').value.trim()  || 'CarFlow Agency',
    address:  $('setAddress').value.trim(),
    phone:    $('setPhone').value.trim(),
    email:    $('setEmail').value.trim(),
    tax:      $('setTax').value.trim(),
    currency: $('setCurrency').value,
  };
  currency = company.currency;
  save();
  if ($('companyChip')) $('companyChip').textContent = company.name;

  const msg = $('settingsMsg');
  msg.textContent = '✓ Paramètres enregistrés avec succès';
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2500);
});

$('clearDataBtn').addEventListener('click', () => {
  if (confirm('Êtes-vous sûr ? Toutes les données seront supprimées définitivement.')) {
    rentals = [];
    localStorage.removeItem('cf_rentals');
    save();
    navigate('dashboard');
    renderDashboard();
  }
}); 

// ── Enter key shortcut ──
document.querySelector('.form-wrap')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
    $('addRentalBtn')?.click();
  }
});

// ── Boot ──
initDemo();
setDate();
renderDashboard();
