/**
 * ============================================================
 * Thảo Anh Apartment – Căn Hộ Dịch Vụ Đà Lạt
 * app.js – Vanilla JS (ES6+) | Apify Facebook API Integrated
 * Phiên bản: 10.0 (Đặt lịch hẹn, Sửa bài viết, Tối ưu 24h, SVG Icons)
 * ============================================================
 */

'use strict';

/* ============================================================
   APIFY ACTOR TASK & DATASET CONFIGURATION
   ============================================================ */
// Link Actor Task mới nhất do người dùng cung cấp
const APIFY_TASK_RUN_URL = 'https://api.apify.com/v2/actor-tasks/karty1223~facebook-thue-nha/runs/last?token=apify_api_mMJCOy5qx5BE7Vm7xdqhoo68acG7ae2DgyU4';
const APIFY_TASK_DATASET_URL = 'https://api.apify.com/v2/actor-tasks/karty1223~facebook-thue-nha/runs/last/dataset/items?token=apify_api_mMJCOy5qx5BE7Vm7xdqhoo68acG7ae2DgyU4&format=json&clean=true';
const APIFY_DATASET_FALLBACK_URL = 'https://api.apify.com/v2/datasets/mNdadBFYxuYndWdbl/items?signature=MC4xNzk0ODE0MzE1ODkwLkduc3dVS1lmdllUWFVJTnBMYzBM&format=json&clean=true';

// LocalStorage Keys
const CACHE_APIFY_KEY       = 'thaoanh_apify_cached_posts';
const LAST_SYNC_KEY         = 'thaoanh_last_apify_sync_time';
const STORAGE_CUSTOM_KEY    = 'thaoanh_custom_posts';
const STORAGE_EDITED_KEY    = 'thaoanh_edited_posts';
const STORAGE_DELETED_KEY   = 'thaoanh_deleted_posts';
const STORAGE_BOOKINGS_KEY  = 'thaoanh_bookings';
const ADMIN_STORAGE_KEY     = 'thaoanh_admin_logged';
const LANG_STORAGE_KEY      = 'thaoanh_lang';
const VALID_PASSWORDS       = ['admin123', 'thaoanh', 'thaoanh2024', '123456'];

// Ngôn ngữ hiện tại (vi hoặc en)
let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'vi';

// Giới hạn cập nhật 24 giờ (1 ngày 1 lần để tối ưu tài khoản Apify Free)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/* ============================================================
   BILINGUAL TRANSLATIONS (TIẾNG VIỆT 🇻🇳 & ENGLISH 🇬🇧)
   ============================================================ */
const TRANSLATIONS = {
  vi: {
    nav_listings: 'Căn Hộ',
    nav_branches: '4 Cơ Sở',
    nav_about: 'Về Chúng Tôi',
    nav_contact: 'Liên Hệ',
    header_book: 'Đặt Lịch Xem Phòng',
    header_admin: 'Admin',
    admin_appointments: 'Lịch hẹn',
    admin_logout: 'Thoát',
    lang_label: 'Ngôn ngữ',
    nav_admin_login: 'Đăng Nhập Quản Trị (Admin)',
    nav_appointments: 'Lịch Hẹn Khách Đặt',
    nav_logout: 'Đăng Xuất Admin',
    hero_eyebrow: 'Thảo Anh Apartment • Căn Hộ Dịch Vụ Đà Lạt',
    hero_title_sub: 'Căn Hộ Dịch Vụ',
    hero_title_artistic: 'Tiện Nghi &amp; Ấm Cúng',
    hero_loc_prefix: 'Tại',
    hero_subtitle: 'Hệ thống 4 cơ sở trung tâm TP. Đà Lạt (Phường 4 & Phường 8). Đầy đủ nội thất cao cấp, view ngắm trọn phố sương mù lấp lánh về đêm, giá tốt chỉ từ 3.2 – 6 triệu/tháng.',
    filter_loc_label: 'Cơ sở / Khu vực',
    filter_loc_all: 'Tất cả cơ sở tại Đà Lạt',
    filter_price_label: 'Khoảng giá',
    filter_price_all: 'Tất cả mức giá',
    filter_price_u4: 'Dưới 4 triệu',
    filter_price_45: '4 – 5 triệu (Phổ biến)',
    filter_price_57: '5 – 7 triệu',
    filter_price_o7: 'Trên 7 triệu',
    filter_room_label: 'Loại phòng',
    filter_room_all: 'Tất cả loại phòng',
    filter_room_1pn: '1 Phòng ngủ (1PN)',
    filter_room_2pn: '2 Phòng ngủ (2PN)',
    filter_room_studio: 'Studio / Gác lửng',
    filter_btn: '🔍 Tìm Kiếm',
    stat_branches: 'Cơ sở tại Đà Lạt',
    stat_furniture: 'Full nội thất cao cấp',
    stat_followers: 'Người theo dõi Fanpage',
    stat_satisfaction: 'Khách hàng hài lòng',
    branches_badge: 'Hệ Thống Cơ Sở',
    branches_title: '4 Vị Trí Trung Tâm Tại TP. Đà Lạt',
    branches_sub: 'Tọa lạc tại Phường 4 và Phường 8, không gian yên bình, an ninh và tiện di chuyển',
    branch1_num: 'CƠ SỞ 1',
    branch1_tag: 'View đồi thoáng mát',
    branch2_num: 'CƠ SỞ 2',
    branch2_tag: 'Gần ĐH Đà Lạt',
    branch3_num: 'CƠ SỞ 3',
    branch3_tag: 'Yên tĩnh, an ninh cao',
    branch4_num: 'CƠ SỞ 4',
    branch4_tag: 'Khuôn viên rộng rãi',
    listings_title: 'Danh Sách Căn Hộ Đang Cho Thuê',
    listings_sub: 'Được cập nhật thường xuyên từ Fanpage Thảo Anh Apartment - Căn Hộ Đà Lạt',
    admin_panel_title: 'Bảng Điều Khiển Quản Trị Viên',
    admin_manage_btn: 'Quản Lý Lịch Hẹn',
    admin_sync_btn: 'Đồng bộ Apify (Bỏ qua 24h)',
    admin_add_post: 'Thêm bài mới',
    empty_title: 'Không tìm thấy căn hộ phù hợp',
    empty_desc: 'Thử thay đổi bộ lọc để xem thêm các cơ sở khác tại Đà Lạt nhé!',
    empty_reset: 'Xoá bộ lọc',
    about_badge: 'Về Thảo Anh Apartment',
    about_title: 'Không gian sống<br /><span class="highlight">ấm cúng &amp; tiện nghi</span> giữa lòng Đà Lạt',
    about_desc: 'Thảo Anh Apartment là chuỗi căn hộ dịch vụ uy tín tại TP. Đà Lạt với 4 cơ sở trung tâm. Cung cấp không gian nghỉ ngơi yên tĩnh, trang bị đầy đủ tiện nghi sinh hoạt cao cấp cho khách du lịch, làm việc hay định cư lâu dài.',
    about_item1: '✅ Đầy đủ nội thất chuẩn căn hộ dịch vụ (bếp, máy giặt, nóng lạnh...)',
    about_item2: '✅ Không gian ấm cúng, thoáng đãng, view đồi đặc trưng Đà Lạt',
    about_item3: '✅ An ninh 24/7, khóa cửa thông minh, giờ giấc tự do',
    about_item4: '✅ Hỗ trợ khách thuê tận tình, giá thuê trực tiếp không qua trung gian',
    about_badge_sub: 'Căn Hộ Dịch Vụ Đà Lạt',
    contact_title: 'Liên Hệ Đặt Phòng / Xem Nhà',
    contact_sub: 'Thảo Anh Apartment luôn sẵn sàng tư vấn và đón tiếp quý khách',
    btn_msg: '0559521514 (Phương)',
    footer_desc: 'Căn hộ dịch vụ cao cấp, đầy đủ tiện nghi tại TP. Đà Lạt.',
    footer_branches: 'Hệ thống 4 cơ sở',
    footer_services: 'Dịch vụ',
    footer_svc1: 'Cho thuê theo tháng',
    footer_svc2: 'Cho thuê theo năm',
    footer_svc3: 'Hợp đồng linh hoạt',
    footer_contact: 'Liên hệ',
    footer_copy: '© 2024 Thảo Anh Apartment - Căn Hộ Dịch Vụ Đà Lạt. All rights reserved.',
    modal_amenities_title: '🛋️ Nội thất &amp; Tiện nghi có sẵn',
    modal_desc_title: '📋 Mô tả chi tiết từ Thảo Anh Apartment',
    modal_book_btn: '📅 Đặt Lịch Hẹn Xem Phòng Này',
    modal_edit_btn: '✏️ Chỉnh Sửa Bài Viết Này (Admin)',
    modal_fb_link: 'Xem bài viết gốc trên Facebook ↗',
    modal_zoom_btn: 'Phóng to xem nét',
    book_title: 'Hẹn Lịch Xem Phòng / Đặt Phòng',
    book_sub: 'Thảo Anh Apartment – Quản lý sẽ liên hệ xác nhận trong 15 – 30 phút',
    book_apt_label: 'Căn hộ / Cơ sở bạn quan tâm *',
    book_name_label: 'Họ và tên của bạn *',
    book_phone_label: 'Số điện thoại / Zalo *',
    book_date_label: 'Ngày muốn đến xem phòng *',
    book_slot_label: 'Khung giờ thuận tiện nhất *',
    slot_morning: 'Buổi sáng: 09:00 – 11:30',
    slot_afternoon: 'Buổi chiều: 14:00 – 17:30',
    slot_evening: 'Buổi tối: 18:00 – 20:00',
    slot_flexible: 'Giờ giấc linh hoạt (liên hệ trước)',
    book_notes_label: 'Nhu cầu cụ thể hoặc ghi chú thêm (tuỳ chọn):',
    book_cancel: 'Hủy',
    book_submit: '🚀 Gửi Yêu Cầu Đặt Lịch',
    book_succ_title: 'Đặt Lịch Hẹn Thành Công!',
    book_succ_desc: 'Cảm ơn bạn đã quan tâm. Quản lý hệ thống <strong>Thảo Anh Apartment</strong> đã nhận được thông tin và sẽ gọi điện hoặc nhắn tin Zalo xác nhận lịch hẹn trong ít phút.',
    book_succ_zalo: '💬 Nhắn Zalo Quản Lý Ngay',
    book_succ_done: 'Hoàn tất &amp; Đóng'
  },
  en: {
    nav_listings: 'Apartments',
    nav_branches: '4 Locations',
    nav_about: 'About Us',
    nav_contact: 'Contact',
    header_book: 'Book a Viewing',
    header_admin: 'Admin',
    admin_appointments: 'Bookings',
    admin_logout: 'Log out',
    lang_label: 'Language',
    nav_admin_login: 'Admin Sign In',
    nav_appointments: 'Client Appointments',
    nav_logout: 'Log Out Admin',
    hero_eyebrow: 'Thao Anh Apartment • Serviced Living in Da Lat',
    hero_title_sub: 'Serviced Apartments',
    hero_title_artistic: 'Cozy &amp; Well-Furnished',
    hero_loc_prefix: 'In',
    hero_subtitle: 'A premier chain of 4 central locations in Da Lat (Ward 4 &amp; Ward 8). Fully furnished, misty pine hill view, night lights, affordable from 3.2 – 6M VND/month.',
    filter_loc_label: 'Location / Branch',
    filter_loc_all: 'All Da Lat Locations',
    filter_price_label: 'Price Range',
    filter_price_all: 'All Price Ranges',
    filter_price_u4: 'Under 4M VND',
    filter_price_45: '4 – 5M VND (Popular)',
    filter_price_57: '5 – 7M VND',
    filter_price_o7: 'Over 7M VND',
    filter_room_label: 'Room Type',
    filter_room_all: 'All Room Types',
    filter_room_1pn: '1 Bedroom (1BR)',
    filter_room_2pn: '2 Bedrooms (2BR)',
    filter_room_studio: 'Studio / Mezzanine',
    filter_btn: '🔍 Search',
    stat_branches: 'Branches in Da Lat',
    stat_furniture: 'Fully Furnished',
    stat_followers: 'Fanpage Followers',
    stat_satisfaction: 'Satisfied Guests',
    branches_badge: 'Our Locations',
    branches_title: '4 Prime Locations in Da Lat City',
    branches_sub: 'Conveniently located in Ward 4 &amp; Ward 8, peaceful ambiance, high security and easy transportation',
    branch1_num: 'BRANCH 1',
    branch1_tag: 'Panoramic Hill View',
    branch2_num: 'BRANCH 2',
    branch2_tag: 'Near Da Lat University',
    branch3_num: 'BRANCH 3',
    branch3_tag: 'Quiet &amp; High Security',
    branch4_num: 'BRANCH 4',
    branch4_tag: 'Spacious Grounds',
    listings_title: 'Available Apartments for Rent',
    listings_sub: 'Directly synced with Thao Anh Apartment Facebook Fanpage',
    admin_panel_title: 'Admin Control Center',
    admin_manage_btn: 'Manage Bookings',
    admin_sync_btn: 'Sync Apify (Skip 24h)',
    admin_add_post: 'Add New Listing',
    empty_title: 'No matching apartments found',
    empty_desc: 'Try adjusting your filters or choose another location in Da Lat!',
    empty_reset: 'Clear Filters',
    about_badge: 'About Thao Anh Apartment',
    about_title: 'A warm &amp; comfortable living space in the heart of Da Lat',
    about_desc: 'Thao Anh Apartment is a reputable chain of serviced apartments in Da Lat with 4 central locations. We provide serene accommodation equipped with premium amenities for travelers, digital nomads, remote workers, and long-term residents.',
    about_item1: '✅ Fully equipped serviced living (kitchen, washing machine, hot shower...)',
    about_item2: '✅ Warm, cozy &amp; airy atmosphere with signature Da Lat pine hill views',
    about_item3: '✅ 24/7 security, smart keyless entry, flexible 24h access',
    about_item4: '✅ Dedicated host support, direct rental price with no agency fees',
    about_badge_sub: 'Da Lat Serviced Apartments',
    contact_title: 'Contact Us / Schedule a Viewing',
    contact_sub: 'Thao Anh Apartment is always delighted to assist and welcome you',
    btn_msg: '0559521514 (Phuong)',
    footer_desc: 'Premium serviced apartments with full amenities in Da Lat City.',
    footer_branches: 'Our 4 Locations',
    footer_services: 'Services',
    footer_svc1: 'Monthly Rental',
    footer_svc2: 'Yearly Rental',
    footer_svc3: 'Flexible Lease Terms',
    footer_contact: 'Contact Info',
    footer_copy: '© 2024 Thao Anh Apartment - Da Lat Serviced Apartments. All rights reserved.',
    modal_amenities_title: '🛋️ Furnishings &amp; Amenities Included',
    modal_desc_title: '📋 Description from Thao Anh Apartment',
    modal_book_btn: '📅 Schedule a Viewing for This Unit',
    modal_edit_btn: '✏️ Edit This Listing (Admin)',
    modal_fb_link: 'View Original Post on Facebook ↗',
    modal_zoom_btn: 'View full size',
    book_title: 'Schedule a Viewing / Book an Apartment',
    book_sub: 'Thao Anh Apartment – Manager will contact you within 15–30 minutes',
    book_apt_label: 'Apartment / Location of Interest *',
    book_name_label: 'Your Full Name *',
    book_phone_label: 'Phone / WhatsApp / Zalo *',
    book_date_label: 'Preferred Viewing Date *',
    book_slot_label: 'Preferred Time Slot *',
    slot_morning: 'Morning: 09:00 – 11:30',
    slot_afternoon: 'Afternoon: 14:00 – 17:30',
    slot_evening: 'Evening: 18:00 – 20:00',
    slot_flexible: 'Flexible time (contact in advance)',
    book_notes_label: 'Specific requirements or notes (optional):',
    book_cancel: 'Cancel',
    book_submit: '🚀 Submit Viewing Request',
    book_succ_title: 'Viewing Scheduled Successfully!',
    book_succ_desc: 'Thank you! The property manager at <strong>Thao Anh Apartment</strong> has received your request and will call or message you shortly.',
    book_succ_zalo: '💬 Chat with Manager on Zalo',
    book_succ_done: 'Done &amp; Close'
  }
};

/* ============================================================
   SVG ICONS COLLECTION (BỘ HÌNH VẼ MINH HỌA TRỰC QUAN SẮC NÉT)
   ============================================================ */
const SVG = {
  bed: `<svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 7h-8v8H3V5H1v15h2v-3h18v3h2v-9a4 4 0 0 0-4-4zm2 8h-8V9h6a2 2 0 0 1 2 2v4zM7 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>`,
  bath: `<svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21 14V7a4 4 0 0 0-4-4h-2a2 2 0 0 0-2 2v9H3a1 1 0 0 0-1 1v4a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-4a1 1 0 0 0-1-1zm-6-9h2a2 2 0 0 1 2 2v7h-4V5zM7 2a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1z"/></svg>`,
  area: `<svg class="svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h3v2H9v6h1v2H7v-2h1V9H7V7zm8 0h3v2h-1v6h1v2h-3v-2h1V9h-1V7z"/></svg>`,
  location: `<svg class="svg-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  calendar: `<svg class="svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2zM7 11h5v5H7z"/></svg>`,
  edit: `<svg class="svg-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  trash: `<svg class="svg-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
  clock: `<svg class="svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>`,
  sofa: `<svg class="svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M20 10V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v3a4 4 0 0 0-2 3.46V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-5.54A4 4 0 0 0 20 10zM6 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3H6V7z"/></svg>`,
  stove: `<svg class="svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4H5V6h14v2zm-6 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>`,
  fridge: `<svg class="svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v6h10V4H7zm0 8v8h10v-8H7zm2-6h2v2H9V6zm0 8h2v3H9v-3z"/></svg>`,
  washer: `<svg class="svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18 2.01L6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6V4h12v16zm-6-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>`,
  balcony: `<svg class="svg-icon" viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M14 6V4h-4v2h4zM4 8v11h16V8H4zm2 2h2v7H6v-7zm4 0h4v7h-4v-7zm6 0h2v7h-2v-7zM2 20h20v2H2v-2z"/></svg>`,
  check: `<svg class="svg-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
  star: `<svg class="svg-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
};

/* ============================================================
   FURNITURE DICTIONARY (TỰ ĐỘNG BÓC TÁCH NỘI THẤT TỪ BÀI VIẾT)
   ============================================================ */
const FURNITURE_DICTIONARY = [
  { kw: /sofa/i, label: 'Sofa tiếp khách', icon: SVG.sofa },
  { kw: /bàn trà/i, label: 'Bàn trà', icon: SVG.sofa },
  { kw: /bàn ăn/i, label: 'Bàn ăn & ghế', icon: SVG.stove },
  { kw: /bàn làm việc/i, label: 'Bàn làm việc', icon: SVG.area },
  { kw: /giường/i, label: 'Giường nệm cao cấp', icon: SVG.bed },
  { kw: /nệm|đệm/i, label: 'Nệm êm ái', icon: SVG.bed },
  { kw: /chăn ga/i, label: 'Chăn ga gối đầy đủ', icon: SVG.bed },
  { kw: /tủ quần áo|tủ áo/i, label: 'Tủ quần áo', icon: SVG.area },
  { kw: /tủ lạnh/i, label: 'Tủ lạnh', icon: SVG.fridge },
  { kw: /máy giặt/i, label: 'Máy giặt riêng', icon: SVG.washer },
  { kw: /máy sấy/i, label: 'Máy sấy quần áo', icon: SVG.washer },
  { kw: /sân phơi/i, label: 'Sân phơi đồ rộng', icon: SVG.balcony },
  { kw: /bếp từ|bếp điện|bếp ga|bếp tiện nghi|bếp/i, label: 'Bếp nấu riêng', icon: SVG.stove },
  { kw: /hút mùi/i, label: 'Máy hút mùi', icon: SVG.stove },
  { kw: /lò vi sóng/i, label: 'Lò vi sóng', icon: SVG.stove },
  { kw: /bình nóng lạnh|nóng lạnh|nước nóng/i, label: 'Bình tắm nóng lạnh', icon: SVG.bath },
  { kw: /máy sưởi|quạt sưởi/i, label: 'Máy sưởi ấm', icon: SVG.bath },
  { kw: /ban công/i, label: 'Ban công thoáng mát', icon: SVG.balcony },
  { kw: /view đồi|view thung lũng|view đẹp|ngắm cảnh/i, label: 'View đồi Đà Lạt', icon: SVG.balcony },
  { kw: /cửa sổ/i, label: 'Cửa sổ đón nắng', icon: SVG.balcony },
  { kw: /ô tô|bãi đậu ô tô|đậu xe|chỗ để xe|bãi xe/i, label: 'Đường rộng ô tô ra vào', icon: SVG.location },
  { kw: /wifi|internet/i, label: 'Wifi tốc độ cao', icon: SVG.star },
  { kw: /an ninh|camera|giờ tự do/i, label: 'An ninh tốt, giờ tự do', icon: SVG.star },
  { kw: /full nội thất/i, label: 'Full nội thất cao cấp', icon: SVG.star }
];

/* ============================================================
   TRANSFORM APIFY ITEM TO STRUCTURED APARTMENT
   ============================================================ */
function formatRelativeTime(isoString) {
  if (!isoString) return currentLang === 'en' ? 'Just now' : 'Mới cập nhật';
  const diff = (Date.now() - new Date(isoString)) / 1000;
  if (currentLang === 'en') {
    if (diff < 3600) return `${Math.max(1, Math.floor(diff/60))}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return new Date(isoString).toLocaleDateString('en-US');
  }
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
    /(\d+[.,]?\d*)\s*(?:triệu|tr)\b/i, // 3tr2, 5tr
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

  // 3. Cơ sở & Địa chỉ tại Đà Lạt
  let district = 'Đà Lạt';
  let address = 'TP. Đà Lạt, Lâm Đồng';

  if (/ngô thì sỹ|74d/i.test(text)) {
    district = 'Ngô Thì Sỹ (P.4)';
    address = '74D Ngô Thì Sỹ, Phường 4, TP. Đà Lạt';
  } else if (/61\/18\s*phù đổng/i.test(text)) {
    district = '61/18 Phù Đổng (P.8)';
    address = '61/18 Phù Đổng Thiên Vương, Phường 8, TP. Đà Lạt';
  } else if (/nguyễn trung trực|f2\s*-\s*c5/i.test(text)) {
    district = 'Nguyễn Trung Trực (P.4)';
    address = 'F2 - C5 Nguyễn Trung Trực, Phường 4, TP. Đà Lạt';
  } else if (/61\/7|61\/19|phù đổng thiên vương/i.test(text)) {
    district = '61/7 Phù Đổng (P.8)';
    address = '61/7 Phù Đổng Thiên Vương, Phường 8, TP. Đà Lạt';
  }

  // 4. Loại phòng
  let roomType = '1PN';
  let beds = 1;
  if (/2\s*phòng|2pn|2\s*ngủ/i.test(text)) {
    roomType = '2PN';
    beds = 2;
  } else if (/studio|gác lửng|mini/i.test(text)) {
    roomType = 'Studio';
    beds = 1;
  }

  // 5. Diện tích: CHỈ lấy khi bài đăng trên Fanpage có ghi số m2/m², TUYỆT ĐỐI KHÔNG tự bịa số liệu
  let area = null;
  const areaMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*(?:m2|m²|mét vuông)\b/i);
  if (areaMatch) {
    area = `${areaMatch[1]} m²`;
  }

  // Xây dựng danh sách specs thực tế theo nội dung bài viết
  const specs = [
    { icon: SVG.bed,  label: `${beds} Phòng ngủ` },
    { icon: SVG.bath, label: '1 WC Nước nóng' },
  ];
  // Chỉ thêm diện tích nếu bài đăng thực tế có ghi
  if (area) {
    specs.push({ icon: SVG.area, label: area });
  } else if (/ban công/i.test(text)) {
    specs.push({ icon: SVG.balcony, label: 'Có ban công' });
  } else if (/giờ tự do|tự do/i.test(text)) {
    specs.push({ icon: SVG.star, label: 'Giờ giấc tự do' });
  }

  // 6. Nhận diện nội thất thực tế
  const amenities = [];
  FURNITURE_DICTIONARY.forEach(f => {
    if (f.kw.test(text) && !amenities.includes(f.label)) {
      amenities.push(f.label);
    }
  });
  if (!amenities.length) {
    amenities.push('Full nội thất cao cấp', 'Bình tắm nóng lạnh', 'Bếp nấu riêng', 'Wifi miễn phí');
  }

  // 7. Hình ảnh thực tế (Lọc bỏ avatar hoặc link méo)
  let images = [];
  if (Array.isArray(item.images) && item.images.length) {
    images = item.images.filter(u => u && !u.includes('30808-1'));
  } else if (Array.isArray(item.media)) {
    item.media.forEach(m => {
      const u = m.image?.uri || m.thumbnail;
      if (u && !u.includes('30808-1') && !images.includes(u)) {
        images.push(u);
      }
    });
  }
  if (!images.length) {
    images.push('dalat-sample.png');
  }

  return {
    id: item.postId || String(item.id || Math.random().toString(36).substr(2, 9)),
    title,
    price,
    priceNum,
    district,
    address,
    roomType,
    specs,
    area: area || '',
    amenities,
    description: text,
    imageUrl: images[0],
    images,
    tag: priceNum > 0 && priceNum <= 4 ? 'Giá rẻ' : (priceNum >= 5 ? 'Cao cấp' : 'Thảo Anh'),
    postedTime: formatRelativeTime(item.time),
    fbUrl: item.url || 'https://www.facebook.com/ThaoAnhApartment',
    isCustom: Boolean(item.isCustom)
  };
}

/* ============================================================
   DATA STORES: GET ALL POSTS (MERGE APIFY + CUSTOM + EDITS)
   ============================================================ */
function getCachedApifyPosts() {
  try {
    const raw = localStorage.getItem(CACHE_APIFY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing cached apify posts', e);
  }
  return typeof APIFY_INITIAL_POSTS !== 'undefined' ? APIFY_INITIAL_POSTS : [];
}

function getCustomPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading custom posts', e);
  }
  return [];
}

function getEditedPostsMap() {
  try {
    const raw = localStorage.getItem(STORAGE_EDITED_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading edited posts', e);
  }
  return {};
}

function getDeletedPostIds() {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading deleted posts', e);
  }
  return [];
}

function getAllPosts() {
  const baseRaw = [...getCustomPosts(), ...getCachedApifyPosts()];
  const editedMap = getEditedPostsMap();
  const deletedIds = getDeletedPostIds();

  const posts = [];
  const seenIds = new Set();

  baseRaw.forEach(item => {
    const apt = transformApifyItem(item);
    if (seenIds.has(String(apt.id))) return;
    if (deletedIds.includes(String(apt.id))) return;

    seenIds.add(String(apt.id));

    // Nếu bài đăng đã được Admin chỉnh sửa, ghi đè bằng phiên bản chỉnh sửa
    if (editedMap[String(apt.id)]) {
      const ed = editedMap[String(apt.id)];
      Object.assign(apt, ed);
    }

    posts.push(apt);
  });

  return posts;
}

/* ============================================================
   LIVE SYNC VỚI APIFY (TỐI ƯU 24 GIỜ / 1 LẦN)
   ============================================================ */
function updateSyncTimeBadge(timestamp) {
  const syncDesc = $('#apifySyncDesc');
  const syncBadge = $('#apifySyncStatus');
  if (!syncDesc) return;

  if (timestamp) {
    const d = new Date(timestamp);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ngày ${d.getDate()}/${d.getMonth()+1}`;
    syncDesc.innerHTML = `⏱️ Cập nhật lần cuối: <strong>${timeStr}</strong> (Tối ưu 24h/lần để tiết kiệm lượt chạy free)`;
    if (syncBadge) syncBadge.textContent = '⚡ Apify Live Synced';
  } else {
    syncDesc.innerHTML = `Tự động liên kết Apify Actor: Chế độ tối ưu cập nhật 24h/lần để tiết kiệm quota miễn phí.`;
  }
}

async function fetchApifyLive(force = false) {
  const statusBadge = $('#apifySyncStatus');
  const syncBtn = $('#btnSyncApify');
  const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0', 10);
  const now = Date.now();

  // Kiểm tra giới hạn 24 giờ nếu không phải bấm cưỡng bức (force)
  if (!force && lastSync && (now - lastSync < ONE_DAY_MS)) {
    console.log('Apify cache is under 24 hours old. Skipping live fetch to optimize quota.');
    updateSyncTimeBadge(lastSync);
    return;
  }

  if (statusBadge) {
    statusBadge.textContent = '🔄 Đang đồng bộ Apify...';
    statusBadge.style.background = '#d97706';
  }
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '🔄 Đang tải...';
  }

  try {
    // Thử endpoint dataset của task run mới nhất trước
    let response = await fetch(APIFY_TASK_DATASET_URL);
    let items = null;

    if (response.ok) {
      items = await response.json();
    }

    // Nếu task run chưa chạy (record-not-found), fallback sang dataset đã cào
    if (!items || !Array.isArray(items) || !items.length) {
      console.warn('Actor task run dataset empty or pending. Trying fallback dataset...');
      const fbRes = await fetch(APIFY_DATASET_FALLBACK_URL);
      if (fbRes.ok) {
        items = await fbRes.json();
      }
    }

    if (Array.isArray(items) && items.length) {
      const validItems = items.filter(it => it.text && it.text.trim().length > 15);
      localStorage.setItem(CACHE_APIFY_KEY, JSON.stringify(validItems));
      localStorage.setItem(LAST_SYNC_KEY, now.toString());

      activeData = getAllPosts();
      renderCards(activeData);
      updateSyncTimeBadge(now);

      if (statusBadge) {
        statusBadge.textContent = '⚡ Apify Live (Mới nhất)';
        statusBadge.style.background = 'var(--clr-primary)';
      }
      showToast(`🎉 Đã đồng bộ thành công ${validItems.length} bài đăng từ Apify!`);
    } else {
      throw new Error('Dữ liệu Apify rỗng hoặc Actor Task chưa có lượt chạy');
    }
  } catch (err) {
    console.info('Apify live sync notice:', err.message);
    if (statusBadge) {
      statusBadge.textContent = '📦 Dữ liệu Apify Sẵn Sàng';
      statusBadge.style.background = 'var(--clr-primary)';
    }
    updateSyncTimeBadge(lastSync);
    if (force) {
      showToast('ℹ️ Task facebook-thue-nha chưa có lượt chạy mới trên Apify. Đang dùng dữ liệu sẵn có.');
    }
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<span class="btn-icon">🔄</span> Đồng bộ Apify (Bỏ qua 24h)';
    }
  }
}

/* ============================================================
   APPOINTMENTS & BOOKING SYSTEM (ĐẶT LỊCH HẸN & QUẢN LÝ ADMIN)
   ============================================================ */
function getBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading bookings', e);
  }
  return [];
}

function saveBookings(list) {
  localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(list));
  updateBookingBadges();
}

/* ============================================================
   NETLIFY & CLOUD REALTIME SYNC (LƯU TRỮ VĨNH VIỄN & THỜI GIAN THỰC)
   ============================================================ */
const CLOUD_STORAGE_ENDPOINT_KEY = 'thaoanh_cloud_db_endpoint';

function getCloudEndpoint() {
  return localStorage.getItem(CLOUD_STORAGE_ENDPOINT_KEY) || '';
}

async function syncBookingToCloud(booking) {
  const endpoint = getCloudEndpoint();
  if (!endpoint) return;

  try {
    await fetch(`${endpoint.replace(/\/$/, '')}/bookings.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    console.log('Booking synced to Cloud Realtime successfully!');
  } catch (e) {
    console.warn('Cloud sync notice:', e);
  }
}

async function fetchBookingsFromCloud() {
  const endpoint = getCloudEndpoint();
  if (!endpoint) return;

  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/bookings.json`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const cloudBookings = Object.keys(data).map(k => ({ ...data[k], cloudKey: k }));
        const localBookings = getBookings();
        const mergedMap = new Map();
        [...localBookings, ...cloudBookings].forEach(b => {
          if (b.id) mergedMap.set(b.id, b);
        });
        const merged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(merged));
        updateBookingBadges();
        if (typeof renderAppointmentsList === 'function') renderAppointmentsList();
      }
    }
  } catch (e) {
    console.warn('Cloud fetch notice:', e);
  }
}

function updateBookingBadges() {
  const bookings = getBookings();
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const headerBadge = $('#headerBookingCount');
  if (headerBadge) {
    headerBadge.textContent = pendingCount;
    headerBadge.classList.toggle('has-alert', pendingCount > 0);
  }

  const navBadge = $('#navBookingCount');
  if (navBadge) navBadge.textContent = pendingCount;

  const panelBadge = $('#panelBookingCount');
  if (panelBadge) panelBadge.textContent = bookings.length;

  const countAll = $('#countAptAll');
  if (countAll) countAll.textContent = bookings.length;

  const countPending = $('#countAptPending');
  if (countPending) countPending.textContent = pendingCount;

  const countConfirmed = $('#countAptConfirmed');
  if (countConfirmed) countConfirmed.textContent = bookings.filter(b => b.status === 'confirmed').length;

  const countDone = $('#countAptDone');
  if (countDone) countDone.textContent = bookings.filter(b => b.status === 'done').length;
}

function openBookingModal(aptId = null, aptTitle = null) {
  const modalOverlay = $('#bookingModalOverlay');
  const form = $('#bookingForm');
  const successBox = $('#bookingSuccessBox');
  const bookAptId = $('#bookAptId');
  const bookAptName = $('#bookAptName');
  const bookDate = $('#bookDate');

  if (!modalOverlay) return;

  // Reset view
  if (form) form.classList.remove('hidden');
  if (successBox) successBox.classList.add('hidden');

  // Điền trước thông tin căn hộ
  if (aptTitle) {
    bookAptId.value = aptId || '';
    bookAptName.value = aptTitle;
  } else if (aptId) {
    const apt = getAllPosts().find(a => String(a.id) === String(aptId));
    bookAptId.value = aptId;
    bookAptName.value = apt ? `${apt.title} (${apt.district})` : '';
  } else {
    bookAptId.value = '';
    bookAptName.value = 'Thảo Anh Apartment (Cơ sở tại Đà Lạt)';
  }

  // Set ngày hẹn tối thiểu là hôm nay
  if (bookDate) {
    const today = new Date().toISOString().split('T')[0];
    bookDate.min = today;
    if (!bookDate.value) bookDate.value = today;
  }

  modalOverlay.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeBookingModal() {
  const modalOverlay = $('#bookingModalOverlay');
  if (modalOverlay) modalOverlay.classList.remove('active');
  document.body.classList.remove('modal-open');
}

function handleBookingSubmit(e) {
  e.preventDefault();

  const aptId = $('#bookAptId').value;
  const aptName = $('#bookAptName').value.trim();
  const customerName = $('#bookCustomerName').value.trim();
  const customerPhone = $('#bookCustomerPhone').value.trim();
  const bookDate = $('#bookDate').value;
  const timeSlot = $('#bookTimeSlot').value;
  const notes = $('#bookNotes').value.trim();

  if (!customerName || !customerPhone || !bookDate) {
    alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Ngày hẹn xem phòng!');
    return;
  }

  const newBooking = {
    id: 'BK-' + Date.now().toString(36).toUpperCase(),
    aptId,
    aptName,
    customerName,
    customerPhone,
    bookDate,
    timeSlot,
    notes,
    status: 'pending', // pending | confirmed | done | cancelled
    createdAt: new Date().toISOString()
  };

  const list = getBookings();
  list.unshift(newBooking);
  saveBookings(list);

  // 1. Tự động gửi tới Netlify Forms (hoạt động tức thì khi đưa website lên Netlify)
  try {
    const netlifyBody = new URLSearchParams();
    netlifyBody.append('form-name', 'dat-lich-thaoanh');
    netlifyBody.append('aptId', aptId);
    netlifyBody.append('aptName', aptName);
    netlifyBody.append('customerName', customerName);
    netlifyBody.append('customerPhone', customerPhone);
    netlifyBody.append('bookDate', bookDate);
    netlifyBody.append('timeSlot', timeSlot);
    netlifyBody.append('notes', notes);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: netlifyBody.toString()
    }).then(res => {
      if (res.ok) console.log('Đã gửi thông tin đặt phòng tới Netlify Forms thành công!');
    }).catch(err => console.log('Netlify form notice:', err));
  } catch (err) {
    console.log('Netlify error:', err);
  }

  // 2. Gửi đồng bộ lên Cloud Realtime Database (nếu có cấu hình)
  syncBookingToCloud(newBooking);

  // Hiển thị màn hình thành công
  const form = $('#bookingForm');
  const successBox = $('#bookingSuccessBox');
  const detailsBox = $('#bookingSuccessDetails');
  const zaloBtn = $('#btnZaloConfirmQuick');

  if (form) form.classList.add('hidden');
  if (successBox) successBox.classList.remove('hidden');

  if (detailsBox) {
    if (currentLang === 'en') {
      detailsBox.innerHTML = `
        <div class="booking-receipt">
          <p><strong>Booking ID:</strong> <span>#${newBooking.id}</span></p>
          <p><strong>Customer:</strong> <span>${customerName} (${customerPhone})</span></p>
          <p><strong>Apartment:</strong> <span>${aptName}</span></p>
          <p><strong>Scheduled Time:</strong> <span>${bookDate} | ${timeSlot}</span></p>
          ${notes ? `<p><strong>Notes:</strong> <span>${notes}</span></p>` : ''}
        </div>
      `;
    } else {
      detailsBox.innerHTML = `
        <div class="booking-receipt">
          <p><strong>Mã lịch hẹn:</strong> <span>#${newBooking.id}</span></p>
          <p><strong>Khách hàng:</strong> <span>${customerName} (${customerPhone})</span></p>
          <p><strong>Phòng quan tâm:</strong> <span>${aptName}</span></p>
          <p><strong>Thời gian hẹn:</strong> <span>${bookDate} | ${timeSlot}</span></p>
          ${notes ? `<p><strong>Ghi chú:</strong> <span>${notes}</span></p>` : ''}
        </div>
      `;
    }
  }

  if (zaloBtn) {
    const zaloMsg = encodeURIComponent(currentLang === 'en'
      ? `Hello Thao Anh Apartment, my name is ${customerName} (${customerPhone}). I just requested a viewing for "${aptName}" on ${bookDate} (${timeSlot}). Please assist and confirm for me!`
      : `Chào Thảo Anh Apartment, mình tên ${customerName} (${customerPhone}). Mình vừa đặt lịch hẹn xem phòng "${aptName}" vào ngày ${bookDate} (${timeSlot}). Nhờ quản lý tư vấn xác nhận giúp mình nhé!`);
    zaloBtn.href = `https://zalo.me/0901351815?text=${zaloMsg}`;
  }

  showToast(currentLang === 'en'
    ? '🎉 Viewing scheduled successfully! Our manager will contact you shortly.'
    : '🎉 Đặt lịch hẹn xem phòng thành công! Quản trị viên đã nhận được thông tin.');
}

/* ── QUẢN LÝ LỊCH HẸN TRONG TÀI KHOẢN ADMIN ────────────────── */
let currentAppointmentFilter = 'all';

function openAppointmentsModal() {
  const modal = $('#appointmentsModalOverlay');
  if (!modal) return;
  modal.classList.add('active');
  document.body.classList.add('modal-open');
  renderAppointmentsList();
  fetchBookingsFromCloud();
}

function closeAppointmentsModal() {
  const modal = $('#appointmentsModalOverlay');
  if (modal) modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

function renderAppointmentsList() {
  const listEl = $('#appointmentsList');
  if (!listEl) return;

  const bookings = getBookings();
  updateBookingBadges();

  let filtered = bookings;
  if (currentAppointmentFilter !== 'all') {
    filtered = bookings.filter(b => b.status === currentAppointmentFilter);
  }

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="empty-bookings">
        <div class="empty-icon">📅</div>
        <h4>Chưa có lịch hẹn nào (${currentAppointmentFilter === 'all' ? 'Tất cả' : currentAppointmentFilter})</h4>
        <p>Khi khách hàng bấm "Đặt Lịch Xem Phòng" trên website, thông tin sẽ hiển thị trực tiếp tại đây.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(b => {
    const statusMap = {
      pending:   { label: '🟡 Chờ liên hệ', class: 'status--pending' },
      confirmed: { label: '🔵 Đã xác nhận hẹn', class: 'status--confirmed' },
      done:      { label: '🟢 Đã xem / Chốt cọc', class: 'status--done' },
      cancelled: { label: '⚪ Đã hủy', class: 'status--cancelled' }
    };
    const curStatus = statusMap[b.status] || statusMap.pending;

    return `
      <div class="appointment-card ${curStatus.class}" data-id="${b.id}">
        <div class="apt-card__top">
          <div class="apt-card__customer">
            <h4 class="apt-card__name">${b.customerName}</h4>
            <div class="apt-card__contact-links">
              <a href="tel:${b.customerPhone}" class="btn-tel" title="Gọi trực tiếp">
                ${SVG.bed} 📞 ${b.customerPhone}
              </a>
              <a href="https://zalo.me/${b.customerPhone.replace(/[^\d]/g, '')}" target="_blank" class="btn-zalo-direct" title="Nhắn Zalo">
                💬 Zalo
              </a>
            </div>
          </div>
          <span class="apt-badge ${curStatus.class}">${curStatus.label}</span>
        </div>

        <div class="apt-card__info">
          <p class="apt-card__room"><strong>🏡 Căn hộ:</strong> ${b.aptName}</p>
          <p class="apt-card__time"><strong>⏰ Lịch hẹn:</strong> Ngày <strong>${b.bookDate}</strong> – Khung giờ: <strong>${b.timeSlot}</strong></p>
          ${b.notes ? `<p class="apt-card__notes"><strong>📝 Lời nhắn:</strong> "${b.notes}"</p>` : ''}
          <p class="apt-card__meta"><small>Gửi lúc: ${new Date(b.createdAt).toLocaleString('vi-VN')}</small></p>
        </div>

        <div class="apt-card__actions">
          <label>Trạng thái:
            <select class="apt-status-select" data-id="${b.id}">
              <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>🟡 Chờ liên hệ</option>
              <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>🔵 Đã xác nhận hẹn</option>
              <option value="done" ${b.status === 'done' ? 'selected' : ''}>🟢 Đã xem / Chốt cọc</option>
              <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>⚪ Đã hủy</option>
            </select>
          </label>
          <button class="btn btn--danger-outline btn--sm btn-delete-booking" data-id="${b.id}" title="Xóa lịch hẹn này">
            ${SVG.trash} Xóa
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Gắn sự kiện thay đổi trạng thái
  $$('.apt-status-select', listEl).forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      const all = getBookings();
      const target = all.find(b => b.id === id);
      if (target) {
        target.status = newStatus;
        saveBookings(all);
        renderAppointmentsList();
        showToast('✅ Đã cập nhật trạng thái lịch hẹn!');
      }
    });
  });

  // Gắn sự kiện xóa lịch hẹn
  $$('.btn-delete-booking', listEl).forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('Bạn có chắc muốn xóa lịch hẹn này khỏi danh sách?')) {
        const remaining = getBookings().filter(b => b.id !== id);
        saveBookings(remaining);
        renderAppointmentsList();
        showToast('🗑️ Đã xóa lịch hẹn.');
      }
    });
  });
}

/* ============================================================
   ADMIN EDIT POST SYSTEM (CHỈNH SỬA BÀI VIẾT ĐÃ ĐĂNG)
   ============================================================ */
function openEditPostModal(id) {
  const apt = getAllPosts().find(a => String(a.id) === String(id));
  if (!apt) {
    alert('Không tìm thấy bài viết này để chỉnh sửa.');
    return;
  }

  const modal = $('#editModalOverlay');
  if (!modal) return;

  $('#editPostId').value = apt.id;
  $('#editTitle').value = apt.title || '';
  $('#editTag').value = apt.tag || 'Thảo Anh';
  $('#editPrice').value = apt.price || '';
  $('#editDistrict').value = apt.district.includes('Ngô Thì Sỹ') ? 'Ngô Thì Sỹ' :
                             apt.district.includes('Nguyễn Trung Trực') ? 'Nguyễn Trung Trực' :
                             apt.district.includes('61/7') ? '61/7 Phù Đổng' : '61/18 Phù Đổng';
  $('#editRoom').value = apt.roomType || '1PN';
  $('#editAddress').value = apt.address || '';

  const areaMatch = (apt.specs || []).find(s => s.label && s.label.includes('m²'));
  $('#editArea').value = areaMatch ? areaMatch.label : '';

  $('#editImages').value = (apt.images || [apt.imageUrl]).join('\n');
  $('#editAmenities').value = (apt.amenities || []).join(', ');
  $('#editDescription').value = apt.description || '';

  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeEditPostModal() {
  const modal = $('#editModalOverlay');
  if (modal) modal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

function handleEditPostSubmit(e) {
  e.preventDefault();

  const id = $('#editPostId').value;
  if (!id) return;

  const title = $('#editTitle').value.trim();
  const tag = $('#editTag').value.trim() || 'Thảo Anh';
  const price = $('#editPrice').value.trim();
  const district = $('#editDistrict').value;
  const roomType = $('#editRoom').value;
  const address = $('#editAddress').value.trim();
  const area = $('#editArea').value.trim();
  const desc = $('#editDescription').value.trim();

  // Images
  const rawImgs = $('#editImages').value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  const images = rawImgs.length ? rawImgs : ['dalat-sample.png'];

  // Amenities
  const rawAm = $('#editAmenities').value.split(',').map(s => s.trim()).filter(Boolean);
  const amenities = rawAm.length ? rawAm : ['Full nội thất cao cấp', 'Bình tắm nóng lạnh', 'Bếp nấu riêng', 'Wifi'];

  const beds = roomType === '2PN' ? 2 : 1;
  const specs = [
    { icon: SVG.bed,  label: `${beds} Phòng ngủ` },
    { icon: SVG.bath, label: '1 WC Nước nóng' },
  ];
  if (area) {
    specs.push({ icon: SVG.area, label: area.includes('m²') ? area : `${area} m²` });
  }

  const editedData = {
    title,
    tag,
    price,
    district,
    roomType,
    address,
    specs,
    images,
    imageUrl: images[0],
    amenities,
    description: desc,
    isEdited: true
  };

  // Lưu vào edited posts map
  const editedMap = getEditedPostsMap();
  editedMap[String(id)] = editedData;
  localStorage.setItem(STORAGE_EDITED_KEY, JSON.stringify(editedMap));

  // Render lại toàn bộ danh sách
  activeData = getAllPosts();
  renderCards(activeData);

  closeEditPostModal();
  showToast('✅ Đã lưu cập nhật bài viết thành công!');
}

function deletePost(id) {
  const apt = getAllPosts().find(a => String(a.id) === String(id));
  const title = apt ? apt.title : 'bài viết này';

  if (!confirm(`Bạn có chắc chắn muốn xóa "${title}" khỏi website?`)) return;

  // Thêm vào danh sách đã xóa
  const deletedIds = getDeletedPostIds();
  if (!deletedIds.includes(String(id))) {
    deletedIds.push(String(id));
    localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(deletedIds));
  }

  // Xóa khỏi custom posts nếu có
  const custom = getCustomPosts().filter(p => String(p.id) !== String(id) && String(p.postId) !== String(id));
  localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(custom));

  activeData = getAllPosts();
  renderCards(activeData);
  showToast('🗑️ Đã xóa bài viết khỏi website.');
}

/* ============================================================
   CARD CREATION & RENDERING
   ============================================================ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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

let activeData = [];

function formatPrice(price) {
  if (!price || price === 'Liên hệ') {
    return `<span class="price-contact">${currentLang === 'en' ? 'Contact for price' : 'Giá liên hệ'}</span>`;
  }
  const unit = currentLang === 'en' ? 'VND/month' : 'VNĐ/tháng';
  return `${price} <span>${unit}</span>`;
}

function createCard(apt) {
  const article = document.createElement('article');
  article.className = 'card animate-in';
  article.setAttribute('tabindex', '0');

  const specsHTML = (apt.specs || [])
    .map(s => {
      let label = s.label;
      if (currentLang === 'en') {
        if (/(\d+)\s*phòng ngủ/i.test(label)) {
          const num = label.match(/(\d+)/)?.[1] || 1;
          label = `${num} ${num > 1 ? 'Bedrooms' : 'Bedroom'}`;
        } else if (/nước nóng|wc/i.test(label)) {
          label = '1 Bath (Hot Water)';
        } else if (/ban công/i.test(label)) {
          label = 'Private Balcony';
        } else if (/tự do/i.test(label)) {
          label = 'Flexible 24h';
        }
      }
      return `<span class="card__spec">${s.icon} ${label}</span>`;
    })
    .join('');

  // Huy hiệu số lượng ảnh
  const imgCountHTML = (apt.images && apt.images.length > 1)
    ? `<span class="card__img-count">📷 ${apt.images.length} ${currentLang === 'en' ? 'photos' : 'ảnh'}</span>`
    : '';

  // Nút Quản trị viên (Sửa & Xóa bài trên thẻ)
  const adminBtnsHTML = `
    <div class="card__admin-actions admin-only">
      <button class="card__admin-btn card__admin-btn--edit" data-id="${apt.id}" title="${currentLang === 'en' ? 'Edit listing' : 'Chỉnh sửa bài này'}">
        ${SVG.edit} ${currentLang === 'en' ? 'Edit' : 'Sửa'}
      </button>
      <button class="card__admin-btn card__admin-btn--del" data-id="${apt.id}" title="${currentLang === 'en' ? 'Delete listing' : 'Xóa bài này'}">
        ${SVG.trash} ${currentLang === 'en' ? 'Delete' : 'Xóa'}
      </button>
    </div>
  `;

  article.innerHTML = `
    <div class="card__img-wrap">
      <img
        class="card__img"
        src="${apt.imageUrl}"
        alt="${apt.title}"
        loading="lazy"
        referrerpolicy="no-referrer"
        onerror="this.onerror=null; this.src='dalat-sample.png';"
      />
      <span class="card__tag">${apt.tag || 'Thảo Anh'}</span>
      ${imgCountHTML}
      ${adminBtnsHTML}
      <span class="card__fav" title="${currentLang === 'en' ? 'Add to favorites' : 'Yêu thích'}" role="button" aria-label="Favorite">🤍</span>
    </div>
    <div class="card__body">
      <p class="card__price">${formatPrice(apt.price)}</p>
      <h3 class="card__title">${apt.title}</h3>
      <p class="card__address">
        ${SVG.location}
        <span>${apt.address}</span>
      </p>
      <div class="card__specs">${specsHTML}</div>
    </div>
    <div class="card__footer">
      <span class="card__time">${SVG.clock} ${apt.postedTime || (currentLang === 'en' ? 'Just updated' : 'Vừa xong')}</span>
      <div class="card__footer-actions">
        <button class="btn btn--sm btn--card-book" data-id="${apt.id}" title="${currentLang === 'en' ? 'Book a viewing for this apartment' : 'Đặt lịch hẹn xem căn hộ này'}">
          ${SVG.calendar} ${currentLang === 'en' ? 'Book viewing' : 'Đặt lịch'}
        </button>
        <span class="card__cta">${currentLang === 'en' ? 'Details →' : 'Chi tiết →'}</span>
      </div>
    </div>
  `;

  // Gắn sự kiện nút admin
  const editBtn = article.querySelector('.card__admin-btn--edit');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditPostModal(apt.id);
    });
  }

  const delBtn = article.querySelector('.card__admin-btn--del');
  if (delBtn) {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deletePost(apt.id);
    });
  }

  // Nút đặt lịch nhanh trên thẻ
  const cardBookBtn = article.querySelector('.btn--card-book');
  if (cardBookBtn) {
    cardBookBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBookingModal(apt.id, apt.title);
    });
  }

  article.querySelector('.card__fav').addEventListener('click', handleFavToggle);

  article.addEventListener('click', (e) => {
    if (e.target.closest('.card__fav') || e.target.closest('.card__admin-actions') || e.target.closest('.btn--card-book')) return;
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
  if (!listingGrid) return;
  listingGrid.innerHTML = '';

  if (!data.length) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (resultCount) resultCount.textContent = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (resultCount) {
    resultCount.textContent = currentLang === 'en'
      ? `Showing ${data.length} available apartments from Thao Anh Apartment Da Lat`
      : `Đang hiển thị ${data.length} căn hộ từ Thảo Anh Apartment Đà Lạt`;
  }

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
  const branch     = filterDistrict ? filterDistrict.value : '';
  const priceRange = filterPrice ? filterPrice.value : '';
  const roomType   = filterRoom ? filterRoom.value : '';

  activeData = getAllPosts().filter(apt => {
    if (branch && !apt.district.includes(branch) && !apt.address.includes(branch)) {
      return false;
    }

    if (priceRange) {
      const p = apt.priceNum;
      if (priceRange === '0-4' && (p > 4 || p === 0)) return false;
      if (priceRange === '4-5' && (p < 4 || p > 5))  return false;
      if (priceRange === '5-7' && (p < 5 || p > 7))  return false;
      if (priceRange === '7+'  && p < 7)              return false;
    }

    if (roomType && apt.roomType !== roomType) {
      return false;
    }

    return true;
  });

  renderCards(activeData);

  const listingsSec = $('#listings');
  if (listingsSec) {
    listingsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function resetAllFilters() {
  if (filterDistrict) filterDistrict.value = '';
  if (filterPrice)    filterPrice.value = '';
  if (filterRoom)     filterRoom.value = '';
  activeData = getAllPosts();
  renderCards(activeData);
}

if (applyFilter) applyFilter.addEventListener('click', applyFilters);
if (resetFilter) resetFilter.addEventListener('click', resetAllFilters);

/* ============================================================
   MODAL CHI TIẾT & ALBUM ẢNH (2 CỘT & LIGHTBOX SIÊU NÉT)
   ============================================================ */
let currentModalAptId = null;
let currentModalImages = [];
let currentModalImgIndex = 0;
let isLightboxActive = false;
let currentLightboxIndex = 0;

function setModalGalleryIndex(idx) {
  if (!currentModalImages || !currentModalImages.length) return;
  if (idx < 0) idx = currentModalImages.length - 1;
  if (idx >= currentModalImages.length) idx = 0;
  currentModalImgIndex = idx;

  const modalImg = $('#modalImg');
  if (modalImg) {
    modalImg.style.opacity = '0.35';
    modalImg.src = currentModalImages[currentModalImgIndex];
    requestAnimationFrame(() => {
      modalImg.style.opacity = '1';
    });
  }

  const counter = $('#modalImgCounter');
  if (counter) {
    counter.textContent = `${currentModalImgIndex + 1} / ${currentModalImages.length}`;
  }

  const thumbsBox = $('#modalThumbnails');
  if (thumbsBox) {
    const thumbs = $$('.modal__thumb', thumbsBox);
    thumbs.forEach((t, i) => {
      const isActive = (i === currentModalImgIndex);
      t.classList.toggle('active', isActive);
      if (isActive) {
        t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }
}

function nextModalImage() {
  setModalGalleryIndex(currentModalImgIndex + 1);
}

function prevModalImage() {
  setModalGalleryIndex(currentModalImgIndex - 1);
}

/* ── LIGHTBOX FULLSCREEN ZOOM CHẤT LƯỢNG CAO ───────────────── */
function openLightbox(idx = 0) {
  if (!currentModalImages || !currentModalImages.length) return;
  isLightboxActive = true;
  currentLightboxIndex = idx;
  const lb = $('#lightboxModal');
  const lbImg = $('#lightboxImg');
  const lbCounter = $('#lightboxCounter');
  if (!lb || !lbImg) return;

  lbImg.classList.remove('zoomed');
  lbImg.src = currentModalImages[currentLightboxIndex];
  if (lbCounter) lbCounter.textContent = `${currentLightboxIndex + 1} / ${currentModalImages.length}`;

  lb.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeLightbox() {
  isLightboxActive = false;
  const lb = $('#lightboxModal');
  const lbImg = $('#lightboxImg');
  if (lb) lb.classList.remove('active');
  if (lbImg) lbImg.classList.remove('zoomed');
  if (!modalOverlay.classList.contains('active')) {
    document.body.classList.remove('modal-open');
  }
}

function nextLightboxImage() {
  if (!currentModalImages || !currentModalImages.length) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % currentModalImages.length;
  updateLightboxImage();
  setModalGalleryIndex(currentLightboxIndex);
}

function prevLightboxImage() {
  if (!currentModalImages || !currentModalImages.length) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + currentModalImages.length) % currentModalImages.length;
  updateLightboxImage();
  setModalGalleryIndex(currentLightboxIndex);
}

function updateLightboxImage() {
  const lbImg = $('#lightboxImg');
  const lbCounter = $('#lightboxCounter');
  if (!lbImg) return;
  lbImg.classList.remove('zoomed');
  lbImg.style.opacity = '0.35';
  lbImg.src = currentModalImages[currentLightboxIndex];
  requestAnimationFrame(() => {
    lbImg.style.opacity = '1';
  });
  if (lbCounter) lbCounter.textContent = `${currentLightboxIndex + 1} / ${currentModalImages.length}`;
}

function openModal(id) {
  const apt = getAllPosts().find(a => String(a.id) === String(id));
  if (!apt) return;

  currentModalAptId = apt.id;

  // Cấu hình danh sách ảnh
  currentModalImages = (apt.images && apt.images.length)
    ? apt.images
    : (apt.imageUrl ? [apt.imageUrl] : ['dalat-sample.png']);
  currentModalImgIndex = 0;

  const modalImg = $('#modalImg');
  if (modalImg) {
    modalImg.alt = apt.title;
    modalImg.style.opacity = '0';
    modalImg.onerror = () => { modalImg.src = 'dalat-sample.png'; };
  }

  const unit = currentLang === 'en' ? '/month' : '/tháng';
  $('#modalPrice').innerHTML = apt.price === 'Liên hệ'
    ? (currentLang === 'en' ? 'Contact for price' : 'Liên hệ')
    : `${apt.price} VNĐ<small style="font-size:.6em;font-weight:500;color:var(--clr-text-muted)">${unit}</small>`;

  $('#modalTag').textContent = apt.tag || (currentLang === 'en' ? 'Thao Anh' : 'Thảo Anh');
  $('#modalTitle').textContent = apt.title;
  $('#modalAddressText').textContent = apt.address;
  $('#modalBadge').textContent = apt.tag || (currentLang === 'en' ? 'Thao Anh' : 'Thảo Anh');

  // Specs
  $('#modalSpecs').innerHTML = (apt.specs || [])
    .map(s => {
      let label = s.label;
      if (currentLang === 'en') {
        if (/(\d+)\s*phòng ngủ/i.test(label)) {
          const num = label.match(/(\d+)/)?.[1] || 1;
          label = `${num} ${num > 1 ? 'Bedrooms' : 'Bedroom'}`;
        } else if (/nước nóng|wc/i.test(label)) {
          label = '1 Bath (Hot Water)';
        } else if (/ban công/i.test(label)) {
          label = 'Private Balcony';
        } else if (/tự do/i.test(label)) {
          label = 'Flexible 24h';
        }
      }
      return `<span class="modal__spec">${s.icon} ${label}</span>`;
    })
    .join('');

  // Nội thất thực tế với hình minh họa
  const amenitiesList = (apt.amenities && apt.amenities.length)
    ? apt.amenities
    : ['Full nội thất cao cấp', 'Bình tắm nóng lạnh', 'Bếp nấu riêng', 'Wifi'];

  $('#modalAmenities').innerHTML = amenitiesList
    .map(a => `<span class="modal__amenity">${SVG.check} ${a}</span>`)
    .join('');

  // Description
  $('#modalDescription').textContent = apt.description;

  // Album ảnh thu nhỏ (Gallery thumbnails)
  const thumbsBox = $('#modalThumbnails');
  const thumbsWrap = $('.modal__thumbnails-wrap');
  if (thumbsBox) {
    thumbsBox.innerHTML = '';
    if (currentModalImages.length > 1) {
      if (thumbsWrap) thumbsWrap.classList.remove('hidden');
      thumbsBox.classList.remove('hidden');
      currentModalImages.forEach((imgSrc, idx) => {
        const thumb = document.createElement('img');
        thumb.className = `modal__thumb ${idx === 0 ? 'active' : ''}`;
        thumb.src = imgSrc;
        thumb.alt = `Ảnh ${idx + 1}`;
        thumb.setAttribute('referrerpolicy', 'no-referrer');
        thumb.onerror = () => { thumb.src = 'dalat-sample.png'; };
        thumb.addEventListener('click', (e) => {
          e.stopPropagation();
          setModalGalleryIndex(idx);
        });
        thumbsBox.appendChild(thumb);
      });
    } else {
      thumbsBox.classList.add('hidden');
      if (thumbsWrap) thumbsWrap.classList.add('hidden');
    }
  }

  // Khởi tạo ảnh đầu tiên
  setModalGalleryIndex(0);

  // Ẩn/Hiện nút chuyển ảnh nếu chỉ có 1 ảnh
  const prevBtn = $('#modalImgPrev');
  const nextBtn = $('#modalImgNext');
  const counter = $('#modalImgCounter');
  if (prevBtn) prevBtn.style.display = currentModalImages.length > 1 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = currentModalImages.length > 1 ? 'flex' : 'none';
  if (counter) counter.style.display = currentModalImages.length > 1 ? 'block' : 'none';

  // Nút nhanh xem album ảnh phòng
  const photoCountLabel = $('#modalPhotoCountLabel');
  if (photoCountLabel) {
    photoCountLabel.textContent = currentLang === 'en'
      ? `View All Photos (${currentModalImages.length} photos)`
      : `Xem toàn bộ ảnh phòng (${currentModalImages.length} ảnh)`;
  }
  const viewPhotosBtn = $('#modalViewPhotosBtn');
  if (viewPhotosBtn) {
    viewPhotosBtn.onclick = () => {
      openLightbox(0);
    };
  }

  // Reset cuộn lên đỉnh đầu để khách xem ngay ảnh trên mobile
  const modalEl = $('#modal');
  if (modalEl) modalEl.scrollTop = 0;
  const modalBodyEl = $('#modalBody');
  if (modalBodyEl) modalBodyEl.scrollTop = 0;

  // Nút đặt lịch xem trong modal
  const modalBookBtn = $('#modalBookNowBtn');
  if (modalBookBtn) {
    modalBookBtn.onclick = () => {
      closeModal();
      openBookingModal(apt.id, apt.title);
    };
  }

  // Nút sửa bài trong modal (dành cho Admin)
  const modalEditBtn = $('#modalEditPostBtn');
  if (modalEditBtn) {
    modalEditBtn.onclick = () => {
      closeModal();
      openEditPostModal(apt.id);
    };
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
  $('#modalMessenger').href = `tel:0559521514`;
  $('#modalZalo').href = `tel:0903879393`;

  // Activate overlay
  modalOverlay.classList.add('active');
  document.body.classList.add('modal-open');

  requestAnimationFrame(() => {
    if (modalImg) {
      modalImg.style.transition = 'opacity 0.3s ease';
      modalImg.style.opacity = '1';
    }
  });
}

function closeModal() {
  modalOverlay.classList.remove('active');
  if (!isLightboxActive) {
    document.body.classList.remove('modal-open');
  }
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

// Bắt sự kiện phóng to và chuyển ảnh trong Modal
const modalMainImg = $('#modalImg');
if (modalMainImg) {
  modalMainImg.addEventListener('click', (e) => {
    e.stopPropagation();
    openLightbox(currentModalImgIndex);
  });
}
const modalZoomBtn = $('#modalZoomBtn');
if (modalZoomBtn) {
  modalZoomBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openLightbox(currentModalImgIndex);
  });
}
const mPrevBtn = $('#modalImgPrev');
if (mPrevBtn) mPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevModalImage(); });
const mNextBtn = $('#modalImgNext');
if (mNextBtn) mNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextModalImage(); });

// Cử chỉ vuốt tay (Touch Swipe) cho Gallery trên điện thoại
const modalGalleryBox = $('#modalGallery');
if (modalGalleryBox) {
  modalGalleryBox.addEventListener('click', (e) => {
    if (e.target.closest('.modal__nav-btn') || e.target.closest('.modal__zoom-btn') || e.target.closest('.modal__close')) return;
    openLightbox(currentModalImgIndex);
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  modalGalleryBox.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
    }
  }, { passive: true });

  modalGalleryBox.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length === 1) {
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    }
  }, { passive: true });

  modalGalleryBox.addEventListener('touchend', () => {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    // Ngưỡng vuốt ngang tối thiểu 40px và độ lệch ngang phải lớn hơn độ lệch dọc
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        nextModalImage();
      } else {
        prevModalImage();
      }
    }
  });
}

// Bắt sự kiện Lightbox
const lbCloseBtn = $('#lightboxClose');
if (lbCloseBtn) lbCloseBtn.addEventListener('click', closeLightbox);
const lbPrevBtn = $('#lightboxPrev');
if (lbPrevBtn) lbPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevLightboxImage(); });
const lbNextBtn = $('#lightboxNext');
if (lbNextBtn) lbNextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextLightboxImage(); });
const lbMainImg = $('#lightboxImg');
if (lbMainImg) {
  lbMainImg.addEventListener('click', (e) => {
    e.stopPropagation();
    lbMainImg.classList.toggle('zoomed');
  });
}
const lbModalBox = $('#lightboxModal');
if (lbModalBox) {
  lbModalBox.addEventListener('click', (e) => {
    if (e.target === lbModalBox || (e.target.classList && e.target.classList.contains('lightbox__content'))) {
      closeLightbox();
    }
  });

  // Touch Swipe cử chỉ trên điện thoại cho Lightbox
  let lbTouchStartX = 0;
  let lbTouchStartY = 0;
  let lbTouchEndX = 0;
  let lbTouchEndY = 0;
  let lastTapTime = 0;

  lbModalBox.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      lbTouchStartX = e.touches[0].clientX;
      lbTouchStartY = e.touches[0].clientY;
      lbTouchEndX = lbTouchStartX;
      lbTouchEndY = lbTouchStartY;
    }
  }, { passive: true });

  lbModalBox.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length === 1) {
      lbTouchEndX = e.touches[0].clientX;
      lbTouchEndY = e.touches[0].clientY;
    }
  }, { passive: true });

  lbModalBox.addEventListener('touchend', () => {
    const diffX = lbTouchEndX - lbTouchStartX;
    const diffY = lbTouchEndY - lbTouchStartY;

    // Vuốt xuống để đóng Lightbox (như app Facebook / iOS)
    if (diffY > 80 && Math.abs(diffY) > Math.abs(diffX) * 1.4) {
      closeLightbox();
      return;
    }

    // Vuốt ngang để chuyển ảnh
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        nextLightboxImage();
      } else {
        prevLightboxImage();
      }
    }
  });

  // Chạm đúp (Double tap) để phóng to / thu nhỏ trên điện thoại
  if (lbMainImg) {
    lbMainImg.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTapTime < 320) {
        e.preventDefault();
        lbMainImg.classList.toggle('zoomed');
      }
      lastTapTime = now;
    });
  }
}

/* ============================================================
   ADMIN AUTHENTICATION
   ============================================================ */
function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
}

function applyAdminState() {
  const logged = isAdminLoggedIn();
  const adminLoginBtn = $('#adminLoginBtn');
  const adminLoggedBadge = $('#adminLoggedBadge');
  const fbSmartPanel = $('#fbSmartPanel');
  const navAdminLoginBtn = $('#navAdminLoginBtn');
  const navAdminAppointmentsBtn = $('#navAdminAppointmentsBtn');
  const navAdminLogoutBtn = $('#navAdminLogoutBtn');

  if (logged) {
    document.body.classList.add('is-admin');
    if (adminLoginBtn) adminLoginBtn.classList.add('hidden');
    if (adminLoggedBadge) adminLoggedBadge.classList.remove('hidden');
    if (fbSmartPanel) fbSmartPanel.classList.remove('hidden');
    if (navAdminLoginBtn) navAdminLoginBtn.classList.add('hidden');
    if (navAdminAppointmentsBtn) navAdminAppointmentsBtn.classList.remove('hidden');
    if (navAdminLogoutBtn) navAdminLogoutBtn.classList.remove('hidden');
  } else {
    document.body.classList.remove('is-admin');
    if (adminLoginBtn) adminLoginBtn.classList.remove('hidden');
    if (adminLoggedBadge) adminLoggedBadge.classList.add('hidden');
    if (fbSmartPanel) fbSmartPanel.classList.add('hidden');
    if (navAdminLoginBtn) navAdminLoginBtn.classList.remove('hidden');
    if (navAdminAppointmentsBtn) navAdminAppointmentsBtn.classList.add('hidden');
    if (navAdminLogoutBtn) navAdminLogoutBtn.classList.add('hidden');
  }

  updateBookingBadges();
}

function initAdminAuth() {
  const adminLoginBtn     = $('#adminLoginBtn');
  const adminLogoutBtn    = $('#adminLogoutBtn');
  const adminModalOverlay = $('#adminModalOverlay');
  const adminModalClose   = $('#adminModalClose');
  const adminLoginForm   = $('#adminLoginForm');
  const adminPassword    = $('#adminPassword');
  const navAdminLoginBtn  = $('#navAdminLoginBtn');
  const navAdminAppointmentsBtn = $('#navAdminAppointmentsBtn');
  const navAdminLogoutBtn = $('#navAdminLogoutBtn');

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

  // Hỗ trợ đăng nhập & quản lý từ Menu di động (Hamburger)
  if (navAdminLoginBtn) {
    navAdminLoginBtn.addEventListener('click', () => {
      const navEl = $('#nav');
      const navToggleEl = $('#navToggle');
      if (navEl) navEl.classList.remove('open', 'nav--open');
      if (navToggleEl) navToggleEl.classList.remove('active', 'nav-toggle--active');
      openAdminModal();
    });
  }

  if (navAdminAppointmentsBtn) {
    navAdminAppointmentsBtn.addEventListener('click', () => {
      const navEl = $('#nav');
      const navToggleEl = $('#navToggle');
      if (navEl) navEl.classList.remove('open', 'nav--open');
      if (navToggleEl) navToggleEl.classList.remove('active', 'nav-toggle--active');
      openAppointmentsModal();
    });
  }

  if (navAdminLogoutBtn) {
    navAdminLogoutBtn.addEventListener('click', () => {
      const navEl = $('#nav');
      const navToggleEl = $('#navToggle');
      if (navEl) navEl.classList.remove('open', 'nav--open');
      if (navToggleEl) navToggleEl.classList.remove('active', 'nav-toggle--active');
      if (confirm('Bạn có muốn đăng xuất quyền Admin không?')) {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        applyAdminState();
        showToast('Đã đăng xuất quyền Admin.');
      }
    });
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPass = adminPassword.value.trim();

      if (VALID_PASSWORDS.includes(enteredPass)) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        applyAdminState();
        closeAdminModal();
        showToast('🛡️ Đăng nhập quyền Admin thành công!');
      } else {
        alert('Mật khẩu không đúng! Mật khẩu mặc định là: admin123');
        adminPassword.select();
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      if (confirm('Bạn có muốn đăng xuất quyền Admin không?')) {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        applyAdminState();
        showToast('Đã đăng xuất quyền Admin.');
      }
    });
  }

  // Header booking button
  const headerBookingBtn = $('#headerBookingBtn');
  if (headerBookingBtn) {
    headerBookingBtn.addEventListener('click', () => openBookingModal(null, null));
  }

  // Header appointments button (Admin)
  const headerAppointmentsBtn = $('#headerAppointmentsBtn');
  if (headerAppointmentsBtn) {
    headerAppointmentsBtn.addEventListener('click', openAppointmentsModal);
  }

  // Panel appointments button (Admin)
  const btnOpenAppointmentsPanel = $('#btnOpenAppointmentsPanel');
  if (btnOpenAppointmentsPanel) {
    btnOpenAppointmentsPanel.addEventListener('click', openAppointmentsModal);
  }

  // Modal appointments close
  const appointmentsModalClose = $('#appointmentsModalClose');
  if (appointmentsModalClose) appointmentsModalClose.addEventListener('click', closeAppointmentsModal);
  const appointmentsModalOverlay = $('#appointmentsModalOverlay');
  if (appointmentsModalOverlay) {
    appointmentsModalOverlay.addEventListener('click', (e) => {
      if (e.target === appointmentsModalOverlay) closeAppointmentsModal();
    });
  }

  // Filter tabs in appointments modal
  $$('.apt-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      $$('.apt-pill').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentAppointmentFilter = e.currentTarget.dataset.filter || 'all';
      renderAppointmentsList();
    });
  });

  // Clear appointments button
  const btnClearAppointments = $('#btnClearAppointments');
  if (btnClearAppointments) {
    btnClearAppointments.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn xoá toàn bộ danh sách lịch hẹn không?')) {
        saveBookings([]);
        renderAppointmentsList();
        showToast('🗑️ Đã xóa toàn bộ lịch hẹn.');
      }
    });
  }

  // Booking modal close buttons
  const bookingModalClose = $('#bookingModalClose');
  if (bookingModalClose) bookingModalClose.addEventListener('click', closeBookingModal);
  const bookModalCancel = $('#bookModalCancel');
  if (bookModalCancel) bookModalCancel.addEventListener('click', closeBookingModal);
  const btnBookingSuccessDone = $('#btnBookingSuccessDone');
  if (btnBookingSuccessDone) btnBookingSuccessDone.addEventListener('click', closeBookingModal);
  const bookingModalOverlay = $('#bookingModalOverlay');
  if (bookingModalOverlay) {
    bookingModalOverlay.addEventListener('click', (e) => {
      if (e.target === bookingModalOverlay) closeBookingModal();
    });
  }

  // Booking form submit
  const bookingForm = $('#bookingForm');
  if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);

  // Edit post modal close buttons
  const editModalClose = $('#editModalClose');
  if (editModalClose) editModalClose.addEventListener('click', closeEditPostModal);
  const editModalCancel = $('#editModalCancel');
  if (editModalCancel) editModalCancel.addEventListener('click', closeEditPostModal);
  const editModalOverlay = $('#editModalOverlay');
  if (editModalOverlay) {
    editModalOverlay.addEventListener('click', (e) => {
      if (e.target === editModalOverlay) closeEditPostModal();
    });
  }

  // Edit post form submit
  const editPostForm = $('#editPostForm');
  if (editPostForm) editPostForm.addEventListener('submit', handleEditPostSubmit);

  // Áp dụng trạng thái lúc khởi động
  applyAdminState();
}

/* ============================================================
   SMART IMPORTER (NHẬP BÀI THỦ CÔNG & TỰ BÓC TÁCH)
   ============================================================ */
function initSmartImporter() {
  const openBtn = $('#openImportModalBtn');
  const modalOverlay = $('#importModalOverlay');
  const closeBtn = $('#importModalClose');
  const cancelBtn = $('#importModalCancel');
  const submitBtn = $('#btnSubmitImport');
  const autoParseBtn = $('#btnAutoParse');
  const fillDemoBtn = $('#btnFillDemo');

  const captionInput = $('#importCaption');
  const imgUrlInput = $('#importImageUrl');
  const previewImg = $('#imagePreviewImg');

  const titleInput = $('#importTitle');
  const priceInput = $('#importPrice');
  const districtSelect = $('#importDistrict');
  const roomSelect = $('#importRoom');
  const areaInput = $('#importArea');
  const addressInput = $('#importAddress');
  const furnitureInput = $('#importFurnitureInput');
  const furnitureTagsBox = $('#furnitureTags');
  const furnitureEmptyHint = $('#furnitureEmptyHint');

  const btnSyncApify = $('#btnSyncApify');

  if (btnSyncApify) {
    btnSyncApify.addEventListener('click', () => {
      fetchApifyLive(true);
    });
  }

  if (!modalOverlay) return;

  function openImportModal() {
    modalOverlay.classList.add('active');
    document.body.classList.add('modal-open');
    if (captionInput) setTimeout(() => captionInput.focus(), 200);
  }

  function closeImportModal() {
    modalOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  if (openBtn) openBtn.addEventListener('click', openImportModal);
  if (closeBtn) closeBtn.addEventListener('click', closeImportModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeImportModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeImportModal();
  });

  if (imgUrlInput && previewImg) {
    imgUrlInput.addEventListener('input', () => {
      const val = imgUrlInput.value.trim().split(/[\s,]+/)[0];
      if (val) previewImg.src = val;
    });
  }

  function performSmartParse() {
    const text = captionInput.value;
    if (!text.trim()) return;

    const detected = transformApifyItem({ text, postId: 'preview_' + Date.now() });

    if (titleInput) titleInput.value = detected.title;
    if (priceInput) priceInput.value = detected.price;
    if (districtSelect) {
      if (detected.district.includes('Ngô Thì Sỹ')) districtSelect.value = 'Ngô Thì Sỹ';
      else if (detected.district.includes('Nguyễn Trung Trực')) districtSelect.value = 'Nguyễn Trung Trực';
      else if (detected.district.includes('61/7')) districtSelect.value = '61/7 Phù Đổng';
      else districtSelect.value = '61/18 Phù Đổng';
    }
    if (roomSelect) roomSelect.value = detected.roomType;
    if (addressInput) addressInput.value = detected.address;
    if (areaInput) {
      const areaMatch = detected.specs.find(s => s.label.includes('m²'));
      areaInput.value = areaMatch ? areaMatch.label : '';
    }

    if (furnitureTagsBox && furnitureEmptyHint) {
      furnitureTagsBox.innerHTML = '';
      if (detected.amenities && detected.amenities.length) {
        furnitureEmptyHint.classList.add('hidden');
        detected.amenities.forEach(am => {
          const tag = document.createElement('span');
          tag.className = 'detected-pill';
          tag.textContent = `✓ ${am}`;
          furnitureTagsBox.appendChild(tag);
        });
        if (furnitureInput) furnitureInput.value = detected.amenities.join(', ');
      } else {
        furnitureEmptyHint.classList.remove('hidden');
      }
    }

    showToast('✨ Đã tự động nhận diện giá, cơ sở và nội thất!');
  }

  if (autoParseBtn) autoParseBtn.addEventListener('click', performSmartParse);
  if (captionInput) {
    captionInput.addEventListener('paste', () => {
      setTimeout(performSmartParse, 150);
    });
  }

  if (fillDemoBtn && captionInput) {
    fillDemoBtn.addEventListener('click', () => {
      captionInput.value = `CHỈ CÒN 1 CĂN DUY NHẤT - HÔM NAY GIẢM GIÁ CHỈ CÒN 4TR5 💵
📢🏡 CĂN HỘ 2 PHÒNG FULL NỘI THẤT – NGAY TRUNG TÂM ĐÀ LẠT 🌿
✨ Không gian sạch sẽ, thoáng mát, dọn vào ở ngay.
📍 Chỉ cách Chợ Đà Lạt khoảng 2km.
✅ Full nội thất: Giường nệm cao cấp, sofa tiếp khách, bàn ăn
🍽 Bếp tiện nghi với tủ lạnh, máy hút mùi, lò vi sóng
🚿 Nhà vệ sinh sạch sẽ có bình tắm nóng lạnh, máy giặt riêng
🚗 Đường rộng rãi, ô tô ra vào thoải mái
📍 Địa chỉ: F2 - C5 Nguyễn Trung Trực, Đà Lạt
📞 Hotline: 0903879393 (Cô Thảo)`;
      performSmartParse();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const price = priceInput.value.trim();
      const address = addressInput.value.trim();

      if (!title || !price || !address) {
        alert('Vui lòng điền Tiêu đề, Mức giá và Địa chỉ cơ sở!');
        return;
      }

      const rawImgs = imgUrlInput.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      const images = rawImgs.length ? rawImgs : ['dalat-sample.png'];

      const rawAm = furnitureInput.value.split(',').map(s => s.trim()).filter(Boolean);
      const amenities = rawAm.length ? rawAm : ['Full nội thất cao cấp', 'Bình tắm nóng lạnh', 'Bếp nấu riêng', 'Wifi'];

      const district = districtSelect.value;
      const roomType = roomSelect.value;
      const area = areaInput.value.trim();
      const beds = roomType === '2PN' ? 2 : 1;
      const specs = [
        { icon: SVG.bed,  label: `${beds} Phòng ngủ` },
        { icon: SVG.bath, label: '1 WC Nước nóng' },
      ];
      if (area) {
        specs.push({ icon: SVG.area, label: area.includes('m²') ? area : `${area} m²` });
      }

      const newPost = {
        id: 'custom_' + Date.now(),
        postId: 'custom_' + Date.now(),
        text: captionInput.value || title,
        time: new Date().toISOString(),
        url: 'https://www.facebook.com/ThaoAnhApartment',
        likes: 1,
        images,
        isCustom: true
      };

      const customPosts = getCustomPosts();
      customPosts.unshift(newPost);
      localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(customPosts));

      activeData = getAllPosts();
      renderCards(activeData);

      closeImportModal();
      showToast('🚀 Đã đăng căn hộ mới lên website thành công!');
    });
  }
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function showToast(message, type = 'info') {
  const container = $('#toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type} animate-in`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ============================================================
   HEADER & NAVIGATION
   ============================================================ */
window.addEventListener('scroll', () => {
  if (header) {
    header.classList.toggle('header--scrolled', window.scrollY > 20);
  }
}, { passive: true });

if (navToggle && nav) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    nav.classList.toggle('nav--open', isOpen);
    navToggle.classList.toggle('active', isOpen);
    navToggle.classList.toggle('nav-toggle--active', isOpen);
  });

  // Bấm ra ngoài khoảng trống để đóng menu mobile
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
      nav.classList.remove('open', 'nav--open');
      navToggle.classList.remove('active', 'nav-toggle--active');
    }
  });

  $$('.nav__link', nav).forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open', 'nav--open');
      navToggle.classList.remove('active', 'nav-toggle--active');
    });
  });
}

// Nút Đặt Lịch Xem Phòng nổi bật bên trong Mobile Menu
const navBookingBtn = $('#navBookingBtn');
if (navBookingBtn) {
  navBookingBtn.addEventListener('click', () => {
    if (nav) nav.classList.remove('open', 'nav--open');
    if (navToggle) navToggle.classList.remove('active', 'nav-toggle--active');
    openBookingModal(null, null);
  });
}

// Global keyboard listener (Escape, ArrowLeft, ArrowRight)
document.addEventListener('keydown', (e) => {
  if (isLightboxActive) {
    if (e.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') {
      prevLightboxImage();
      return;
    }
    if (e.key === 'ArrowRight') {
      nextLightboxImage();
      return;
    }
  }

  if (modalOverlay && modalOverlay.classList.contains('active')) {
    if (e.key === 'ArrowLeft') {
      prevModalImage();
      return;
    }
    if (e.key === 'ArrowRight') {
      nextModalImage();
      return;
    }
  }

  if (e.key === 'Escape') {
    closeLightbox();
    closeModal();
    closeBookingModal();
    closeAppointmentsModal();
    closeEditPostModal();
    const adminModalOverlay = $('#adminModalOverlay');
    if (adminModalOverlay) adminModalOverlay.classList.remove('active');
    const importModalOverlay = $('#importModalOverlay');
    if (importModalOverlay) importModalOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
});

/* ============================================================
   BILINGUAL LANGUAGE SYSTEM (VI 🇻🇳 / EN 🇬🇧)
   ============================================================ */
function initLanguage() {
  const langBtns = $$('.lang-switch__btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = btn.getAttribute('data-lang');
      if (targetLang && targetLang !== currentLang) {
        applyLanguage(targetLang, true);
      }
    });
  });

  // Khởi chạy ngôn ngữ ban đầu đã lưu (không hiện toast)
  applyLanguage(currentLang, false);
}

function applyLanguage(lang, notify = false) {
  currentLang = (lang === 'en') ? 'en' : 'vi';
  localStorage.setItem(LANG_STORAGE_KEY, currentLang);
  document.documentElement.lang = currentLang;

  // Cập nhật trạng thái active trên các nút chuyển ngôn ngữ
  $$('.lang-switch__btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-lang') === currentLang);
  });

  // Áp dụng từ điển dịch cho tất cả các thẻ có attribute data-i18n
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.vi;
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict && dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Cập nhật các tuỳ chọn mặc định của Select Filter
  const fDistrict = $('#filterDistrict');
  if (fDistrict) {
    const optAll = fDistrict.querySelector('option[value=""]');
    if (optAll) optAll.textContent = dict.filter_loc_all;
  }
  const fPrice = $('#filterPrice');
  if (fPrice) {
    const optAll = fPrice.querySelector('option[value=""]');
    if (optAll) optAll.textContent = dict.filter_price_all;
  }
  const fRoom = $('#filterRoom');
  if (fRoom) {
    const optAll = fRoom.querySelector('option[value=""]');
    if (optAll) optAll.textContent = dict.filter_room_all;
  }

  // Cập nhật lại danh sách thẻ căn hộ theo ngôn ngữ mới
  if (activeData && activeData.length) {
    renderCards(activeData);
  }

  if (notify) {
    showToast(currentLang === 'en' ? '🇬🇧 Switched to English version' : '🇻🇳 Đã chuyển sang Tiếng Việt');
  }
}

/* ============================================================
   INIT APPLICATION
   ============================================================ */
function init() {
  initLanguage();
  initAdminAuth();
  activeData = getAllPosts();
  renderCards(activeData);
  initSmartImporter();
  updateBookingBadges();
  fetchBookingsFromCloud();

  // Tự động kiểm tra Apify theo chế độ tối ưu 24 giờ
  fetchApifyLive(false);
}

window.renderCards = renderCards;
window.openBookingModal = openBookingModal;
window.openEditPostModal = openEditPostModal;

init();
