/**
 * FoodExpress - Administrative Dashboard Controller (Vanilla ES6 JS)
 * Handles security check, real-time analytics, CRUD operations, and premium UX interactions.
 */

// ==================== STATE & CONFIGURATION ====================
let currentUser = JSON.parse(localStorage.getItem('fe_user')) || null;
let currentToken = localStorage.getItem('fe_token') || null;

// Application State
let activeTab = 'dashboard';
let cache = {
  products: [],
  categories: [],
  orders: [],
  vouchers: [],
  chartData: null
};

// Pagination states
let pagination = {
  products: { page: 1, limit: 8, total: 0 },
  orders: { page: 1, limit: 10, total: 0 }
};

// Filter and Search states
let filters = {
  productSearch: '',
  productCategory: 'all',
  orderSearch: '',
  orderStatus: 'all'
};

// Chart Instances state
let chartInstances = {
  revenue: null,
  status: null,
  category: null
};

// DOM Cache
const DOM = {
  // Overlays & Containers
  loginOverlay: document.getElementById('admin-login-overlay'),
  appContainer: document.getElementById('admin-app-container'),
  toastContainer: document.getElementById('toast-container'),
  
  // Auth Form
  adminLoginForm: document.getElementById('admin-login-form'),
  adminLogoutBtn: document.getElementById('admin-logout-btn'),
  adminFullnameDisplay: document.getElementById('admin-fullname-display'),
  
  // Sidebar & Theme
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  menuItems: document.querySelectorAll('.sidebar-menu .menu-item'),
  
  // System time
  systemTimeDisplay: document.getElementById('system-time-display'),
  
  // Stat values
  statRevenue: document.getElementById('stat-revenue'),
  statOrders: document.getElementById('stat-orders'),
  statProducts: document.getElementById('stat-products'),
  statUsers: document.getElementById('stat-users'),
  topProductsTbody: document.getElementById('top-products-tbody'),
  
  // Tabs & Sections
  tabs: {
    dashboard: document.getElementById('tab-dashboard'),
    orders: document.getElementById('tab-orders'),
    products: document.getElementById('tab-products'),
    categories: document.getElementById('tab-categories'),
    vouchers: document.getElementById('tab-vouchers')
  },
  
  // Products Tab
  productSearchInput: document.getElementById('product-search-input'),
  productCategoryFilter: document.getElementById('product-category-filter'),
  btnOpenAddProductModal: document.getElementById('btn-open-add-product-modal'),
  productsTableBody: document.getElementById('products-table-body'),
  productsPaginationInfo: document.getElementById('products-pagination-info'),
  productsPaginationControls: document.getElementById('products-pagination-controls'),
  
  // Product Modal Form
  productModal: document.getElementById('product-modal'),
  productModalClose: document.getElementById('product-modal-close'),
  productForm: document.getElementById('product-form'),
  productFormId: document.getElementById('product-form-id'),
  productName: document.getElementById('product-name'),
  productCategory: document.getElementById('product-category'),
  productPrice: document.getElementById('product-price'),
  productStock: document.getElementById('product-stock'),
  productStatus: document.getElementById('product-status'),
  productImage: document.getElementById('product-image'),
  productDesc: document.getElementById('product-desc'),
  btnCancelProduct: document.getElementById('btn-cancel-product'),
  btnSaveProduct: document.getElementById('btn-save-product'),
  productModalTitle: document.getElementById('product-modal-title'),
  
  // Orders Tab
  orderSearchInput: document.getElementById('order-search-input'),
  orderStatusFilter: document.getElementById('order-status-filter'),
  btnRefreshOrders: document.getElementById('btn-refresh-orders'),
  ordersTableBody: document.getElementById('orders-table-body'),
  ordersPaginationInfo: document.getElementById('orders-pagination-info'),
  ordersPaginationControls: document.getElementById('orders-pagination-controls'),
  
  // Order Detail Modal
  orderModal: document.getElementById('order-modal'),
  orderModalClose: document.getElementById('order-modal-close'),
  orderModalTitle: document.getElementById('order-modal-title'),
  orderDetailCustomer: document.getElementById('order-detail-customer'),
  orderDetailPhone: document.getElementById('order-detail-phone'),
  orderDetailDate: document.getElementById('order-detail-date'),
  orderDetailStatusBadge: document.getElementById('order-detail-status-badge'),
  orderDetailAddress: document.getElementById('order-detail-address'),
  orderDetailNote: document.getElementById('order-detail-note'),
  orderItemsTbody: document.getElementById('order-items-tbody'),
  orderSummarySubtotal: document.getElementById('order-summary-subtotal'),
  orderSummaryDiscountRow: document.getElementById('order-summary-discount-row'),
  orderSummaryDiscountLabel: document.getElementById('order-summary-discount-label'),
  orderSummaryDiscount: document.getElementById('order-summary-discount'),
  orderSummaryPaymentMethod: document.getElementById('order-summary-payment-method'),
  orderSummaryPaymentStatus: document.getElementById('order-summary-payment-status'),
  orderSummaryTotal: document.getElementById('order-summary-total'),
  modalOrderStatusSelect: document.getElementById('modal-order-status-select'),
  btnUpdateOrderStatus: document.getElementById('btn-update-order-status'),
  
  // Categories Tab
  btnOpenAddCategoryModal: document.getElementById('btn-open-add-category-modal'),
  categoriesTableBody: document.getElementById('categories-table-body'),
  
  // Category Modal Form
  categoryModal: document.getElementById('category-modal'),
  categoryModalClose: document.getElementById('category-modal-close'),
  categoryForm: document.getElementById('category-form'),
  categoryFormId: document.getElementById('category-form-id'),
  categoryName: document.getElementById('category-name'),
  categoryDesc: document.getElementById('category-desc'),
  btnCancelCategory: document.getElementById('btn-cancel-category'),
  btnSaveCategory: document.getElementById('btn-save-category'),
  categoryModalTitle: document.getElementById('category-modal-title'),
  
  // Vouchers Tab
  btnOpenAddVoucherModal: document.getElementById('btn-open-add-voucher-modal'),
  vouchersTableBody: document.getElementById('vouchers-table-body'),
  
  // Voucher Modal Form
  voucherModal: document.getElementById('voucher-modal'),
  voucherModalClose: document.getElementById('voucher-modal-close'),
  voucherForm: document.getElementById('voucher-form'),
  voucherFormId: document.getElementById('voucher-form-id'),
  voucherCode: document.getElementById('voucher-code'),
  voucherName: document.getElementById('voucher-name'),
  voucherPercent: document.getElementById('voucher-percent'),
  voucherCash: document.getElementById('voucher-cash'),
  voucherMinVal: document.getElementById('voucher-min-val'),
  voucherQty: document.getElementById('voucher-qty'),
  voucherStart: document.getElementById('voucher-start'),
  voucherEnd: document.getElementById('voucher-end'),
  voucherStatus: document.getElementById('voucher-status'),
  btnCancelVoucher: document.getElementById('btn-cancel-voucher'),
  btnSaveVoucher: document.getElementById('btn-save-voucher'),
  voucherModalTitle: document.getElementById('voucher-modal-title')
};

// ==================== UTILITY FUNCTIONS ====================

// Format Price to VND
function formatPrice(number) {
  if (typeof number !== 'number') number = parseFloat(number) || 0;
  return number.toLocaleString('vi-VN') + 'đ';
}

// Format Datetime (múi giờ Việt Nam)
function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Chuyển chuỗi datetime-local (YYYY-MM-DDTHH:MM) được nhập theo giờ Việt Nam
 * thành ISO string UTC để gửi lên server.
 * Lý do: input datetime-local không có thông tin timezone, nếu dùng new Date() trực tiếp
 * sẽ parse theo giờ hệ thống máy tính (có thể sai). Gắn '+07:00' vào đảm bảo đúng giờ VN.
 */
function convertVNInputToISO(localStr) {
  if (!localStr) return null;
  // Gắn offset +07:00 (Việt Nam) để new Date() parse đúng
  return new Date(localStr + ':00+07:00').toISOString();
}

// Show Custom Toast Alerts
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconClass = 'fa-solid fa-circle-check';
  if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';
  if (type === 'info') iconClass = 'fa-solid fa-circle-info';
  if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';
  
  toast.innerHTML = `
    <i class="${iconClass}"></i>
    <span>${message}</span>
  `;
  
  DOM.toastContainer.appendChild(toast);
  
  // Slide out and remove toast
  setTimeout(() => {
    toast.style.animation = 'toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Local clock initialization (múi giờ Việt Nam)
function startClock() {
  const updateClock = () => {
    const now = new Date();
    DOM.systemTimeDisplay.textContent = now.toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// Helper: API calls with Bearer Token auth
async function apiCall(url, options = {}) {
  const defaultHeaders = {
    'Authorization': `Bearer ${currentToken}`
  };
  
  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }
  
  options.headers = { ...defaultHeaders, ...options.headers };
  
  const response = await fetch(url, options);
  
  // If token is expired or unauthorized, automatically sign out!
  if (response.status === 401 || response.status === 403) {
    showToast('Token phiên làm việc đã hết hạn hoặc không có quyền!', 'error');
    logout();
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}

// ==================== AUTHENTICATION & SECURITY GUARD ====================

function checkSecurityGuard() {
  if (!currentToken || !currentUser) {
    // Show login overlay, hide layout
    DOM.loginOverlay.style.display = 'flex';
    DOM.appContainer.style.display = 'none';
    return false;
  }
  
  if (currentUser.VaiTroID !== 1) {
    // Authenticated but NOT as Admin
    DOM.loginOverlay.style.display = 'flex';
    DOM.appContainer.style.display = 'none';
    
    // Change overlay context to Access Denied
    const card = DOM.loginOverlay.querySelector('.admin-login-card');
    card.innerHTML = `
      <div class="login-icon-large" style="background: linear-gradient(135deg, var(--danger), #ef4444); box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h2 class="login-title-large">Từ Chối Truy Cập</h2>
      <p class="login-desc-large" style="color: var(--danger); font-weight: 600;">Tài khoản của bạn không có quyền Quản trị viên!</p>
      <p class="login-desc-large">Vui lòng đăng xuất và đăng nhập lại bằng tài khoản được phân quyền phù hợp.</p>
      <button class="login-btn-large" id="btn-switch-account" style="width: 100%; margin-bottom: 12px; background-color: var(--danger);">Đăng Xuất & Chuyển Tài Khoản</button>
      <a href="index.html" class="login-home-btn"><i class="fa-solid fa-house"></i> Trở lại trang chủ mua sắm</a>
    `;
    
    document.getElementById('btn-switch-account').addEventListener('click', () => {
      logout();
    });
    return false;
  }
  
  // Authorized, prepare layout
  DOM.loginOverlay.style.display = 'none';
  DOM.appContainer.style.display = 'flex';
  DOM.adminFullnameDisplay.textContent = currentUser.HoTen;
  return true;
}

// Login action specific for Admin Overlay Form
DOM.adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  
  const loginBtn = document.getElementById('admin-login-btn');
  loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Xác thực...';
  loginBtn.setAttribute('disabled', 'true');
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        TenDangNhap: username,
        MatKhau: password
      })
    });
    
    const data = await res.json();
    
    if (res.status === 200) {
      if (data.user.VaiTroID !== 1) {
        showToast('Tài khoản này không có quyền Quản trị viên!', 'error');
        loginBtn.innerHTML = 'Đăng Nhập Quản Trị';
        loginBtn.removeAttribute('disabled');
        return;
      }
      
      // Save credentials
      currentUser = data.user;
      currentToken = data.token;
      
      localStorage.setItem('fe_user', JSON.stringify(currentUser));
      localStorage.setItem('fe_token', currentToken);
      
      showToast(`Đăng nhập quản trị thành công! Chào ${currentUser.HoTen} 👋`, 'success');
      DOM.adminLoginForm.reset();
      
      if (checkSecurityGuard()) {
        initAdminApp();
      }
    } else {
      showToast(data.message || 'Sai tài khoản hoặc mật khẩu!', 'error');
    }
  } catch (err) {
    console.error('Lỗi login admin:', err);
    showToast('Lỗi máy chủ xác thực không phản hồi!', 'error');
  } finally {
    loginBtn.innerHTML = 'Đăng Nhập Quản Trị';
    loginBtn.removeAttribute('disabled');
  }
});

// Logout
function logout() {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem('fe_user');
  localStorage.removeItem('fe_token');
  location.reload();
}

DOM.adminLogoutBtn.addEventListener('click', () => {
  logout();
});

// ==================== APP INITIALIZATION & CORE EVENTS ====================

document.addEventListener('DOMContentLoaded', () => {
  // Theme check
  if (localStorage.getItem('fe_dark_mode') === 'false') {
    document.body.classList.add('light-theme');
    DOM.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  } else {
    document.body.classList.remove('light-theme');
    DOM.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
  
  if (checkSecurityGuard()) {
    initAdminApp();
  }
});

function initAdminApp() {
  startClock();
  setupTabRouting();
  setupThemeToggle();
  setupSidebarResponsive();
  
  // Initial load
  loadDashboardData();
}

// Sidebar toggle on mobile
function setupSidebarResponsive() {
  DOM.sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.sidebar.classList.toggle('open');
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#sidebar') && DOM.sidebar.classList.contains('open')) {
      DOM.sidebar.classList.remove('open');
    }
  });
}

// Theme toggler
function setupThemeToggle() {
  DOM.themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('fe_dark_mode', !isLight);
    
    if (isLight) {
      DOM.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      DOM.themeToggleBtn.title = "Chuyển chế độ tối";
      showToast('Đã chuyển sang giao diện Sáng! ☀️', 'info');
    } else {
      DOM.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      DOM.themeToggleBtn.title = "Chuyển chế độ tối";
      showToast('Đã chuyển sang giao diện Tối! 🌙', 'info');
    }

    // Vẽ lại biểu đồ với màu sắc phù hợp theo theme mới
    if (activeTab === 'dashboard' && cache.chartData) {
      renderDashboardCharts(cache.chartData);
    }
  });
}

// SPA tab switching
function setupTabRouting() {
  DOM.menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      if (tabName === activeTab) return;
      
      // Update UI active states
      DOM.menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Hide current tab, show new tab
      Object.keys(DOM.tabs).forEach(k => DOM.tabs[k].classList.remove('active'));
      DOM.tabs[tabName].classList.add('active');
      
      activeTab = tabName;
      
      // Fetch relevant tab data
      if (tabName === 'dashboard') loadDashboardData();
      else if (tabName === 'orders') loadOrdersData();
      else if (tabName === 'products') loadProductsData();
      else if (tabName === 'categories') loadCategoriesData();
      else if (tabName === 'vouchers') loadVouchersData();
      
      // Close sidebar if open on mobile
      DOM.sidebar.classList.remove('open');
    });
  });
}

// ==================== TAB 1: OVERVIEW DASHBOARD LOGIC ====================

async function loadDashboardData() {
  try {
    // Skeletons
    DOM.topProductsTbody.innerHTML = Array(3).fill('<tr><td colspan="4"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách bán chạy...</td></tr>').join('');

    // ── Bước 1: Tải các API thống kê chính (bắt buộc thành công) ──
    const [thongKe, doanhThu, topProducts] = await Promise.all([
      apiCall('/api/admin/thongke'),
      apiCall('/api/admin/doanhthu'),
      apiCall('/api/admin/sanphambanchay')
    ]);

    // Populate stat cards
    DOM.statRevenue.textContent = formatPrice(doanhThu.TongDoanhThu || 0);
    DOM.statOrders.textContent   = thongKe.TongHoaDon    || 0;
    DOM.statProducts.textContent = thongKe.TongSanPham   || 0;
    DOM.statUsers.textContent    = thongKe.TongNguoiDung || 0;

    // Top 5 products rendering
    DOM.topProductsTbody.innerHTML = '';
    if (!topProducts || topProducts.length === 0) {
      DOM.topProductsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chưa có món ăn nào bán ra.</td></tr>';
    } else {
      topProducts.forEach(p => {
        const imgUrl = p.HinhAnh && p.HinhAnh.startsWith('http')
          ? p.HinhAnh
          : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
        DOM.topProductsTbody.innerHTML += `
          <tr>
            <td>
              <div class="table-img-wrapper">
                <img src="${imgUrl}" alt="${p.TenSanPham}" class="table-img"
                     onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';">
              </div>
            </td>
            <td>
              <div class="product-table-name">${p.TenSanPham}</div>
              <div class="product-table-desc">Mã món: #${p.SanPhamID}</div>
            </td>
            <td style="font-weight:600;">${formatPrice(p.Gia)}</td>
            <td>
              <span class="badge badge-completed" style="font-size:0.85rem;">
                <i class="fa-solid fa-fire"></i> Đã bán ${p.TongSoLuongDaBan} phần
              </span>
            </td>
          </tr>`;
      });
    }

  } catch (err) {
    console.error('Lỗi tải dữ liệu Dashboard:', err);
    showToast('Lỗi hệ thống khi tải thống kê tổng quan!', 'error');
  }

  // ── Bước 2: Tải dữ liệu biểu đồ riêng biệt (KHÔNG làm hỏng stats nếu lỗi) ──
  try {
    const bieuDo = await apiCall('/api/admin/bieudo');
    cache.chartData = bieuDo;
    renderDashboardCharts(bieuDo);
  } catch (chartErr) {
    console.warn('Không thể tải dữ liệu biểu đồ (có thể chưa có đơn hàng thanh toán):', chartErr.message);
    // Hiển thị thông báo trống thay vì lỗi toàn trang
    ['revenue-chart', 'order-status-chart', 'category-chart'].forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const parent = canvas.parentElement;
        parent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                      height:100%;color:var(--text-muted);gap:8px;font-size:0.9rem;">
            <i class="fa-solid fa-chart-simple" style="font-size:2rem;opacity:0.3;"></i>
            <span>Chưa có dữ liệu để hiển thị biểu đồ</span>
          </div>`;
      }
    });
  }
}

function renderDashboardCharts(data) {
  if (!data) return;
  const isDark = !document.body.classList.contains('light-theme');
  const textColor = isDark ? '#9ca3af' : '#4b5563';
  const gridColor = isDark ? '#2d3748' : '#e5e7eb';

  // --- 1. BIỂU ĐỒ DOANH THU & ĐƠN HÀNG (Combo Bar & Line) ---
  const revCtx = document.getElementById('revenue-chart').getContext('2d');
  if (chartInstances.revenue) {
    chartInstances.revenue.destroy();
  }

  // Sắp xếp doanh thu tháng tăng dần theo thời gian
  const sortedDoanhThu = [...data.doanhThuThang].sort((a, b) => {
    if (a.Nam !== b.Nam) return a.Nam - b.Nam;
    return a.Thang - b.Thang;
  });

  const labels = sortedDoanhThu.map(item => `Tháng ${item.Thang}/${item.Nam}`);
  const revenues = sortedDoanhThu.map(item => item.DoanhThu);
  const ordersCount = sortedDoanhThu.map(item => item.SoDonHang);

  chartInstances.revenue = new Chart(revCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Doanh thu (VND)',
          data: revenues,
          backgroundColor: 'rgba(99, 102, 241, 0.65)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          yAxisID: 'y-revenue',
          order: 2
        },
        {
          label: 'Số đơn hàng',
          data: ordersCount,
          type: 'line',
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderWidth: 3,
          tension: 0.3,
          fill: false,
          yAxisID: 'y-orders',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        'y-revenue': {
          type: 'linear',
          position: 'left',
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: value => value.toLocaleString('vi-VN') + 'đ'
          },
          title: {
            display: true,
            text: 'Doanh thu',
            color: textColor
          }
        },
        'y-orders': {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            color: textColor,
            stepSize: 1
          },
          title: {
            display: true,
            text: 'Số đơn',
            color: textColor
          }
        }
      }
    }
  });

  // --- 2. BIỂU ĐỒ TRẠNG THÁI ĐƠN HÀNG (Doughnut) ---
  const statusCtx = document.getElementById('order-status-chart').getContext('2d');
  if (chartInstances.status) {
    chartInstances.status.destroy();
  }

  const statusColors = {
    'Chờ xác nhận': 'rgba(245, 158, 11, 0.7)',
    'Đang giao': 'rgba(59, 130, 246, 0.7)',
    'Hoàn thành': 'rgba(16, 185, 129, 0.7)',
    'Đã hủy': 'rgba(239, 68, 68, 0.7)'
  };
  const statusBorderColors = {
    'Chờ xác nhận': 'rgb(245, 158, 11)',
    'Đang giao': 'rgb(59, 130, 246)',
    'Hoàn thành': 'rgb(16, 185, 129)',
    'Đã hủy': 'rgb(239, 68, 68)'
  };

  const statusLabels = data.trangThaiDon.map(item => item.TrangThai);
  const statusValues = data.trangThaiDon.map(item => item.SoLuong);
  const bgColors = statusLabels.map(label => statusColors[label] || 'rgba(156, 163, 175, 0.7)');
  const borderColors = statusLabels.map(label => statusBorderColors[label] || 'rgb(156, 163, 175)');

  chartInstances.status = new Chart(statusCtx, {
    type: 'doughnut',
    data: {
      labels: statusLabels,
      datasets: [{
        data: statusValues,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor }
        }
      }
    }
  });

  // --- 3. BIỂU ĐỒ DOANH THU THEO DANH MỤC (Horizontal Bar) ---
  const catCtx = document.getElementById('category-chart').getContext('2d');
  if (chartInstances.category) {
    chartInstances.category.destroy();
  }

  const catLabels = data.doanhThuDanhMuc.map(item => item.TenDanhMuc);
  const catValues = data.doanhThuDanhMuc.map(item => item.DoanhThu);

  chartInstances.category = new Chart(catCtx, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{
        label: 'Doanh thu (VND)',
        data: catValues,
        backgroundColor: [
          'rgba(244, 63, 94, 0.65)',
          'rgba(249, 115, 22, 0.65)',
          'rgba(234, 179, 8, 0.65)',
          'rgba(34, 197, 94, 0.65)',
          'rgba(6, 182, 212, 0.65)',
          'rgba(168, 85, 247, 0.65)'
        ],
        borderColor: [
          'rgb(244, 63, 94)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)',
          'rgb(6, 182, 212)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: value => value.toLocaleString('vi-VN') + 'đ'
          }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    }
  });
}


// ==================== TAB 2: ORDER MANAGEMENT LOGIC ====================

async function loadOrdersData() {
  try {
    DOM.ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu đơn hàng...</td></tr>';
    
    const orders = await apiCall('/api/admin/donhang');
    cache.orders = orders;
    
    renderOrders();
  } catch (err) {
    console.error('Lỗi tải đơn hàng:', err);
    showToast('Lỗi khi lấy danh sách hóa đơn từ máy chủ!', 'error');
  }
}

function renderOrders() {
  let filtered = [...cache.orders];
  
  // Apply Search
  const kw = filters.orderSearch.trim().toLowerCase();
  if (kw) {
    filtered = filtered.filter(o => 
      (o.TenKhachHang && o.TenKhachHang.toLowerCase().includes(kw)) ||
      (o.SoDienThoaiNhan && o.SoDienThoaiNhan.includes(kw)) ||
      (o.HoaDonID && o.HoaDonID.toString().includes(kw))
    );
  }
  
  // Apply status filter
  if (filters.orderStatus !== 'all') {
    filtered = filtered.filter(o => o.TrangThai === filters.orderStatus);
  }
  
  pagination.orders.total = filtered.length;
  
  // Apply pagination
  const start = (pagination.orders.page - 1) * pagination.orders.limit;
  const end = Math.min(start + pagination.orders.limit, filtered.length);
  const paged = filtered.slice(start, end);
  
  DOM.ordersTableBody.innerHTML = '';
  
  if (paged.length === 0) {
    DOM.ordersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">Không tìm thấy đơn hàng nào phù hợp!</td></tr>';
    DOM.ordersPaginationInfo.textContent = 'Hiển thị đơn hàng 0 - 0 của 0';
    DOM.ordersPaginationControls.innerHTML = '';
    return;
  }
  
  DOM.ordersPaginationInfo.textContent = `Hiển thị đơn hàng ${start + 1} - ${end} của ${filtered.length}`;
  
  paged.forEach(o => {
    let statusClass = 'badge-pending';
    if (o.TrangThai === 'Đang giao') statusClass = 'badge-delivering';
    else if (o.TrangThai === 'Hoàn thành') statusClass = 'badge-completed';
    else if (o.TrangThai === 'Đã hủy') statusClass = 'badge-cancelled';
    
    DOM.ordersTableBody.innerHTML += `
      <tr>
        <td style="font-weight: 700;">#HD${o.HoaDonID}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${o.TenKhachHang || 'Khách Vãng Lai'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Mã ND: #${o.NguoiDungID}</div>
        </td>
        <td>${o.SoDienThoaiNhan || 'N/A'}</td>
        <td>${formatDateTime(o.NgayDat)}</td>
        <td style="font-weight: 700; color: var(--primary);">${formatPrice(o.TongTien)}</td>
        <td>
          <span class="badge ${statusClass}">
            <span class="badge-dot"></span>
            ${o.TrangThai}
          </span>
        </td>
        <td>
          <div class="actions-row" style="justify-content: center;">
            <button class="btn-action btn-action-view" title="Xem chi tiết" onclick="openOrderDetailModal(${o.HoaDonID})">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  renderOrdersPaginationControls(filtered.length);
}

function renderOrdersPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / pagination.orders.limit);
  DOM.ordersPaginationControls.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn-page';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled = pagination.orders.page === 1;
  prevBtn.addEventListener('click', () => {
    pagination.orders.page--;
    renderOrders();
  });
  DOM.ordersPaginationControls.appendChild(prevBtn);
  
  // Numbered buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `btn-page ${i === pagination.orders.page ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      pagination.orders.page = i;
      renderOrders();
    });
    DOM.ordersPaginationControls.appendChild(btn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-page';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled = pagination.orders.page === totalPages;
  nextBtn.addEventListener('click', () => {
    pagination.orders.page++;
    renderOrders();
  });
  DOM.ordersPaginationControls.appendChild(nextBtn);
}

// Search & Filter Events for Orders
DOM.orderSearchInput.addEventListener('input', (e) => {
  filters.orderSearch = e.target.value;
  pagination.orders.page = 1;
  renderOrders();
});

DOM.orderStatusFilter.addEventListener('change', (e) => {
  filters.orderStatus = e.target.value;
  pagination.orders.page = 1;
  renderOrders();
});

DOM.btnRefreshOrders.addEventListener('click', loadOrdersData);

// ORDER DETAILS MODAL
let activeDetailOrderId = null;

window.openOrderDetailModal = async function(orderId) {
  activeDetailOrderId = orderId;
  DOM.orderModalTitle.textContent = `Chi Tiết Đơn Hàng #HD${orderId}`;
  
  DOM.orderDetailCustomer.textContent = 'Đang tải...';
  DOM.orderDetailPhone.textContent = 'Đang tải...';
  DOM.orderDetailDate.textContent = 'Đang tải...';
  DOM.orderDetailAddress.textContent = 'Đang tải...';
  DOM.orderDetailNote.textContent = 'Đang tải...';
  DOM.orderItemsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải món ăn...</td></tr>';
  
  DOM.orderModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  try {
    const order = await apiCall(`/api/hoadon/${orderId}`);
    
    // Fill client meta details
    DOM.orderDetailCustomer.textContent = order.TenKhachHang || 'Khách Vãng Lai';
    DOM.orderDetailPhone.textContent = order.SoDienThoaiNhan || 'N/A';
    DOM.orderDetailDate.textContent = formatDateTime(order.NgayDat);
    DOM.orderDetailAddress.textContent = order.DiaChiNhan || 'Không có thông tin địa chỉ';
    DOM.orderDetailNote.textContent = order.GhiChu || 'Không có ghi chú thêm.';
    
    // Status Badge
    let statusClass = 'badge-pending';
    if (order.TrangThai === 'Đang giao') statusClass = 'badge-delivering';
    else if (order.TrangThai === 'Hoàn thành') statusClass = 'badge-completed';
    else if (order.TrangThai === 'Đã hủy') statusClass = 'badge-cancelled';
    
    DOM.orderDetailStatusBadge.innerHTML = `
      <span class="badge ${statusClass}">
        <span class="badge-dot"></span>
        ${order.TrangThai}
      </span>
    `;
    
    // Items
    DOM.orderItemsTbody.innerHTML = '';
    const details = order.ChiTiet || [];
    
    if (details.length === 0) {
      DOM.orderItemsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Đơn hàng không có sản phẩm.</td></tr>';
    } else {
      details.forEach(item => {
        const imgUrl = item.HinhAnh && item.HinhAnh.startsWith('http') 
          ? item.HinhAnh 
          : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
          
        DOM.orderItemsTbody.innerHTML += `
          <tr>
            <td>
              <div class="table-img-wrapper" style="width: 36px; height: 36px; border-radius: 6px;">
                <img src="${imgUrl}" alt="${item.TenSanPham}" class="table-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';">
              </div>
            </td>
            <td style="font-weight: 600; color: var(--text-primary);">${item.TenSanPham}</td>
            <td style="font-weight: 600;">x${item.SoLuong}</td>
            <td>${formatPrice(item.DonGia)}</td>
            <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${formatPrice(item.ThanhTien)}</td>
          </tr>
        `;
      });
    }
    
    // Summary
    const payment = order.ThanhToan || {};
    DOM.orderSummaryPaymentMethod.textContent = payment.PhuongThuc || 'Tiền mặt';
    DOM.orderSummaryPaymentStatus.textContent = payment.TrangThaiThanhToan || 'Chưa thanh toán';
    
    if (payment.TrangThaiThanhToan === 'Đã thanh toán') {
      DOM.orderSummaryPaymentStatus.className = 'text-success';
    } else {
      DOM.orderSummaryPaymentStatus.className = 'text-danger';
    }
    
    // Calculate subtotals
    const subtotal = details.reduce((sum, item) => sum + item.ThanhTien, 0);
    DOM.orderSummarySubtotal.textContent = formatPrice(subtotal);
    
    // Discount/Vouchers
    if (order.MaKhuyenMai) {
      DOM.orderSummaryDiscountRow.style.display = 'flex';
      DOM.orderSummaryDiscountLabel.textContent = `Voucher (${order.MaKhuyenMai}):`;
      
      const discount = order.SoTienGiam || 0;
      DOM.orderSummaryDiscount.textContent = `-${formatPrice(discount)}`;
    } else {
      DOM.orderSummaryDiscountRow.style.display = 'none';
    }
    
    DOM.orderSummaryTotal.textContent = formatPrice(order.TongTien);
    
    // Order Status Select
    DOM.modalOrderStatusSelect.value = order.TrangThai;
    
  } catch (err) {
    console.error('Lỗi lấy chi tiết đơn:', err);
    showToast('Không thể kết nối máy chủ tải chi tiết đơn!', 'error');
  }
};

DOM.orderModalClose.addEventListener('click', () => {
  DOM.orderModal.classList.remove('open');
  document.body.style.overflow = '';
});

// Update status inside detail modal
DOM.btnUpdateOrderStatus.addEventListener('click', async () => {
  if (!activeDetailOrderId) return;
  const newStatus = DOM.modalOrderStatusSelect.value;
  
  DOM.btnUpdateOrderStatus.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
  DOM.btnUpdateOrderStatus.setAttribute('disabled', 'true');
  
  try {
    await apiCall(`/api/hoadon/${activeDetailOrderId}/trangthai`, {
      method: 'PUT',
      body: { TrangThai: newStatus }
    });
    
    showToast('Cập nhật trạng thái hóa đơn thành công! 💾', 'success');
    
    // Refresh modal info
    await openOrderDetailModal(activeDetailOrderId);
    
    // Refresh orders list
    loadOrdersData();
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái:', err);
    showToast(err.message || 'Lỗi khi thay đổi trạng thái hóa đơn!', 'error');
  } finally {
    DOM.btnUpdateOrderStatus.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu thay đổi';
    DOM.btnUpdateOrderStatus.removeAttribute('disabled');
  }
});

// ==================== TAB 3: PRODUCT CRUD LOGIC ====================

async function loadProductsData() {
  try {
    DOM.productsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu sản phẩm...</td></tr>';
    
    const response = await apiCall('/api/sanpham');
    // Ensure supporting raw arrays or paginated data wrapper
    cache.products = Array.isArray(response) ? response : response.data;
    
    // Check categories cache to pre-load filter options
    if (cache.categories.length === 0) {
      const cats = await apiCall('/api/danhmuc');
      cache.categories = cats;
      
      // Load into Category selector
      DOM.productCategoryFilter.innerHTML = '<option value="all">Tất cả danh mục</option>';
      DOM.productCategory.innerHTML = '';
      cats.forEach(c => {
        DOM.productCategoryFilter.innerHTML += `<option value="${c.DanhMucID}">${c.TenDanhMuc}</option>`;
        DOM.productCategory.innerHTML += `<option value="${c.DanhMucID}">${c.TenDanhMuc}</option>`;
      });
    }
    
    renderProducts();
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
    showToast('Không thể lấy danh sách sản phẩm!', 'error');
  }
}

function renderProducts() {
  let filtered = [...cache.products];
  
  // Apply search
  const kw = filters.productSearch.trim().toLowerCase();
  if (kw) {
    filtered = filtered.filter(p => p.TenSanPham.toLowerCase().includes(kw));
  }
  
  // Apply category filter
  if (filters.productCategory !== 'all') {
    filtered = filtered.filter(p => p.DanhMucID == filters.productCategory);
  }
  
  pagination.products.total = filtered.length;
  
  // Apply pagination
  const start = (pagination.products.page - 1) * pagination.products.limit;
  const end = Math.min(start + pagination.products.limit, filtered.length);
  const paged = filtered.slice(start, end);
  
  DOM.productsTableBody.innerHTML = '';
  
  if (paged.length === 0) {
    DOM.productsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 30px;">Không tìm thấy món ăn nào phù hợp!</td></tr>';
    DOM.productsPaginationInfo.textContent = 'Hiển thị sản phẩm 0 - 0 của 0';
    DOM.productsPaginationControls.innerHTML = '';
    return;
  }
  
  DOM.productsPaginationInfo.textContent = `Hiển thị món ăn ${start + 1} - ${end} của ${filtered.length}`;
  
  paged.forEach(p => {
    const isOutOfStock = p.SoLuongTon <= 0;
    const isActived = p.TrangThai !== false;
    
    const stockClass = isOutOfStock ? 'badge-inactive' : 'badge-active';
    const stockText = isOutOfStock ? 'Hết hàng' : `Còn ${p.SoLuongTon} suất`;
    
    const activeClass = isActived ? 'badge-active' : 'badge-inactive';
    const activeText = isActived ? 'Đang bán' : 'Tạm ngưng';
    
    const imgUrl = p.HinhAnh && p.HinhAnh.startsWith('http') 
      ? p.HinhAnh 
      : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
      
    DOM.productsTableBody.innerHTML += `
      <tr>
        <td style="font-weight: 700;">#${p.SanPhamID}</td>
        <td>
          <div class="table-img-wrapper">
            <img src="${imgUrl}" alt="${p.TenSanPham}" class="table-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';">
          </div>
        </td>
        <td>
          <div class="product-table-name">${p.TenSanPham}</div>
          <div class="product-table-desc">${p.MoTa || 'Món ăn ngon nóng hổi từ nhà bếp.'}</div>
        </td>
        <td style="font-weight: 600;">${p.TenDanhMuc || 'Khác'}</td>
        <td style="font-weight: 700; color: var(--primary);">${formatPrice(p.Gia)}</td>
        <td>
          <span class="badge ${stockClass}">
            <span class="badge-dot"></span>
            ${stockText}
          </span>
        </td>
        <td>
          <span class="badge ${activeClass}">
            <span class="badge-dot"></span>
            ${activeText}
          </span>
        </td>
        <td>
          <div class="actions-row">
            <button class="btn-action btn-action-edit" title="Chỉnh sửa" onclick="openProductEditModal(${p.SanPhamID})">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-action btn-action-delete" title="Xóa món" onclick="deleteProduct(${p.SanPhamID}, '${p.TenSanPham.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  renderProductsPaginationControls(filtered.length);
}

function renderProductsPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / pagination.products.limit);
  DOM.productsPaginationControls.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn-page';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled = pagination.products.page === 1;
  prevBtn.addEventListener('click', () => {
    pagination.products.page--;
    renderProducts();
  });
  DOM.productsPaginationControls.appendChild(prevBtn);
  
  // Numbered buttons
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `btn-page ${i === pagination.products.page ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      pagination.products.page = i;
      renderProducts();
    });
    DOM.productsPaginationControls.appendChild(btn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn-page';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled = pagination.products.page === totalPages;
  nextBtn.addEventListener('click', () => {
    pagination.products.page++;
    renderProducts();
  });
  DOM.productsPaginationControls.appendChild(nextBtn);
}

// Search and filter events for products
DOM.productSearchInput.addEventListener('input', (e) => {
  filters.productSearch = e.target.value;
  pagination.products.page = 1;
  renderProducts();
});

DOM.productCategoryFilter.addEventListener('change', (e) => {
  filters.productCategory = e.target.value;
  pagination.products.page = 1;
  renderProducts();
});

// OPEN PRODUCT MODAL FOR ADDING NEW
DOM.btnOpenAddProductModal.addEventListener('click', () => {
  DOM.productModalTitle.textContent = 'Thêm Sản Phẩm Món Ăn Mới';
  DOM.productForm.reset();
  DOM.productFormId.value = '';
  DOM.productStatus.checked = true;
  DOM.productModal.classList.add('open');
  document.body.style.overflow = 'hidden';
});

// OPEN PRODUCT MODAL FOR EDITING
window.openProductEditModal = async function(productId) {
  DOM.productModalTitle.textContent = `Chỉnh Sửa Sản Phẩm Món Ăn (Mã #${productId})`;
  DOM.productForm.reset();
  
  try {
    const p = await apiCall(`/api/sanpham/${productId}`);
    
    // Fill values
    DOM.productFormId.value = p.SanPhamID;
    DOM.productName.value = p.TenSanPham;
    DOM.productCategory.value = p.DanhMucID;
    DOM.productPrice.value = p.Gia;
    DOM.productStock.value = p.SoLuongTon;
    DOM.productStatus.checked = p.TrangThai !== false;
    DOM.productImage.value = p.HinhAnh || '';
    DOM.productDesc.value = p.MoTa || '';
    
    DOM.productModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
  } catch (err) {
    console.error('Lỗi openProductEditModal:', err);
    showToast('Không thể tải chi tiết sản phẩm cần chỉnh sửa!', 'error');
  }
};

function closeProductFormModal() {
  DOM.productModal.classList.remove('open');
  document.body.style.overflow = '';
  DOM.productForm.reset();
  DOM.productFormId.value = '';
}

DOM.productModalClose.addEventListener('click', closeProductFormModal);
DOM.btnCancelProduct.addEventListener('click', closeProductFormModal);

// SAVE / UPDATE PRODUCT
DOM.productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = DOM.productFormId.value;
  const isEditing = id !== '';
  
  const payload = {
    DanhMucID: parseInt(DOM.productCategory.value),
    TenSanPham: DOM.productName.value.trim(),
    Gia: parseFloat(DOM.productPrice.value),
    SoLuongTon: parseInt(DOM.productStock.value),
    HinhAnh: DOM.productImage.value.trim(),
    MoTa: DOM.productDesc.value.trim(),
    TrangThai: DOM.productStatus.checked
  };
  
  DOM.btnSaveProduct.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
  DOM.btnSaveProduct.setAttribute('disabled', 'true');
  
  try {
    let url = '/api/sanpham';
    let method = 'POST';
    
    if (isEditing) {
      url = `/api/sanpham/${id}`;
      method = 'PUT';
    }
    
    await apiCall(url, {
      method,
      body: payload
    });
    
    showToast(`${isEditing ? 'Cập nhật' : 'Tạo mới'} sản phẩm "${payload.TenSanPham}" thành công! 🎉`, 'success');
    closeProductFormModal();
    loadProductsData();
  } catch (err) {
    console.error('Lỗi khi lưu sản phẩm:', err);
    showToast(err.message || 'Lỗi khi lưu thông tin sản phẩm!', 'error');
  } finally {
    DOM.btnSaveProduct.textContent = 'Lưu Thông Tin';
    DOM.btnSaveProduct.removeAttribute('disabled');
  }
});

// DELETE PRODUCT
window.deleteProduct = async function(id, name) {
  const yes = confirm(`❓ BẠN CÓ CHẮC CHẮN MUỐN XÓA MÓN ĂN:\n"${name}" (Mã #${id})?\nThao tác này không thể hoàn tác!`);
  if (!yes) return;
  
  try {
    await apiCall(`/api/sanpham/${id}`, {
      method: 'DELETE'
    });
    
    showToast(`Đã xóa món ăn "${name}" thành công!`, 'success');
    loadProductsData();
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm:', err);
    showToast(err.message || 'Không thể xóa sản phẩm do ràng buộc dữ liệu!', 'error');
  }
};

// ==================== TAB 4: CATEGORY CRUD LOGIC ====================

async function loadCategoriesData() {
  try {
    DOM.categoriesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh mục...</td></tr>';
    
    const cats = await apiCall('/api/danhmuc');
    cache.categories = cats;
    
    renderCategories();
  } catch (err) {
    console.error('Lỗi tải danh mục:', err);
    showToast('Lỗi khi lấy danh sách danh mục từ máy chủ!', 'error');
  }
}

function renderCategories() {
  DOM.categoriesTableBody.innerHTML = '';
  
  if (cache.categories.length === 0) {
    DOM.categoriesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Chưa có danh mục nào.</td></tr>';
    return;
  }
  
  cache.categories.forEach(c => {
    const moTa = c.MoTa ? c.MoTa : '<em style="color: var(--text-muted);">Chưa có mô tả</em>';
    const safeDesc = (c.MoTa || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
    DOM.categoriesTableBody.innerHTML += `
      <tr>
        <td style="font-weight: 700;">#DM${c.DanhMucID}</td>
        <td style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">${c.TenDanhMuc}</td>
        <td style="color: var(--text-secondary); font-size: 0.875rem;">${moTa}</td>
        <td>
          <div class="actions-row" style="justify-content: center;">
            <button class="btn-action btn-action-edit" title="Sửa" onclick="openCategoryEditModal(${c.DanhMucID}, '${c.TenDanhMuc.replace(/'/g, "\\'")}', '${safeDesc}')">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-action btn-action-delete" title="Xóa danh mục" onclick="deleteCategory(${c.DanhMucID}, '${c.TenDanhMuc.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

// OPEN CATEGORY MODAL FOR ADDING NEW
DOM.btnOpenAddCategoryModal.addEventListener('click', () => {
  DOM.categoryModalTitle.textContent = 'Thêm Danh Mục Món Ăn Mới';
  DOM.categoryForm.reset();
  DOM.categoryFormId.value = '';
  DOM.categoryModal.classList.add('open');
  document.body.style.overflow = 'hidden';
});

// OPEN CATEGORY MODAL FOR EDITING
window.openCategoryEditModal = function(id, name, desc) {
  DOM.categoryModalTitle.textContent = `Chỉnh Sửa Danh Mục (Mã #DM${id})`;
  DOM.categoryFormId.value = id;
  DOM.categoryName.value = name;
  DOM.categoryDesc.value = desc || '';
  DOM.categoryModal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

function closeCategoryModal() {
  DOM.categoryModal.classList.remove('open');
  document.body.style.overflow = '';
  DOM.categoryForm.reset();
  DOM.categoryFormId.value = '';
  DOM.categoryDesc.value = '';
}

DOM.categoryModalClose.addEventListener('click', closeCategoryModal);
DOM.btnCancelCategory.addEventListener('click', closeCategoryModal);

// SAVE / UPDATE CATEGORY
DOM.categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = DOM.categoryFormId.value;
  const isEditing = id !== '';
  const name = DOM.categoryName.value.trim();
  
  DOM.btnSaveCategory.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
  DOM.btnSaveCategory.setAttribute('disabled', 'true');
  
  try {
    let url = '/api/danhmuc';
    let method = 'POST';
    
    if (isEditing) {
      url = `/api/danhmuc/${id}`;
      method = 'PUT';
    }
    
    await apiCall(url, {
      method,
      body: { TenDanhMuc: name, MoTa: DOM.categoryDesc.value.trim() || null }
    });
    
    showToast(`${isEditing ? 'Cập nhật' : 'Thêm'} danh mục "${name}" thành công! 🎉`, 'success');
    closeCategoryModal();
    
    // Clear product category cache so it re-fetches
    cache.categories = [];
    loadCategoriesData();
  } catch (err) {
    console.error('Lỗi khi lưu danh mục:', err);
    showToast(err.message || 'Lỗi khi lưu danh mục món ăn!', 'error');
  } finally {
    DOM.btnSaveCategory.textContent = 'Lưu Danh Mục';
    DOM.btnSaveCategory.removeAttribute('disabled');
  }
});

// DELETE CATEGORY
window.deleteCategory = async function(id, name) {
  const yes = confirm(`❓ BẠN CÓ CHẮC CHẮN MUỐN XÓA DANH MỤC:\n"${name}" (Mã #DM${id})?\nThao tác này sẽ thất bại nếu đang có sản phẩm thuộc danh mục này!`);
  if (!yes) return;
  
  try {
    await apiCall(`/api/danhmuc/${id}`, {
      method: 'DELETE'
    });
    
    showToast(`Đã xóa thành công danh mục "${name}"!`, 'success');
    
    // Clear product category cache so it re-fetches
    cache.categories = [];
    loadCategoriesData();
  } catch (err) {
    console.error('Lỗi xóa danh mục:', err);
    showToast(err.message || 'Không thể xóa danh mục này do đang chứa các món ăn!', 'error');
  }
};

// ==================== TAB 5: VOUCHER/PROMOTION LOGIC ====================

async function loadVouchersData() {
  try {
    DOM.vouchersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải khuyến mãi...</td></tr>';
    
    const response = await apiCall('/api/khuyenmai');
    cache.vouchers = response;
    
    renderVouchers();
  } catch (err) {
    console.error('Lỗi tải khuyến mãi:', err);
    showToast('Lỗi khi lấy danh sách mã giảm giá!', 'error');
  }
}

function renderVouchers() {
  DOM.vouchersTableBody.innerHTML = '';
  
  if (cache.vouchers.length === 0) {
    DOM.vouchersTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Chưa có chương trình khuyến mãi nào.</td></tr>';
    return;
  }
  
  cache.vouchers.forEach(v => {
    const isActived = v.TrangThai !== false;
    const badgeClass = isActived ? 'badge-active' : 'badge-inactive';
    const badgeText = isActived ? 'Kích hoạt' : 'Tạm dừng';
    
    const valueText = v.PhanTramGiam > 0 ? `Giảm ${v.PhanTramGiam}%` : `Giảm ${formatPrice(v.SoTienGiam)}`;
    
    DOM.vouchersTableBody.innerHTML += `
      <tr>
        <td style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">${v.MaKhuyenMai}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${v.TenKhuyenMai}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Mã: #${v.KhuyenMaiID}</div>
        </td>
        <td style="font-weight: 700; color: var(--success);">${valueText}</td>
        <td style="font-weight: 500;">${formatPrice(v.DieuKienToiThieu)}</td>
        <td style="font-weight: 600;">Còn ${v.SoLuong} lượt</td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">BĐ: ${formatDateTime(v.NgayBatDau)}</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary);">KT: ${formatDateTime(v.NgayKetThuc)}</div>
        </td>
        <td>
          <span class="badge ${badgeClass}">
            <span class="badge-dot"></span>
            ${badgeText}
          </span>
        </td>
        <td>
          <div class="actions-row">
            <button class="btn-action btn-action-edit" title="Sửa mã" onclick="openVoucherEditModal(${v.KhuyenMaiID})">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-action btn-action-delete" title="Xóa mã" onclick="deleteVoucher(${v.KhuyenMaiID}, '${v.MaKhuyenMai}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

// OPEN VOUCHER MODAL FOR ADDING NEW
DOM.btnOpenAddVoucherModal.addEventListener('click', () => {
  DOM.voucherModalTitle.textContent = 'Tạo Chương Trình Khuyến Mãi Mới';
  DOM.voucherForm.reset();
  DOM.voucherFormId.value = '';
  DOM.voucherStatus.checked = true;
  // Hide qty warning on open
  const hint = document.getElementById('voucher-qty-hint');
  if (hint) hint.style.display = 'none';
  DOM.voucherModal.classList.add('open');
  document.body.style.overflow = 'hidden';
});

// Show/hide "Hết lượt" warning when voucher quantity changes
DOM.voucherQty.addEventListener('input', () => {
  const hint = document.getElementById('voucher-qty-hint');
  if (!hint) return;
  hint.style.display = parseInt(DOM.voucherQty.value) === 0 ? 'block' : 'none';
});

// OPEN VOUCHER MODAL FOR EDITING
window.openVoucherEditModal = async function(id) {
  DOM.voucherModalTitle.textContent = `Chỉnh Sửa Mã Khuyến Mãi (Mã #${id})`;
  DOM.voucherForm.reset();
  
  try {
    const v = await apiCall(`/api/khuyenmai/${id}`);
    
    DOM.voucherFormId.value = v.KhuyenMaiID;
    DOM.voucherCode.value = v.MaKhuyenMai;
    DOM.voucherName.value = v.TenKhuyenMai;
    DOM.voucherPercent.value = v.PhanTramGiam || 0;
    DOM.voucherCash.value = v.SoTienGiam || 0;
    DOM.voucherMinVal.value = v.DieuKienToiThieu || 0;
    DOM.voucherQty.value = v.SoLuong || 0;
    DOM.voucherStatus.checked = v.TrangThai !== false;
    
    // Format datetimes theo múi giờ Việt Nam (Asia/Ho_Chi_Minh) cho HTML datetime-local input
    const formatToVNInputDate = (isoStr) => {
      if (!isoStr) return '';
      const d = new Date(isoStr);
      // Dùng Intl để lấy các phần theo múi giờ VN
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(d);
      const get = (type) => parts.find(p => p.type === type)?.value || '00';
      const hour = get('hour') === '24' ? '00' : get('hour'); // Xử lý midnight edge case
      return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
    };
    
    DOM.voucherStart.value = formatToVNInputDate(v.NgayBatDau);
    DOM.voucherEnd.value = formatToVNInputDate(v.NgayKetThuc);
    
    // Hiển thị cảnh báo "Hết lượt" nếu số lượng đang là 0
    const hint = document.getElementById('voucher-qty-hint');
    if (hint) hint.style.display = (parseInt(v.SoLuong) === 0) ? 'block' : 'none';
    
    DOM.voucherModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
  } catch (err) {
    console.error('Lỗi openVoucherEditModal:', err);
    showToast('Không thể kết nối tải dữ liệu khuyến mãi!', 'error');
  }
};

function closeVoucherModal() {
  DOM.voucherModal.classList.remove('open');
  document.body.style.overflow = '';
  DOM.voucherForm.reset();
  DOM.voucherFormId.value = '';
}

DOM.voucherModalClose.addEventListener('click', closeVoucherModal);
DOM.btnCancelVoucher.addEventListener('click', closeVoucherModal);

// SAVE / UPDATE VOUCHER
DOM.voucherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = DOM.voucherFormId.value;
  const isEditing = id !== '';
  
  const payload = {
    MaKhuyenMai: DOM.voucherCode.value.trim().toUpperCase(),
    TenKhuyenMai: DOM.voucherName.value.trim(),
    PhanTramGiam: parseInt(DOM.voucherPercent.value) || 0,
    SoTienGiam: parseFloat(DOM.voucherCash.value) || 0,
    DieuKienToiThieu: parseFloat(DOM.voucherMinVal.value) || 0,
    SoLuong: parseInt(DOM.voucherQty.value) || 0,
    NgayBatDau: convertVNInputToISO(DOM.voucherStart.value),
    NgayKetThuc: convertVNInputToISO(DOM.voucherEnd.value),
    TrangThai: DOM.voucherStatus.checked
  };
  
  DOM.btnSaveVoucher.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
  DOM.btnSaveVoucher.setAttribute('disabled', 'true');
  
  try {
    let url = '/api/khuyenmai';
    let method = 'POST';
    
    if (isEditing) {
      url = `/api/khuyenmai/${id}`;
      method = 'PUT';
    }
    
    await apiCall(url, {
      method,
      body: payload
    });
    
    showToast(`${isEditing ? 'Cập nhật' : 'Tạo mới'} mã ưu đãi "${payload.MaKhuyenMai}" thành công! 🎟️`, 'success');
    closeVoucherModal();
    loadVouchersData();
  } catch (err) {
    console.error('Lỗi lưu khuyến mãi:', err);
    showToast(err.message || 'Lỗi khi lưu cấu hình khuyến mãi!', 'error');
  } finally {
    DOM.btnSaveVoucher.textContent = isEditing ? 'Lưu Thay Đổi' : 'Tạo Mã Giảm';
    DOM.btnSaveVoucher.removeAttribute('disabled');
  }
});

// DELETE VOUCHER
window.deleteVoucher = async function(id, code) {
  const yes = confirm(`❓ BẠN CÓ CHẮC CHẮN MUỐN XÓA MÃ KHUYẾN MÃI:\n"${code}" (Mã #${id})?\nLưu ý: Nếu mã đã được khách áp dụng trong các hóa đơn cũ, thao tác xóa có thể bị lỗi.`);
  if (!yes) return;
  
  try {
    await apiCall(`/api/khuyenmai/${id}`, {
      method: 'DELETE'
    });
    
    showToast(`Đã xóa thành công mã khuyến mãi "${code}"!`, 'success');
    loadVouchersData();
  } catch (err) {
    console.error('Lỗi xóa voucher:', err);
    showToast(err.message || 'Không thể xóa mã khuyến mãi do ràng buộc lịch sử đơn hàng!', 'error');
  }
};

// ==================== GLOBAL OVERLAYS HANDLERS ====================
// Clicking on modal overlays closes them
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});
