/**
 * =====================================================
 * fb-integration.js – Facebook Graph API Integration
 * Fetch bài viết từ Fanpage → hiển thị trên web
 * Vanilla JS, không framework, không backend
 * =====================================================
 */

'use strict';

/* ── Namespace tránh xung đột biến global ── */
const FBIntegration = (() => {

  /* ────────────────────────────────────────────
     CACHE (localStorage)
     ──────────────────────────────────────────── */
  const CACHE_KEY = 'fb_posts_cache';

  function saveCache(posts) {
    if (!FB_CONFIG.CACHE_TTL_MIN) return;
    const payload = { ts: Date.now(), posts };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch (_) {}
  }

  function loadCache() {
    if (!FB_CONFIG.CACHE_TTL_MIN) return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { ts, posts } = JSON.parse(raw);
      const ageMin = (Date.now() - ts) / 60000;
      return ageMin < FB_CONFIG.CACHE_TTL_MIN ? posts : null;
    } catch (_) { return null; }
  }

  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
  }

  /* ────────────────────────────────────────────
     HELPERS – Trích xuất thông tin từ caption
     ──────────────────────────────────────────── */

  /** Lấy dòng đầu tiên có nội dung làm tiêu đề */
  function extractTitle(text = '') {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    // Bỏ dòng chỉ có emoji/icon
    const firstReal = lines.find(l => l.replace(/[\p{Emoji}\s]/gu, '').length > 8);
    return firstReal || lines[0] || 'Tin đăng cho thuê';
  }

  /** Trích xuất giá (trả về chuỗi dạng "5.000.000" hoặc null) */
  function extractPrice(text = '') {
    // Khớp các dạng: "5 triệu", "5tr", "5.000.000", "5,500,000"
    const patterns = [
      /(\d+[.,]?\d*)\s*(?:triệu|tr)\b/i,
      /(\d+[.,]\d{3}[.,]\d{3})/,
      /(\d+[.,]\d{3})\s*(?:đ|vnd|vnđ)/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        let val = m[1].replace(/,/g, '.');
        // Chuẩn hóa sang dạng X.XXX.XXX
        if (/triệu|tr/i.test(m[0])) {
          const num = parseFloat(val);
          val = (num * 1_000_000).toLocaleString('vi-VN').replace(/\./g, '.');
        }
        return val;
      }
    }
    return null;
  }

  /** Trích xuất số giá dạng số để lọc */
  function extractPriceNum(text = '') {
    const patterns = [
      { re: /(\d+[.,]?\d*)\s*(?:triệu|tr)\b/i, mult: 1 },
      { re: /(\d+[.,]\d{3}[.,]\d{3})/, mult: 0.000001 },
    ];
    for (const { re, mult } of patterns) {
      const m = text.match(re);
      if (m) return parseFloat(m[1].replace(',', '.')) * (mult === 1 ? 1 : mult) * (mult === 1 ? 1 : 1000000 * mult);
    }
    return 0;
  }

  /** Trích xuất địa chỉ */
  function extractAddress(text = '') {
    const m = text.match(FB_CONFIG.ADDRESS_REGEX);
    if (m) return m[1].trim().replace(/\n.*/s, '');
    // Fallback: tìm dòng chứa "quận" hoặc "đường"
    const line = text.split('\n').find(l => /quận|đường|p\.|q\./i.test(l));
    return line ? line.replace(/^[📍\-–:•\s]+/, '').trim() : 'TP. Hồ Chí Minh';
  }

  /** Trích xuất loại phòng */
  function extractRoomType(text = '') {
    if (/studio/i.test(text)) return 'Studio';
    const m = text.match(/(\d)\s*(?:phòng ngủ|pn|bedroom|br)/i);
    if (m) return `${m[1]}PN`;
    if (/1\s*pn|1\s*phòng/i.test(text)) return '1PN';
    if (/2\s*pn|2\s*phòng/i.test(text)) return '2PN';
    if (/3\s*pn|3\s*phòng/i.test(text)) return '3PN';
    return '1PN';
  }

  /** Trích xuất diện tích */
  function extractArea(text = '') {
    const m = text.match(/(\d+)\s*(?:m²|m2|mét vuông)/i);
    return m ? `${m[1]} m²` : null;
  }

  /** Format thời gian đăng */
  function formatRelativeTime(isoString) {
    const diff = (Date.now() - new Date(isoString)) / 1000;
    if (diff < 60)   return 'Vừa đăng';
    if (diff < 3600) return `${Math.floor(diff/60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff/3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff/86400)} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  }

  /** Lấy tag tự động */
  function autoTag(post) {
    const t = (post.message || '').toLowerCase();
    if (t.includes('mới') || t.includes('moi'))   return 'Mới đăng';
    if (t.includes('giá rẻ') || t.includes('sinh viên')) return 'Giá rẻ';
    if (t.includes('cao cấp') || t.includes('luxury')) return 'Cao cấp';
    if (t.includes('gia đình'))   return 'Gia đình';
    if (t.includes('studio'))     return 'Studio';
    return 'Cho thuê';
  }

  /** Lấy danh sách ảnh từ attachments */
  function extractImages(post) {
    const imgs = [];
    if (post.full_picture) imgs.push(post.full_picture);

    const attachments = post.attachments?.data || [];
    attachments.forEach(att => {
      // Nhiều ảnh (album/carousel)
      const subs = att.subattachments?.data || [];
      subs.forEach(sub => {
        const src = sub.media?.image?.src;
        if (src && !imgs.includes(src)) imgs.push(src);
      });
      // Ảnh đơn
      const src = att.media?.image?.src;
      if (src && !imgs.includes(src)) imgs.push(src);
    });

    return imgs;
  }

  /** Lấy URL video (nếu có) */
  function extractVideo(post) {
    const attachments = post.attachments?.data || [];
    for (const att of attachments) {
      if (att.type === 'video_inline' || att.type === 'native_templates') {
        return att.media?.source || null;
      }
    }
    return null;
  }

  /** Lọc bài viết theo từ khoá cấu hình */
  function passesKeywordFilter(message = '') {
    if (!FB_CONFIG.FILTER_KEYWORDS.length) return true;
    const lower = message.toLowerCase();
    return FB_CONFIG.FILTER_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
  }

  /* ────────────────────────────────────────────
     TRANSFORM – FB post → app format
     ──────────────────────────────────────────── */
  function transformPost(fbPost, index) {
    const msg     = fbPost.message || '';
    const images  = extractImages(fbPost);
    const price   = extractPrice(msg);
    const area    = extractArea(msg);
    const roomType = extractRoomType(msg);

    const specs = [];
    if (area)     specs.push({ icon: '📐', label: area });
    specs.push({ icon: '🛏', label: roomType });
    if (/wc|toilet|phòng tắm|bathroom/i.test(msg))
      specs.push({ icon: '🚿', label: '1 Phòng tắm' });

    // Tự động tạo tiện ích từ nội dung
    const amenities = autoDetectAmenities(msg);

    return {
      id:          `fb_${fbPost.id}`,
      fbPostId:    fbPost.id,
      title:       extractTitle(msg),
      price:       price || 'Liên hệ',
      priceNum:    extractPriceNum(msg),
      address:     extractAddress(msg),
      district:    extractDistrict(msg),
      roomType,
      specs,
      amenities,
      description: msg,
      imageUrl:    images[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      images,
      videoUrl:    extractVideo(fbPost),
      tag:         autoTag(fbPost),
      postedTime:  formatRelativeTime(fbPost.created_time),
      permalink:   fbPost.permalink_url || `https://www.facebook.com/${fbPost.id}`,
      source:      'facebook',
    };
  }

  function extractDistrict(text) {
    const m = text.match(/(?:quận|q\.)\s*(\d+|bình thạnh|tân bình|gò vấp|phú nhuận|thủ đức)/i);
    return m ? `Quận ${m[1]}` : '';
  }

  function autoDetectAmenities(text) {
    const map = [
      { kw: /wifi|internet/i,          label: 'Wifi' },
      { kw: /máy lạnh|điều hòa/i,      label: 'Máy lạnh' },
      { kw: /máy giặt/i,               label: 'Máy giặt' },
      { kw: /tủ lạnh/i,                label: 'Tủ lạnh' },
      { kw: /bếp/i,                    label: 'Bếp' },
      { kw: /thang máy|elevator/i,     label: 'Thang máy' },
      { kw: /bảo vệ|an ninh|security/i,label: 'Bảo vệ 24/7' },
      { kw: /hồ bơi|bể bơi/i,          label: 'Hồ bơi' },
      { kw: /gym|thể dục/i,            label: 'Gym' },
      { kw: /bãi xe|chỗ để xe/i,       label: 'Bãi xe' },
      { kw: /ban công/i,               label: 'Ban công' },
      { kw: /nội thất/i,               label: 'Nội thất' },
    ];
    return map.filter(({ kw }) => kw.test(text)).map(({ label }) => label);
  }

  /* ────────────────────────────────────────────
     FETCH từ Facebook Graph API
     ──────────────────────────────────────────── */
  async function fetchFromAPI(pageId, accessToken, cursor = null) {
    const fields = [
      'id', 'message', 'created_time',
      'full_picture', 'permalink_url',
      'attachments{type,media,subattachments,url}',
    ].join(',');

    let url = `https://graph.facebook.com/${FB_CONFIG.API_VERSION}/${pageId}/posts`
            + `?fields=${encodeURIComponent(fields)}`
            + `&limit=${FB_CONFIG.POSTS_LIMIT}`
            + `&access_token=${encodeURIComponent(accessToken)}`;

    if (cursor) url += `&after=${encodeURIComponent(cursor)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (json.error) throw new Error(`FB API: ${json.error.message} (code ${json.error.code})`);

    return json;
  }

  /** Lấy thông tin page (tên, ảnh đại diện) */
  async function fetchPageInfo(pageId, accessToken) {
    const fields = 'name,picture{url},fan_count,category';
    const url = `https://graph.facebook.com/${FB_CONFIG.API_VERSION}/${pageId}`
              + `?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json;
  }

  /* ────────────────────────────────────────────
     PUBLIC API
     ──────────────────────────────────────────── */

  /**
   * fetchPosts – Điểm vào chính
   * @param {object} opts
   * @param {boolean} opts.forceRefresh – Bỏ qua cache
   * @param {string}  opts.cursor       – Pagination cursor
   * @returns {Promise<{posts, pageInfo, nextCursor}>}
   */
  async function fetchPosts({ forceRefresh = false, cursor = null } = {}) {
    const { PAGE_ID, ACCESS_TOKEN } = FB_CONFIG;

    if (!PAGE_ID || PAGE_ID === 'YOUR_PAGE_ID') {
      throw new Error('CONFIG_MISSING');
    }

    // Thử cache trước
    if (!forceRefresh && !cursor) {
      const cached = loadCache();
      if (cached) {
        console.log('[FB] Loaded from cache');
        return { posts: cached, pageInfo: null, nextCursor: null, fromCache: true };
      }
    }

    // Fetch song song: bài viết + info page
    const [rawData, pageInfo] = await Promise.all([
      fetchFromAPI(PAGE_ID, ACCESS_TOKEN, cursor),
      cursor ? Promise.resolve(null) : fetchPageInfo(PAGE_ID, ACCESS_TOKEN).catch(() => null),
    ]);

    const allPosts = (rawData.data || [])
      .filter(p => p.message && passesKeywordFilter(p.message))
      .map((p, i) => transformPost(p, i));

    const nextCursor = rawData.paging?.cursors?.after || null;

    if (!cursor) saveCache(allPosts);

    return { posts: allPosts, pageInfo, nextCursor, fromCache: false };
  }

  return { fetchPosts, clearCache, CACHE_KEY };

})();


/* ════════════════════════════════════════════
   UI – Kết nối với DOM (app.js sẽ gọi hàm này)
   ════════════════════════════════════════════ */

/**
 * initFacebookSync – Khởi tạo tích hợp FB vào website
 * Gọi từ app.js sau khi DOM sẵn sàng
 */
async function initFacebookSync() {
  const syncBtn    = document.getElementById('fbSyncBtn');
  const syncStatus = document.getElementById('fbSyncStatus');
  const pageInfo   = document.getElementById('fbPageInfo');

  function setStatus(msg, type = 'info') {
    if (!syncStatus) return;
    syncStatus.textContent = msg;
    syncStatus.className = `sync-status sync-status--${type}`;
    syncStatus.classList.remove('hidden');
  }

  function setLoading(loading) {
    if (!syncBtn) return;
    syncBtn.disabled = loading;
    syncBtn.innerHTML = loading
      ? '<span class="spinner"></span> Đang tải...'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Đồng bộ Facebook';
  }

  async function doSync(forceRefresh = false) {
    setLoading(true);
    setStatus('Đang kết nối Facebook API...', 'info');

    try {
      const result = await FBIntegration.fetchPosts({ forceRefresh });

      // Cập nhật info fanpage
      if (result.pageInfo && pageInfo) {
        renderPageInfo(result.pageInfo, pageInfo);
      }

      if (result.posts.length === 0) {
        setStatus('Không tìm thấy bài đăng phù hợp. Thử điều chỉnh FILTER_KEYWORDS trong fb-config.js', 'warning');
        setLoading(false);
        return;
      }

      // Render bài viết vào grid
      const fromCacheMsg = result.fromCache ? ' (từ cache)' : '';
      setStatus(`✅ Đã tải ${result.posts.length} bài đăng${fromCacheMsg}`, 'success');

      // Gọi hàm renderCards của app.js (đã được expose toàn cục)
      if (typeof renderCards === 'function') {
        window._fbPosts = result.posts;
        renderCards(result.posts);
        updateResultCount(result.posts.length);
      }

    } catch (err) {
      console.error('[FB Sync Error]', err);
      if (err.message === 'CONFIG_MISSING') {
        setStatus('⚠️ Chưa cấu hình fb-config.js. Xem hướng dẫn bên dưới.', 'warning');
      } else if (err.message.includes('190')) {
        setStatus('❌ Access Token hết hạn. Vui lòng tạo token mới tại Graph API Explorer.', 'error');
      } else if (err.message.includes('10')) {
        setStatus('❌ App chưa được duyệt "Page Public Content Access". Dùng Development Mode.', 'error');
      } else {
        setStatus(`❌ Lỗi: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  function renderPageInfo(info, container) {
    container.innerHTML = `
      <div class="fb-page-badge">
        ${info.picture ? `<img src="${info.picture.data?.url}" alt="${info.name}" class="fb-page-avatar" />` : ''}
        <div class="fb-page-meta">
          <strong>${info.name || FB_CONFIG.PAGE_NAME}</strong>
          <span>${info.fan_count ? info.fan_count.toLocaleString('vi-VN') + ' người theo dõi' : info.category || ''}</span>
        </div>
        <a href="https://www.facebook.com/${FB_CONFIG.PAGE_ID}" target="_blank" class="fb-page-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 10.82V8h-3V6c0-.55.45-1 1-1h2V2h-2c-2.21 0-4 1.79-4 4v2H9v2.82l-1 1V13h1v8h4v-8h2.22l.78-.78V13H15v-2h2.18l.82-.82z"/></svg>
          Xem Fanpage
        </a>
      </div>
    `;
    container.classList.remove('hidden');
  }

  function updateResultCount(count) {
    const el = document.getElementById('resultCount');
    if (el) el.textContent = `Đã tải ${count} bài đăng từ Fanpage`;
  }

  // Gắn sự kiện nút sync
  if (syncBtn) {
    syncBtn.addEventListener('click', () => doSync(true));
  }

  // Tự động sync khi load trang (dùng cache nếu có)
  if (FB_CONFIG.PAGE_ID && FB_CONFIG.PAGE_ID !== 'YOUR_PAGE_ID') {
    await doSync(false);
  } else {
    setStatus('💡 Điền thông tin vào fb-config.js để bắt đầu đồng bộ bài viết từ Fanpage.', 'warning');
  }
}
