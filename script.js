// ── State ──
let rentals = JSON.parse(localStorage.getItem('carRentals') || '[]');
let activeFilter = 'all';

// ── DOM ──
const clientName   = document.getElementById('clientName');
const clientPhone  = document.getElementById('clientPhone');
const carModel     = document.getElementById('carModel');
const plateNumber  = document.getElementById('plateNumber');
const pickupDate   = document.getElementById('pickupDate');
const rentalDays   = document.getElementById('rentalDays');
const returnDate   = document.getElementById('returnDate');
const pricePerDay  = document.getElementById('pricePerDay');
const totalPrice   = document.getElementById('totalPrice');
const fuelLevel    = document.getElementById('fuelLevel');
const notes        = document.getElementById('notes');
const addBtn       = document.getElementById('addRentalBtn');
const rentalsBody  = document.getElementById('rentalsBody');
const emptyState   = document.getElementById('emptyState');
const summaryBar   = document.getElementById('summaryBar');
const currentDate  = document.getElementById('currentDate');

// ── Date display ──
currentDate.textContent = new Date().toLocaleDateString('en-GB', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
});

// ── Helpers ──
function fmt(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + parseInt(days));
  return d.toISOString().split('T')[0];
}

function formatMoney(val) {
  return '$' + parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getStatus(rental) {
  if (rental.returned) return 'returned';
  const today = new Date().toISOString().split('T')[0];
  return rental.returnDate < today ? 'overdue' : 'active';
}

// ── Auto-calculations ──
function recalc() {
  if (pickupDate.value && rentalDays.value) {
    returnDate.value = fmt(addDays(pickupDate.value, rentalDays.value));
  } else {
    returnDate.value = '';
  }
  const days  = parseInt(rentalDays.value) || 0;
  const price = parseFloat(pricePerDay.value) || 0;
  totalPrice.value = days && price ? formatMoney(days * price) : '';
}

[pickupDate, rentalDays, pricePerDay].forEach(el => el.addEventListener('input', recalc));

// ── Set today ──
pickupDate.value = new Date().toISOString().split('T')[0];
recalc();

// ── Validation ──
function shake(el, msg) {
  el.classList.add('shake');
  el.focus();
  const prev = el.placeholder;
  el.placeholder = msg;
  setTimeout(() => { el.classList.remove('shake'); el.placeholder = prev; }, 700);
}

// ── Add rental ──
addBtn.addEventListener('click', () => {
  const name   = clientName.value.trim();
  const phone  = clientPhone.value.trim();
  const car    = carModel.value.trim();
  const plate  = plateNumber.value.trim();
  const pickup = pickupDate.value;
  const days   = parseInt(rentalDays.value);
  const price  = parseFloat(pricePerDay.value);

  if (!name)  return shake(clientName,  'Enter client name');
  if (!car)   return shake(carModel,    'Enter car model');
  if (!plate) return shake(plateNumber, 'Enter plate number');
  if (!pickup) return shake(pickupDate, 'Select pickup date');
  if (!days || days < 1) return shake(rentalDays, 'Min 1 day');
  if (!price || price < 0) return shake(pricePerDay, 'Enter price');

  const retDate = addDays(pickup, days);

  const rental = {
    id: uid(),
    name, phone, car, plate,
    pickupDate: pickup,
    days, price,
    returnDate: retDate,
    fuel: fuelLevel.value,
    notes: notes.value.trim(),
    returned: false,
    createdAt: new Date().toISOString()
  };

  rentals.unshift(rental);
  save();
  render();
  resetForm();
  btnSuccess();
});

// ── Mark as returned ──
function markReturned(id) {
  const r = rentals.find(x => x.id === id);
  if (r) { r.returned = true; r.returnedAt = new Date().toISOString(); }
  save();
  render();
}

// ── Delete ──
function deleteRental(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    row.classList.add('row-exit');
    setTimeout(() => {
      rentals = rentals.filter(x => x.id !== id);
      save();
      render();
    }, 200);
  }
}

// ── Event delegation ──
rentalsBody.addEventListener('click', e => {
  const ret = e.target.closest('.btn-return');
  const del = e.target.closest('.btn-delete');
  if (ret) markReturned(ret.dataset.id);
  if (del) deleteRental(del.dataset.id);
});

// ── Filter ──
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });
});

// ── Render ──
function render() {
  const today = new Date().toISOString().split('T')[0];

  const filtered = rentals.filter(r => {
    const s = getStatus(r);
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return s === 'active' || s === 'overdue';
    if (activeFilter === 'returned') return s === 'returned';
    return true;
  });

  rentalsBody.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    filtered.forEach(r => {
      const status = getStatus(r);
      const badgeClass = status === 'active' ? 'badge-active' : status === 'overdue' ? 'badge-overdue' : 'badge-returned';
      const badgeText  = status === 'active' ? 'Active' : status === 'overdue' ? 'Overdue' : 'Returned';
      const total = r.days * r.price;

      const tr = document.createElement('tr');
      tr.dataset.id = r.id;
      tr.classList.add('row-enter');

      tr.innerHTML = `
        <td>
          <div style="font-weight:500;font-size:13px">${r.name}</div>
          <div style="font-size:11px;color:#888780">${r.phone || '—'}</div>
        </td>
        <td>${r.car}</td>
        <td><span style="font-family:monospace;font-size:12px;background:#f4f3ef;padding:2px 7px;border-radius:4px;border:0.5px solid rgba(0,0,0,0.1)">${r.plate}</span></td>
        <td>${fmt(r.pickupDate)}</td>
        <td>${fmt(r.returnDate)}</td>
        <td>${r.days}d</td>
        <td>${formatMoney(r.price)}</td>
        <td style="font-weight:500;color:#3b6d11">${formatMoney(total)}</td>
        <td>${r.fuel}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>
          <div class="actions-cell">
            ${!r.returned ? `<button class="btn-action btn-return" data-id="${r.id}">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 0 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 4v4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Return
            </button>` : ''}
            <button class="btn-action btn-delete" data-id="${r.id}" title="Delete">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.75 3.5H12.25M5.25 3.5V2.625C5.25 2.1415 5.6415 1.75 6.125 1.75H7.875C8.3585 1.75 8.75 2.1415 8.75 2.625V3.5M10.5 3.5V11.375C10.5 11.8585 10.1085 12.25 9.625 12.25H4.375C3.8915 12.25 3.5 11.8585 3.5 11.375V3.5H10.5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </td>
      `;
      rentalsBody.appendChild(tr);
    });
  }

  updateSummary();
}

// ── Summary ──
function updateSummary() {
  const total    = rentals.length;
  const active   = rentals.filter(r => !r.returned).length;
  const returned = rentals.filter(r => r.returned).length;
  const revenue  = rentals.reduce((s, r) => s + r.days * r.price, 0);

  if (total === 0) {
    summaryBar.style.display = 'none';
    return;
  }
  summaryBar.style.display = 'grid';
  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statActive').textContent   = active;
  document.getElementById('statReturned').textContent = returned;
  document.getElementById('statRevenue').textContent  = formatMoney(revenue);
}

// ── Reset form ──
function resetForm() {
  clientName.value  = '';
  clientPhone.value = '';
  carModel.value    = '';
  plateNumber.value = '';
  notes.value       = '';
  pricePerDay.value = '50';
  rentalDays.value  = '3';
  fuelLevel.value   = 'Full';
  pickupDate.value  = new Date().toISOString().split('T')[0];
  recalc();
  clientName.focus();
}

// ── Button success flash ──
function btnSuccess() {
  addBtn.textContent = '✓ Rental Added';
  addBtn.classList.add('success');
  setTimeout(() => {
    addBtn.textContent = '+ Add Rental';
    addBtn.classList.remove('success');
  }, 1800);
}

// ── Enter key shortcut ──
document.querySelector('.form-grid').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') addBtn.click();
});

// ── Storage ──
function save() {
  localStorage.setItem('carRentals', JSON.stringify(rentals));
}

// ── Init ──
render();