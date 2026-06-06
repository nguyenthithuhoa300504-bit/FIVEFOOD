/**
 * FoodExpress - Delivery Map Page JS
 * Features: Leaflet map, Nominatim geocoding, GPS, address search autocomplete
 */

// ── STATE ──
let map = null;
let selectedMarker = null;
let gpsMarker = null;
let selectedLatLng = null;
let selectedAddress = '';
let searchTimeout = null;
let isSearching = false;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSearch();
  restoreFromStorage();
});

// ── MAP INIT ──
function initMap() {
  // Default center: Hà Nội
  const defaultCenter = [21.0285, 105.8542];
  const defaultZoom = 13;

  map = L.map('map', {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: true,
    attributionControl: true
  });

  // OpenStreetMap tile layer (free)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  // Click on map to drop pin
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    hideTip();
    placePin(lat, lng, true);
  });

  // Hide map tip after 5s
  setTimeout(hideTip, 5000);
}

function hideTip() {
  const tip = document.getElementById('map-tip');
  if (tip) tip.classList.add('hide');
}

// ── PIN & REVERSE GEOCODE ──
function placePin(lat, lng, doReverseGeocode = true) {
  selectedLatLng = { lat, lng };

  // Remove previous pin
  if (selectedMarker) {
    map.removeLayer(selectedMarker);
  }

  // Custom icon
  const pinIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;
      background:var(--primary,#ff5722);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 4px 16px rgba(255,87,34,0.4);
    "></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40]
  });

  selectedMarker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);

  // Allow drag to re-select
  selectedMarker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    placePin(pos.lat, pos.lng, true);
  });

  map.panTo([lat, lng], { animate: true, duration: 0.5 });

  if (doReverseGeocode) {
    reverseGeocode(lat, lng);
  } else {
    // Already have address
    showAddressResult(selectedAddress, lat, lng);
  }
}

async function reverseGeocode(lat, lng) {
  showMapLoading(true);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'vi', 'User-Agent': 'FoodExpressApp/1.0' }
    });
    const data = await res.json();
    const addr = formatNominatimAddress(data);
    selectedAddress = addr;
    showAddressResult(addr, lat, lng);

    // Update popup
    selectedMarker.bindPopup(`<b>📍 Điểm giao hàng</b><br>${addr}`).openPopup();
  } catch (err) {
    const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    selectedAddress = fallback;
    showAddressResult(fallback, lat, lng);
    showToast('Không thể lấy địa chỉ từ vị trí này, thử lại sau!', 'warning');
  } finally {
    showMapLoading(false);
  }
}

function formatNominatimAddress(data) {
  if (!data || !data.address) return data.display_name || 'Không xác định';
  const a = data.address;
  const parts = [];
  if (a.house_number && a.road) parts.push(`${a.house_number} ${a.road}`);
  else if (a.road) parts.push(a.road);
  if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood);
  if (a.city_district || a.district) parts.push(a.city_district || a.district);
  if (a.city || a.town || a.municipality) parts.push(a.city || a.town || a.municipality);
  if (a.state) parts.push(a.state);
  return parts.filter(Boolean).join(', ') || data.display_name;
}

function showAddressResult(addr, lat, lng) {
  selectedAddress = addr;
  document.getElementById('no-address-view').style.display = 'none';
  document.getElementById('address-result-view').style.display = 'flex';
  document.getElementById('address-main-text').textContent = addr;
  document.getElementById('address-coords-text').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  document.getElementById('selected-address-card').classList.add('has-address');

  // Reveal note and confirm
  document.getElementById('note-section').style.display = 'block';
  document.getElementById('confirm-address-btn').disabled = false;

  // Step 2 active
  document.getElementById('step-1').classList.add('done');
  document.getElementById('step-2').classList.add('active');
}

// ── SEARCH AUTOCOMPLETE ──
function initSearch() {
  const input = document.getElementById('address-search');
  const clearBtn = document.getElementById('search-clear');

  input.addEventListener('input', () => {
    const val = input.value.trim();
    clearBtn.style.display = val ? 'flex' : 'none';
    if (val.length < 3) {
      closeAutocomplete();
      return;
    }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchAddress(val), 400);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 3) searchAddress(input.value.trim());
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box-wrapper') && !e.target.closest('.autocomplete-dropdown')) {
      closeAutocomplete();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAutocomplete();
    if (e.key === 'Enter') {
      e.preventDefault();
      const first = document.querySelector('.autocomplete-item');
      if (first) first.click();
    }
  });
}

async function searchAddress(query) {
  const list = document.getElementById('autocomplete-list');
  list.innerHTML = '<div class="autocomplete-loading"><div class="map-loading-spinner" style="width:16px;height:16px;border-width:2px"></div> Đang tìm...</div>';
  list.classList.add('open');

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', Việt Nam')}&limit=6&accept-language=vi&addressdetails=1&countrycodes=vn`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FoodExpressApp/1.0' }
    });
    const results = await res.json();

    if (!results.length) {
      list.innerHTML = '<div class="autocomplete-loading">Không tìm thấy kết quả nào.</div>';
      return;
    }

    list.innerHTML = '';
    results.forEach(item => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      const shortName = formatNominatimAddress(item);
      const city = item.address?.city || item.address?.state || '';
      div.innerHTML = `
        <i class="fa-solid fa-location-dot"></i>
        <div class="autocomplete-item-text">
          <strong>${shortName}</strong>
          <span>${city}</span>
        </div>
      `;
      div.addEventListener('click', () => {
        document.getElementById('address-search').value = shortName;
        document.getElementById('search-clear').style.display = 'flex';
        closeAutocomplete();
        placePin(parseFloat(item.lat), parseFloat(item.lon), false);
        selectedAddress = shortName;
        showAddressResult(shortName, parseFloat(item.lat), parseFloat(item.lon));
        map.setView([parseFloat(item.lat), parseFloat(item.lon)], 16, { animate: true });
        selectedMarker?.bindPopup(`<b>📍 Điểm giao hàng</b><br>${shortName}`).openPopup();
      });
      list.appendChild(div);
    });
  } catch {
    list.innerHTML = '<div class="autocomplete-loading">Lỗi kết nối. Vui lòng thử lại.</div>';
  }
}

function closeAutocomplete() {
  document.getElementById('autocomplete-list').classList.remove('open');
}

function clearSearch() {
  document.getElementById('address-search').value = '';
  document.getElementById('search-clear').style.display = 'none';
  closeAutocomplete();
  document.getElementById('address-search').focus();
}

// ── GPS ──
function useGPS() {
  if (!navigator.geolocation) {
    showToast('Trình duyệt của bạn không hỗ trợ GPS!', 'error');
    return;
  }

  const btn = document.getElementById('gps-btn');
  const overlay = document.getElementById('gps-locating');
  const iconWrap = document.getElementById('gps-icon-wrapper');

  btn.classList.add('locating');
  iconWrap.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  overlay.style.display = 'flex';
  hideTip();

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      overlay.style.display = 'none';
      btn.classList.remove('locating');
      iconWrap.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';

      // GPS blue dot marker
      if (gpsMarker) map.removeLayer(gpsMarker);
      const gpsIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:20px;height:20px;
          background:#3b82f6;
          border-radius:50%;
          border:3px solid #fff;
          box-shadow:0 0 0 6px rgba(59,130,246,0.25);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      gpsMarker = L.marker([lat, lng], { icon: gpsIcon }).addTo(map)
        .bindPopup('<b>📍 Vị trí của bạn</b>').openPopup();

      map.setView([lat, lng], 17, { animate: true });
      placePin(lat, lng, true);
      showToast('Đã xác định vị trí GPS thành công!', 'success');
    },
    (err) => {
      overlay.style.display = 'none';
      btn.classList.remove('locating');
      iconWrap.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';

      const msgs = {
        1: 'Bạn đã từ chối quyền truy cập GPS. Vui lòng cấp quyền trong cài đặt trình duyệt.',
        2: 'Không thể xác định vị trí. Kiểm tra kết nối internet!',
        3: 'Quá thời gian định vị GPS. Vui lòng thử lại!'
      };
      showToast(msgs[err.code] || 'Lỗi GPS không xác định!', 'error');
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

// ── CONFIRM & PASS DATA ──
function confirmAddress() {
  if (!selectedAddress || !selectedLatLng) {
    showToast('Vui lòng chọn địa chỉ trước!', 'warning');
    return;
  }

  const note = document.getElementById('delivery-note').value.trim();

  // Save to sessionStorage so checkout page can read it
  sessionStorage.setItem('fe_delivery_address', selectedAddress);
  sessionStorage.setItem('fe_delivery_lat', selectedLatLng.lat);
  sessionStorage.setItem('fe_delivery_lng', selectedLatLng.lng);
  if (note) sessionStorage.setItem('fe_delivery_note', note);

  showToast('Đã lưu địa chỉ! Đang chuyển về trang mua sắm...', 'success');

  // Animate button
  const btn = document.getElementById('confirm-address-btn');
  btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã xác nhận!';
  btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ── NAVIGATION ──
function goBack() {
  // Try to go back, fallback to index
  if (document.referrer && document.referrer.includes(window.location.hostname)) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}

// ── RESTORE SAVED ADDRESS ──
function restoreFromStorage() {
  const saved = sessionStorage.getItem('fe_delivery_address');
  const lat = parseFloat(sessionStorage.getItem('fe_delivery_lat'));
  const lng = parseFloat(sessionStorage.getItem('fe_delivery_lng'));
  const note = sessionStorage.getItem('fe_delivery_note');

  if (saved && !isNaN(lat) && !isNaN(lng)) {
    selectedAddress = saved;
    selectedLatLng = { lat, lng };
    document.getElementById('address-search').value = saved;
    document.getElementById('search-clear').style.display = 'flex';
    if (note) document.getElementById('delivery-note').value = note;

    // Wait for map to init before placing pin
    setTimeout(() => {
      map.setView([lat, lng], 16, { animate: false });
      placePin(lat, lng, false);
      showAddressResult(saved, lat, lng);
      selectedMarker?.bindPopup(`<b>📍 Điểm giao hàng</b><br>${saved}`).openPopup();
    }, 300);
  }
}

// ── MAP LOADING ──
function showMapLoading(show) {
  document.getElementById('map-loading').style.display = show ? 'flex' : 'none';
}

// ── TOAST ──
function showToast(message, type = 'info') {
  const container = document.getElementById('dm-toast-container');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `dm-toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
