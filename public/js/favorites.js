/**
 * FoodExpress - Favorites and Purchase History Page Logic
 */

// ==================== STATE & GLOBALS ====================
let cart = JSON.parse(localStorage.getItem('fe_cart')) || [];
let appliedCoupon = JSON.parse(localStorage.getItem('fe_coupon')) || null;
let currentUser = JSON.parse(localStorage.getItem('fe_user')) || null;
let currentToken = localStorage.getItem('fe_token') || null;
let favorites = JSON.parse(localStorage.getItem('fe_favorites')) || [];
let currentTab = 'history'; // 'history' or 'favorites'

let dbCart = {};
let modalActiveProduct = null;

// DOM Elements cache
const DOM = {
  // Theme
  themeToggle: document.getElementById('theme-toggle'),
  
  // Auth
  loginBtn: document.getElementById('login-btn'),
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
  
  // Containers
  historyContainer: document.getElementById('history-products-container'),
  favoritesContainer: document.getElementById('favorite-products-container'),
  
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

  // Orders Modal (Order History)
  ordersModal: document.getElementById('orders-modal'),
  ordersModalClose: document.getElementById('orders-modal-close'),
  ordersListContainer: document.getElementById('orders-list-container'),
  
  // Toast notifications
  toastContainer: document.getElementById('toast-container'),
};

// ==================== UTILITY FUNCTIONS ====================

function formatPrice(number) {
  if (typeof number !== 'number') number = parseFloat(number) || 0;
  return number.toLocaleString('vi-VN') + 'đ';
}

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
  
  setTimeout(() => {
    toast.style.animation = 'slide-in-toast 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

// ==================== INITIALIZATION & THEME ====================

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

async function initApp() {
  // Check saved Dark Mode preference
  if (localStorage.getItem('fe_dark_mode') === 'true') {
    document.body.classList.add('dark-mode');
    DOM.themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    DOM.themeToggle.title = "Chuyển chế độ sáng";
  }

  updateUserUI();
  updateCartBadge();
  
  if (currentUser && currentToken) {
    await syncFavoritesFromDB();
    syncCartFromDB();
  }

  // Load content
  loadTabContent();
}

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

// ==================== TABS NAVIGATION ====================

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.favorites-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  
  const historyPanel = document.getElementById('tab-content-history');
  const favoritesPanel = document.getElementById('tab-content-favorites');
  
  if (tabName === 'history') {
    historyPanel.style.display = 'block';
    favoritesPanel.style.display = 'none';
  } else {
    historyPanel.style.display = 'none';
    favoritesPanel.style.display = 'block';
  }
  
  loadTabContent();
}

function loadTabContent() {
  if (currentTab === 'history') {
    loadHistoryTab();
  } else {
    loadFavoritesTab();
  }
}

// ==================== DYNAMIC DATA FETCHING & RENDERING ====================

async function loadHistoryTab() {
  if (!currentUser) {
    DOM.historyContainer.innerHTML = `
      <div class="login-prompt-box">
        <i class="fa-solid fa-user-clock"></i>
        <h3>Xem lịch sử đặt món</h3>
        <p>Vui lòng đăng nhập để hệ thống có thể hiển thị danh sách các món ngon mà bạn đã từng đặt trước đây.</p>
        <button class="btn btn-primary" onclick="DOM.authModal.classList.add('open')">Đăng Nhập Ngay</button>
      </div>
    `;
    return;
  }

  try {
    DOM.historyContainer.innerHTML = Array(3).fill('<div class="skeleton-card product-skeleton"></div>').join('');
    
    const res = await fetch('/api/sanpham/dathang', {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        handleLogout();
        return;
      }
      throw new Error('Fetch failed');
    }

    const products = await res.json();
    renderProductsList(products, DOM.historyContainer, 'Không có món ăn nào đã đặt trước đó. Hãy khám phá thực đơn và đặt bữa ăn đầu tiên nhé!');

  } catch (err) {
    console.error('Lỗi loadHistoryTab:', err);
    DOM.historyContainer.innerHTML = `
      <div class="empty-cart-view" style="grid-column: 1/-1; padding: 40px; color: var(--danger)">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; margin-bottom: 10px;"></i>
        <p>Lỗi kết nối máy chủ khi tải món đã đặt.</p>
        <button onclick="loadHistoryTab()" class="btn btn-outline btn-sm m-t-20">Thử lại</button>
      </div>
    `;
  }
}

function loadFavoritesTab() {
  if (favorites.length === 0) {
    DOM.favoritesContainer.innerHTML = `
      <div class="empty-cart-view" style="grid-column: 1/-1; padding: 60px;">
        <i class="fa-solid fa-heart-crack" style="font-size: 54px; color: #cbd5e1; margin-bottom: 20px;"></i>
        <p>Danh sách món ăn yêu thích của bạn trống!</p>
        <a href="index.html#menu-section" class="btn btn-primary btn-sm m-t-20">Khám phá menu ngay</a>
      </div>
    `;
    return;
  }

  DOM.favoritesContainer.innerHTML = '';
  renderProductsList(favorites, DOM.favoritesContainer, 'Không có món ăn yêu thích.');
}

function renderProductsList(products, container, emptyMsg) {
  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-view" style="grid-column: 1/-1; padding: 60px;">
        <i class="fa-solid fa-face-frown" style="font-size: 54px; color: #cbd5e1; margin-bottom: 20px;"></i>
        <p>${emptyMsg}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  products.forEach(p => {
    const isOutOfStock = p.SoLuongTon <= 0;
    const stockClass = isOutOfStock ? 'tag-outstock' : 'tag-instock';
    const stockText = isOutOfStock ? 'Hết hàng' : `Còn ${p.SoLuongTon} suất`;
    
    const imgUrl = p.HinhAnh && p.HinhAnh.startsWith('http') 
      ? p.HinhAnh 
      : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
      
    const isFav = favorites.some(fav => fav.SanPhamID === p.SanPhamID);
    
    const pCard = document.createElement('div');
    pCard.className = `product-card ${isOutOfStock ? 'out-of-stock' : ''}`;
    pCard.setAttribute('data-id', p.SanPhamID);

    // Build star rating HTML
    const avg = parseFloat(p.TrungBinhSao) || 0;
    const count = parseInt(p.TongDanhGia) || 0;
    let starsHtml = '';
    if (count > 0) {
      const starIcons = Array.from({length: 5}, (_, i) => {
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
          <button class="btn-add-cart-simple" title="Thêm vào giỏ" ${isOutOfStock ? 'disabled' : ''} onclick="quickAddToCart(event, ${p.SanPhamID}, '${p.TenSanPham.replace(/'/g, "\\'")}', ${p.Gia}, '${imgUrl}', ${p.SoLuongTon})">
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

    container.appendChild(pCard);
  });
}

window.toggleFavorite = async function(e, id, productObj) {
  e.stopPropagation();
  
  const existingIdx = favorites.findIndex(fav => fav.SanPhamID === id);
  const btn = e.currentTarget;
  
  if (existingIdx > -1) {
    // Remove
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
    // Add
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
  
  // Refresh layout
  if (currentTab === 'favorites') {
    loadFavoritesTab();
  } else {
    // Reload history container buttons state
    loadHistoryTab();
  }
};

// ==================== PRODUCT DETAILS MODAL ====================

async function openProductModal(productId) {
  try {
    const res = await fetch(`/api/sanpham/${productId}`);
    if (!res.ok) throw new Error('Cannot fetch product details');
    const product = await res.json();
    
    modalActiveProduct = product;
    
    const imgUrl = product.HinhAnh && product.HinhAnh.startsWith('http') 
      ? product.HinhAnh 
      : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
      
    DOM.modalProductImg.src = imgUrl;
    DOM.modalProductImg.onerror = () => { DOM.modalProductImg.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'; };
    DOM.modalProductCategory.textContent = product.TenDanhMuc || 'Thực Phẩm';
    DOM.modalProductTitle.textContent = product.TenSanPham;
    
    const starsWrapper = document.getElementById('modal-product-stars-wrapper');
    if (starsWrapper) {
      const avg = parseFloat(product.TrungBinhSao) || 0;
      const count = parseInt(product.TongDanhGia) || 0;
      if (count > 0) {
        const starIcons = Array.from({length: 5}, (_, i) => {
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
    
    const isOutOfStock = product.SoLuongTon <= 0;
    DOM.modalProductStockBadge.textContent = isOutOfStock ? 'Tạm Hết Hàng' : 'Đang Bán';
    DOM.modalProductStockBadge.className = `stock-badge ${isOutOfStock ? 'out-of-stock' : ''}`;
    DOM.modalProductStockNum.textContent = isOutOfStock ? 'Quý khách vui lòng chọn món khác' : `Còn lại: ${product.SoLuongTon} phần trong kho`;
    
    DOM.qtyInput.value = 1;
    DOM.qtyInput.setAttribute('max', product.SoLuongTon);
    
    if (isOutOfStock) {
      DOM.modalAddToCartBtn.setAttribute('disabled', 'true');
      DOM.modalAddToCartBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Tạm hết hàng';
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
    
    DOM.productModal.classList.add('open');
    document.body.style.overflow = 'hidden';

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
                Món ăn này chưa có đánh giá nào.
              </div>
            `;
          } else {
            reviewsContainer.innerHTML = '';
            reviews.forEach(rev => {
              const revDate = new Date(rev.NgayTao).toLocaleDateString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
                day: '2-digit', month: '2-digit', year: 'numeric'
              });
              
              const starIcons = Array.from({length: 5}, (_, i) => {
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
          reviewsContainer.innerHTML = `<div style="text-align: center; padding: 10px; color: var(--danger); font-size: 13px;">Không thể tải đánh giá.</div>`;
        }
      } catch (revErr) {
        console.error(revErr);
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

// Adjust quantity
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

DOM.modalAddToCartBtn.addEventListener('click', () => {
  if (!modalActiveProduct) return;
  const qty = parseInt(DOM.qtyInput.value) || 1;
  
  const imgUrl = modalActiveProduct.HinhAnh && modalActiveProduct.HinhAnh.startsWith('http') 
    ? modalActiveProduct.HinhAnh 
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
    
  addToCart(modalActiveProduct.SanPhamID, modalActiveProduct.TenSanPham, modalActiveProduct.Gia, imgUrl, modalActiveProduct.SoLuongTon, qty);
  closeProductModal();
});

window.quickAddToCart = function(e, id, name, price, img, maxStock) {
  e.stopPropagation();
  if (maxStock <= 0) {
    showToast('Món ăn đã hết hàng!', 'error');
    return;
  }
  addToCart(id, name, price, img, maxStock, 1);
};

// ==================== GIỎ HÀNG (HYBRID CART) ====================

async function addToCart(id, name, price, image, stock, qty = 1) {
  const existingItemIndex = cart.findIndex(item => item.id === id);

  if (existingItemIndex > -1) {
    const newQty = cart[existingItemIndex].qty + qty;
    if (newQty > stock) {
      showToast(`Không đủ số lượng! Đang có ${cart[existingItemIndex].qty} phần, tối đa ${stock} phần.`, 'warning');
      return;
    }
    cart[existingItemIndex].qty = newQty;
  } else {
    if (qty > stock) {
      showToast(`Chỉ còn ${stock} phần!`, 'warning');
      return;
    }
    cart.push({ id, name, price: parseFloat(price), image, stock: parseInt(stock), qty });
  }

  localStorage.setItem('fe_cart', JSON.stringify(cart));
  updateCartBadge();

  if (currentUser && currentToken) {
    try {
      const res = await fetch('/api/giohang/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
        body: JSON.stringify({ NguoiDungID: currentUser.NguoiDungID, SanPhamID: id, SoLuong: qty })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.ChiTietGioHangID) {
          dbCart[id] = data.data.ChiTietGioHangID;
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }
  showToast(`Đã thêm ${qty} phần ${name} vào giỏ! 🛒`, 'success');
}

function updateCartBadge() {
  const totalItemsCount = cart.reduce((total, item) => total + item.qty, 0);
  DOM.cartCountBadge.textContent = totalItemsCount;
  DOM.cartCountBadge.style.display = totalItemsCount > 0 ? 'flex' : 'none';
}

DOM.cartBtn.addEventListener('click', () => {
  renderCart();
  DOM.cartModal.classList.add('open');
});

DOM.cartModalClose.addEventListener('click', () => {
  DOM.cartModal.classList.remove('open');
});

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
    itemCard.className = 'cart-item';
    itemCard.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <span class="cart-item-price">${formatPrice(item.price)}</span>
      </div>
      <div class="cart-item-actions">
        <span class="btn-delete-cart-item" onclick="deleteCartItem(${item.id})"><i class="fa-regular fa-trash-can"></i> Xóa</span>
        <div class="cart-qty-selector">
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
          <input type="number" value="${item.qty}" readonly>
          <button class="cart-qty-btn" onclick="updateCartItemQty(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    `;
    DOM.cartItemsContainer.appendChild(itemCard);
  });

  calculateCartSummary();
}

window.deleteCartItem = async function(id) {
  const item = cart.find(i => i.id === id);
  cart = cart.filter(i => i.id !== id);
  localStorage.setItem('fe_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
  if (item) showToast(`Đã xóa ${item.name} khỏi giỏ.`, 'info');

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
        console.warn(err);
      }
    }
  }
};

window.updateCartItemQty = async function(id, direction) {
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
      console.warn(err);
    }
  }
};

async function syncCartFromDB() {
  if (!currentUser || !currentToken) return;

  try {
    const res = await fetch(`/api/giohang/${currentUser.NguoiDungID}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    // Xử lý token hết hạn
    if (res.status === 401 || res.status === 403) {
      console.warn('Token hết hạn khi đồng bộ giỏ hàng. Bỏ qua.');
      return;
    }
    if (!res.ok) return;

    const data = await res.json();
    const dbItems = (data.data && data.data.ChiTiet) || [];

    if (dbItems.length > 0) {
      dbCart = {};
      cart = dbItems.map(item => {
        dbCart[item.SanPhamID] = item.ChiTietGioHangID;
        return {
          id: item.SanPhamID,
          name: item.TenSanPham,
          price: parseFloat(item.Gia),
          image: item.HinhAnh,
          stock: item.SoLuongTon,
          qty: item.SoLuong
        };
      });
      localStorage.setItem('fe_cart', JSON.stringify(cart));
      updateCartBadge();
    }
  } catch (err) {
    console.warn('Lỗi đồng bộ giỏ hàng:', err.message);
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
      const syncRes = await fetch('/api/yeuthich/dongbo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ sanPhamIds: ids })
      });
      // Nếu token hết hạn, bỏ qua yêu thích sync
      if (syncRes.status === 401 || syncRes.status === 403) return;
    }

    // 2. Lấy danh sách mới nhất từ DB về
    const res = await fetch('/api/yeuthich', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (res.status === 401 || res.status === 403) return; // Token hết hạn, bỏ qua

    if (res.ok) {
      const dbFavorites = await res.json();
      favorites = dbFavorites;
      localStorage.setItem('fe_favorites', JSON.stringify(favorites));
    }
  } catch (err) {
    console.warn('Đồng bộ danh sách yêu thích thất bại:', err.message);
  }
}

function calculateCartSummary() {
  const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  DOM.cartSubtotal.textContent = formatPrice(subtotal);
  
  let discount = 0;
  
  if (appliedCoupon) {
    DOM.appliedCouponStatus.style.display = 'flex';
    DOM.couponInput.style.display = 'none';
    DOM.applyCouponBtn.style.display = 'none';
    DOM.couponTagName.textContent = appliedCoupon.code;
    
    if (subtotal < appliedCoupon.minVal) {
      discount = 0;
      DOM.couponDiscountValue.innerHTML = `<span class="text-danger" style="font-size: 11px;">Thiếu đơn tối thiểu ${formatPrice(appliedCoupon.minVal)}</span>`;
      DOM.cartDiscountRow.style.display = 'none';
    } else {
      if (appliedCoupon.percent > 0) {
        discount = (subtotal * appliedCoupon.percent) / 100;
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

// APPLY PROMOTION
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MaKhuyenMai: code, TongTien: subtotal })
    });

    const result = await res.json();
    
    if (res.status === 200) {
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
      showToast(result.message || 'Mã giảm giá không hợp lệ!', 'error');
    }

  } catch (err) {
    showToast('Lỗi máy chủ khi áp dụng mã giảm giá!', 'error');
  } finally {
    DOM.applyCouponBtn.textContent = 'Áp dụng';
    DOM.applyCouponBtn.removeAttribute('disabled');
  }
});

DOM.removeCouponBtn.addEventListener('click', () => {
  appliedCoupon = null;
  localStorage.removeItem('fe_coupon');
  calculateCartSummary();
  showToast('Đã hủy áp dụng mã giảm giá.', 'info');
});

// CHECKOUT REDIRECT TO HOME PAGE WITH FLAG
DOM.checkoutBtn.addEventListener('click', () => {
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

  // Set checkout redirect flag, and go back to index.html which handles it beautifully!
  sessionStorage.setItem('fe_delivery_address', currentUser.DiaChi || '');
  sessionStorage.setItem('fe_checkout_temp_phone', currentUser.SoDienThoai || '');
  sessionStorage.setItem('fe_checkout_from_favorites', 'true');
  
  // Go to homepage with checkout query parameter
  window.location.href = 'index.html?action=checkout';
});

// ==================== AUTHENTICATION MANAGEMENT ====================

DOM.loginBtn.addEventListener('click', () => {
  DOM.authModal.classList.add('open');
});

DOM.authModalClose.addEventListener('click', () => {
  DOM.authModal.classList.remove('open');
});

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TenDangNhap: username, MatKhau: password })
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

      await syncFavoritesFromDB();
      syncCartFromDB();
      loadTabContent(); // Reload tabs since user logged in!
    } else {
      showToast(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!', 'error');
    }

  } catch (err) {
    showToast('Máy chủ xác thực không phản hồi!', 'error');
  } finally {
    const submitBtn = DOM.loginForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Đăng Nhập';
    submitBtn.removeAttribute('disabled');
  }
});

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        VaiTroID: 2,
        HoTen: fullname,
        TenDangNhap: username,
        MatKhau: password,
        Email: email,
        SoDienThoai: phone,
        DiaChi: '123 Đường Xuân Thủy, Cầu Giấy, Hà Nội'
      })
    });

    const data = await res.json();
    
    if (res.status === 201 || res.status === 200) {
      showToast('Đăng ký tài khoản thành công! Đang tự động đăng nhập...', 'success');
      
      document.getElementById('login-username').value = username;
      document.getElementById('login-password').value = password;
      DOM.tabLoginBtn.click();
      DOM.loginForm.dispatchEvent(new Event('submit'));
      DOM.registerForm.reset();
    } else {
      showToast(data.message || 'Lỗi đăng ký tài khoản mới!', 'error');
    }

  } catch (err) {
    showToast('Có lỗi xảy ra khi tạo tài khoản!', 'error');
  } finally {
    const submitBtn = DOM.registerForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Đăng Ký Tài Khoản';
    submitBtn.removeAttribute('disabled');
  }
});

function updateUserUI() {
  if (currentUser) {
    DOM.loginBtn.style.display = 'none';
    DOM.profileDropdown.style.display = 'block';
    DOM.usernameDisplay.textContent = currentUser.HoTen.split(' ').pop();
    
    const adminBtn = document.getElementById('menu-admin-btn');
    if (adminBtn) {
      adminBtn.style.display = currentUser.VaiTroID === 1 ? 'flex' : 'none';
    }
  } else {
    DOM.loginBtn.style.display = 'flex';
    DOM.profileDropdown.style.display = 'none';
  }
}

DOM.profileTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  DOM.profileDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
  DOM.profileDropdown.classList.remove('open');
});

DOM.logoutBtn.addEventListener('click', handleLogout);

function handleLogout() {
  currentUser = null;
  currentToken = null;
  appliedCoupon = null;
  dbCart = {};
  favorites = [];
  localStorage.removeItem('fe_user');
  localStorage.removeItem('fe_token');
  localStorage.removeItem('fe_coupon');
  localStorage.removeItem('fe_favorites');
  
  updateUserUI();
  calculateCartSummary();
  showToast('Đã đăng xuất khỏi hệ thống thành công!', 'info');
  loadTabContent(); // Reload tabs since user logged out!
}

// ==================== PROFILE MODAL & EDIT ====================

document.getElementById('menu-profile-btn').addEventListener('click', (e) => {
  e.preventDefault();
  openProfileModal();
});

function openProfileModal() {
  if (!currentUser) return;
  
  DOM.profileFullname.value = currentUser.HoTen;
  DOM.profileEmail.value = currentUser.Email || '';
  DOM.profilePhone.value = currentUser.SoDienThoai || '';
  DOM.profileAddress.value = currentUser.DiaChi || '';
  
  DOM.profileDisplayName.textContent = currentUser.HoTen;
  DOM.profileDisplayUsername.textContent = `@${currentUser.TenDangNhap}`;
  DOM.profileRoleBadge.textContent = currentUser.VaiTroID === 1 ? 'Quản trị viên' : 'Khách hàng';
  
  DOM.profileModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

DOM.profileModalClose.addEventListener('click', () => {
  DOM.profileModal.classList.remove('open');
  document.body.style.overflow = '';
});

DOM.togglePwdFieldsBtn.addEventListener('click', () => {
  const isHidden = DOM.passwordChangeFields.style.display === 'none';
  DOM.passwordChangeFields.style.display = isHidden ? 'block' : 'none';
});

// Profile Form Submit
DOM.profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullname = DOM.profileFullname.value.trim();
  const email = DOM.profileEmail.value.trim();
  const phone = DOM.profilePhone.value.trim();
  const address = DOM.profileAddress.value.trim();
  const newPassword = DOM.profileNewPassword.value.trim();
  
  const updateBody = {
    HoTen: fullname,
    Email: email,
    SoDienThoai: phone,
    DiaChi: address
  };
  
  if (newPassword) {
    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải chứa ít nhất 6 ký tự!', 'warning');
      return;
    }
    updateBody.MatKhau = newPassword;
  }
  
  try {
    DOM.profileSaveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    DOM.profileSaveBtn.setAttribute('disabled', 'true');
    
    const res = await fetch(`/api/nguoidung/${currentUser.NguoiDungID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(updateBody)
    });
    
    const data = await res.json();
    
    if (res.status === 200) {
      currentUser = data.data;
      localStorage.setItem('fe_user', JSON.stringify(currentUser));
      updateUserUI();
      DOM.profileModal.classList.remove('open');
      document.body.style.overflow = '';
      showToast('Cập nhật thông tin tài khoản thành công!', 'success');
      
      // Reset password fields
      DOM.profileNewPassword.value = '';
      DOM.passwordChangeFields.style.display = 'none';
    } else {
      showToast(data.message || 'Lỗi khi cập nhật thông tin!', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Không thể kết nối máy chủ để cập nhật!', 'error');
  } finally {
    DOM.profileSaveBtn.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Lưu Thay Đổi';
    DOM.profileSaveBtn.removeAttribute('disabled');
  }
});

// ==================== SEARCH / REDIRECT LOGIC ====================

function handleSearch() {
  const keyword = DOM.searchInput.value.trim();
  if (keyword) {
    // Redirect to index.html with query param
    window.location.href = `index.html?search=${encodeURIComponent(keyword)}`;
  } else {
    window.location.href = 'index.html';
  }
}

DOM.searchBtn.addEventListener('click', handleSearch);
DOM.searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// ==================== ORDER HISTORY IN OVERLAY ====================

document.getElementById('menu-orders-btn').addEventListener('click', (e) => {
  e.preventDefault();
  openOrdersModal();
});

function openOrdersModal() {
  if (!currentUser) return;
  DOM.ordersModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  fetchOrdersHistory();
}

DOM.ordersModalClose.addEventListener('click', () => {
  DOM.ordersModal.classList.remove('open');
  document.body.style.overflow = '';
});

async function fetchOrdersHistory() {
  try {
    DOM.ordersListContainer.innerHTML = Array(3).fill('<div class="skeleton-card promotion-skeleton" style="height:80px;margin-bottom:10px;"></div>').join('');
    
    const res = await fetch('/api/hoadon', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    
    if (!res.ok) throw new Error('Failed');
    const orders = await res.json();
    
    if (orders.length === 0) {
      DOM.ordersListContainer.innerHTML = `
        <div class="empty-orders-view">
          <i class="fa-solid fa-receipt empty-icon"></i>
          <p>Bạn chưa có đơn hàng nào!</p>
        </div>
      `;
      return;
    }
    
    DOM.ordersListContainer.innerHTML = '';
    orders.forEach(o => {
      const orderDate = new Date(o.NgayDat).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      const item = document.createElement('div');
      item.className = 'order-history-card';
      item.style.padding = '15px';
      item.style.border = '1px solid var(--border-light)';
      item.style.borderRadius = '12px';
      item.style.marginBottom = '12px';
      item.style.background = 'var(--bg-card)';
      
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
          <strong>Đơn hàng: HD${o.HoaDonID}</strong>
          <span class="status-badge" style="background:var(--primary-light); color:var(--primary); padding:3px 8px; border-radius:12px; font-size:12px;">${o.TrangThai}</span>
        </div>
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Ngày đặt: ${orderDate}</div>
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">Tổng tiền: <span class="text-primary" style="font-weight:700;">${formatPrice(o.TongTien)}</span></div>
        <div style="font-size:13px; color:var(--text-muted);">Phương thức TT: ${o.PhuongThuc} - Trạng thái: ${o.TrangThaiThanhToan}</div>
      `;
      DOM.ordersListContainer.appendChild(item);
    });
  } catch (err) {
    DOM.ordersListContainer.innerHTML = `<div class="text-danger" style="text-align:center;padding:20px;">Lỗi khi tải lịch sử đơn hàng.</div>`;
  }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
  DOM.themeToggle.addEventListener('click', toggleTheme);
  
  DOM.productModalClose.addEventListener('click', closeProductModal);
  DOM.productModal.addEventListener('click', (e) => {
    if (e.target === DOM.productModal) closeProductModal();
  });
  
  // Tabs click
  document.querySelectorAll('.favorites-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });
}
