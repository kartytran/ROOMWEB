/**
 * ============================================================
 * Thảo Anh Apartment – Căn Hộ Dịch Vụ Đà Lạt
 * app.js – Vanilla JS (ES6+) | Apify Facebook API Integrated
 * ============================================================
 */

'use strict';

/* ============================================================
   APIFY DATASET CONFIGURATION & LIVE SYNC
   ============================================================ */
const APIFY_DATASET_URL = 'https://api.apify.com/v2/datasets/mNdadBFYxuYndWdbl/items?signature=MC4xNzk0ODE0MzE1ODkwLkduc3dVS1lmdllUWFVJTnBMYzBM&format=json&clean=true';
const CACHE_APIFY_KEY = 'thaoanh_apify_cached_posts';
const STORAGE_CUSTOM_KEY = 'thaoanh_custom_posts';
const ADMIN_STORAGE_KEY = 'thaoanh_admin_logged';
const VALID_PASSWORDS = ['admin123', 'thaoanh', 'thaoanh2024', '123456'];

/* ============================================================
   FURNITURE DICTIONARY (QUÉT NỘI THẤT TỰ ĐỘNG)
   ============================================================ */
const FURNITURE_DICTIONARY = [
  { kw: /sofa/i, label: 'Sofa tiếp khách' },
  { kw: /bàn trà/i, label: 'Bàn trà' },
  { kw: /bàn ăn/i, label: 'Bàn ăn & ghế' },
  { kw: /bàn làm việc/i, label: 'Bàn làm việc' },
  { kw: /bàn trang điểm/i, label: 'Bàn trang điểm' },
  { kw: /giường/i, label: 'Giường nệm cao cấp' },
  { kw: /nệm|đệm/i, label: 'Nệm êm ái' },
  { kw: /chăn ga/i, label: 'Chăn ga gối đầy đủ' },
  { kw: /tủ quần áo|tủ áo/i, label: 'Tủ quần áo' },
  { kw: /tủ lạnh/i, label: 'Tủ lạnh' },
  { kw: /máy giặt/i, label: 'Máy giặt riêng' },
  { kw: /máy sấy/i, label: 'Máy sấy quần áo' },
  { kw: /sân phơi/i, label: 'Sân phơi đồ rộng' },
  { kw: /bếp từ|bếp điện|bếp ga|bếp tiện nghi|bếp/i, label: 'Bếp nấu riêng' },
  { kw: /hút mùi/i, label: 'Máy hút mùi' },
  { kw: /lò vi sóng/i, label: 'Lò vi sóng' },
  { kw: /bình nóng lạnh|nóng lạnh|nước nóng/i, label: 'Bình tắm nóng lạnh' },
  { kw: /máy sưởi|quạt sưởi/i, label: 'Máy sưởi ấm' },
  { kw: /máy lạnh|điều hòa/i, label: 'Máy lạnh' },
  { kw: /tivi|tv|smart tv/i, label: 'Smart TV' },
  { kw: /ban công/i, label: 'Ban công thoáng mát' },
  { kw: /view đồi|view thung lũng|view đẹp|ngắm cảnh/i, label: 'View đồi Đà Lạt' },
  { kw: /cửa sổ/i, label: 'Cửa sổ đón nắng' },
  { kw: /ô tô|bãi đậu ô tô|đậu xe|chỗ để xe|bãi xe/i, label: 'Đường rộng ô tô ra vào' },
  { kw: /wifi|internet/i, label: 'Wifi tốc độ cao' },
  { kw: /hoa tươi|hoa/i, label: 'Hoa tươi trang trí' },
  { kw: /khóa vân tay|thẻ từ/i, label: 'Khóa cửa vân tay an ninh' },
  { kw: /an ninh|camera/i, label: 'An ninh tốt, giờ tự do' },
  { kw: /full nội thất/i, label: 'Full nội thất cao cấp' },
];

/* ============================================================
   TRANSFORM APIFY ITEM TO APARTMENT OBJECT
   ============================================================ */
function formatRelativeTime(isoString) {
  if (!isoString) return 'Vừa xong';
  const diff = (Date.now() - new Date(isoString)) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff/60))} phút trước`;
  if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff/86400)} ngày trước`;
  return new Date(isoString).toLocaleDateString('vi-VN');
}

function transformApifyItem(item) {
  const text = item.text || '';
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Tiêu đề
  let title = lines.find(l => l.replace(/[\p{Emoji}\s#*_\-]/gu, '').length > 8) || lines[0] || 'Căn hộ Thảo Anh Apartment Đà Lạt';
  title = title.replace(/^[📍🏠✨🔥💥📌🌟📢💵•\-\s]+/, '').trim();

  // 2. Mức giá
  let price = 'Liên hệ';
  let priceNum = 0;

  const pricePatterns = [
    /(\d+)\s*(?:tr|triệu)\s*(\d+)/i, // 4tr5 -> 4.500.000
    /(\d+[.,]?\d*)\s*(?:triệu|tr)\b/i, // 3tr2, 5tr, 3.5 triệu
    /(\d{1,3}(?:[.,]\d{3}){1,2})/,
    /(\d+[.,]\d{3})\s*(?:đ|vnd|vnđ)/i,
  ];

  for (const re of pricePatterns) {
    const m = text.match(re);
    if (m) {
      if (m[2]) {
        price = `${m[1]}.${m[2]}00.000`;
        priceNum = parseFloat(`${m[1]}.${m[2]}`);
      } else {
        let val = m[1].replace(/,/g, '.');
        if (/triệu|tr/i.test(m[0])) {
          const num = parseFloat(val);
          price = (num * 1_000_000).toLocaleString('vi-VN').replace(/\./g, '.');
          priceNum = num;
        } else {
          price = val;
          const cleaned = val.replace(/[^\d]/g, '');
          priceNum = cleaned ? parseFloat(cleaned) / 1000000 : 0;
        }
      }
      break;
    }
  }

  // 3. Cơ sở tại Đà Lạt (4 cơ sở chính)
  let district = '61/18 Phù Đổng';
  let address = 'TP. Đà Lạt, Lâm Đồng';

  if (/61\/18\s*phù đổng|phù đổng thiên vương.*18/i.test(text)) {
    district = '61/18 Phù Đổng';
    address = '61/18 Phù Đổng Thiên Vương, Phường 8, TP. Đà Lạt';
  } else if (/61\/7\s*phù đổng|phù đổng thiên vương.*7/i.test(text)) {
    district = '61/7 Phù Đổng';
    address = '61/7 Phù Đổng Thiên Vương, Phường 8, TP. Đà Lạt';
  } else if (/61\/19\s*phù đổng/i.test(text)) {
    district = '61/18 Phù Đổng';
    address = '61/19 Phù Đổng Thiên Vương, Phường 8, TP. Đà Lạt';
  } else if (/ngô thì sỹ|ngô thỳ sỹ|74d/i.test(text)) {
    district = 'Ngô Thì Sỹ';
    address = '74D Ngô Thì Sỹ, Phường 4, TP. Đà Lạt';
  } else if (/nguyễn trung trực|f2\s*-\s*c5|f2-c5/i.test(text)) {
    district = 'Nguyễn Trung Trực';
    address = 'F2 - C5 Nguyễn Trung Trực, Phường 4, TP. Đà Lạt';
  } else {
    // Trích xuất dòng địa chỉ nếu có
    const addrLine = lines.find(l => /địa chỉ|tại/i.test(l));
    if (addrLine) {
      address = addrLine.replace(/^[📍Địa chỉ:\s]+/i, '').trim();
    }
  }

  // 4. Loại phòng
  let roomType = '1PN';
  if (/2\s*phòng|2\s*pn|2pn/i.test(text)) {
    roomType = '2PN';
  } else if (/studio|gác lửng|phòng trọ/i.test(text)) {
    roomType = 'Studio';
  }

  // 5. Diện tích
  let area = roomType === '2PN' ? '50 m²' : (roomType === 'Studio' ? '30 m²' : '38 m²');
  const areaMatch = text.match(/(\d+)\s*(?:m2|m²|mét vuông)/i);
  if (areaMatch) {
    area = `${areaMatch[1]} m²`;
  }

  // 6. Quét nội thất thực tế từ bài viết
  const amenities = [];
  FURNITURE_DICTIONARY.forEach(({ kw, label }) => {
    if (kw.test(text) && !amenities.includes(label)) {
      amenities.push(label);
    }
  });
  if (!amenities.length) {
    amenities.push('Full nội thất cao cấp', 'Bình tắm nóng lạnh', 'Bếp nấu riêng', 'Wifi tốc độ cao');
  }

  // 7. Hình ảnh
  let images = [];
  if (Array.isArray(item.images) && item.images.length) {
    images = item.images;
  } else if (Array.isArray(item.media)) {
    item.media.forEach(m => {
      const u = m.image?.uri || m.thumbnail;
      if (u && !images.includes(u)) images.push(u);
    });
  }
  if (!images.length) {
    images.push('dalat-sample.png');
  }

  return {
    id: String(item.postId || `apify_${Math.random()}`),
    title,
    price,
    priceNum,
    address,
    district,
    roomType,
    specs: [
      { icon: '📐', label: area },
      { icon: '🛏', label: roomType },
      { icon: '🚿', label: '1 Phòng tắm' },
      { icon: '🏢', label: 'Thảo Anh' },
    ],
    amenities,
    description: text,
    imageUrl: images[0],
    images,
    tag: priceNum > 0 && priceNum <= 4 ? 'Giá rẻ' : (priceNum >= 5 ? 'Cao cấp' : 'Thảo Anh'),
    postedTime: formatRelativeTime(item.time),
    fbUrl: item.url || 'https://www.facebook.com/ThaoAnhApartment',
    likes: item.likes || 0,
    source: 'facebook',
  };
}

/* ============================================================
   POSTS DATA STORE & MERGE
   ============================================================ */
let apifyPosts = [];

// Khởi tạo apifyPosts từ apify-data.js (đã có sẵn 38 bài)
if (typeof APIFY_INITIAL_POSTS !== 'undefined' && Array.isArray(APIFY_INITIAL_POSTS)) {
  apifyPosts = APIFY_INITIAL_POSTS.map(transformApifyItem);
}

function getCustomPosts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CUSTOM_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCustomPosts(posts) {
  try {
    localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(posts));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

function getAllPosts() {
  return [...getCustomPosts(), ...apifyPosts];
}

let activeData = getAllPosts();

/* ============================================================
   APIFY LIVE FETCH (CẬP NHẬT TỰ ĐỘNG)
   ============================================================ */
async function fetchApifyLive(isManual = false) {
  const syncBtn = $('#btnSyncApify');
  const syncBadge = $('#apifySyncStatus');

  if (isManual && syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '⏳ Đang tải từ Apify...';
  }

  try {
    const response = await fetch(APIFY_DATASET_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rawItems = Array.isArray(data) ? data : (data.value || []);

    if (rawItems.length > 0) {
      apifyPosts = rawItems
        .filter(it => it.text && it.text.trim().length > 10)
        .map(transformApifyItem);

      try {
        localStorage.setItem(CACHE_APIFY_KEY, JSON.stringify(apifyPosts));
      } catch (_) {}

      activeData = getAllPosts();
      renderCards(activeData);

      if (syncBadge) {
        syncBadge.textContent = `⚡ Apify Live: ${apifyPosts.length} bài đã tải`;
      }
      if (isManual) {
        showToast(`🎉 Đã đồng bộ thành công ${apifyPosts.length} bài viết mới nhất từ Facebook!`);
      }
    }
  } catch (err) {
    console.warn('[Apify Fetch Warning]', err.message, 'Using bundled/cached dataset.');
    // Thử load từ cache localStorage nếu có
    try {
      const cached = localStorage.getItem(CACHE_APIFY_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          apifyPosts = parsed;
          activeData = getAllPosts();
          renderCards(activeData);
        }
      }
    } catch (_) {}

    if (syncBadge) {
      syncBadge.textContent = `⚡ Đang hiển thị ${apifyPosts.length} bài từ Fanpage`;
    }
    if (isManual) {
      showToast('Đang hiển thị 38 bài đăng thực tế từ Fanpage Thảo Anh.');
    }
  } finally {
    if (isManual && syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<span class="btn-icon">🔄</span> Đồng bộ Apify Live';
    }
  }
}

/* ============================================================
   DOM HELPERS & REFERENCES
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const listingGrid    = $('#listingGrid');
const emptyState     = $('#emptyState');
const resultCount    = $('#resultCount');
const filterDistrict = $('#filterDistrict');
const filterPrice    = $('#filterPrice');
const filterRoom     = $('#filterRoom');
const applyFilter    = $('#applyFilter');
const resetFilter    = $('#resetFilter');

const modalOverlay   = $('#modalOverlay');
const modalClose     = $('#modalClose');
const header         = $('#header');
const navToggle      = $('#navToggle');
const nav            = $('#nav');

/* ============================================================
   ADMIN AUTHENTICATION MODULE
   ============================================================ */
function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
}

function applyAdminState() {
  const isLogged = isAdminLoggedIn();
  const adminLoginBtn = $('#adminLoginBtn');
  const adminLoggedBadge = $('#adminLoggedBadge');
  const fbSmartPanel = $('#fbSmartPanel');

  if (isLogged) {
    document.body.classList.add('is-admin');
    if (adminLoginBtn) adminLoginBtn.classList.add('hidden');
    if (adminLoggedBadge) adminLoggedBadge.classList.remove('hidden');
    if (fbSmartPanel) fbSmartPanel.classList.remove('hidden');
  } else {
    document.body.classList.remove('is-admin');
    if (adminLoginBtn) adminLoginBtn.classList.remove('hidden');
    if (adminLoggedBadge) adminLoggedBadge.classList.add('hidden');
    if (fbSmartPanel) fbSmartPanel.classList.add('hidden');
  }
}

function initAdminAuth() {
  const adminLoginBtn     = $('#adminLoginBtn');
  const adminLogoutBtn    = $('#adminLogoutBtn');
  const adminModalOverlay = $('#adminModalOverlay');
  const adminModalClose   = $('#adminModalClose');
  const adminLoginForm   = $('#adminLoginForm');
  const adminPassword    = $('#adminPassword');

  if (!adminModalOverlay) return;

  function openAdminModal() {
    adminModalOverlay.classList.add('active');
    document.body.classList.add('modal-open');
    if (adminPassword) {
      adminPassword.value = '';
      setTimeout(() => adminPassword.focus(), 200);
    }
  }

  function closeAdminModal() {
    adminModalOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  if (adminLoginBtn) adminLoginBtn.addEventListener('click', openAdminModal);
  if (adminModalClose) adminModalClose.addEventListener('click', closeAdminModal);
  adminModalOverlay.addEventListener('click', (e) => {
    if (e.target === adminModalOverlay) closeAdminModal();
  });

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPass = (adminPassword.value || '').trim();

      if (VALID_PASSWORDS.includes(enteredPass)) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        applyAdminState();
        closeAdminModal();
        showToast('🛡️ Đăng nhập quyền Admin thành công!');
      } else {
        alert('Mật khẩu không đúng! Mật khẩu mặc định là: admin123');
        adminPassword.focus();
        adminPassword.select();
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      applyAdminState();
      showToast('Đã đăng xuất quyền Admin.');
    });
  }

  applyAdminState();
}

/* ============================================================
   RENDER CARDS
   ============================================================ */
function formatPrice(price) {
  if (price === 'Liên hệ') return `<span>Liên hệ</span>`;
  return `${price} <span>VNĐ/tháng</span>`;
}

function createCard(apt) {
  const article = document.createElement('article');
  article.className = 'card animate-in';
  article.setAttribute('tabindex', '0');
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `Xem chi tiết: ${apt.title}`);
  article.dataset.id = apt.id;
  if (apt.source) article.dataset.source = apt.source;

  const specsHTML = (apt.specs || [])
    .map(s => `<span class="card__spec">${s.icon} ${s.label}</span>`)
    .join('');

  // Huy hiệu đếm số lượng ảnh
  const imgCountHTML = (apt.images && apt.images.length > 1)
    ? `<span class="card__img-count">📷 ${apt.images.length} ảnh</span>`
    : '';

  // Nút xoá (chỉ hiện khi là admin và là bài tự thêm)
  const deleteBtnHTML = apt.isCustom
    ? `<button class="card__delete-btn" title="Xóa căn hộ này" aria-label="Xóa căn hộ">✕</button>`
    : '';

  article.innerHTML = `
    <div class="card__img-wrap">
      <img
        class="card__img"
        src="${apt.imageUrl}"
        alt="${apt.title}"
        loading="lazy"
        onerror="this.src='dalat-sample.png'"
      />
      <span class="card__tag">${apt.tag || 'Thảo Anh'}</span>
      ${imgCountHTML}
      ${deleteBtnHTML}
      <span class="card__fav" title="Yêu thích" role="button" aria-label="Thêm vào yêu thích">🤍</span>
    </div>
    <div class="card__body">
      <p class="card__price">${formatPrice(apt.price)}</p>
      <h3 class="card__title">${apt.title}</h3>
      <p class="card__address">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        ${apt.address}
      </p>
      <div class="card__specs">${specsHTML}</div>
    </div>
    <div class="card__footer">
      <span class="card__time">🕐 ${apt.postedTime || 'Vừa xong'}</span>
      <span class="card__cta">Xem chi tiết →</span>
    </div>
  `;

  const delBtn = article.querySelector('.card__delete-btn');
  if (delBtn) {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Bạn có chắc muốn xoá căn hộ "${apt.title}"?`)) {
        deleteCustomPost(apt.id);
      }
    });
  }

  article.querySelector('.card__fav').addEventListener('click', handleFavToggle);

  article.addEventListener('click', (e) => {
    if (e.target.closest('.card__fav') || e.target.closest('.card__delete-btn')) return;
    openModal(apt.id);
  });

  article.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(apt.id);
    }
  });

  return article;
}

function renderCards(data) {
  listingGrid.innerHTML = '';

  if (!data.length) {
    emptyState.classList.remove('hidden');
    resultCount.textContent = '';
    return;
  }

  emptyState.classList.add('hidden');
  resultCount.textContent = `Đang hiển thị ${data.length} căn hộ từ Fanpage Thảo Anh Apartment Đà Lạt`;

  const fragment = document.createDocumentFragment();
  data.forEach(apt => fragment.appendChild(createCard(apt)));
  listingGrid.appendChild(fragment);
}

function handleFavToggle(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const isFav = btn.textContent === '❤️';
  btn.textContent = isFav ? '🤍' : '❤️';
  btn.title = isFav ? 'Yêu thích' : 'Bỏ yêu thích';
}

/* ============================================================
   FILTER LOGIC
   ============================================================ */
function applyFilters() {
  const branch     = filterDistrict.value;
  const priceRange = filterPrice.value;
  const roomType   = filterRoom.value;

  activeData = getAllPosts().filter(apt => {
    // Branch filter
    if (branch && !apt.district.includes(branch) && !apt.address.includes(branch)) {
      return false;
    }

    // Price filter
    if (priceRange) {
      if (priceRange === '0-4' && apt.priceNum >= 4) return false;
      if (priceRange === '4-5' && (apt.priceNum < 4 || apt.priceNum > 5)) return false;
      if (priceRange === '5-7' && (apt.priceNum < 5 || apt.priceNum > 7)) return false;
      if (priceRange === '7+' && apt.priceNum < 7) return false;
    }

    // Room filter
    if (roomType && apt.roomType !== roomType) return false;

    return true;
  });

  renderCards(activeData);
  $('#listings').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

applyFilter.addEventListener('click', applyFilters);

if (resetFilter) {
  resetFilter.addEventListener('click', () => {
    filterDistrict.value = '';
    filterPrice.value = '';
    filterRoom.value = '';
    activeData = getAllPosts();
    renderCards(activeData);
  });
}

[filterDistrict, filterPrice, filterRoom].forEach(sel => {
  sel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyFilters();
  });
});

/* ============================================================
   MODAL CHI TIẾT & ALBUM ẢNH
   ============================================================ */
function openModal(id) {
  const apt = getAllPosts().find(a => String(a.id) === String(id));
  if (!apt) return;

  const modalImg = $('#modalImg');
  modalImg.src = apt.imageUrl;
  modalImg.alt = apt.title;
  modalImg.style.opacity = '0';

  $('#modalPrice').innerHTML = apt.price === 'Liên hệ'
    ? 'Liên hệ'
    : `${apt.price} VNĐ<small style="font-size:.6em;font-weight:500;color:var(--clr-text-muted)">/tháng</small>`;

  $('#modalTag').textContent = apt.tag || 'Thảo Anh';
  $('#modalTitle').textContent = apt.title;
  $('#modalAddressText').textContent = apt.address;
  $('#modalBadge').textContent = apt.tag || 'Thảo Anh';

  // Specs
  $('#modalSpecs').innerHTML = (apt.specs || [])
    .map(s => `<span class="modal__spec">${s.icon} ${s.label}</span>`)
    .join('');

  // Nội thất thực tế
  const amenitiesList = (apt.amenities && apt.amenities.length)
    ? apt.amenities
    : ['Full nội thất cao cấp', 'Bình tắm nóng lạnh', 'Bếp nấu riêng', 'Wifi'];

  $('#modalAmenities').innerHTML = amenitiesList
    .map(a => `<span class="modal__amenity">✓ ${a}</span>`)
    .join('');

  // Description
  $('#modalDescription').textContent = apt.description;

  // Album ảnh thu nhỏ (Gallery thumbnails)
  const thumbsBox = $('#modalThumbnails');
  if (thumbsBox) {
    thumbsBox.innerHTML = '';
    if (apt.images && apt.images.length > 1) {
      thumbsBox.classList.remove('hidden');
      apt.images.forEach((imgSrc, idx) => {
        const thumb = document.createElement('img');
        thumb.className = `modal__thumb ${idx === 0 ? 'active' : ''}`;
        thumb.src = imgSrc;
        thumb.alt = `Ảnh ${idx + 1}`;
        thumb.addEventListener('click', () => {
          modalImg.src = imgSrc;
          $$('.modal__thumb', thumbsBox).forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        });
        thumbsBox.appendChild(thumb);
      });
    } else {
      thumbsBox.classList.add('hidden');
    }
  }

  // Link bài viết gốc trên Facebook
  const fbLinkBtn = $('#modalFbPostLink');
  if (fbLinkBtn) {
    if (apt.fbUrl) {
      fbLinkBtn.href = apt.fbUrl;
      fbLinkBtn.classList.remove('hidden');
    } else {
      fbLinkBtn.classList.add('hidden');
    }
  }

  // CTA buttons
  $('#modalMessenger').href = `https://m.me/thaoanhapartmentdalat`;
  $('#modalZalo').href = `tel:0903879393`;

  // Activate overlay
  modalOverlay.classList.add('active');
  document.body.classList.add('modal-open');

  requestAnimationFrame(() => {
    modalImg.style.transition = 'opacity 0.4s ease';
    modalImg.style.opacity = '1';
  });

  setTimeout(() => modalClose.focus(), 300);
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.classList.remove('modal-open');
}

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    closeModal();
  }
});

/* ============================================================
   TOAST & CUSTOM POST DELETION
   ============================================================ */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '🌲' : 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function deleteCustomPost(id) {
  let customPosts = getCustomPosts().filter(p => String(p.id) !== String(id));
  saveCustomPosts(customPosts);
  activeData = getAllPosts();
  renderCards(activeData);
  updateUserPostCounter();
  showToast('Đã xoá căn hộ khỏi danh sách.');
}

function updateUserPostCounter() {
  const count = getCustomPosts().length;
  const btnClear = document.getElementById('clearUserPostsBtn');
  const countEl = document.getElementById('userPostCount');
  if (countEl) countEl.textContent = count;
  if (btnClear) {
    if (count > 0 && isAdminLoggedIn()) {
      btnClear.classList.remove('hidden');
    } else {
      btnClear.classList.add('hidden');
    }
  }
}

/* ============================================================
   SMART IMPORTER (NHẬP THỦ CÔNG THÊM BÀI FB)
   ============================================================ */
function initSmartImporter() {
  const importModalOverlay = $('#importModalOverlay');
  const importModalClose   = $('#importModalClose');
  const importModalCancel  = $('#importModalCancel');
  const openImportModalBtn = $('#openImportModalBtn');
  const btnSubmitImport    = $('#btnSubmitImport');
  const btnFillDemo        = $('#btnFillDemo');
  const btnAutoParse       = $('#btnAutoParse');
  const btnSyncApify       = $('#btnSyncApify');
  const clearUserPostsBtn  = $('#clearUserPostsBtn');

  const importCaption       = $('#importCaption');
  const importImageUrl      = $('#importImageUrl');
  const imagePreviewImg     = $('#imagePreviewImg');
  const furnitureTagsBox    = $('#furnitureTags');
  const furnitureEmptyHint  = $('#furnitureEmptyHint');
  const importFurnitureInput = $('#importFurnitureInput');

  const importTitle    = $('#importTitle');
  const importTag      = $('#importTag');
  const importPrice    = $('#importPrice');
  const importDistrict = $('#importDistrict');
  const importRoom     = $('#importRoom');
  const importArea     = $('#importArea');
  const importAddress  = $('#importAddress');

  if (btnSyncApify) {
    btnSyncApify.addEventListener('click', () => fetchApifyLive(true));
  }

  if (!importModalOverlay) return;

  let currentDetectedFurnitures = [];

  function renderFurnitureTags() {
    if (!furnitureTagsBox) return;
    furnitureTagsBox.innerHTML = '';

    if (!currentDetectedFurnitures.length) {
      if (furnitureEmptyHint) furnitureEmptyHint.style.display = 'block';
      return;
    }

    if (furnitureEmptyHint) furnitureEmptyHint.style.display = 'none';

    currentDetectedFurnitures.forEach((item, index) => {
      const tag = document.createElement('span');
      tag.className = 'furniture-tag';
      tag.innerHTML = `🛋️ ${item} <span class="furniture-tag-remove" data-index="${index}">✕</span>`;
      furnitureTagsBox.appendChild(tag);
    });

    if (importFurnitureInput) {
      importFurnitureInput.value = currentDetectedFurnitures.join(', ');
    }

    $$('.furniture-tag-remove', furnitureTagsBox).forEach(rmBtn => {
      rmBtn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        currentDetectedFurnitures.splice(idx, 1);
        renderFurnitureTags();
      });
    });
  }

  if (importFurnitureInput) {
    importFurnitureInput.addEventListener('input', () => {
      currentDetectedFurnitures = importFurnitureInput.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      renderFurnitureTags();
    });
  }

  function openImportModal() {
    if (!isAdminLoggedIn()) {
      alert('Bạn cần đăng nhập quyền Quản trị viên để thực hiện chức năng này!');
      return;
    }
    importModalOverlay.classList.add('active');
    document.body.classList.add('modal-open');
    setTimeout(() => importCaption && importCaption.focus(), 200);
  }

  function closeImportModal() {
    importModalOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  if (openImportModalBtn) openImportModalBtn.addEventListener('click', openImportModal);
  if (importModalClose)   importModalClose.addEventListener('click', closeImportModal);
  if (importModalCancel)  importModalCancel.addEventListener('click', closeImportModal);
  importModalOverlay.addEventListener('click', (e) => {
    if (e.target === importModalOverlay) closeImportModal();
  });

  if (importImageUrl && imagePreviewImg) {
    importImageUrl.addEventListener('input', () => {
      const url = importImageUrl.value.trim().split(',')[0].trim();
      imagePreviewImg.src = url || 'dalat-sample.png';
    });
  }

  function parseCaption(text) {
    if (!text || !text.trim()) return;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const titleCandidate = lines.find(l => l.replace(/[\p{Emoji}\s#*_\-]/gu, '').length > 6) || lines[0] || '';
    if (importTitle && titleCandidate) {
      importTitle.value = titleCandidate.replace(/^[📍🏠✨🔥💥📌🌟📢💵\s]+/, '').trim();
    }

    // Giá
    const pricePatterns = [
      /(\d+)\s*(?:tr|triệu)\s*(\d+)/i,
      /(\d+[.,]?\d*)\s*(?:triệu|tr)\b/i,
      /(\d{1,3}(?:[.,]\d{3}){1,2})/,
      /(\d+[.,]\d{3})\s*(?:đ|vnd|vnđ)/i,
    ];

    for (const re of pricePatterns) {
      const m = text.match(re);
      if (m) {
        if (m[2]) {
          importPrice.value = `${m[1]}.${m[2]}00.000`;
        } else {
          let val = m[1].replace(/,/g, '.');
          if (/triệu|tr/i.test(m[0])) {
            const num = parseFloat(val);
            val = (num * 1_000_000).toLocaleString('vi-VN').replace(/\./g, '.');
          }
          importPrice.value = val;
        }
        break;
      }
    }

    // Cơ sở Đà Lạt
    if (/61\/18\s*phù đổng|phù đổng thiên vương.*18/i.test(text)) {
      if (importDistrict) importDistrict.value = '61/18 Phù Đổng';
      if (importAddress) importAddress.value = '61/18 Phù Đổng Thiên Vương, Phường 8, TP. Đà Lạt';
    } else if (/61\/7\s*phù đổng|phù đổng thiên vương.*7/i.test(text)) {
      if (importDistrict) importDistrict.value = '61/7 Phù Đổng';
      if (importAddress) importAddress.value = '61/7 Phù Đổng Thiên Vương, Phường 8, TP. Đà Lạt';
    } else if (/ngô thì sỹ|74d/i.test(text)) {
      if (importDistrict) importDistrict.value = 'Ngô Thì Sỹ';
      if (importAddress) importAddress.value = '74D Ngô Thì Sỹ, Phường 4, TP. Đà Lạt';
    } else if (/nguyễn trung trực|f2-c5/i.test(text)) {
      if (importDistrict) importDistrict.value = 'Nguyễn Trung Trực';
      if (importAddress) importAddress.value = 'F2-C5 Nguyễn Trung Trực, Phường 4, TP. Đà Lạt';
    }

    // Phòng
    if (/2\s*phòng|2\s*pn|2pn/i.test(text)) {
      if (importRoom) importRoom.value = '2PN';
    } else if (/studio|gác lửng/i.test(text)) {
      if (importRoom) importRoom.value = 'Studio';
    } else {
      if (importRoom) importRoom.value = '1PN';
    }

    // Diện tích
    const areaMatch = text.match(/(\d+)\s*(?:m2|m²|mét vuông)/i);
    if (areaMatch && importArea) {
      importArea.value = `${areaMatch[1]} m²`;
    }

    // Quét nội thất
    const detected = [];
    FURNITURE_DICTIONARY.forEach(({ kw, label }) => {
      if (kw.test(text) && !detected.includes(label)) {
        detected.push(label);
      }
    });

    currentDetectedFurnitures = detected.length
      ? detected
      : ['Full nội thất cao cấp', 'Bình tắm nóng lạnh', 'Bếp nấu riêng'];
    renderFurnitureTags();

    const parseHint = $('#parseHint');
    if (parseHint) {
      parseHint.textContent = `✨ Đã quét được ${currentDetectedFurnitures.length} nội thất/tiện nghi từ bài viết!`;
      parseHint.style.color = '#16a34a';
    }
  }

  if (importCaption) {
    importCaption.addEventListener('input', () => {
      if (importCaption.value.length > 20) parseCaption(importCaption.value);
    });
    importCaption.addEventListener('paste', () => {
      setTimeout(() => parseCaption(importCaption.value), 50);
    });
  }
  if (btnAutoParse) {
    btnAutoParse.addEventListener('click', () => {
      parseCaption(importCaption.value);
    });
  }

  if (btnFillDemo) {
    btnFillDemo.addEventListener('click', () => {
      importCaption.value = `CHỈ CÒN 1 CĂN DUY NHẤT – HÔM NAY GIẢM GIÁ CHỈ CÒN 4TR5 💵
🏠 CĂN HỘ 2 PHÒNG FULL NỘI THẤT – NGAY TRUNG TÂM ĐÀ LẠT 🌿

📍 Vị trí: 61/18 Phù Đổng Thiên Vương, P.8, TP. Đà Lạt
- Đầy đủ sofa vàng tiếp khách, bàn trà trang trí hoa tươi
- 2 phòng ngủ nệm êm ái, tủ quần áo, cửa sổ lớn đón nắng
- Khu bếp riêng đầy đủ bếp điện, tủ lạnh, bồn rửa
- Máy giặt riêng, bình nóng lạnh ariston
- Bãi đậu ô tô rộng rãi, an ninh tuyệt đối, giờ giấc tự do!`;
      if (importImageUrl) {
        importImageUrl.value = 'dalat-sample.png';
        if (imagePreviewImg) imagePreviewImg.src = 'dalat-sample.png';
      }
      parseCaption(importCaption.value);
      showToast('Đã dán bài đăng mẫu và tự động bóc tách nội thất!');
    });
  }

  if (btnSubmitImport) {
    btnSubmitImport.addEventListener('click', () => {
      const title    = (importTitle && importTitle.value.trim()) || 'Căn hộ Thảo Anh Đà Lạt';
      let price      = (importPrice && importPrice.value.trim()) || 'Liên hệ';
      const district = (importDistrict && importDistrict.value) || '61/18 Phù Đổng';
      const address  = (importAddress && importAddress.value.trim()) || 'TP. Đà Lạt, Lâm Đồng';
      const roomType = (importRoom && importRoom.value) || '2PN';
      const area     = (importArea && importArea.value.trim()) || '45 m²';
      const tag      = (importTag && importTag.value.trim()) || 'Thảo Anh';
      const caption  = (importCaption && importCaption.value.trim()) || title;

      let priceNum = 0;
      const numMatch = price.replace(/[^\d]/g, '');
      if (numMatch) {
        priceNum = parseFloat(numMatch) / 1000000;
        if (priceNum === 0) priceNum = parseFloat(numMatch);
      }

      let imageUrl = 'dalat-sample.png';
      let images = ['dalat-sample.png'];
      if (importImageUrl && importImageUrl.value.trim()) {
        images = importImageUrl.value.split(',').map(u => u.trim()).filter(Boolean);
        imageUrl = images[0] || 'dalat-sample.png';
      }

      let amenities = [...currentDetectedFurnitures];
      if (!amenities.length) {
        amenities = ['Sofa ấm cúng', 'Giường nệm', 'Bình nóng lạnh', 'Bếp nấu riêng'];
      }

      const specs = [
        { icon: '📐', label: area },
        { icon: '🛏', label: roomType },
        { icon: '🚿', label: '1 Phòng tắm' },
        { icon: '🏢', label: 'Thảo Anh' },
      ];

      const newPost = {
        id: `custom_${Date.now()}`,
        title,
        price,
        priceNum,
        address,
        district,
        roomType,
        specs,
        amenities,
        description: caption,
        imageUrl,
        images,
        tag,
        postedTime: 'Vừa xong',
        isCustom: true,
        source: 'facebook',
      };

      const customPosts = getCustomPosts();
      customPosts.unshift(newPost);
      saveCustomPosts(customPosts);

      activeData = getAllPosts();
      renderCards(activeData);
      updateUserPostCounter();

      closeImportModal();
      showToast('🎉 Đã thêm bài viết căn hộ thành công!');
      $('#listings').scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (importCaption) importCaption.value = '';
      if (importImageUrl) importImageUrl.value = '';
      currentDetectedFurnitures = [];
      renderFurnitureTags();
    });
  }

  if (clearUserPostsBtn) {
    clearUserPostsBtn.addEventListener('click', () => {
      const count = getCustomPosts().length;
      if (confirm(`Bạn có chắc muốn xoá toàn bộ ${count} bài viết tự thêm?`)) {
        saveCustomPosts([]);
        activeData = getAllPosts();
        renderCards(activeData);
        updateUserPostCounter();
        showToast('Đã xoá toàn bộ bài viết tự nhập.');
      }
    });
  }

  updateUserPostCounter();
}

/* ============================================================
   HEADER SCROLL & MOBILE NAV
   ============================================================ */
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  header.classList.toggle('scrolled', scrollY > 10);
  lastScrollY = scrollY;
}, { passive: true });

navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

$$('.nav__link', nav).forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.classList.remove('active');
  });
});

document.addEventListener('click', (e) => {
  if (!header.contains(e.target) && nav.classList.contains('open')) {
    nav.classList.remove('open');
    navToggle.classList.remove('active');
  }
});

/* ============================================================
   SCROLL-TO-TOP BUTTON
   ============================================================ */
const scrollTopBtn = document.createElement('button');
scrollTopBtn.className = 'scroll-top';
scrollTopBtn.innerHTML = '↑';
scrollTopBtn.setAttribute('aria-label', 'Lên đầu trang');
document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   FLOATING BUTTONS
   ============================================================ */
function initFloatButtons() {
  const floatGroup = $('#floatGroup');
  if (!floatGroup) return;
  setTimeout(() => {
    floatGroup.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    floatGroup.style.opacity = '1';
    floatGroup.style.transform = 'translateY(0)';
  }, 1200);

  floatGroup.style.opacity = '0';
  floatGroup.style.transform = 'translateY(30px)';
}

/* ============================================================
   INIT APPLICATION
   ============================================================ */
function init() {
  initAdminAuth();
  activeData = getAllPosts();
  renderCards(activeData);
  initFloatButtons();
  initSmartImporter();

  // Tự động kết nối và đồng bộ Apify Dataset
  fetchApifyLive(false);
}

window.renderCards = renderCards;

init();
