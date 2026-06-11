/**
 * FoodExpress - Core Frontend Engine (Vanilla ES6 JS)
 * Handles state management, API requests, local shopping cart, and premium UX interactions.
 */

// ==================== STATE & GLOBALS ====================
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('fe_cart')) || [];
let appliedCoupon = JSON.parse(localStorage.getItem('fe_coupon')) || null;
let currentUser = JSON.parse(localStorage.getItem('fe_user')) || null;
let currentToken = localStorage.getItem('fe_token') || null;
let currentOrderFilter = 'all';
let userOrders = [];
let favorites = JSON.parse(localStorage.getItem('fe_favorites')) || [];

// dbCart: lưu mapping SanPhamID -> ChiTietGioHangID (chỉ dùng khi đăng nhập)
// Ví dụ: { 5: 12, 8: 15 } => Sản phẩm ID 5 có ChiTietGioHangID là 12
let dbCart = {};

// Search debounce timer
let searchDebounceTimer = null;

// DOM Elements cache
const DOM = {
  // Theme
  themeToggle: document.getElementById('theme-toggle'),

  // Auth
  loginBtn: document.getElementById('login-btn'),
  mobileLoginBtn: document.getElementById('mobile-login-btn'),
  profileDropdown: document.getElementById('profile-dropdown'),
  profileTrigger: document.getElementById('profile-trigger'),
  usernameDisplay: document.getElementById('username-display'),
  logoutBtn: document.getElementById('logout-btn'),

  authModal: document.getElementById('auth-modal'),
  authModalClose: document.getElementById('auth-modal-close'),
  tabLoginBtn: document.getElementById('tab-login-btn'),
  tabRegisterBtn: document.getElementById('tab-register-btn'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),

  // Search
  searchInput: document.getElementById('search-input'),
  searchBtn: document.getElementById('search-btn'),
  mobileSearchInput: document.getElementById('mobile-search-input'),
  mobileSearchBtn: document.getElementById('mobile-search-btn'),
  searchStatusWrapper: document.getElementById('search-status-wrapper'),
  searchStatusText: document.getElementById('search-status-text'),
  clearSearchBtn: document.getElementById('clear-search-btn'),

  // Lists Containers
  promotionsContainer: document.getElementById('promotions-container'),
  categoryTabsContainer: document.getElementById('category-tabs-container'),
  productsContainer: document.getElementById('products-container'),

  // Product Detail Modal
  productModal: document.getElementById('product-modal'),
  productModalClose: document.getElementById('product-modal-close'),
  modalProductImg: document.getElementById('modal-product-img'),
  modalProductCategory: document.getElementById('modal-product-category'),
  modalProductTitle: document.getElementById('modal-product-title'),
  modalProductPrice: document.getElementById('modal-product-price'),
  modalProductDesc: document.getElementById('modal-product-desc'),
  modalProductStockBadge: document.getElementById('modal-product-stock-badge'),
  modalProductStockNum: document.getElementById('modal-product-stock-num'),
  qtyInput: document.getElementById('qty-input'),
  qtyMinusBtn: document.getElementById('qty-minus-btn'),
  qtyPlusBtn: document.getElementById('qty-plus-btn'),
  modalAddToCartBtn: document.getElementById('modal-add-to-cart-btn'),

  // Cart
  cartBtn: document.getElementById('cart-btn'),
  mobileCartBtn: document.getElementById('mobile-cart-btn'),
  cartCountBadge: document.getElementById('cart-count'),
  cartModal: document.getElementById('cart-modal'),
  cartModalClose: document.getElementById('cart-modal-close'),
  cartItemsContainer: document.getElementById('cart-items-container'),
  cartFooter: document.getElementById('cart-footer'),
  couponInput: document.getElementById('coupon-input'),
  applyCouponBtn: document.getElementById('apply-coupon-btn'),
  appliedCouponStatus: document.getElementById('applied-coupon-status'),
  couponTagName: document.getElementById('coupon-tag-name'),
  couponDiscountValue: document.getElementById('coupon-discount-value'),
  removeCouponBtn: document.getElementById('remove-coupon-btn'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  cartDiscountRow: document.getElementById('cart-discount-row'),
  cartDiscount: document.getElementById('cart-discount'),
  cartTotal: document.getElementById('cart-total'),
  checkoutBtn: document.getElementById('checkout-btn'),
  emptyCartExploreBtn: document.getElementById('empty-cart-explore-btn'),

  // Toast notifications
  toastContainer: document.getElementById('toast-container'),
  header: document.querySelector('.main-header'),
  mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
  mobileNavPanel: document.getElementById('mobile-nav-panel'),
  mobileThemeToggle: document.getElementById('mobile-theme-toggle'),

  // Profile Modal
  profileModal: document.getElementById('profile-modal'),
  profileModalClose: document.getElementById('profile-modal-close'),
  profileForm: document.getElementById('profile-form'),
  profileAvatarImg: document.getElementById('profile-avatar-img'),
  profileRoleBadge: document.getElementById('profile-role-badge'),
  profileDisplayName: document.getElementById('profile-display-name'),
  profileDisplayUsername: document.getElementById('profile-display-username'),
  profileFullname: document.getElementById('profile-fullname'),
  profileEmail: document.getElementById('profile-email'),
  profilePhone: document.getElementById('profile-phone'),
  profileAddress: document.getElementById('profile-address'),
  togglePwdFieldsBtn: document.getElementById('toggle-pwd-fields-btn'),
  passwordChangeFields: document.getElementById('password-change-fields'),
  profileNewPassword: document.getElementById('profile-new-password'),
  profileSaveBtn: document.getElementById('profile-save-btn'),

  // Orders Modal
  ordersModal: document.getElementById('orders-modal'),
  ordersModalClose: document.getElementById('orders-modal-close'),
  ordersListContainer: document.getElementById('orders-list-container'),

  // Checkout Confirmation Modal
  checkoutModal: document.getElementById('checkout-modal'),
  checkoutModalClose: document.getElementById('checkout-modal-close'),
  checkoutForm: document.getElementById('checkout-form'),
  checkoutAddress: document.getElementById('checkout-address'),
  checkoutPhone: document.getElementById('checkout-phone'),
  checkoutPayment: document.getElementById('checkout-payment'),
  checkoutNote: document.getElementById('checkout-note'),
  checkoutOrderSummary: document.getElementById('checkout-order-summary'),
  confirmOrderBtn: document.getElementById('confirm-order-btn'),
  paymentMethodsGrid: document.getElementById('payment-methods-grid'),
  panelMomo: document.getElementById('panel-momo'),
  panelBank: document.getElementById('panel-bank'),

  // Order Success Modal
  orderSuccessModal: document.getElementById('order-success-modal'),
  orderSuccessClose: document.getElementById('order-success-close'),
  successOrderId: document.getElementById('success-order-id'),
  successAddress: document.getElementById('success-address'),
  successPhone: document.getElementById('success-phone'),
  successPayment: document.getElementById('success-payment'),
  successTotal: document.getElementById('success-total'),
  successViewOrdersBtn: document.getElementById('success-view-orders-btn'),
  successContinueBtn: document.getElementById('success-continue-btn'),
  successConfettiCanvas: document.getElementById('success-confetti-canvas'),

  // Review Modal
  reviewModal: document.getElementById('review-modal'),
  reviewModalClose: document.getElementById('review-modal-close'),
  reviewItemsContainer: document.getElementById('review-items-container'),
  submitReviewsBtn: document.getElementById('submit-reviews-btn')
};

// State for current review session
let currentReviewOrderId = null;

// ==================== UTILITY FUNCTIONS ====================

// Format price to VND currency
function formatPrice(number) {
  if (typeof number !== 'number') number = parseFloat(number) || 0;
  return number.toLocaleString('vi-VN') + 'đ';
}

/**
 * apiFetch — Wrapper an toàn cho tất cả fetch có token.
 * Tự động xử lý lỗi 401/403 (token hết hạn/không hợp lệ):
 *   - Hiển thị toast thông báo tiếng Việt
 *   - Tự động đăng xuất và yêu cầu đăng nhập lại
 * @param {string} url - Đường dẫn API
 * @param {object} options - fetch options (method, headers, body,...)
 * @returns {Promise<Response>}
 */
async function apiFetch(url, options = {}) {
  // Luôn đọc token mới nhất từ localStorage để đề phòng token được cập nhật
  const token = currentToken || localStorage.getItem('fe_token');
  const defaultHeaders = {};
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === 'object') {
    defaultHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  options.headers = { ...defaultHeaders, ...options.headers };

  const res = await fetch(url, options);

  // Xử lý token hết hạn hoặc không hợp lệ
  if (res.status === 401 || res.status === 403) {
    showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', 'error');
    // Tự động đăng xuất
    currentUser = null;
    currentToken = null;
    dbCart = {};
    favorites = [];
    localStorage.removeItem('fe_user');
    localStorage.removeItem('fe_token');
    localStorage.removeItem('fe_coupon');
    localStorage.removeItem('fe_favorites');
    updateUserUI();
    calculateCartSummary();
    // Đóng mọi modal đang mở
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
    // Mở modal đăng nhập
    setTimeout(() => {
      if (DOM.authModal) DOM.authModal.classList.add('open');
    }, 400);
    throw new Error('TOKEN_EXPIRED');
  }

  return res;
}

// Show premium custom toast notifications
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

  // Slide out and remove toast after 3.5s
  setTimeout(() => {
    toast.style.animation = 'slide-in-toast 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

// ==================== INITIALIZATION & THEME ====================

// ==================== ORDER SUCCESS MODAL ====================

// Lưu ID đơn hàng vừa đặt để dùng cho nút "Xem Đơn Hàng"
let lastPlacedOrderId = null;

/**
 * Hiển thị modal đặt hàng thành công với confetti
 */
function showOrderSuccess({ hoaDonId, address, phone, payment, totalAmount }) {
  // Lưu lại ID đơn hàng để nút Xem Đơn Hàng có thể điều hướng đến trang theo dõi
  lastPlacedOrderId = hoaDonId || null;

  // Điền thông tin vào modal
  DOM.successOrderId.textContent = `HD${hoaDonId || '--'}`;
  DOM.successAddress.textContent = address || '--';
  DOM.successPhone.textContent = phone || '--';
  DOM.successPayment.textContent = payment || 'Tiền mặt';
  DOM.successTotal.textContent = formatPrice(totalAmount || 0);

  // Reset animations bằng cách clone lại SVG
  const svg = DOM.orderSuccessModal.querySelector('.checkmark-svg');
  if (svg) {
    const parent = svg.parentNode;
    const clone = svg.cloneNode(true);
    parent.removeChild(svg);
    parent.appendChild(clone);
  }

  // Mở modal
  DOM.orderSuccessModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Bắt đầu confetti sau 300ms
  setTimeout(() => launchConfetti(), 300);
}

/**
 * Confetti animation thuần JS
 */
function launchConfetti() {
  const canvas = DOM.successConfettiCanvas;
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

// Đóng success modal
function closeOrderSuccessModal() {
  DOM.orderSuccessModal.classList.remove('open');
  document.body.style.overflow = '';
}

DOM.orderSuccessClose.addEventListener('click', closeOrderSuccessModal);
DOM.orderSuccessModal.addEventListener('click', (e) => {
  if (e.target === DOM.orderSuccessModal) closeOrderSuccessModal();
});
DOM.successContinueBtn.addEventListener('click', () => {
  closeOrderSuccessModal();
  window.scrollTo({ top: document.getElementById('menu-section').offsetTop - 100, behavior: 'smooth' });
});
DOM.successViewOrdersBtn.addEventListener('click', () => {
  closeOrderSuccessModal();
  // Nếu đã có ID đơn hàng vừa đặt → chuyển đến trang theo dõi đơn hàng trực tiếp
  if (lastPlacedOrderId) {
    window.location.href = `track-order.html?id=${lastPlacedOrderId}`;
  } else if (currentUser) {
    // Fallback: mở modal lịch sử đơn hàng
    fetchUserOrders();
    DOM.ordersModal.classList.add('open');
  } else {
    DOM.authModal.classList.add('open');
  }
});


document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

function initApp() {
  // 1. Check saved Dark Mode preference
  if (localStorage.getItem('fe_dark_mode') === 'true') {
    document.body.classList.add('dark-mode');
    DOM.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    DOM.themeToggle.title = "Chuyển chế độ sáng";
  }

  // 2. Load auth status
  updateUserUI();
  if (currentUser && currentToken) {
    syncFavoritesFromDB();
    syncCartFromDB();
  }

  // 3. Render cart badge and items
  updateCartBadge();

  // 4. Fetch dynamic content from backend REST APIs
  fetchCategories();
  fetchPromotions();
  fetchProducts();

  // 5. Check if returning from delivery map page
  checkDeliveryMapReturn();

  // 6. Check for URL action params (like checkout or search)
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  if (action === 'checkout' && currentUser) {
    setTimeout(() => {
      DOM.checkoutBtn.click();
    }, 500);
  }
  const searchQuery = urlParams.get('search');
  if (searchQuery) {
    DOM.searchInput.value = searchQuery;
    searchProducts(searchQuery);
  }
}

// Theme Toggle Action
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('fe_dark_mode', isDark);

  if (isDark) {
    DOM.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    DOM.themeToggle.title = "Chuyển chế độ sáng";
    showToast("Đã kích hoạt Chế độ tối! 🌙", "info");
  } else {
    DOM.themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    DOM.themeToggle.title = "Chuyển chế độ tối";
    showToast("Đã kích hoạt Chế độ sáng! ☀️", "info");
  }
}

// Scroll header visual shrink
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    DOM.header.classList.add('scrolled');
  } else {
    DOM.header.classList.remove('scrolled');
  }
});

// Handle return from back-forward cache (bfcache)
window.addEventListener('pageshow', (event) => {
  checkDeliveryMapReturn();
});

// ==================== API FETCHING MODULES ====================

// Fetch categories and render Tabs
async function fetchCategories(retryCount = 0) {
  try {
    // Gọi API danh mục (không cần token, đây là public endpoint)
    const res = await fetch('/api/danhmuc');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP ${res.status}`);
    }
    const categories = await res.json();

    if (!Array.isArray(categories)) {
      throw new Error('Dữ liệu danh mục không hợp lệ');
    }

    // Clear default options, keep "All" tab
    DOM.categoryTabsContainer.innerHTML = `
      <button class="category-tab ${currentCategory === 'all' ? 'active' : ''}" data-category-id="all">
        <span class="tab-icon"><i class="fa-solid fa-border-all"></i></span>
        <span>Tất Cả Món</span>
      </button>
    `;

    // Assign typical food icons based on category name
    const getCategoryIcon = (name) => {
      name = (name || '').toLowerCase();
      if (name.includes('nhanh') || name.includes('burger')) return 'fa-hamburger';
      if (name.includes('nước') || name.includes('uống') || name.includes('giải khát')) return 'fa-coffee';
      if (name.includes('bánh') || name.includes('ngọt')) return 'fa-cookie';
      if (name.includes('lẩu') || name.includes('mì') || name.includes('bún')) return 'fa-bowl-rice';
      if (name.includes('hải sản') || name.includes('cá')) return 'fa-fish';
      return 'fa-utensils';
    };

    categories.forEach(cat => {
      if (!cat || !cat.DanhMucID) return;
      const activeClass = currentCategory == cat.DanhMucID ? 'active' : '';
      const icon = getCategoryIcon(cat.TenDanhMuc);

      DOM.categoryTabsContainer.innerHTML += `
        <button class="category-tab ${activeClass}" data-category-id="${cat.DanhMucID}">
          <span class="tab-icon"><i class="fa-solid ${icon}"></i></span>
          <span>${cat.TenDanhMuc || 'Danh mục'}</span>
        </button>
      `;
    });

    // Re-attach click listeners to dynamically created category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const catId = btn.getAttribute('data-category-id');

        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        currentCategory = catId;

        // Clear search input if switching category
        DOM.searchInput.value = '';
        DOM.searchStatusWrapper.style.display = 'none';

        if (catId === 'all') {
          fetchProducts();
        } else {
          fetchProducts(catId);
        }
      });
    });

  } catch (err) {
    console.error('Lỗi fetchCategories:', err);
    // Retry tối đa 2 lần sau 2 giây nếu là lỗi mạng
    if (retryCount < 2) {
      console.warn(`Thử lại tải danh mục lần ${retryCount + 1}...`);
      setTimeout(() => fetchCategories(retryCount + 1), 2000);
    } else {
      showToast('Không thể tải danh mục món ăn. Vui lòng làm mới trang!', 'error');
    }
  }
}

// Fetch promotions and render
async function fetchPromotions() {
  try {
    const res = await fetch('/api/khuyenmai');
    if (!res.ok) throw new Error('Cannot fetch promotions');
    const promotions = await res.json();

    const now = new Date();
    // Lọc bỏ các mã giảm giá đã hết hạn
    const activePromotions = promotions.filter(p => {
      const end = new Date(p.NgayKetThuc);
      return now <= end;
    });

    if (activePromotions.length === 0) {
      DOM.promotionsContainer.innerHTML = `
        <div class="empty-cart-view" style="grid-column: 1/-1; padding: 20px;">
          <i class="fa-solid fa-gift" style="font-size: 38px; color: #cbd5e1; margin-bottom: 10px;"></i>
          <p>Hiện không có chương trình khuyến mãi nào.</p>
        </div>
      `;
      return;
    }

    DOM.promotionsContainer.innerHTML = '';

    activePromotions.forEach(p => {
      const start = new Date(p.NgayBatDau);
      const end = new Date(p.NgayKetThuc);

      const isSuspended = !p.TrangThai; // handles false/0/null
      const isExpired = now > end;
      const isNotStarted = now < start;
      const isOutOfStock = p.SoLuong <= 0;

      const isDisabled = isSuspended || isExpired || isNotStarted || isOutOfStock;

      let statusText = p.MaKhuyenMai;
      let btnClass = 'promo-code-btn';
      let btnAttr = `onclick="copyVoucher(event, '${p.MaKhuyenMai}')"`;
      let btnStyle = '';

      if (isDisabled) {
        btnClass += ' disabled';
        btnAttr = 'disabled';
        btnStyle = 'cursor: not-allowed; border-color: var(--text-muted); color: var(--text-muted); background: var(--bg-body); pointer-events: none;';
        if (isSuspended) {
          statusText = 'Tạm ngưng';
        } else if (isExpired) {
          statusText = 'Hết hạn';
        } else if (isOutOfStock) {
          statusText = 'Hết lượt';
        } else if (isNotStarted) {
          statusText = 'Chưa bắt đầu';
        }
      }

      let stampHTML = '';
      if (isDisabled) {
        let stampClass = '';
        let stampText = '';
        if (isSuspended) {
          stampClass = 'stamp-suspended';
          stampText = 'Tạm Ngưng';
        } else if (isExpired) {
          stampClass = 'stamp-expired';
          stampText = 'Hết Hạn';
        } else if (isOutOfStock) {
          stampClass = 'stamp-outofstock';
          stampText = 'Hết Lượt';
        } else if (isNotStarted) {
          stampClass = 'stamp-notstarted';
          stampText = 'Sắp Diễn Ra';
        }
        stampHTML = `<div class="promo-stamp ${stampClass}">${stampText}</div>`;
      }

      const discountText = p.PhanTramGiam > 0 ? `${p.PhanTramGiam}%` : formatPrice(p.SoTienGiam);
      const icon = p.PhanTramGiam > 0 ? 'fa-percent' : 'fa-hand-holding-dollar';
      const condText = p.DieuKienToiThieu > 0 ? `Đơn tối thiểu ${formatPrice(p.DieuKienToiThieu)}` : 'Không giới hạn';

      DOM.promotionsContainer.innerHTML += `
        <div class="promotion-card ${isDisabled ? 'disabled' : ''}" data-code="${p.MaKhuyenMai}">
          <div class="promo-left">
            <i class="fa-solid ${icon}"></i>
            <span class="promo-percent">${p.PhanTramGiam > 0 ? p.PhanTramGiam + '%' : 'GIẢM'}</span>
            <span class="promo-percent-label">${p.PhanTramGiam > 0 ? 'Tối đa' : discountText}</span>
          </div>
          <div class="promo-divider-line"></div>
          <div class="promo-right">
            <div>
              <h3 class="promo-title">${p.TenKhuyenMai}</h3>
              <p class="promo-desc">${condText}. Hạn sử dụng: ${new Date(p.NgayKetThuc).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
            <div class="promo-footer">
              <span class="promo-limit"><i class="fa-solid fa-database"></i> Còn ${p.SoLuong || 0} lượt</span>
              ${isDisabled ? '' : `
              <button class="${btnClass}" ${btnAttr} style="${btnStyle}">
                <i class="fa-solid fa-copy"></i> ${statusText}
              </button>
              `}
            </div>
          </div>
          ${stampHTML}
        </div>
      `;
    });

  } catch (err) {
    console.error('Lỗi fetchPromotions:', err);
    DOM.promotionsContainer.innerHTML = `
      <div class="empty-cart-view" style="grid-column: 1/-1; padding: 20px; color: var(--danger)">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 38px; margin-bottom: 10px;"></i>
        <p>Lỗi khi kết nối API khuyến mãi. Vui lòng kiểm tra database!</p>
      </div>
    `;
  }
}

// Copy voucher helper
window.copyVoucher = function (e, code) {
  e.stopPropagation(); // Avoid card click handler
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Đã sao chép mã "${code}" thành công! 🎉`, "success");

    // Automatically pre-fill the coupon code input if the cart is open
    DOM.couponInput.value = code;
  }).catch(() => {
    showToast(`Không thể sao chép tự động. Mã là: ${code}`, "warning");
  });
};

// Fetch products (All or by Category)
async function fetchProducts(categoryId = null) {
  try {
    // Show skeletons
    DOM.productsContainer.innerHTML = Array(6).fill('<div class="skeleton-card product-skeleton"></div>').join('');

    let url = '/api/sanpham';
    if (categoryId) {
      url = `/api/sanpham/danhmuc/${categoryId}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Cannot fetch products');
    const responseData = await res.json();

    // Handle the dual schema returned by getAllProducts (could be object with .data or raw array)
    const products = Array.isArray(responseData) ? responseData : responseData.data;

    renderProductsList(products);

  } catch (err) {
    console.error('Lỗi fetchProducts:', err);
    DOM.productsContainer.innerHTML = `
      <div class="empty-cart-view" style="grid-column: 1/-1; padding: 40px; color: var(--danger)">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; margin-bottom: 10px;"></i>
        <p>Lỗi kết nối máy chủ API Sản phẩm.</p>
        <button onclick="fetchProducts(${categoryId})" class="btn btn-outline btn-sm m-t-20">Thử lại</button>
      </div>
    `;
  }
}

// Render dynamic products list
function renderProductsList(products) {
  if (!products || products.length === 0) {
    DOM.productsContainer.innerHTML = `
      <div class="empty-cart-view" style="grid-column: 1/-1; padding: 60px;">
        <i class="fa-solid fa-face-frown" style="font-size: 54px; color: #cbd5e1; margin-bottom: 20px;"></i>
        <p>Không tìm thấy món ăn nào phù hợp với yêu cầu của bạn!</p>
      </div>
    `;
    return;
  }

  DOM.productsContainer.innerHTML = '';

  products.forEach(p => {
    const isOutOfStock = p.SoLuongTon <= 0;
    const isSuspended = p.TrangThai === false || p.TrangThai === 0;

    let stockClass = 'tag-instock';
    let stockText = `Còn ${p.SoLuongTon} suất`;
    if (isSuspended) {
      stockClass = 'tag-outstock';
      stockText = 'Tạm ngưng';
    } else if (isOutOfStock) {
      stockClass = 'tag-outstock';
      stockText = 'Hết hàng';
    }

    const imgUrl = p.HinhAnh && p.HinhAnh.startsWith('http')
      ? p.HinhAnh
      : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';

    const isFav = favorites.some(fav => fav.SanPhamID === p.SanPhamID);

    const pCard = document.createElement('div');
    pCard.className = `product-card ${isOutOfStock || isSuspended ? 'out-of-stock' : ''}`;
    pCard.setAttribute('data-id', p.SanPhamID);

    // Build star rating HTML
    const avg = parseFloat(p.TrungBinhSao) || 0;
    const count = parseInt(p.TongDanhGia) || 0;
    let starsHtml = '';
    if (count > 0) {
      const starIcons = Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(avg)) return '<i class="fa-solid fa-star"></i>';
        if (i < avg) return '<i class="fa-solid fa-star-half-stroke"></i>';
        return '<i class="fa-regular fa-star"></i>';
      }).join('');
      starsHtml = `<div class="product-stars-inline">${starIcons}<span class="rating-count">(${count} đánh giá)</span></div>`;
    }

    pCard.innerHTML = `
      <div class="product-img-wrapper">
        <span class="product-cat-tag">${p.TenDanhMuc || 'Món Ăn'}</span>
        <span class="product-stock-tag ${stockClass}">${stockText}</span>
        <button class="favorite-toggle-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, ${p.SanPhamID}, ${JSON.stringify(p).replace(/"/g, '&quot;')})">
          <i class="fa-solid fa-heart"></i>
        </button>
        <img src="${imgUrl}" alt="${p.TenSanPham}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';">
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.TenSanPham}</h3>
        ${starsHtml}
        <p class="product-desc">${p.MoTa || 'Món ăn ngon đậm đà bản sắc, cung cấp đầy đủ chất dinh dưỡng và năng lượng cần thiết cho ngày dài năng động.'}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(p.Gia)}</span>
          <button class="btn-add-cart-simple" title="${isSuspended ? 'Món ăn tạm ngưng bán' : 'Thêm vào giỏ'}" ${isOutOfStock || isSuspended ? 'disabled' : ''} onclick="quickAddToCart(event, ${p.SanPhamID}, '${p.TenSanPham.replace(/'/g, "\\'")}', ${p.Gia}, '${imgUrl}', ${p.SoLuongTon}, ${isSuspended})">
            <i class="fa-solid fa-cart-plus"></i>
          </button>
        </div>
      </div>
    `;

    pCard.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-add-cart-simple') && !e.target.closest('.favorite-toggle-btn')) {
        openProductModal(p.SanPhamID);
      }
    });

    DOM.productsContainer.appendChild(pCard);
  });
}

// Perform REST-API based Search with debounce
function searchProducts(keyword) {
  if (!keyword || keyword.trim() === '') {
    DOM.searchStatusWrapper.style.display = 'none';
    fetchProducts(currentCategory === 'all' ? null : currentCategory);
    return;
  }

  // Active search feedback
  DOM.searchStatusText.innerHTML = `Đang tìm món ngon chứa: "<strong>${keyword.trim()}</strong>"`;
  DOM.searchStatusWrapper.style.display = 'flex';

  DOM.productsContainer.innerHTML = Array(3).fill('<div class="skeleton-card product-skeleton"></div>').join('');

  fetch(`/api/sanpham/timkiem?q=${encodeURIComponent(keyword.trim())}`)
    .then(res => {
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    })
    .then(products => {
      renderProductsList(products);
      DOM.searchStatusText.innerHTML = `Tìm thấy <strong>${products.length}</strong> kết quả cho: "<strong>${keyword.trim()}</strong>"`;
    })
    .catch(err => {
      console.error('Lỗi tìm kiếm:', err);
      DOM.productsContainer.innerHTML = `
        <div class="empty-cart-view" style="grid-column: 1/-1; padding: 40px; color: var(--danger)">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; margin-bottom: 10px;"></i>
          <p>Có lỗi xảy ra khi thực hiện tìm kiếm món ăn!</p>
        </div>
      `;
    });
}

// ==================== PRODUCT DETAILS MODAL ====================
let modalActiveProduct = null;

async function openProductModal(productId) {
  try {
    const res = await fetch(`/api/sanpham/${productId}`);
    if (!res.ok) throw new Error('Cannot fetch product details');
    const product = await res.json();

    modalActiveProduct = product;

    // Fill dynamic details
    const imgUrl = product.HinhAnh && product.HinhAnh.startsWith('http')
      ? product.HinhAnh
      : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';

    DOM.modalProductImg.src = imgUrl;
    DOM.modalProductImg.onerror = () => { DOM.modalProductImg.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'; };
    DOM.modalProductCategory.textContent = product.TenDanhMuc || 'Thực Phẩm';
    DOM.modalProductTitle.textContent = product.TenSanPham;

    // RENDER STARS IN MODAL TITLE
    const starsWrapper = document.getElementById('modal-product-stars-wrapper');
    if (starsWrapper) {
      const avg = parseFloat(product.TrungBinhSao) || 0;
      const count = parseInt(product.TongDanhGia) || 0;
      if (count > 0) {
        const starIcons = Array.from({ length: 5 }, (_, i) => {
          if (i < Math.floor(avg)) return '<i class="fa-solid fa-star"></i>';
          if (i < avg) return '<i class="fa-solid fa-star-half-stroke"></i>';
          return '<i class="fa-regular fa-star"></i>';
        }).join('');
        starsWrapper.innerHTML = `<div class="product-stars-inline" style="margin: 0;">${starIcons}<span class="rating-count" style="margin-left: 5px;">${avg.toFixed(1)}/5.0 (${count} đánh giá)</span></div>`;
      } else {
        starsWrapper.innerHTML = `<span style="font-size: 12px; color: var(--text-muted);"><i class="fa-regular fa-star"></i> Chưa có đánh giá</span>`;
      }
    }

    DOM.modalProductPrice.textContent = formatPrice(product.Gia);
    DOM.modalProductDesc.textContent = product.MoTa || 'Món ăn ngon, chuẩn sạch vệ sinh chế biến và phục vụ nóng sốt trực tiếp.';

    // Stock configuration
    const isOutOfStock = product.SoLuongTon <= 0;
    const isSuspended = product.TrangThai === false || product.TrangThai === 0;

    if (isSuspended) {
      DOM.modalProductStockBadge.textContent = 'Tạm Ngưng Bán';
      DOM.modalProductStockBadge.className = 'stock-badge out-of-stock';
      DOM.modalProductStockNum.textContent = 'Món ăn này đang tạm ngưng phục vụ. Vui lòng chọn món khác.';
    } else if (isOutOfStock) {
      DOM.modalProductStockBadge.textContent = 'Tạm Hết Hàng';
      DOM.modalProductStockBadge.className = 'stock-badge out-of-stock';
      DOM.modalProductStockNum.textContent = 'Quý khách vui lòng chọn món khác';
    } else {
      DOM.modalProductStockBadge.textContent = 'Đang Bán';
      DOM.modalProductStockBadge.className = 'stock-badge';
      DOM.modalProductStockNum.textContent = `Còn lại: ${product.SoLuongTon} phần trong kho`;
    }

    // Reset quantity selection
    DOM.qtyInput.value = 1;
    DOM.qtyInput.setAttribute('max', product.SoLuongTon);

    if (isOutOfStock || isSuspended) {
      DOM.modalAddToCartBtn.setAttribute('disabled', 'true');
      DOM.modalAddToCartBtn.innerHTML = isSuspended ? '<i class="fa-solid fa-ban"></i> Tạm ngưng bán' : '<i class="fa-solid fa-ban"></i> Tạm hết hàng';
      DOM.qtyInput.setAttribute('disabled', 'true');
      DOM.qtyMinusBtn.setAttribute('disabled', 'true');
      DOM.qtyPlusBtn.setAttribute('disabled', 'true');
    } else {
      DOM.modalAddToCartBtn.removeAttribute('disabled');
      DOM.modalAddToCartBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Thêm Vào Giỏ Hàng';
      DOM.qtyInput.removeAttribute('disabled');
      DOM.qtyMinusBtn.removeAttribute('disabled');
      DOM.qtyPlusBtn.removeAttribute('disabled');
    }

    // Open modal overlay
    DOM.productModal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Stop scroll bleed

    // Fetch and render reviews list
    const reviewsContainer = document.getElementById('modal-product-reviews-container');
    const reviewsCountSpan = document.getElementById('modal-product-reviews-count');

    if (reviewsContainer && reviewsCountSpan) {
      reviewsContainer.innerHTML = `<div style="text-align: center; padding: 10px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải đánh giá...</div>`;
      reviewsCountSpan.textContent = '0';

      try {
        const reviewsRes = await fetch(`/api/danhgia/sanpham/${productId}`);
        if (reviewsRes.ok) {
          const reviews = await reviewsRes.json();
          reviewsCountSpan.textContent = reviews.length;

          if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
              <div style="text-align: center; padding: 20px 10px; color: var(--text-muted); font-size: 13px;">
                <i class="fa-regular fa-message" style="font-size: 24px; margin-bottom: 8px; display: block; opacity: 0.5; margin-left: auto; margin-right: auto;"></i>
                Món ăn này chưa có đánh giá nào. Hãy là người đầu tiên thưởng thức và chia sẻ cảm nhận nhé!
              </div>
            `;
          } else {
            reviewsContainer.innerHTML = '';
            reviews.forEach(rev => {
              const revDate = new Date(rev.NgayTao).toLocaleDateString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });

              const starIcons = Array.from({ length: 5 }, (_, i) => {
                if (i < rev.SoSao) return '<i class="fa-solid fa-star"></i>';
                return '<i class="fa-regular fa-star"></i>';
              }).join('');

              const commentText = rev.BinhLuan || 'Khách hàng không để lại bình luận.';

              reviewsContainer.innerHTML += `
                <div class="user-review-row">
                  <div class="user-review-header">
                    <span>${rev.TenKhachHang || 'Khách hàng'}</span>
                    <span class="user-review-date">${revDate}</span>
                  </div>
                  <div class="user-review-stars" style="margin-bottom: 4px;">
                    ${starIcons}
                  </div>
                  <div class="user-review-comment">
                    ${commentText}
                  </div>
                </div>
              `;
            });
          }
        } else {
          reviewsContainer.innerHTML = `<div style="text-align: center; padding: 10px; color: var(--danger); font-size: 13px;">Không thể tải danh sách đánh giá.</div>`;
        }
      } catch (revErr) {
        console.error('Error fetching reviews:', revErr);
        reviewsContainer.innerHTML = `<div style="text-align: center; padding: 10px; color: var(--danger); font-size: 13px;">Lỗi kết nối khi tải đánh giá.</div>`;
      }
    }

  } catch (err) {
    console.error('Lỗi openProductModal:', err);
    showToast('Không thể tải chi tiết sản phẩm!', 'error');
  }
}

function closeProductModal() {
  DOM.productModal.classList.remove('open');
  document.body.style.overflow = '';
  modalActiveProduct = null;
}

// Adjust Quantity Buttons inside Modal
DOM.qtyMinusBtn.addEventListener('click', () => {
  let val = parseInt(DOM.qtyInput.value) || 1;
  if (val > 1) DOM.qtyInput.value = val - 1;
});

DOM.qtyPlusBtn.addEventListener('click', () => {
  let val = parseInt(DOM.qtyInput.value) || 1;
  const max = parseInt(DOM.qtyInput.getAttribute('max')) || 99;
  if (val < max) DOM.qtyInput.value = val + 1;
});

DOM.qtyInput.addEventListener('change', () => {
  let val = parseInt(DOM.qtyInput.value) || 1;
  const max = parseInt(DOM.qtyInput.getAttribute('max')) || 99;
  if (val < 1) DOM.qtyInput.value = 1;
  if (val > max) {
    DOM.qtyInput.value = max;
    showToast(`Chỉ còn ${max} phần trong kho!`, 'warning');
  }
});

// ==================== GIỎ HÀNG ẢO (VIRTUAL LOCAL CART) ====================

// Simple check-out or product details modal Add To Cart
DOM.modalAddToCartBtn.addEventListener('click', () => {
  if (!modalActiveProduct) return;
  const qty = parseInt(DOM.qtyInput.value) || 1;

  const imgUrl = modalActiveProduct.HinhAnh && modalActiveProduct.HinhAnh.startsWith('http')
    ? modalActiveProduct.HinhAnh
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';

  addToCart(modalActiveProduct.SanPhamID, modalActiveProduct.TenSanPham, modalActiveProduct.Gia, imgUrl, modalActiveProduct.SoLuongTon, qty);
  closeProductModal();
});

// Quick Add to Cart from cards list
window.quickAddToCart = function (e, id, name, price, img, maxStock, isSuspended) {
  e.stopPropagation(); // Stop card click trigger
  if (isSuspended) {
    showToast(`Món ăn "${name}" đang tạm ngưng bán!`, 'error');
    return;
  }
  if (maxStock <= 0) {
    showToast('Món ăn đã hết hàng!', 'error');
    return;
  }
  addToCart(id, name, price, img, maxStock, 1);
};

// Toggle Favorite logic
window.toggleFavorite = async function (e, id, productObj) {
  e.stopPropagation();
  const existingIdx = favorites.findIndex(fav => fav.SanPhamID === id);
  const btn = e.currentTarget;

  if (existingIdx > -1) {
    favorites.splice(existingIdx, 1);
    btn.classList.remove('active');
    showToast(`Đã bỏ thích món "${productObj.TenSanPham}" 💔`, 'info');

    if (currentUser && currentToken) {
      try {
        await fetch(`/api/yeuthich/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
      } catch (err) {
        console.warn('Lỗi xóa yêu thích khỏi DB:', err);
      }
    }
  } else {
    favorites.push(productObj);
    btn.classList.add('active');
    showToast(`Đã thêm "${productObj.TenSanPham}" vào yêu thích! 💖`, 'success');

    if (currentUser && currentToken) {
      try {
        await fetch('/api/yeuthich', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ SanPhamID: id })
        });
      } catch (err) {
        console.warn('Lỗi thêm yêu thích vào DB:', err);
      }
    }
  }

  localStorage.setItem('fe_favorites', JSON.stringify(favorites));
};

// Add to Cart Core Engine (Hybrid: localStorage + DB sync khi đăng nhập)
async function addToCart(id, name, price, image, stock, qty = 1) {
  const existingItemIndex = cart.findIndex(item => item.id === id);

  if (existingItemIndex > -1) {
    const newQty = cart[existingItemIndex].qty + qty;
    if (newQty > stock) {
      showToast(`Không đủ số lượng trong kho! Đang có ${cart[existingItemIndex].qty} phần, tối đa ${stock} phần.`, 'warning');
      return;
    }
    cart[existingItemIndex].qty = newQty;
  } else {
    if (qty > stock) {
      showToast(`Món này chỉ còn ${stock} phần thôi!`, 'warning');
      return;
    }
    cart.push({ id, name, price: parseFloat(price), image, stock: parseInt(stock), qty });
  }

  // Luôn lưu localStorage
  localStorage.setItem('fe_cart', JSON.stringify(cart));
  updateCartBadge();

  // Nếu đã đăng nhập: đồng bộ vào DB ngay lập tức
  if (currentUser && currentToken) {
    try {
      const res = await fetch('/api/giohang/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
        body: JSON.stringify({ NguoiDungID: currentUser.NguoiDungID, SanPhamID: id, SoLuong: qty })
      });
      if (res.ok) {
        const data = await res.json();
        // Cập nhật mapping dbCart
        if (data.data && data.data.ChiTietGioHangID) {
          dbCart[id] = data.data.ChiTietGioHangID;
        }
        showToast(`Đã thêm ${qty} phần ${name} vào giỏ! 🛒`, 'success');
      } else {
        showToast(`Đã thêm ${qty} phần ${name} vào giỏ! 🛒`, 'success');
      }
    } catch {
      showToast(`Đã thêm ${qty} phần ${name} vào giỏ! 🛒`, 'success');
    }
  } else {
    showToast(`Đã thêm ${qty} phần ${name} vào giỏ! 🛒`, 'success');
  }
}

// Update Header Cart Badge count
function updateCartBadge() {
  const totalItemsCount = cart.reduce((total, item) => total + item.qty, 0);
  DOM.cartCountBadge.textContent = totalItemsCount;

  if (totalItemsCount > 0) {
    DOM.cartCountBadge.style.display = 'flex';
  } else {
    DOM.cartCountBadge.style.display = 'none';
  }
}

// Toggle Cart Slider Overlay
DOM.cartBtn.addEventListener('click', () => {
  renderCart();
  DOM.cartModal.classList.add('open');
});

DOM.cartModalClose.addEventListener('click', () => {
  DOM.cartModal.classList.remove('open');
});

DOM.emptyCartExploreBtn.addEventListener('click', () => {
  DOM.cartModal.classList.remove('open');
});

// Render list of cart drawer items
function renderCart() {
  if (cart.length === 0) {
    DOM.cartItemsContainer.innerHTML = `
      <div class="empty-cart-view">
        <i class="fa-solid fa-basket-shopping empty-icon"></i>
        <p>Giỏ hàng của bạn đang trống!</p>
        <button onclick="DOM.cartModal.classList.remove('open');" class="btn btn-primary btn-sm">Mua sắm ngay</button>
      </div>
    `;
    DOM.cartFooter.style.display = 'none';
    return;
  }

  DOM.cartFooter.style.display = 'block';
  DOM.cartItemsContainer.innerHTML = '';

  cart.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = `cart-item${item.suspended ? ' cart-item-suspended' : ''}`;
    itemCard.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img${item.suspended ? ' cart-img-suspended' : ''}">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        ${item.suspended ? '<span class="cart-suspended-badge"><i class="fa-solid fa-ban"></i> Tạm ngưng bán</span>' : ''}
        <span class="cart-item-price">${formatPrice(item.price)}</span>
      </div>
      <div class="cart-item-actions">
        <span class="btn-delete-cart-item" onclick="deleteCartItem(${item.id})"><i class="fa-regular fa-trash-can"></i> Xóa</span>
        <div class="cart-qty-selector">
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, -1)" ${item.suspended ? 'disabled' : ''}><i class="fa-solid fa-minus"></i></button>
          <input type="number" value="${item.qty}" readonly>
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, 1)" ${item.suspended ? 'disabled' : ''}><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    `;
    DOM.cartItemsContainer.appendChild(itemCard);
  });

  // Calculate pricing
  calculateCartSummary();
}

// Delete Item from Cart (Hybrid: xóa localStorage + DB sync khi đăng nhập)
window.deleteCartItem = async function (id) {
  const item = cart.find(i => i.id === id);
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem('fe_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
  if (item) showToast(`Đã xóa ${item.name} khỏi giỏ.`, 'info');

  // Nếu đã đăng nhập: xóa khỏi DB ngay
  if (currentUser && currentToken) {
    const chiTietId = dbCart[id];
    if (chiTietId) {
      try {
        await fetch(`/api/giohang/item/${chiTietId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        delete dbCart[id];
      } catch (err) {
        console.warn('Không thể xóa khỏi DB:', err);
      }
    } else {
      // Fallback: tìm ChiTietGioHangID qua API
      try {
        const res = await fetch(`/api/giohang/${currentUser.NguoiDungID}`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const found = (data.data?.ChiTiet || []).find(i => i.SanPhamID === id);
          if (found) {
            await fetch(`/api/giohang/item/${found.ChiTietGioHangID}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${currentToken}` }
            });
          }
        }
      } catch (err) {
        console.warn('Fallback xóa giỏ hàng DB thất bại:', err);
      }
    }
  }
};

// Update Item Quantity inside Drawer (Hybrid: cập nhật localStorage + DB sync)
window.updateCartItemQty = async function (id, direction) {
  const itemIndex = cart.findIndex(item => item.id === id);
  if (itemIndex === -1) return;

  const currentItem = cart[itemIndex];
  const newQty = currentItem.qty + direction;

  if (newQty <= 0) {
    deleteCartItem(id);
    return;
  }
  if (newQty > currentItem.stock) {
    showToast(`Xin lỗi, chỉ còn ${currentItem.stock} phần trong kho!`, 'warning');
    return;
  }

  currentItem.qty = newQty;
  localStorage.setItem('fe_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();

  // Nếu đã đăng nhập: cập nhật số lượng trong DB ngay
  if (currentUser && currentToken) {
    try {
      await fetch('/api/giohang/capnhat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
        body: JSON.stringify({
          NguoiDungID: currentUser.NguoiDungID,
          SanPhamID: id,
          SoLuong: newQty
        })
      });
    } catch (err) {
      console.warn('Không thể cập nhật số lượng trong DB:', err);
    }
  }
};

// ==================== DB CART SYNC ====================

/**
 * Tải giỏ hàng từ DB khi user đăng nhập.
 * Merge với localStorage: ưu tiên dữ liệu DB nếu user đã có items trong DB.
 * Nếu DB trống mà localStorage có items → push lên DB.
 */
async function syncCartFromDB() {
  if (!currentUser || !currentToken) return;

  try {
    const res = await fetch(`/api/giohang/${currentUser.NguoiDungID}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    const dbItems = (data.data && data.data.ChiTiet) || [];

    if (dbItems.length > 0) {
      // DB có items → dùng DB làm nguồn sự thật
      dbCart = {};
      cart = dbItems.map(item => {
        dbCart[item.SanPhamID] = item.ChiTietGioHangID;
        return {
          id: item.SanPhamID,
          name: item.TenSanPham,
          price: parseFloat(item.Gia),
          image: item.HinhAnh,
          stock: item.SoLuongTon,
          qty: item.SoLuong,
          suspended: item.TrangThai === false || item.TrangThai === 0
        };
      });
      localStorage.setItem('fe_cart', JSON.stringify(cart));
      updateCartBadge();
    } else if (cart.length > 0) {
      // DB trống, localStorage có items → push lên DB
      for (const item of cart) {
        try {
          const addRes = await fetch('/api/giohang/them', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
            body: JSON.stringify({ NguoiDungID: currentUser.NguoiDungID, SanPhamID: item.id, SoLuong: item.qty })
          });
          if (addRes.ok) {
            const addData = await addRes.json();
            if (addData.data && addData.data.ChiTietGioHangID) {
              dbCart[item.id] = addData.data.ChiTietGioHangID;
            }
          }
        } catch { /* bỏ qua lỗi từng item */ }
      }
    }
  } catch (err) {
    console.warn('syncCartFromDB thất bại (không ảnh hưởng giỏ hàng hiện tại):', err);
  }
}

/**
 * Đồng bộ danh sách sản phẩm yêu thích từ localStorage lên DB và lấy danh sách mới nhất từ DB về.
 */
async function syncFavoritesFromDB() {
  if (!currentUser || !currentToken) return;

  try {
    // 1. Đồng bộ localStorage lên DB nếu có dữ liệu
    if (favorites.length > 0) {
      const ids = favorites.map(fav => fav.SanPhamID);
      await fetch('/api/yeuthich/dongbo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ sanPhamIds: ids })
      });
    }

    // 2. Lấy danh sách mới nhất từ DB về
    const res = await fetch('/api/yeuthich', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (res.ok) {
      const dbFavorites = await res.json();
      favorites = dbFavorites;
      localStorage.setItem('fe_favorites', JSON.stringify(favorites));

      // Cập nhật lại UI hiển thị sản phẩm trên trang chủ
      if (typeof fetchProducts === 'function') {
        const cat = currentCategory === 'all' ? null : currentCategory;
        fetchProducts(cat);
      }
    }
  } catch (err) {
    console.warn('Đồng bộ danh sách yêu thích thất bại:', err);
  }
}

// Calculate pricing and discounts
function calculateCartSummary() {
  const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  DOM.cartSubtotal.textContent = formatPrice(subtotal);

  let discount = 0;

  if (appliedCoupon) {
    DOM.appliedCouponStatus.style.display = 'flex';
    DOM.couponInput.style.display = 'none';
    DOM.applyCouponBtn.style.display = 'none';

    DOM.couponTagName.textContent = appliedCoupon.code;

    // Check minimum condition
    if (subtotal < appliedCoupon.minVal) {
      discount = 0;
      DOM.couponDiscountValue.innerHTML = `<span class="text-danger" style="font-size: 11px;">Thiếu đơn tối thiểu ${formatPrice(appliedCoupon.minVal)}</span>`;
      DOM.cartDiscountRow.style.display = 'none';
    } else {
      if (appliedCoupon.percent > 0) {
        discount = (subtotal * appliedCoupon.percent) / 100;
        // Limit max if needed, but normally raw percent is fine here
      } else {
        discount = appliedCoupon.cash;
      }
      DOM.couponDiscountValue.textContent = `-${formatPrice(discount)}`;
      DOM.cartDiscount.textContent = `-${formatPrice(discount)}`;
      DOM.cartDiscountRow.style.display = 'flex';
    }
  } else {
    DOM.appliedCouponStatus.style.display = 'none';
    DOM.couponInput.style.display = 'block';
    DOM.applyCouponBtn.style.display = 'block';
    DOM.cartDiscountRow.style.display = 'none';
  }

  const shipping = 15000;
  const grandTotal = Math.max(0, subtotal - discount + shipping);
  DOM.cartTotal.textContent = formatPrice(grandTotal);
}

// APPLY PROMOTION CODE VIA REAL REST API
DOM.applyCouponBtn.addEventListener('click', async () => {
  const code = DOM.couponInput.value.trim().toUpperCase();
  if (!code) {
    showToast('Vui lòng nhập mã giảm giá!', 'warning');
    return;
  }

  const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);

  try {
    DOM.applyCouponBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    DOM.applyCouponBtn.setAttribute('disabled', 'true');

    const res = await fetch('/api/khuyenmai/ap-dung', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        MaKhuyenMai: code,
        TongTien: subtotal
      })
    });

    const result = await res.json();

    if (res.status === 200) {
      // Promotion validated successfully!
      const km = result.data;
      appliedCoupon = {
        code: km.MaKhuyenMai,
        percent: km.PhanTramGiam,
        cash: km.SoTienGiam,
        minVal: km.DieuKienToiThieu,
        id: km.KhuyenMaiID
      };

      localStorage.setItem('fe_coupon', JSON.stringify(appliedCoupon));
      DOM.couponInput.value = '';
      calculateCartSummary();
      showToast('Áp dụng mã giảm giá thành công! 🎟️', 'success');
    } else {
      // Promotion invalid
      showToast(result.message || 'Mã giảm giá không hợp lệ!', 'error');
    }

  } catch (err) {
    console.error('Lỗi áp dụng voucher:', err);
    showToast('Lỗi máy chủ khi áp dụng mã giảm giá!', 'error');
  } finally {
    DOM.applyCouponBtn.textContent = 'Áp dụng';
    DOM.applyCouponBtn.removeAttribute('disabled');
  }
});

// Remove Coupon Action
DOM.removeCouponBtn.addEventListener('click', () => {
  appliedCoupon = null;
  localStorage.removeItem('fe_coupon');
  calculateCartSummary();
  showToast('Đã hủy áp dụng mã giảm giá.', 'info');
});

// ==================== CHECKOUT CONFIRMATION MODAL ====================

// Mở modal xác nhận đặt hàng (thay vì gửi thẳng API)
DOM.checkoutBtn.addEventListener('click', () => {
  // Kiểm tra đăng nhập
  if (!currentUser) {
    showToast('Bạn vui lòng đăng nhập trước khi thanh toán đơn hàng!', 'warning');
    DOM.cartModal.classList.remove('open');
    DOM.authModal.classList.add('open');
    return;
  }

  if (cart.length === 0) {
    showToast('Giỏ hàng của bạn đang trống!', 'warning');
    return;
  }

  // Tự điền sẵn địa chỉ và SĐT từ profile nếu có (ưu tiên địa chỉ chọn trên bản đồ)
  const mapAddress = sessionStorage.getItem('fe_delivery_address');
  DOM.checkoutAddress.value = mapAddress || currentUser.DiaChi || '';
  DOM.checkoutPhone.value = currentUser.SoDienThoai || '';
  DOM.checkoutNote.value = sessionStorage.getItem('fe_delivery_note') || '';
  DOM.checkoutPayment.value = 'Tiền mặt';

  // Hiển thị tóm tắt đơn hàng trong modal
  const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const shipping = 15000;
  const discount = appliedCoupon
    ? (appliedCoupon.percent > 0 ? (subtotal * appliedCoupon.percent / 100) : appliedCoupon.cash)
    : 0;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  DOM.checkoutOrderSummary.innerHTML = `
    <div class="checkout-summary-title"><i class="fa-solid fa-receipt"></i> Tóm Tắt Đơn Hàng</div>
    <div class="checkout-summary-row">
      <span>Tạm tính (${cart.reduce((n, i) => n + i.qty, 0)} món)</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    ${discount > 0 ? `<div class="checkout-summary-row" style="color:var(--success)">
      <span>🎟️ Giảm giá (${appliedCoupon.code})</span>
      <span>-${formatPrice(discount)}</span>
    </div>` : ''}
    <div class="checkout-summary-row">
      <span>Phí vận chuyển</span>
      <span>${formatPrice(shipping)}</span>
    </div>
    <div class="checkout-summary-row grand">
      <span>Tổng thanh toán</span>
      <span>${formatPrice(grandTotal)}</span>
    </div>
  `;

  // Reset payment method về mặc định (Tiền mặt)
  resetPaymentMethod();

  // Đóng cart drawer, mở checkout modal
  DOM.cartModal.classList.remove('open');
  DOM.checkoutModal.classList.add('open');
  document.body.style.overflow = 'hidden';
});

/**
 * Điều hướng sang trang bản đồ để chọn địa chỉ nhận hàng
 * Lưu lại thông tin đang nhập dở của khách hàng để khôi phục khi quay lại
 */
window.openDeliveryMap = function () {
  if (DOM.checkoutPhone.value) {
    sessionStorage.setItem('fe_checkout_temp_phone', DOM.checkoutPhone.value.trim());
  }
  if (DOM.checkoutNote.value) {
    sessionStorage.setItem('fe_checkout_temp_note', DOM.checkoutNote.value.trim());
  }
  if (DOM.checkoutPayment.value) {
    sessionStorage.setItem('fe_checkout_temp_payment', DOM.checkoutPayment.value);
  }
  window.location.href = 'delivery-map.html';
};

/**
 * Kiểm tra xem người dùng có vừa quay lại từ trang chọn vị trí bản đồ hay không
 * Nếu có, khôi phục lại form và mở sẵn modal thanh toán
 */
function checkDeliveryMapReturn() {
  const mapAddress = sessionStorage.getItem('fe_delivery_address');
  if (mapAddress) {
    // Chỉ tự động mở khi đã đăng nhập và giỏ hàng có đồ
    if (currentUser && cart.length > 0) {
      DOM.checkoutAddress.value = mapAddress;

      const tempPhone = sessionStorage.getItem('fe_checkout_temp_phone');
      if (tempPhone) DOM.checkoutPhone.value = tempPhone;

      const tempNote = sessionStorage.getItem('fe_checkout_temp_note');
      const mapNote = sessionStorage.getItem('fe_delivery_note');
      if (mapNote) {
        DOM.checkoutNote.value = mapNote + (tempNote ? '\n' + tempNote : '');
      } else if (tempNote) {
        DOM.checkoutNote.value = tempNote;
      }

      const tempPayment = sessionStorage.getItem('fe_checkout_temp_payment');
      if (tempPayment) {
        DOM.checkoutPayment.value = tempPayment;
        document.querySelectorAll('.payment-method-card').forEach(c => {
          c.classList.toggle('active', c.dataset.value === tempPayment);
        });
        DOM.panelMomo.style.display = tempPayment === 'Ví MoMo' ? 'block' : 'none';
        DOM.panelBank.style.display = tempPayment === 'Chuyển khoản ngân hàng' ? 'block' : 'none';
      }

      // Tính toán giá trị hiển thị tóm tắt
      const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
      const shipping = 15000;
      const discount = appliedCoupon
        ? (appliedCoupon.percent > 0 ? (subtotal * appliedCoupon.percent / 100) : appliedCoupon.cash)
        : 0;
      const grandTotal = Math.max(0, subtotal - discount + shipping);

      DOM.checkoutOrderSummary.innerHTML = `
        <div class="checkout-summary-title"><i class="fa-solid fa-receipt"></i> Tóm Tắt Đơn Hàng</div>
        <div class="checkout-summary-row">
          <span>Tạm tính (${cart.reduce((n, i) => n + i.qty, 0)} món)</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        ${discount > 0 ? `<div class="checkout-summary-row" style="color:var(--success)">
          <span>🎟️ Giảm giá (${appliedCoupon.code})</span>
          <span>-${formatPrice(discount)}</span>
        </div>` : ''}
        <div class="checkout-summary-row">
          <span>Phí vận chuyển</span>
          <span>${formatPrice(shipping)}</span>
        </div>
        <div class="checkout-summary-row grand">
          <span>Tổng thanh toán</span>
          <span>${formatPrice(grandTotal)}</span>
        </div>
      `;

      // Mở modal thanh toán
      DOM.checkoutModal.classList.add('open');
      document.body.style.overflow = 'hidden';

      // Xóa các dữ liệu nháp tạm thời (chỉ giữ địa chỉ chính)
      sessionStorage.removeItem('fe_checkout_temp_phone');
      sessionStorage.removeItem('fe_checkout_temp_note');
      sessionStorage.removeItem('fe_checkout_temp_payment');
    }
  }
}

// ==================== PAYMENT METHOD CARDS LOGIC ====================

/**
 * Reset phương thức thanh toán về mặc định (Tiền mặt)
 */
function resetPaymentMethod() {
  // Bỏ active tất cả, set active COD
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.classList.toggle('active', card.dataset.value === 'Tiền mặt');
  });
  DOM.checkoutPayment.value = 'Tiền mặt';
  DOM.panelMomo.style.display = 'none';
  DOM.panelBank.style.display = 'none';
}

/**
 * Xử lý click chọn phương thức thanh toán
 */
document.querySelectorAll('.payment-method-card').forEach(card => {
  card.addEventListener('click', () => {
    const value = card.dataset.value;

    // Cập nhật trạng thái active
    document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    DOM.checkoutPayment.value = value;

    // Ẩn tất cả panel
    DOM.panelMomo.style.display = 'none';
    DOM.panelBank.style.display = 'none';

    // Hiện panel tương ứng
    if (value === 'Ví MoMo') {
      DOM.panelMomo.style.display = 'block';
    } else if (value === 'Chuyển khoản ngân hàng') {
      DOM.panelBank.style.display = 'block';
    }
  });
});

/**
 * Copy thông tin tài khoản khi click
 */
document.querySelectorAll('.pd-copyable').forEach(el => {
  el.addEventListener('click', () => {
    const text = el.dataset.copy;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const original = el.innerHTML;
      el.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép!';
      el.style.background = 'rgba(46,204,113,0.12)';
      el.style.color = 'var(--success)';
      setTimeout(() => {
        el.innerHTML = original;
        el.style.background = '';
        el.style.color = '';
      }, 2000);
    }).catch(() => {
      showToast('Không thể sao chép. Thông tin: ' + text, 'info');
    });
  });
});

// Đóng checkout modal
DOM.checkoutModalClose.addEventListener('click', () => {
  DOM.checkoutModal.classList.remove('open');
  document.body.style.overflow = '';
});
DOM.checkoutModal.addEventListener('click', (e) => {
  if (e.target === DOM.checkoutModal) {
    DOM.checkoutModal.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// Xử lý Submit form đặt hàng
DOM.checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const diaChiNhan = DOM.checkoutAddress.value.trim();
  const soDienThoaiNhan = DOM.checkoutPhone.value.trim();
  const phuongThucThanhToan = DOM.checkoutPayment.value;
  const ghiChu = DOM.checkoutNote.value.trim();

  // Kiểm tra đăng nhập và token trước khi tiến hành
  if (!currentUser || !currentToken) {
    showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục!', 'error');
    DOM.checkoutModal.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (DOM.authModal) DOM.authModal.classList.add('open');
    }, 300);
    return;
  }

  // Kiểm tra giỏ hàng không rỗng
  if (!cart || cart.length === 0) {
    showToast('Giỏ hàng của bạn đang trống! Vui lòng thêm sản phẩm.', 'warning');
    return;
  }

  // Validate địa chỉ và SĐT
  if (!diaChiNhan) {
    showToast('Vui lòng nhập địa chỉ nhận hàng!', 'warning');
    DOM.checkoutAddress.focus();
    return;
  }
  if (!soDienThoaiNhan) {
    showToast('Vui lòng nhập số điện thoại nhận hàng!', 'warning');
    DOM.checkoutPhone.focus();
    return;
  }
  // Kiểm tra định dạng SĐT Việt Nam
  if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(soDienThoaiNhan)) {
    showToast('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam đúng định dạng.', 'warning');
    DOM.checkoutPhone.focus();
    return;
  }

  try {
    const confirmBtn = DOM.confirmOrderBtn;
    confirmBtn.setAttribute('disabled', 'true');
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

    // Bước 1: Đồng bộ giỏ hàng localStorage → Database
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đồng bộ giỏ hàng...';

    // Bước 1a: Lấy giỏ hàng hiện tại trong DB để xóa sạch trước khi đồng bộ
    const cartGetRes = await apiFetch(`/api/giohang/${currentUser.NguoiDungID}`);

    if (cartGetRes.ok) {
      const cartGetData = await cartGetRes.json();
      const existingItems = (cartGetData.data && cartGetData.data.ChiTiet) || [];
      // Xóa từng item cũ trong DB cart
      for (const item of existingItems) {
        try {
          await apiFetch(`/api/giohang/item/${item.ChiTietGioHangID}`, { method: 'DELETE' });
        } catch (delErr) {
          if (delErr.message === 'TOKEN_EXPIRED') throw delErr;
          console.warn('Không thể xóa item DB cart:', delErr.message);
        }
      }
    }

    // Bước 1b: Thêm từng sản phẩm từ localStorage vào DB cart
    for (const item of cart) {
      const addRes = await apiFetch('/api/giohang/them', {
        method: 'POST',
        body: {
          NguoiDungID: currentUser.NguoiDungID,
          SanPhamID: item.id,
          SoLuong: item.qty
        }
      });
      if (!addRes.ok) {
        const addErr = await addRes.json().catch(() => ({}));
        throw new Error(addErr.message || `Không thể thêm "${item.name}" vào giỏ hàng hệ thống.`);
      }
    }

    // Bước 2: Tạo hóa đơn
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo đơn hàng...';

    const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
    const shipping = 15000;
    const discount = appliedCoupon
      ? (appliedCoupon.percent > 0 ? (subtotal * appliedCoupon.percent / 100) : appliedCoupon.cash)
      : 0;
    const finalTotal = Math.max(0, subtotal - discount + shipping);

    const orderBody = {
      NguoiDungID: currentUser.NguoiDungID,
      MaKhuyenMai: appliedCoupon ? appliedCoupon.code : null,
      DiaChiNhan: diaChiNhan,
      SoDienThoaiNhan: soDienThoaiNhan,
      PhuongThucThanhToan: phuongThucThanhToan,
      GhiChu: ghiChu || 'Đơn hàng từ Website FoodExpress'
    };

    const res = await apiFetch('/api/hoadon', {
      method: 'POST',
      body: orderBody
    });

    const result = await res.json().catch(() => ({ message: 'Lỗi phân tích dữ liệu phản hồi' }));

    if (res.status === 201 || res.status === 200) {
      // Thành công! Xóa giỏ hàng, đóng modal
      cart = [];
      appliedCoupon = null;
      localStorage.removeItem('fe_cart');
      localStorage.removeItem('fe_coupon');
      sessionStorage.removeItem('fe_delivery_address');
      sessionStorage.removeItem('fe_delivery_lat');
      sessionStorage.removeItem('fe_delivery_lng');
      sessionStorage.removeItem('fe_delivery_note');
      updateCartBadge();

      DOM.checkoutModal.classList.remove('open');
      document.body.style.overflow = '';

      showToast('🎉 Đặt hàng thành công! Đơn hàng đang được chuẩn bị.', 'success');
      setTimeout(() => {
        showOrderSuccess({
          hoaDonId: result.data ? result.data.HoaDonID : null,
          address: diaChiNhan,
          phone: soDienThoaiNhan,
          payment: phuongThucThanhToan,
          totalAmount: finalTotal
        });
      }, 300);

      fetchProducts();
    } else {
      const isInvalidCoupon = result.message && (
        result.message.includes('Mã giảm giá hết hiệu lực') ||
        result.message.includes('khuyến mãi') ||
        result.message.includes('Khuyến mãi')
      );
      if (isInvalidCoupon && appliedCoupon) {
        appliedCoupon = null;
        localStorage.removeItem('fe_coupon');
        calculateCartSummary();
      }
      showToast(result.message || 'Không thể tạo hóa đơn. Vui lòng thử lại!', 'error');
    }

  } catch (err) {
    console.error('Lỗi checkout:', err);
    // Bỏ qua lỗi TOKEN_EXPIRED vì đã được xử lý bởi apiFetch
    if (err.message === 'TOKEN_EXPIRED') return;
    showToast(err.message || 'Lỗi kết nối máy chủ thanh toán!', 'error');
  } finally {
    DOM.confirmOrderBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Xác Nhận & Đặt Hàng Ngay';
    DOM.confirmOrderBtn.removeAttribute('disabled');
  }
});

// ==================== AUTHENTICATION MANAGEMENT ====================

// Toggle Auth Dialog
DOM.loginBtn.addEventListener('click', () => {
  DOM.authModal.classList.add('open');
});

DOM.authModalClose.addEventListener('click', () => {
  DOM.authModal.classList.remove('open');
});

// Switch between Login and Register tabs
DOM.tabLoginBtn.addEventListener('click', () => {
  DOM.tabLoginBtn.classList.add('active');
  DOM.tabRegisterBtn.classList.remove('active');
  DOM.loginForm.style.display = 'flex';
  DOM.registerForm.style.display = 'none';
});

DOM.tabRegisterBtn.addEventListener('click', () => {
  DOM.tabRegisterBtn.classList.add('active');
  DOM.tabLoginBtn.classList.remove('active');
  DOM.registerForm.style.display = 'flex';
  DOM.loginForm.style.display = 'none';
});

// Login Form Submit (POST /api/login)
DOM.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const submitBtn = DOM.loginForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xác thực...';
    submitBtn.setAttribute('disabled', 'true');

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
      currentUser = data.user;
      currentToken = data.token;

      localStorage.setItem('fe_user', JSON.stringify(currentUser));
      localStorage.setItem('fe_token', currentToken);

      updateUserUI();
      DOM.authModal.classList.remove('open');
      DOM.loginForm.reset();
      showToast(`Chào mừng ${currentUser.HoTen} trở lại! 👋`, 'success');

      // Đồng bộ giỏ hàng từ DB sau khi đăng nhập
      syncCartFromDB();
      syncFavoritesFromDB();
    } else {
      showToast(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!', 'error');
    }

  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    showToast('Máy chủ xác thực không phản hồi!', 'error');
  } finally {
    const submitBtn = DOM.loginForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Đăng Nhập';
    submitBtn.removeAttribute('disabled');
  }
});

// Register Form Submit (POST /api/register)
DOM.registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('reg-username').value.trim();
  const fullname = document.getElementById('reg-fullname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value.trim();

  if (password.length < 6) {
    showToast('Mật khẩu bảo mật phải chứa ít nhất 6 ký tự!', 'warning');
    return;
  }

  try {
    const submitBtn = DOM.registerForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo tài khoản...';
    submitBtn.setAttribute('disabled', 'true');

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        VaiTroID: 2, // Default: Customer (Khách hàng)
        HoTen: fullname,
        TenDangNhap: username,
        MatKhau: password,
        Email: email,
        SoDienThoai: phone,
        DiaChi: '123 Đường Xuân Thủy, Cầu Giấy, Hà Nội' // Placeholder address
      })
    });

    const data = await res.json();

    if (res.status === 201 || res.status === 200) {
      showToast('Đăng ký tài khoản thành công! Đang tự động đăng nhập...', 'success');

      // Auto submit login
      document.getElementById('login-username').value = username;
      document.getElementById('login-password').value = password;
      DOM.tabLoginBtn.click();
      DOM.loginForm.dispatchEvent(new Event('submit'));
      DOM.registerForm.reset();
    } else {
      showToast(data.message || 'Lỗi đăng ký tài khoản mới!', 'error');
    }

  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    showToast('Có lỗi xảy ra khi tạo tài khoản!', 'error');
  } finally {
    const submitBtn = DOM.registerForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Đăng Ký Tài Khoản';
    submitBtn.removeAttribute('disabled');
  }
});

// Update UI elements based on authentication status
function updateUserUI() {
  if (currentUser) {
    DOM.loginBtn.style.display = 'none';
    DOM.profileDropdown.style.display = 'block';
    DOM.usernameDisplay.textContent = currentUser.HoTen.split(' ').pop(); // Just take the last name

    // Hiển thị nút admin nếu là Admin (VaiTroID === 1)
    const adminBtn = document.getElementById('menu-admin-btn');
    if (adminBtn) {
      if (currentUser.VaiTroID === 1) {
        adminBtn.style.display = 'flex';
      } else {
        adminBtn.style.display = 'none';
      }
    }
  } else {
    DOM.loginBtn.style.display = 'flex';
    DOM.profileDropdown.style.display = 'none';
  }
}

// User Profile Trigger toggle menu
DOM.profileTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  DOM.profileDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
  DOM.profileDropdown.classList.remove('open');
});

// Logout action
DOM.logoutBtn.addEventListener('click', () => {
  currentUser = null;
  currentToken = null;
  appliedCoupon = null;
  dbCart = {}; // Xóa mapping DB cart
  favorites = []; // Xóa yêu thích
  localStorage.removeItem('fe_user');
  localStorage.removeItem('fe_token');
  localStorage.removeItem('fe_coupon');
  localStorage.removeItem('fe_favorites');
  // Giữ lại giỏ hàng localStorage để user không mất giỏ khi đăng xuất
  updateUserUI();
  calculateCartSummary();
  showToast('Đã đăng xuất khỏi hệ thống thành công!', 'info');
});

// View orders action trigger
document.getElementById('menu-orders-btn').addEventListener('click', (e) => {
  e.preventDefault();
  openOrdersModal();
});

// ==================== ORDER HISTORY MANAGEMENT ====================

function openOrdersModal() {
  if (!currentUser) {
    showToast('Vui lòng đăng nhập để xem lịch sử đơn hàng!', 'warning');
    DOM.authModal.classList.add('open');
    return;
  }

  // Reset active filter tab to all
  currentOrderFilter = 'all';
  document.querySelectorAll('.orders-filter-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-status') === 'all') {
      btn.classList.add('active');
    }
  });

  // Open modal overlay
  DOM.ordersModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Fetch orders
  fetchOrders();
}

function closeOrdersModal() {
  DOM.ordersModal.classList.remove('open');
  document.body.style.overflow = '';
}

async function fetchOrders() {
  try {
    // Show loading skeleton inside container
    DOM.ordersListContainer.innerHTML = `
      <div class="skeleton-card promotion-skeleton" style="height: 80px; margin-bottom: 12px;"></div>
      <div class="skeleton-card promotion-skeleton" style="height: 80px; margin-bottom: 12px;"></div>
      <div class="skeleton-card promotion-skeleton" style="height: 80px; margin-bottom: 12px;"></div>
    `;

    const res = await fetch('/api/hoadon', {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (!res.ok) {
      throw new Error('Không thể lấy danh sách hóa đơn.');
    }

    const data = await res.json();

    // Handle database output format
    userOrders = Array.isArray(data) ? data : (data.data || []);

    // Sort orders by date descending
    userOrders.sort((a, b) => new Date(b.NgayDat) - new Date(a.NgayDat));

    renderOrders(userOrders);

  } catch (err) {
    console.error('Lỗi fetchOrders:', err);
    DOM.ordersListContainer.innerHTML = `
      <div class="empty-orders-view" style="color: var(--danger)">
        <i class="fa-solid fa-triangle-exclamation" style="color: var(--danger); font-size: 38px; margin-bottom: 10px;"></i>
        <p>Lỗi khi kết nối máy chủ tải lịch sử đơn hàng.</p>
        <button class="btn btn-outline btn-sm m-t-20" onclick="fetchOrders()"><i class="fa-solid fa-rotate-right"></i> Thử lại</button>
      </div>
    `;
  }
}

function renderOrders(orders) {
  // Apply filtering based on currentOrderFilter
  let filteredOrders = orders;
  if (currentOrderFilter !== 'all') {
    filteredOrders = orders.filter(o => o.TrangThai === currentOrderFilter);
  }

  if (filteredOrders.length === 0) {
    DOM.ordersListContainer.innerHTML = `
      <div class="empty-orders-view">
        <i class="fa-solid fa-receipt empty-icon" style="font-size: 48px; color: #dee2e6; margin-bottom: 15px;"></i>
        <p>Bạn không có đơn hàng nào thuộc trạng thái này!</p>
      </div>
    `;
    return;
  }

  DOM.ordersListContainer.innerHTML = '';

  filteredOrders.forEach(order => {
    // Generate order item element
    const orderCard = document.createElement('div');
    orderCard.className = 'order-item-card';
    orderCard.setAttribute('data-id', order.HoaDonID);

    // Status class mapping
    let statusClass = 'cho-xac-nhan';
    let statusIcon = 'fa-regular fa-clock';
    if (order.TrangThai === 'Đang giao') {
      statusClass = 'dang-giao';
      statusIcon = 'fa-solid fa-truck-fast';
    } else if (order.TrangThai === 'Hoàn thành') {
      statusClass = 'hoan-thanh';
      statusIcon = 'fa-regular fa-circle-check';
    } else if (order.TrangThai === 'Đã hủy') {
      statusClass = 'da-huy';
      statusIcon = 'fa-regular fa-circle-xmark';
    }

    const orderDate = new Date(order.NgayDat).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    orderCard.innerHTML = `
      <div class="order-item-header">
        <div class="order-info-left">
          <div class="order-id-date">
            <span>Đơn hàng #HD${order.HoaDonID}</span>
            <span class="order-date">${orderDate}</span>
          </div>
          <div class="order-summary-meta">
            <span>Thanh toán: <strong>${order.PhuongThuc || order.PhuongThucThanhToan || 'Tiền mặt'}</strong></span> | 
            <span>Trạng thái: <strong>${order.TrangThaiThanhToan || 'Chưa thanh toán'}</strong></span>
          </div>
        </div>
        <div class="order-info-right">
          <div class="order-price-total">${formatPrice(order.TongTien)}</div>
          <span class="status-badge ${statusClass}">
            <i class="${statusIcon}"></i> ${order.TrangThai}
          </span>
          <i class="fa-solid fa-chevron-down accordion-arrow"></i>
        </div>
      </div>
      <div class="order-item-details">
        <div class="details-inner">
          <div class="order-details-products" id="order-details-products-${order.HoaDonID}">
            <!-- Loading products inside details -->
            <div style="text-align: center; padding: 10px; color: var(--text-muted);">
              <i class="fa-solid fa-spinner fa-spin"></i> Đang tải món ăn...
            </div>
          </div>

          <div class="order-shipping-payment-info">
            <div>
              <h4 class="info-section-title"><i class="fa-solid fa-truck"></i> Thông tin giao nhận</h4>
              <div class="info-box">
                <p><strong>Người nhận:</strong> ${order.TenKhachHang || currentUser?.HoTen || 'Khách hàng'}</p>
                <p><strong>Số điện thoại:</strong> ${order.SoDienThoaiNhan || 'Chưa cập nhật'}</p>
                <p><strong>Địa chỉ:</strong> ${order.DiaChiNhan || 'Chưa cập nhật'}</p>
                <p><strong>Ghi chú:</strong> ${order.GhiChu || 'Không có ghi chú'}</p>
              </div>
            </div>
            <div>
              <h4 class="info-section-title"><i class="fa-solid fa-receipt"></i> Chi tiết thanh toán</h4>
              <div class="order-calculations-box" id="order-calculations-${order.HoaDonID}">
                <div class="calc-row">
                  <span>Tạm tính:</span>
                  <span id="order-calc-subtotal-${order.HoaDonID}">0đ</span>
                </div>
                <div class="calc-row" id="order-calc-discount-row-${order.HoaDonID}" style="display: none;">
                  <span>Khuyến mãi:</span>
                  <span id="order-calc-discount-${order.HoaDonID}" class="text-success">-0đ</span>
                </div>
                <div class="calc-row">
                  <span>Phí ship:</span>
                  <span>15.000đ</span>
                </div>
                <div class="calc-row grand-total">
                  <span>Tổng tiền:</span>
                  <span>${formatPrice(order.TongTien)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="order-details-actions" id="order-actions-bar-${order.HoaDonID}">
            <!-- Actions like cancel order will be shown here if pending -->
          </div>
        </div>
      </div>
    `;

    // Add click event for expanding accordion
    const cardHeader = orderCard.querySelector('.order-item-header');
    cardHeader.addEventListener('click', (e) => {
      const isExpanded = orderCard.classList.toggle('expanded');

      if (isExpanded) {
        // Load details dynamically
        loadOrderDetails(order.HoaDonID);
      }
    });

    DOM.ordersListContainer.appendChild(orderCard);
  });
}

async function loadOrderDetails(orderId) {
  const productsContainer = document.getElementById(`order-details-products-${orderId}`);
  const calcSubtotal = document.getElementById(`order-calc-subtotal-${orderId}`);
  const calcDiscountRow = document.getElementById(`order-calc-discount-row-${orderId}`);
  const calcDiscount = document.getElementById(`order-calc-discount-${orderId}`);
  const actionsBar = document.getElementById(`order-actions-bar-${orderId}`);

  try {
    const res = await fetch(`/api/hoadon/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (!res.ok) throw new Error('Không thể tải chi tiết hóa đơn.');
    const details = await res.json();

    // ── Đồng bộ badge trạng thái trên card header với dữ liệu mới nhất từ DB ──
    const orderCard = document.querySelector(`.order-item-card[data-id="${orderId}"]`);
    if (orderCard && details.TrangThai) {
      const badge = orderCard.querySelector('.status-badge');
      if (badge) {
        // Map trạng thái sang class CSS và icon
        const statusMap = {
          'Chờ xác nhận': { cls: 'cho-xac-nhan', icon: 'fa-regular fa-clock' },
          'Đang giao': { cls: 'dang-giao', icon: 'fa-solid fa-truck-fast' },
          'Hoàn thành': { cls: 'hoan-thanh', icon: 'fa-regular fa-circle-check' },
          'Đã hủy': { cls: 'da-huy', icon: 'fa-regular fa-circle-xmark' }
        };
        const s = statusMap[details.TrangThai] || { cls: 'cho-xac-nhan', icon: 'fa-regular fa-clock' };
        badge.className = `status-badge ${s.cls}`;
        badge.innerHTML = `<i class="${s.icon}"></i> ${details.TrangThai}`;
      }
      // Cập nhật lại mảng userOrders để filter tab hoạt động đúng
      const idx = userOrders.findIndex(o => o.HoaDonID === orderId);
      if (idx !== -1) userOrders[idx].TrangThai = details.TrangThai;
    }

    // Render products list
    productsContainer.innerHTML = '';
    const items = details.ChiTiet || [];

    if (items.length === 0) {
      productsContainer.innerHTML = '<div style="text-align: center; padding: 10px; color: var(--text-muted);">Không tìm thấy thông tin sản phẩm.</div>';
    } else {
      items.forEach(item => {
        const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150';
        const imgUrl = item.HinhAnh && item.HinhAnh.startsWith('http') ? item.HinhAnh : fallbackImg;

        productsContainer.innerHTML += `
          <div class="order-detail-product-row">
            <img src="${imgUrl}" alt="${item.TenSanPham}" onerror="this.onerror=null; this.src='${fallbackImg}';">
            <div class="order-detail-product-info">
              <div class="order-detail-product-name">${item.TenSanPham}</div>
              <div class="order-detail-product-qty-price">${item.SoLuong} x ${formatPrice(item.DonGia)}</div>
            </div>
            <div class="order-detail-product-total">${formatPrice(item.ThanhTien)}</div>
          </div>
        `;
      });
    }

    // Update calculations
    const rawSubtotal = items.reduce((sum, item) => sum + parseFloat(item.ThanhTien || 0), 0);
    calcSubtotal.textContent = formatPrice(rawSubtotal);

    const discountVal = parseFloat(details.SoTienGiam || 0);
    if (discountVal > 0) {
      calcDiscountRow.style.display = 'flex';
      calcDiscount.textContent = `-${formatPrice(discountVal)}`;
    } else {
      calcDiscountRow.style.display = 'none';
    }

    // Actions bar: render buttons based on order status
    actionsBar.innerHTML = '';
    const actionsWrapper = document.createElement('div');
    actionsWrapper.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;';

    // Button: Hủy đơn (if status Chờ xác nhận)
    if (details.TrangThai === 'Chờ xác nhận') {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-cancel-order';
      cancelBtn.innerHTML = '<i class="fa-regular fa-circle-xmark"></i> Hủy đơn hàng';
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cancelOrder(orderId);
      });
      actionsWrapper.appendChild(cancelBtn);
    }

    // Button: Theo dõi đơn hàng (if status is NOT Đã hủy)
    if (details.TrangThai !== 'Đã hủy') {
      const trackBtn = document.createElement('a');
      trackBtn.className = 'btn btn-primary';
      trackBtn.style.cssText = 'padding:8px 18px; font-size:13.5px; display:inline-flex; align-items:center; justify-content:center; text-decoration:none;';
      trackBtn.href = `/track-order.html?id=${orderId}`;
      trackBtn.innerHTML = '<i class="fa-solid fa-location-dot" style="margin-right:6px;"></i> Theo dõi đơn hàng';
      trackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      actionsWrapper.appendChild(trackBtn);
    }

    // Button: Đánh giá món ăn (if status Hoàn thành)
    if (details.TrangThai === 'Hoàn thành') {
      const reviewBtn = document.createElement('button');
      reviewBtn.className = 'btn btn-primary';
      reviewBtn.style.cssText = 'padding:8px 18px; font-size:13.5px; background: linear-gradient(135deg, #f1c40f, #e67e22);';
      reviewBtn.innerHTML = '<i class="fa-solid fa-star"></i> Đánh giá món ăn';
      reviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openReviewModal(orderId, details.ChiTiet || []);
      });
      actionsWrapper.appendChild(reviewBtn);
    }

    actionsBar.appendChild(actionsWrapper);

  } catch (err) {
    console.error(`Lỗi tải chi tiết đơn hàng #${orderId}:`, err);
    productsContainer.innerHTML = '<div style="text-align: center; padding: 10px; color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi khi tải chi tiết món ăn.</div>';
  }
}

// ==================== REVIEW MODAL LOGIC ====================

async function openReviewModal(orderId, items) {
  if (!currentToken) {
    showToast('Vui lòng đăng nhập để đánh giá!', 'warning');
    return;
  }
  if (!items || items.length === 0) {
    showToast('Không tìm thấy sản phẩm trong đơn hàng để đánh giá!', 'warning');
    return;
  }

  currentReviewOrderId = orderId;

  // Fetch which products in this order have already been reviewed
  let reviewedIds = [];
  try {
    const checkRes = await fetch(`/api/danhgia/hoadon/${orderId}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      reviewedIds = checkData.reviewedProductIds || [];
    }
  } catch (err) {
    console.warn('Không thể kiểm tra trạng thái đánh giá:', err);
  }

  // Build form HTML for each non-reviewed product
  const container = DOM.reviewItemsContainer;
  container.innerHTML = '';

  const pendingItems = items.filter(item => !reviewedIds.includes(item.SanPhamID));

  if (pendingItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--text-muted);">
        <i class="fa-solid fa-circle-check" style="font-size:40px; color:var(--success); margin-bottom:12px; display:block;"></i>
        <p style="font-size:15px; font-weight:600;">Bạn đã đánh giá tất cả các món ăn trong đơn hàng này rồi! ❤️</p>
      </div>
    `;
    DOM.submitReviewsBtn.style.display = 'none';
  } else {
    DOM.submitReviewsBtn.style.display = 'flex';
    pendingItems.forEach(item => {
      const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150';
      const imgUrl = item.HinhAnh && item.HinhAnh.startsWith('http') ? item.HinhAnh : fallbackImg;

      const itemEl = document.createElement('div');
      itemEl.className = 'review-product-item';
      itemEl.setAttribute('data-product-id', item.SanPhamID);
      itemEl.innerHTML = `
        <div class="review-product-info-row">
          <img src="${imgUrl}" alt="${item.TenSanPham}" onerror="this.src='${fallbackImg}'">
          <span class="review-product-title">${item.TenSanPham}</span>
        </div>
        <div>
          <label style="font-size:12.5px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Đánh giá của bạn:</label>
          <div class="star-rating-container" data-product-id="${item.SanPhamID}" data-rating="0">
            <i class="fa-regular fa-star star-btn" data-value="1"></i>
            <i class="fa-regular fa-star star-btn" data-value="2"></i>
            <i class="fa-regular fa-star star-btn" data-value="3"></i>
            <i class="fa-regular fa-star star-btn" data-value="4"></i>
            <i class="fa-regular fa-star star-btn" data-value="5"></i>
          </div>
        </div>
        <textarea class="review-textarea" placeholder="Nhận xét của bạn về món ăn này (tùy chọn)..." rows="2"></textarea>
      `;
      container.appendChild(itemEl);
    });

    // Attach star click events
    container.querySelectorAll('.star-rating-container').forEach(starContainer => {
      starContainer.querySelectorAll('.star-btn').forEach(star => {
        star.addEventListener('click', (e) => {
          const val = parseInt(e.currentTarget.getAttribute('data-value'));
          starContainer.setAttribute('data-rating', val);
          starContainer.querySelectorAll('.star-btn').forEach((s, i) => {
            if (i < val) {
              s.classList.add('active');
              s.classList.remove('fa-regular');
              s.classList.add('fa-solid');
            } else {
              s.classList.remove('active');
              s.classList.remove('fa-solid');
              s.classList.add('fa-regular');
            }
          });
        });

        // Hover preview effect
        star.addEventListener('mouseenter', (e) => {
          const val = parseInt(e.currentTarget.getAttribute('data-value'));
          starContainer.querySelectorAll('.star-btn').forEach((s, i) => {
            s.style.color = i < val ? '#f1c40f' : '#dee2e6';
          });
        });
        star.addEventListener('mouseleave', () => {
          const current = parseInt(starContainer.getAttribute('data-rating'));
          starContainer.querySelectorAll('.star-btn').forEach((s, i) => {
            s.style.color = '';
          });
        });
      });
    });
  }

  // Show modal
  DOM.reviewModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function submitReviews() {
  const orderId = currentReviewOrderId;
  if (!orderId) return;

  const reviewItems = DOM.reviewItemsContainer.querySelectorAll('.review-product-item');
  if (reviewItems.length === 0) {
    DOM.reviewModal.classList.remove('open');
    document.body.style.overflow = '';
    return;
  }

  // Validate all items have a star rating
  let hasUnrated = false;
  reviewItems.forEach(item => {
    const starContainer = item.querySelector('.star-rating-container');
    const rating = parseInt(starContainer.getAttribute('data-rating') || '0');
    if (rating === 0) hasUnrated = true;
  });
  if (hasUnrated) {
    showToast('Vui lòng chọn số sao đánh giá cho tất cả các món ăn!', 'warning');
    return;
  }

  // Disable submit button
  DOM.submitReviewsBtn.setAttribute('disabled', 'true');
  DOM.submitReviewsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi đánh giá...';

  let successCount = 0;
  let errorCount = 0;

  for (const item of reviewItems) {
    const productId = parseInt(item.getAttribute('data-product-id'));
    const starContainer = item.querySelector('.star-rating-container');
    const soSao = parseInt(starContainer.getAttribute('data-rating'));
    const binhLuan = item.querySelector('.review-textarea').value.trim();

    try {
      const res = await fetch('/api/danhgia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          SanPhamID: productId,
          HoaDonID: orderId,
          SoSao: soSao,
          BinhLuan: binhLuan || null
        })
      });

      if (res.ok || res.status === 201) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (err) {
      errorCount++;
      console.error('Lỗi gửi đánh giá:', err);
    }
  }

  // Close modal
  DOM.reviewModal.classList.remove('open');
  document.body.style.overflow = '';
  DOM.submitReviewsBtn.removeAttribute('disabled');
  DOM.submitReviewsBtn.innerHTML = '<i class="fa-regular fa-paper-plane"></i> Gửi Đánh Giá Của Bạn';

  if (successCount > 0) {
    showToast(`🌟 Đã gửi ${successCount} đánh giá thành công! Cảm ơn bạn rất nhiều.`, 'success');
    // Reload products to update star ratings displayed
    setTimeout(() => fetchProducts(currentCategory === 'all' ? null : currentCategory), 800);
  }
  if (errorCount > 0) {
    showToast(`Có ${errorCount} đánh giá gửi thất bại. Vui lòng thử lại!`, 'error');
  }
}

async function cancelOrder(orderId) {
  const confirmCancel = confirm(`Bạn có chắc chắn muốn hủy đơn hàng #HD${orderId} không? Thao tác này không thể hoàn tác!`);
  if (!confirmCancel) return;

  try {
    const btn = document.querySelector(`.order-item-card[data-id="${orderId}"] .btn-cancel-order`);
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
      btn.disabled = true;
    }

    const res = await fetch(`/api/hoadon/${orderId}/trangthai`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        TrangThai: 'Đã hủy'
      })
    });

    const result = await res.json();

    if (res.status === 200) {
      showToast(`Hủy đơn hàng #HD${orderId} thành công! 🗑️`, 'success');

      // Reload order list
      fetchOrders();

      // Reload products list in background to update inventory/stocks
      fetchProducts();
    } else {
      showToast(result.message || 'Không thể hủy đơn hàng này!', 'error');
      if (btn) {
        btn.innerHTML = '<i class="fa-regular fa-circle-xmark"></i> Hủy đơn hàng';
        btn.disabled = false;
      }
    }
  } catch (err) {
    console.error('Lỗi cancelOrder:', err);
    showToast('Lỗi máy chủ khi hủy đơn hàng!', 'error');
  }
}

// ==================== USER PROFILE MANAGEMENT ====================

// Open profile modal and populate info
function openProfileModal() {
  if (!currentUser) {
    showToast('Vui lòng đăng nhập để xem thông tin tài khoản!', 'warning');
    DOM.authModal.classList.add('open');
    return;
  }

  // Populate data
  DOM.profileDisplayName.textContent = currentUser.HoTen;
  DOM.profileDisplayUsername.textContent = `@${currentUser.TenDangNhap}`;
  DOM.profileFullname.value = currentUser.HoTen;
  DOM.profileEmail.value = currentUser.Email || '';
  DOM.profilePhone.value = currentUser.SoDienThoai || '';
  DOM.profileAddress.value = currentUser.DiaChi || '';

  // Set role badge
  if (currentUser.VaiTroID === 1) {
    DOM.profileRoleBadge.textContent = 'Quản trị viên';
    DOM.profileRoleBadge.style.backgroundColor = 'var(--primary-color)';
  } else {
    DOM.profileRoleBadge.textContent = 'Khách hàng';
    DOM.profileRoleBadge.style.backgroundColor = 'var(--success)';
  }

  // Set avatar placeholder
  DOM.profileAvatarImg.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

  // Reset password change fields
  DOM.passwordChangeFields.style.display = 'none';
  DOM.profileNewPassword.value = '';
  DOM.togglePwdFieldsBtn.innerHTML = '<i class="fa-solid fa-key"></i> Đổi mật khẩu tài khoản?';

  // Open modal
  DOM.profileModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
  DOM.profileModal.classList.remove('open');
  document.body.style.overflow = '';
}

// Toggle password change fields block
DOM.togglePwdFieldsBtn.addEventListener('click', () => {
  const isHidden = DOM.passwordChangeFields.style.display === 'none';
  if (isHidden) {
    DOM.passwordChangeFields.style.display = 'block';
    DOM.togglePwdFieldsBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Hủy đổi mật khẩu';
  } else {
    DOM.passwordChangeFields.style.display = 'none';
    DOM.profileNewPassword.value = '';
    DOM.togglePwdFieldsBtn.innerHTML = '<i class="fa-solid fa-key"></i> Đổi mật khẩu tài khoản?';
  }
});

// Handle Profile form submission
DOM.profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  const fullname = DOM.profileFullname.value.trim();
  const email = DOM.profileEmail.value.trim();
  const phone = DOM.profilePhone.value.trim();
  const address = DOM.profileAddress.value.trim();
  const newPassword = DOM.profileNewPassword.value.trim();

  if (!fullname) {
    showToast('Họ tên không được để trống!', 'warning');
    return;
  }

  try {
    DOM.profileSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    DOM.profileSaveBtn.setAttribute('disabled', 'true');

    const updateBody = {
      HoTen: fullname,
      Email: email || null,
      SoDienThoai: phone || null,
      DiaChi: address || null
    };

    if (newPassword) {
      if (newPassword.length < 6) {
        showToast('Mật khẩu mới phải chứa ít nhất 6 ký tự!', 'warning');
        DOM.profileSaveBtn.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Lưu Thay Đổi';
        DOM.profileSaveBtn.removeAttribute('disabled');
        return;
      }
      updateBody.MatKhau = newPassword;
    }

    const res = await fetch(`/api/nguoidung/${currentUser.NguoiDungID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(updateBody)
    });

    const result = await res.json();

    if (res.status === 200) {
      // Sync update user state
      currentUser = result.data;
      localStorage.setItem('fe_user', JSON.stringify(currentUser));

      // Update UI displays
      updateUserUI();

      showToast('Cập nhật thông tin tài khoản thành công! 👤', 'success');
      closeProfileModal();
    } else {
      showToast(result.message || 'Cập nhật thông tin thất bại!', 'error');
    }
  } catch (err) {
    console.error('Lỗi cập nhật hồ sơ:', err);
    showToast('Lỗi máy chủ khi cập nhật tài khoản!', 'error');
  } finally {
    DOM.profileSaveBtn.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Lưu Thay Đổi';
    DOM.profileSaveBtn.removeAttribute('disabled');
  }
});

document.getElementById('menu-profile-btn').addEventListener('click', (e) => {
  e.preventDefault();
  openProfileModal();
});

// Password visible toggles
document.querySelectorAll('.pwd-toggle-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const input = e.currentTarget.previousElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      e.currentTarget.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
    } else {
      input.type = 'password';
      e.currentTarget.innerHTML = '<i class="fa-regular fa-eye"></i>';
    }
  });
});

// ==================== GLOBAL CONTROLS & EVENTS ====================

function setupEventListeners() {
  // Theme Action
  DOM.themeToggle.addEventListener('click', toggleTheme);
  DOM.mobileThemeToggle?.addEventListener('click', () => {
    toggleTheme();
    closeMobileMenu();
  });

  // Close modal clicks on overlay backgrounds
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  DOM.productModalClose.addEventListener('click', closeProductModal);
  DOM.profileModalClose.addEventListener('click', closeProfileModal);
  DOM.ordersModalClose.addEventListener('click', closeOrdersModal);

  // Review modal close
  DOM.reviewModalClose.addEventListener('click', () => {
    DOM.reviewModal.classList.remove('open');
    document.body.style.overflow = '';
  });

  // Review modal submit
  DOM.submitReviewsBtn.addEventListener('click', submitReviews);

  // Filter tabs for orders
  document.querySelectorAll('.orders-filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.orders-filter-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentOrderFilter = e.currentTarget.getAttribute('data-status');
      renderOrders(userOrders);
    });
  });

  // Search input typing with dynamic debounce
  DOM.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    const text = e.target.value;

    searchDebounceTimer = setTimeout(() => {
      searchProducts(text);
    }, 450); // 450ms debounce
  });

  DOM.searchBtn.addEventListener('click', () => {
    searchProducts(DOM.searchInput.value);
  });

  DOM.mobileSearchBtn?.addEventListener('click', () => {
    searchProducts(DOM.mobileSearchInput.value);
    closeMobileMenu();
  });

  DOM.mobileSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchProducts(DOM.mobileSearchInput.value);
      closeMobileMenu();
    }
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.searchStatusWrapper.style.display = 'none';
    fetchProducts(currentCategory === 'all' ? null : currentCategory);
  });

  // Mobile menu toggle
  DOM.mobileMenuToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });

  DOM.mobileCartBtn?.addEventListener('click', () => {
    DOM.cartBtn.click();
    closeMobileMenu();
  });

  DOM.mobileLoginBtn?.addEventListener('click', () => {
    DOM.authModal.classList.add('open');
    closeMobileMenu();
  });

  document.addEventListener('click', (e) => {
    if (!DOM.mobileNavPanel?.contains(e.target) && !DOM.mobileMenuToggle?.contains(e.target)) {
      closeMobileMenu();
    }
  });
}

function toggleMobileMenu() {
  const panel = DOM.mobileNavPanel;
  const toggle = DOM.mobileMenuToggle;
  if (!panel || !toggle) return;

  const isOpen = panel.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMobileMenu() {
  DOM.mobileNavPanel?.classList.remove('open');
  DOM.mobileMenuToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
