/* config.js — cấu hình Supabase riêng. Để trống supabaseUrl/supabaseAnonKey = tắt chế độ online
   (game chỉ có chế độ offline, lưu trên trình duyệt).
   ANON key an toàn để công khai (quyền bị giới hạn bởi RLS). KHÔNG dán service_role key vào đây.
   Xem docs/deploy-supabase.md. */
window.ITG_CONFIG = {
  supabaseUrl: "",      // ví dụ: "https://api.example.com"
  supabaseAnonKey: "",  // ANON_KEY trong .env của Supabase
  emailLogin: true,     // cho đăng nhập/đăng ký bằng email + mật khẩu
  providers: [],        // đăng nhập OAuth đã bật ở server: "google", "azure" (Microsoft)
};
