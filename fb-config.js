/**
 * =====================================================
 * fb-config.js – Cấu hình Facebook Graph API
 * =====================================================
 * HƯỚNG DẪN LẤY THÔNG TIN:
 *
 * BƯỚC 1 – Tạo Facebook App:
 *   → https://developers.facebook.com/apps/
 *   → Tạo App mới (Business hoặc Consumer)
 *   → Vào Settings > Basic, copy App ID & App Secret
 *
 * BƯỚC 2 – Lấy Page ID:
 *   → Vào trang Facebook của bạn
 *   → Settings > About > Page ID (dãy số)
 *   → Hoặc dùng: https://www.facebook.com/YOUR_PAGE_USERNAME
 *   → Tool: https://findmyfbid.com/
 *
 * BƯỚC 3 – Lấy Page Access Token (dài hạn ~60 ngày):
 *   → Vào: https://developers.facebook.com/tools/explorer/
 *   → Chọn App → Get User Token
 *   → Tick permissions: pages_read_engagement, pages_show_list
 *   → Generate Access Token → Copy
 *   → Để token dài hạn: dán vào tool https://developers.facebook.com/tools/debug/accesstoken/
 *
 * BƯỚC 4 – Điền vào bên dưới và lưu file
 * =====================================================
 */

const FB_CONFIG = {
  // ── Thông tin App ─────────────────────────────────
  APP_ID:        'YOUR_APP_ID',          // Ví dụ: '1234567890123456'
  APP_SECRET:    'YOUR_APP_SECRET',      // Ví dụ: 'abcdef1234567890...'

  // ── Trang Facebook của bạn ─────────────────────────
  PAGE_ID:       'YOUR_PAGE_ID',         // Ví dụ: '100064123456789'
  PAGE_NAME:     'Tên Fanpage Của Bạn',  // Hiển thị trên web

  // ── Access Token ──────────────────────────────────
  // Dán Page Access Token vào đây (lấy từ Graph API Explorer)
  ACCESS_TOKEN:  'YOUR_PAGE_ACCESS_TOKEN',

  // ── Cấu hình fetch ────────────────────────────────
  API_VERSION:   'v19.0',
  POSTS_LIMIT:   12,          // Số bài viết lấy mỗi lần
  CACHE_TTL_MIN: 30,          // Cache localStorage (phút), 0 = tắt cache

  // ── Lọc bài viết ──────────────────────────────────
  // Chỉ hiển thị bài có chứa ít nhất 1 trong các từ khoá này
  // Để mảng rỗng [] để lấy tất cả bài viết
  FILTER_KEYWORDS: ['cho thuê', 'phòng trọ', 'căn hộ', 'mặt bằng', 'VNĐ', 'triệu', 'studio'],

  // ── Regex tự động trích xuất thông tin ───────────────
  // Giá: nhận dạng "5 triệu", "5.000.000", "5tr", "5,000,000"
  PRICE_REGEX: /(\d[\d.,]*)\s*(triệu|tr|000\.000|,000,000|\s*VNĐ|\s*vnđ|\s*đ\/tháng)/i,

  // Địa chỉ: nhận dạng "đường X, quận Y" hoặc "P. X, Q. Y"
  ADDRESS_REGEX: /(?:📍|địa chỉ|đường|đ\.|p\.|q\.|phường|quận|tại)[:\s]+([^\n]+)/i,
};
