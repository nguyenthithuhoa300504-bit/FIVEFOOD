/**
 * FoodExpress - Realtime Order Tracking JS
 * Features: Leaflet map routing, smooth simulated shipper animation, dynamic countdown, automatic order completion
 */

// ── STATE ──
let map = null;
let shipperMarker = null;
let storeMarker = null;
let customerMarker = null;
let routeLine = null;
let orderData = null;

let animationInterval = null;
let currentPathIndex = 0;
let pathPoints = [];

// Store location (Fixed FoodExpress Headquarters)
const storeLatLng = [21.0362, 105.7904]; // Cầu Giấy, Hà Nội

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    alert('Không tìm thấy mã đơn hàng cần theo dõi. Quay lại trang chủ.');
    location.href = 'index.html';
    return;
  }

  fetchOrderDetails(orderId);
});

// ── FETCH DETAILS ──
async function fetchOrderDetails(orderId) {
  const token = localStorage.getItem('fe_token');
  if (!token) {
    showTokenError();
    return;
  }

  try {
    const response = await fetch(`/api/hoadon/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      showTokenError();
      return;
    }

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Lỗi khi tải thông tin đơn hàng.');
    }

    orderData = await response.json();
    populateOrderInfo(orderData);
    await initTrackingMap(orderData);
    document.getElementById('track-loader').style.display = 'none';

  } catch (error) {
    console.error(error);
    alert(error.message || 'Lỗi hệ thống khi tải đơn hàng.');
    location.href = 'index.html';
  }
}

// Hiển thị thông báo token hết hạn và redirect về trang chủ để đăng nhập lại
function showTokenError() {
  // Xóa token cũ
  localStorage.removeItem('fe_token');
  localStorage.removeItem('fe_user');
  
  // Hiển thị loader với thông báo
  const loader = document.getElementById('track-loader');
  if (loader) {
    loader.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <i class="fa-solid fa-lock" style="font-size:48px; color:#e74c3c; margin-bottom:16px;"></i>
        <h3 style="color:#e74c3c; margin-bottom:8px;">Phiên đăng nhập đã hết hạn</h3>
        <p style="color:#666; margin-bottom:20px;">Vui lòng đăng nhập lại để tiếp tục theo dõi đơn hàng.</p>
        <a href="index.html" style="
          display:inline-block; padding:12px 28px;
          background:linear-gradient(135deg,#ff5722,#e64a19);
          color:#fff; border-radius:12px; text-decoration:none;
          font-weight:600;
        ">Đăng nhập lại</a>
      </div>
    `;
    loader.style.display = 'flex';
  } else {
    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    location.href = 'index.html';
  }
}

// Populate recipient details and text metadata
function populateOrderInfo(order) {
  document.getElementById('order-id-label').textContent = `Đơn Hàng: #HD${order.HoaDonID}`;
  
  // Format Date (Forced to Vietnam Timezone Asia/Ho_Chi_Minh)
  const dateObj = new Date(order.NgayDat);
  const formattedDate = dateObj.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  document.getElementById('order-date-label').textContent = `Đặt lúc: ${formattedDate}`;

  // Recipient details
  document.getElementById('recipient-name').textContent = order.TenKhachHang || 'Khách hàng';
  document.getElementById('recipient-phone').textContent = order.SoDienThoaiNhan || '--';
  document.getElementById('recipient-address').textContent = order.DiaChiNhan || 'Không có địa chỉ';

  // Active status in static timeline
  updateTimelineStatus(order.TrangThai);

  // Hiển thị nút sửa địa chỉ nếu trạng thái là Chờ xác nhận
  const editBtn = document.getElementById('btn-edit-delivery');
  if (editBtn) {
    if (order.TrangThai === 'Chờ xác nhận') {
      editBtn.style.display = 'flex';
    } else {
      editBtn.style.display = 'none';
    }
  }
}

// Update static timeline active CSS classes
function updateTimelineStatus(status) {
  // Clear all statuses first
  const steps = ['cho-xac-nhan', 'dang-chuan-bi', 'dang-giao', 'hoan-thanh'];
  steps.forEach(s => {
    const el = document.getElementById(`step-${s}`);
    if (el) el.className = 'timeline-item';
  });

  if (status === 'Chờ xác nhận') {
    document.getElementById('step-cho-xac-nhan').className = 'timeline-item active';
  } else if (status === 'Đang giao') {
    document.getElementById('step-cho-xac-nhan').className = 'timeline-item done';
    document.getElementById('step-dang-chuan-bi').className = 'timeline-item done';
    document.getElementById('step-dang-giao').className = 'timeline-item active';
  } else if (status === 'Hoàn thành') {
    document.getElementById('step-cho-xac-nhan').className = 'timeline-item done';
    document.getElementById('step-dang-chuan-bi').className = 'timeline-item done';
    document.getElementById('step-dang-giao').className = 'timeline-item done';
    document.getElementById('step-hoan-thanh').className = 'timeline-item done active';
  } else if (status === 'Đã hủy') {
    document.getElementById('step-cho-xac-nhan').className = 'timeline-item active';
    const desc = document.querySelector('#step-cho-xac-nhan .timeline-desc');
    if (desc) desc.textContent = 'Đơn hàng này đã bị hủy bỏ.';
    const title = document.querySelector('#step-cho-xac-nhan .timeline-title');
    if (title) title.innerHTML = '<span style="color:var(--danger)">Đơn hàng đã hủy</span>';
  }
}

// ── LEAFLET MAP TRACKING INTEGRATION ──
async function initTrackingMap(order) {
  // If order is canceled, no map tracking simulated
  if (order.TrangThai === 'Đã hủy') {
    document.getElementById('track-map').innerHTML = `
      <div style="
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        height:100%; text-align:center; color:var(--text-muted); gap:12px; padding:20px;
      ">
        <i class="fa-solid fa-ban" style="font-size:48px; color:var(--danger)"></i>
        <h3>Đơn hàng đã hủy</h3>
        <p>Đơn hàng này đã bị hủy bỏ, hành trình giao hàng không được hiển thị.</p>
      </div>
    `;
    return;
  }

  // Parse destination coordinates (fallback if coordinates empty)
  let customerLatLng = [21.0285, 105.8542];
  if (order.ViDo && order.KinhDo) {
    customerLatLng = [parseFloat(order.ViDo), parseFloat(order.KinhDo)];
  } else {
    // Generate simulated coordinates near store Cầu Giấy (about 2km away)
    customerLatLng = [21.0362 + 0.0115, 105.7904 - 0.0142];
  }

  // Initialize map centered on store
  map = L.map('track-map', {
    center: storeLatLng,
    zoom: 14,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // 1. Store Marker
  const storeIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:38px; height:38px;
      background:#e74c3c;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 4px 12px rgba(231,76,60,0.4);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:16px;
    "><i class="fa-solid fa-fire-burner"></i></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
  storeMarker = L.marker(storeLatLng, { icon: storeIcon })
    .bindPopup('<b>🏪 Nhà bếp FoodExpress</b><br>Đang chuẩn bị & xuất phát tại đây.')
    .addTo(map);

  // 2. Customer Marker
  const customerIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:38px; height:38px;
      background:#2ecc71;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 4px 12px rgba(46,204,113,0.4);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:16px;
    "><i class="fa-solid fa-house-user"></i></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
  customerMarker = L.marker(customerLatLng, { icon: customerIcon })
    .bindPopup('<b>📍 Điểm giao của bạn</b><br>' + order.DiaChiNhan)
    .addTo(map);

  // Fit bounds to show both
  map.fitBounds(L.latLngBounds([storeLatLng, customerLatLng]), { padding: [60, 60] });

  // 3. Setup Shipper Scooter Marker
  const shipperIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:44px; height:44px;
      background:#ff5722;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 4px 14px rgba(255,87,34,0.5);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:18px;
    "><i class="fa-solid fa-motorcycle"></i></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  // Calculate overall straight line distance in meters initially
  let totalDistMeters = calculateDistance(storeLatLng[0], storeLatLng[1], customerLatLng[0], customerLatLng[1]);
  
  // Show ETA widget and Shipper Info
  document.getElementById('eta-container').style.display = 'block';
  document.getElementById('shipper-info-box').style.display = 'flex';

  // 4. GET REAL ROAD ROUTE FROM OSRM API (WITH ROBUST GRACEFUL FALLBACK)
  pathPoints = [];
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${storeLatLng[1]},${storeLatLng[0]};${customerLatLng[1]},${customerLatLng[0]}?overview=full&geometries=geojson`;
    const routeRes = await fetch(osrmUrl);
    if (routeRes.ok) {
      const routeData = await routeRes.json();
      if (routeData.routes && routeData.routes.length > 0) {
        const coords = routeData.routes[0].geometry.coordinates;
        const rawPoints = coords.map(c => [c[1], c[0]]);
        totalDistMeters = routeData.routes[0].distance; // Real road distance
        
        // Interpolate into 80 equidistant points — fast smooth animation (~24s total)
        pathPoints = interpolatePoints(rawPoints, 80);
      }
    }
  } catch (err) {
    console.warn('Failed to fetch OSRM route, falling back to grid routing:', err);
  }

  // Fallback to Grid-like road routing if OSRM failed or returned no points
  if (pathPoints.length === 0) {
    const gridPoints = generateGridFallback(storeLatLng, customerLatLng);
    pathPoints = interpolatePoints(gridPoints, 70);
    // Manhattan distance approx:
    totalDistMeters = (Math.abs(storeLatLng[0] - customerLatLng[0]) + Math.abs(storeLatLng[1] - customerLatLng[1])) * 111000;
  }

  // 5. Draw the road-based route on map
  routeLine = L.polyline(pathPoints, {
    color: '#ff5722',
    weight: 5,
    opacity: 0.8,
    dashArray: '10, 10'
  }).addTo(map);

  // Start animated simulation of Shipper movement
  if (order.TrangThai === 'Hoàn thành') {
    // If order already completed, place shipper at destination directly
    shipperMarker = L.marker(customerLatLng, { icon: shipperIcon })
      .bindPopup('<b>🛵 Shipper Nguyễn Văn Hùng</b><br>Đã hoàn thành bàn giao đồ ăn!')
      .addTo(map);
    
    document.getElementById('eta-time-label').textContent = 'Đã giao!';
    document.getElementById('eta-distance-label').textContent = 'Shipper đã đến điểm giao hàng.';
    updateTimelineStatus('Hoàn thành');
  } else {
    // ── RESUME FROM SAVED PROGRESS ──
    // If user left and came back, calculate how far shipper has already gone
    const storageKey = `fe_track_start_${order.HoaDonID}`;
    const savedStart = localStorage.getItem(storageKey);
    let startIndex = 0;

    if (savedStart) {
      const elapsedMs = Date.now() - parseInt(savedStart, 10);
      // Step interval is now 300ms — calculate resumed index accordingly
      const elapsedSteps = Math.floor(elapsedMs / 300);
      startIndex = Math.min(elapsedSteps, pathPoints.length - 1);
    } else {
      // First visit — save start timestamp
      localStorage.setItem(storageKey, Date.now().toString());
    }

    simulateShipperMove(totalDistMeters, customerLatLng, shipperIcon, order.HoaDonID, startIndex);
  }
}

// ── SIMULATION LOGIC ──
function simulateShipperMove(totalDist, customerCoords, shipperIcon, orderId, startIndex = 0) {
  currentPathIndex = startIndex;

  // Clamp to a valid position: at store if 0, else at resumed position
  const initialPos = pathPoints[currentPathIndex] || storeLatLng;

  // Create shipper marker at the correct resumed position
  shipperMarker = L.marker(initialPos, { icon: shipperIcon })
    .bindPopup(startIndex === 0
      ? '<b>🛵 Shipper Nguyễn Văn Hùng</b><br>Đang kiểm tra giỏ hàng và xuất phát!'
      : '<b>🛵 Shipper Nguyễn Văn Hùng</b><br>Đang trên đường giao hàng đến bạn!')
    .addTo(map)
    .openPopup();

  // Pan map to current position immediately on resume
  map.panTo(initialPos, { animate: false });

  // Speed: Advance 1 step every 300ms (≈3× faster, full route in ~24s)
  animationInterval = setInterval(() => {
    if (currentPathIndex >= pathPoints.length) {
      clearInterval(animationInterval);
      localStorage.removeItem(`fe_track_start_${orderId}`);
      showArrivalModal(orderId);
      return;
    }

    const currentPos = pathPoints[currentPathIndex];
    shipperMarker.setLatLng(currentPos);

    // Smooth pan to follow shipper (pan every 3 steps to stay smooth at 300ms)
    if (currentPathIndex % 3 === 0) {
      map.panTo(currentPos, { animate: true, duration: 0.3 });
    }

    // Calculate dynamic ETA and Distance remaining
    const percentDone = currentPathIndex / pathPoints.length;
    const distRemaining = Math.max(0, Math.round(totalDist * (1 - percentDone)));

    // ETA computed at average 40km/h (approx 1.8 min per km)
    const minutesRemaining = Math.max(1, Math.ceil((distRemaining / 1000) * 1.8));

    document.getElementById('eta-time-label').textContent = `${minutesRemaining} phút`;
    document.getElementById('eta-distance-label').textContent = `Shipper cách bạn ${distRemaining} m`;

    // Dynamic timeline status updates
    if (percentDone < 0.15) {
      updateTimelineStatus('Chờ xác nhận');
      document.getElementById('step-dang-chuan-bi').className = 'timeline-item active';
    } else if (percentDone >= 0.15 && percentDone < 0.95) {
      updateTimelineStatus('Đang giao');
    } else if (percentDone >= 0.95) {
      // Shipper đã đến nơi — hiện modal xác nhận thay vì tự động hoàn thành
      clearInterval(animationInterval);
      localStorage.removeItem(`fe_track_start_${orderId}`);
      shipperMarker.setLatLng(customerCoords);
      shipperMarker.bindPopup('<b>🛵 Shipper Nguyễn Văn Hùng</b><br>Tôi đã tới điểm giao! Hãy xác nhận nhận hàng!').openPopup();

      document.getElementById('eta-time-label').textContent = 'Đã đến nơi!';
      document.getElementById('eta-distance-label').textContent = 'Shipper đang đứng trước điểm giao.';

      showArrivalModal(orderId);
    }

    currentPathIndex++;
  }, 300);
}

// ── HIỆN MODAL XÁC NHẬN KHI SHIPPER ĐẾN NƠI ──
function showArrivalModal(orderId) {
  const modal = document.getElementById('arrival-modal');
  const label = document.getElementById('arrival-order-id');
  if (modal && label) {
    label.textContent = `Đơn hàng #HD${orderId}`;
    modal.dataset.orderId = orderId;
    modal.style.display = 'flex';
  }
}

// ── XÁC NHẬN LẤY HÀNG THÀNH CÔNG ──
async function confirmPickupSuccess(orderId) {
  const token = localStorage.getItem('fe_token');
  const pickupBtn = document.getElementById('btn-confirm-pickup');
  const returnBtn = document.getElementById('btn-confirm-return');

  // Disable cả 2 nút khi đang xử lý
  if (pickupBtn) { pickupBtn.disabled = true; pickupBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...'; }
  if (returnBtn) { returnBtn.disabled = true; }

  try {
    if (token) {
      const response = await fetch(`/api/hoadon/${orderId}/trangthai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ TrangThai: 'Hoàn thành' })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi từ máy chủ khi cập nhật trạng thái.');
      }
    }

    // Đóng modal đến nơi, mở modal thành công
    document.getElementById('arrival-modal').style.display = 'none';
    const successModal = document.getElementById('pickup-success-modal');
    const orderLabel = document.getElementById('del-success-order-id');
    if (successModal && orderLabel) {
      orderLabel.textContent = `HD${orderId}`;
      successModal.style.display = 'flex';
      setTimeout(() => launchConfetti(), 300);
    }
    updateTimelineStatus('Hoàn thành');
  } catch (err) {
    console.error('Lỗi khi xác nhận lấy hàng:', err);
    showToast(err.message || 'Không thể kết nối máy chủ.', 'error');
    // Bật lại các nút nếu thất bại
    if (pickupBtn) {
      pickupBtn.disabled = false;
      pickupBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Lấy hàng thành công';
    }
    if (returnBtn) {
      returnBtn.disabled = false;
    }
  }
}

// ── XÁC NHẬN TRẢ LẠI HÀNG ──
async function confirmReturn(orderId) {
  const token = localStorage.getItem('fe_token');
  const pickupBtn = document.getElementById('btn-confirm-pickup');
  const returnBtn = document.getElementById('btn-confirm-return');

  // Disable cả 2 nút khi đang xử lý
  if (returnBtn) { returnBtn.disabled = true; returnBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...'; }
  if (pickupBtn) { pickupBtn.disabled = true; }

  try {
    if (token) {
      const response = await fetch(`/api/hoadon/${orderId}/trangthai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ TrangThai: 'Đã hủy' })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Lỗi từ máy chủ khi trả hàng.');
      }
    }

    // Đóng modal đến nơi, mở modal trả hàng
    document.getElementById('arrival-modal').style.display = 'none';
    const returnModal = document.getElementById('return-modal');
    const returnLabel = document.getElementById('return-order-id');
    if (returnModal && returnLabel) {
      returnLabel.textContent = `HD${orderId}`;
      returnModal.style.display = 'flex';
    }
    updateTimelineStatus('Đã hủy');
  } catch (err) {
    console.error('Lỗi khi xác nhận trả hàng:', err);
    showToast(err.message || 'Không thể kết nối máy chủ.', 'error');
    // Bật lại các nút nếu thất bại
    if (returnBtn) {
      returnBtn.disabled = false;
      returnBtn.innerHTML = '<i class="fa-solid fa-undo"></i> Trả lại hàng';
    }
    if (pickupBtn) {
      pickupBtn.disabled = false;
    }
  }
}

// Helper straight-line distance math (Haversine formula in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// ── EQUIDISTANT INTERPOLATION FOR SMOOTH CONSTANT-SPEED MOVEMENTS ──
function interpolatePoints(points, targetCount = 120) {
  if (points.length < 2) return points;
  
  // 1. Calculate cumulative distances along the route
  const cumulDist = [0];
  for (let i = 1; i < points.length; i++) {
    const d = calculateDistance(points[i-1][0], points[i-1][1], points[i][0], points[i][1]);
    cumulDist.push(cumulDist[i-1] + d);
  }
  
  const totalDistance = cumulDist[cumulDist.length - 1];
  const interpolated = [];
  
  // 2. Sample targetCount equidistant points along the cumulative distance
  for (let i = 0; i <= targetCount; i++) {
    const targetDist = (i / targetCount) * totalDistance;
    
    // Find matching segment
    let idx = 0;
    while (idx < cumulDist.length - 2 && cumulDist[idx + 1] < targetDist) {
      idx++;
    }
    
    const d0 = cumulDist[idx];
    const d1 = cumulDist[idx + 1];
    const p0 = points[idx];
    const p1 = points[idx + 1] || points[idx]; // Guard: clamp to last point
    
    const segmentLen = (d1 !== undefined && d1 > d0) ? (d1 - d0) : 0;
    const ratio = segmentLen > 0 ? Math.min(1, (targetDist - d0) / segmentLen) : 0;
    
    const lat = p0[0] + (p1[0] - p0[0]) * ratio;
    const lng = p0[1] + (p1[1] - p0[1]) * ratio;
    interpolated.push([lat, lng]);
  }
  
  return interpolated;
}

// ── GRID ROAD ROUTING FALLBACK ──
function generateGridFallback(start, end) {
  const points = [];
  const midLat = start[0];
  const midLng = end[1];
  const steps = 50;
  
  // Draw an L-shaped grid path (horizontal then vertical)
  for (let i = 0; i <= steps; i++) {
    const r = i / steps;
    points.push([start[0], start[1] + (midLng - start[1]) * r]);
  }
  for (let i = 1; i <= steps; i++) {
    const r = i / steps;
    points.push([midLat + (end[0] - midLat) * r, end[1]]);
  }
  return points;
}

// ── DYNAMIC ROUTE RE-INITIALIZATION ON ADDRESS CHANGE ──
async function reinitRoute(destLat, destLng) {
  const customerLatLng = [destLat, destLng];
  
  // Fit bounds to show both
  map.fitBounds(L.latLngBounds([storeLatLng, customerLatLng]), { padding: [60, 60] });

  // Setup Shipper Scooter Marker Icon
  const shipperIcon = L.divIcon({
    className: '',
    html: `<div style="
      width:44px; height:44px;
      background:#ff5722;
      border-radius:50%;
      border:3px solid #fff;
      box-shadow:0 4px 14px rgba(255,87,34,0.5);
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:18px;
    "><i class="fa-solid fa-motorcycle"></i></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

  let totalDistMeters = calculateDistance(storeLatLng[0], storeLatLng[1], customerLatLng[0], customerLatLng[1]);
  pathPoints = [];

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${storeLatLng[1]},${storeLatLng[0]};${customerLatLng[1]},${customerLatLng[0]}?overview=full&geometries=geojson`;
    const routeRes = await fetch(osrmUrl);
    if (routeRes.ok) {
      const routeData = await routeRes.json();
      if (routeData.routes && routeData.routes.length > 0) {
        const coords = routeData.routes[0].geometry.coordinates;
        const rawPoints = coords.map(c => [c[1], c[0]]);
        totalDistMeters = routeData.routes[0].distance;
        pathPoints = interpolatePoints(rawPoints, 80);
      }
    }
  } catch (err) {
    console.warn('OSRM failed during address change, fallback grid route.');
  }

  if (pathPoints.length === 0) {
    const gridPoints = generateGridFallback(storeLatLng, customerLatLng);
    pathPoints = interpolatePoints(gridPoints, 70);
    totalDistMeters = (Math.abs(storeLatLng[0] - customerLatLng[0]) + Math.abs(storeLatLng[1] - customerLatLng[1])) * 111000;
  }

  routeLine = L.polyline(pathPoints, {
    color: '#ff5722',
    weight: 5,
    opacity: 0.8,
    dashArray: '10, 10'
  }).addTo(map);

  // Lưu track start mới để shipper di chuyển từ đầu
  localStorage.setItem(`fe_track_start_${orderData.HoaDonID}`, Date.now().toString());

  simulateShipperMove(totalDistMeters, customerLatLng, shipperIcon, orderData.HoaDonID, 0);
}

// ── CUSTOM TOAST NOTIFICATION ──
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    background: ${type === 'success' ? 'linear-gradient(135deg,#2ecc71,#27ae60)' : type === 'warning' ? 'linear-gradient(135deg,#f1c40f,#f39c12)' : 'linear-gradient(135deg,#e74c3c,#c0392b)'};
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 600;
    animation: slideInToast 0.3s forwards;
    pointer-events: auto;
  `;

  let iconClass = 'fa-solid fa-circle-check';
  if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';
  if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

  toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutToast 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── CONFETTI ANIMATION ON CANVAS ──
function launchConfetti() {
  const canvas = document.getElementById('pickup-confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const colors = ['#ff5722', '#ff8a50', '#2ecc71', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6'];
  const pieces = [];
  const PIECE_COUNT = 80;

  for (let i = 0; i < PIECE_COUNT; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * canvas.height * 0.5,
      w: 8 + Math.random() * 8,
      h: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 2.5 + Math.random() * 3,
      opacity: 1
    });
  }

  let frame = 0;
  const MAX_FRAMES = 160;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      if (frame > MAX_FRAMES * 0.6) p.opacity -= 0.018;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (frame < MAX_FRAMES) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  draw();
}

// Thêm style animation động cho modal và toast
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInToast {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutToast {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(120%); opacity: 0; }
  }
  @keyframes scaleUp {
    from { transform: scale(0.85); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);

// ── DOM EVENT LISTENERS: ARRIVAL MODAL BUTTONS ──
document.addEventListener('DOMContentLoaded', () => {
  const arrivalModal = document.getElementById('arrival-modal');
  const btnPickup = document.getElementById('btn-confirm-pickup');
  const btnReturn = document.getElementById('btn-confirm-return');

  if (btnPickup && arrivalModal) {
    btnPickup.addEventListener('click', () => {
      const orderId = arrivalModal.dataset.orderId;
      if (orderId) confirmPickupSuccess(orderId);
    });
  }

  if (btnReturn && arrivalModal) {
    btnReturn.addEventListener('click', () => {
      const orderId = arrivalModal.dataset.orderId;
      if (orderId) confirmReturn(orderId);
    });
  }
});

// ── DOM EVENT LISTENERS FOR ADDRESS UPDATING ──
document.addEventListener('DOMContentLoaded', () => {
  const editBtn = document.getElementById('btn-edit-delivery');
  const modal = document.getElementById('edit-delivery-modal');
  const closeBtn = document.getElementById('edit-delivery-close');
  const cancelBtn = document.getElementById('btn-edit-delivery-cancel');
  const form = document.getElementById('edit-delivery-form');
  const inputAddress = document.getElementById('edit-delivery-address');
  const inputPhone = document.getElementById('edit-delivery-phone');

  if (editBtn && modal) {
    editBtn.addEventListener('click', () => {
      if (orderData) {
        inputAddress.value = orderData.DiaChiNhan || '';
        inputPhone.value = orderData.SoDienThoaiNhan || '';
        modal.style.display = 'flex';
      }
    });

    const closeModal = () => {
      modal.style.display = 'none';
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newAddress = inputAddress.value.trim();
      const newPhone = inputPhone.value.trim();

      if (!newAddress) {
        showToast('Vui lòng nhập địa chỉ giao hàng mới.', 'warning');
        return;
      }
      if (!newPhone) {
        showToast('Vui lòng nhập số điện thoại mới.', 'warning');
        return;
      }
      if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(newPhone)) {
        showToast('Số điện thoại không hợp lệ! Vui lòng nhập đúng định dạng Việt Nam.', 'warning');
        return;
      }

      const token = localStorage.getItem('fe_token');
      if (!token) {
        showTokenError();
        return;
      }

      try {
        const response = await fetch(`/api/hoadon/${orderData.HoaDonID}/diachi`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            DiaChiNhan: newAddress,
            SoDienThoaiNhan: newPhone
          })
        });

        const data = await response.json();
        if (response.ok) {
          showToast('Cập nhật thông tin giao nhận thành công! 🎉', 'success');
          orderData.DiaChiNhan = newAddress;
          orderData.SoDienThoaiNhan = newPhone;
          populateOrderInfo(orderData);
          closeModal();

          if (map) {
            // Tọa độ điểm giao mới được chọn giả lập xung quanh toạ độ cũ để thay đổi trên bản đồ
            const oldLatLng = customerMarker.getLatLng();
            const newLat = oldLatLng.lat + (Math.random() - 0.5) * 0.003;
            const newLng = oldLatLng.lng + (Math.random() - 0.5) * 0.003;
            
            customerMarker.setLatLng([newLat, newLng]);
            customerMarker.getPopup().setContent('<b>📍 Điểm giao của bạn (Mới)</b><br>' + newAddress);

            // Reset tuyến đường hiện tại
            if (routeLine) {
              map.removeLayer(routeLine);
            }
            if (shipperMarker) {
              map.removeLayer(shipperMarker);
            }
            if (animationInterval) {
              clearInterval(animationInterval);
            }

            // Tạo lại lộ trình mới
            await reinitRoute(newLat, newLng);
          }
        } else {
          showToast(data.message || 'Cập nhật thông tin thất bại.', 'error');
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật thông tin:', err);
        showToast('Không thể kết nối máy chủ.', 'error');
      }
    });
  }
});

