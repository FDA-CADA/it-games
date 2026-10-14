# Triển khai trên VPS với Supabase tự host (Nginx + Certbot)

Site vẫn là file tĩnh. Supabase lo **đăng nhập** và **lưu tiến độ theo tài khoản** (bảng `progress`).

## Hai chế độ chơi (người chơi tự chọn ở nút 💾/☁ trên trang chủ)

| | Offline (mặc định) | Online |
| --- | --- | --- |
| Cần đăng nhập | Không | Có (email, Google, Microsoft) |
| Tiến độ lưu ở | Trình duyệt (localStorage) | Tài khoản trên Supabase |
| Dữ liệu offline | Giữ nguyên, không bao giờ đẩy lên tài khoản | Không dùng |

Hai kho **tách hẳn**, không gộp: đăng nhập chỉ đọc dữ liệu của tài khoản; quay lại offline thì thấy đúng dữ liệu offline cũ. Chưa cấu hình `config.js` thì chỉ có chế độ offline, nút đổi chế độ không hiện.

```text
Trình duyệt ──https──> Nginx ──> /srv/it-games         (games.example.com, file tĩnh)
                         └─────> 127.0.0.1:8000 (Kong)  (api.example.com: auth + REST)
```

Yêu cầu: VPS Ubuntu/Debian ≥ 2 vCPU, 4 GB RAM; Docker + Compose; Nginx + Certbot; 2 domain (bản ghi A) trỏ về IP VPS.

## 1. Dựng Supabase

```bash
git clone --depth 1 https://github.com/supabase/supabase
mkdir ~/supabase && cp -r supabase/docker/. ~/supabase && cd ~/supabase
cp .env.example .env
```

1. Sinh khoá: `./deploy/gen-keys.sh` (trong repo game) in `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`.
2. Mở [`deploy/env.example`](../deploy/env.example), chép các biến vào `~/supabase/.env` (ghi đè biến cùng tên) và điền giá trị thật. Các mật khẩu/khoá còn lại: `openssl rand -hex 32`.
3. Chép [`deploy/docker-compose.override.yml`](../deploy/docker-compose.override.yml) vào `~/supabase/` (truyền biến Google/Microsoft vào service `auth`).
4. `docker compose pull && docker compose up -d && docker compose ps` (mọi service phải healthy).

Firewall chỉ mở 22/80/443. Không để 5432, 6543, 8000 lộ ra internet (đổi `ports` trong compose thành `127.0.0.1:...`).

## 2. Tạo bảng

Chạy [`deploy/schema.sql`](../deploy/schema.sql):
`docker exec -i supabase-db psql -U postgres < deploy/schema.sql`
Bảng bật Row Level Security: mỗi người chỉ đọc/ghi hàng của mình.

## 3. Nginx + Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /srv/it-games
rsync -av --delete --exclude .git --exclude deploy --exclude docs --exclude tools ./ user@vps:/srv/it-games/   # deploy tay lần đầu; sau đó dùng GitHub Actions (mục 7)

# đổi example.com trong 2 file, rồi:
sudo cp deploy/nginx/*.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/games.example.com.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.example.com.conf /etc/nginx/sites-enabled/
echo "map \$http_upgrade \$connection_upgrade { default upgrade; '' close; }" | sudo tee /etc/nginx/conf.d/websocket-map.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d games.example.com -d api.example.com
```

Certbot tự thêm HTTPS, chuyển hướng 80 → 443 và gia hạn định kỳ (`sudo certbot renew --dry-run` để thử).

## 4. Cấu hình site

Sửa [`assets/js/config.js`](../assets/js/config.js) (rồi rsync lại):

```js
window.ITG_CONFIG = {
  supabaseUrl: "https://api.example.com",
  supabaseAnonKey: "<ANON_KEY>",   // chỉ ANON key, không bao giờ dùng SERVICE_ROLE_KEY
  emailLogin: true,
  providers: ["google", "azure"],  // chỉ liệt kê provider đã bật ở bước 5
};
```

## 5. Đăng nhập Google và Microsoft của trường

**Dự án này không có trang admin riêng**, và Supabase Studio bản tự host cũng **không** có màn hình cấu hình nhà cung cấp đăng nhập (đó là tính năng của Supabase Cloud). Với bản tự host, cấu hình bằng biến môi trường trong `.env` (đã nằm sẵn trong `deploy/env.example`), rồi `docker compose up -d` lại. Studio chỉ dùng để xem bảng/người dùng.

**Google**: Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web). Authorized redirect URI: `https://api.example.com/auth/v1/callback`. Điền `GOTRUE_EXTERNAL_GOOGLE_ENABLED=true`, `..._CLIENT_ID`, `..._SECRET`.

**Microsoft (SSO trường)**: Entra admin center → App registrations → New registration, Redirect URI (Web) `https://api.example.com/auth/v1/callback`, tạo Client secret. Điền `GOTRUE_EXTERNAL_AZURE_ENABLED=true`, `..._CLIENT_ID`, `..._SECRET` và `GOTRUE_EXTERNAL_AZURE_URL=https://login.microsoftonline.com/<TENANT_ID>/v2.0`. Dùng tenant ID của trường để chỉ tài khoản trường đăng nhập được. Có thể cần nhờ quản trị Entra cấp quyền (admin consent) cho ứng dụng.

Sau OAuth, trình duyệt quay về `ADDITIONAL_REDIRECT_URLS` nên URL đó phải đúng với địa chỉ trang chủ.

## 6. Kiểm tra

1. `https://games.example.com/#games`: có nút **💾 Offline** ở header. Chơi một level, điểm lưu trên trình duyệt.
2. Bấm nút → chọn Online → đăng nhập: trang hiện dữ liệu của tài khoản (ban đầu trống, không lấy dữ liệu offline).
3. Chơi một level: hàng mới xuất hiện trong bảng `progress` (Studio → Table Editor). Đổi về Offline: thấy lại dữ liệu offline cũ.

## 7. Tự động deploy bằng GitHub Actions

Workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) chạy khi push lên `main` (hoặc bấm *Run workflow*): kiểm tra bản dịch, đóng gói site, ghi `config.js` từ biến của repo rồi `rsync` qua SSH vào `/srv/it-games`. Vì `config.js` được sinh lúc deploy nên không cần commit URL/khoá thật.

**Trên VPS**, tạo user deploy chỉ có quyền ghi thư mục site:

```bash
sudo adduser --disabled-password deploy
sudo chown -R deploy: /srv/it-games
# trên máy bạn: tạo khoá riêng cho CI
ssh-keygen -t ed25519 -f ./ci_deploy -N "" -C github-actions
ssh-copy-id -i ./ci_deploy.pub deploy@VPS_IP      # hoặc thêm vào ~deploy/.ssh/authorized_keys
ssh-keyscan -p 22 VPS_IP                           # kết quả dán vào SSH_KNOWN_HOSTS
```

**Trên GitHub** (Settings → Secrets and variables → Actions):

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Secret | `SSH_HOST` | IP hoặc domain VPS |
| Secret | `SSH_USER` | `deploy` |
| Secret | `SSH_PRIVATE_KEY` | nội dung file `ci_deploy` (khoá riêng) |
| Secret | `SSH_KNOWN_HOSTS` | kết quả `ssh-keyscan` |
| Secret | `SSH_PORT`, `DEPLOY_PATH` | tuỳ chọn (mặc định 22 và `/srv/it-games`) |
| Secret | `SUPABASE_ANON_KEY` | ANON key |
| Variable | `SUPABASE_URL` | `https://api.example.com` |
| Variable | `AUTH_PROVIDERS` | `"google","azure"` (để trống nếu không dùng) |
| Variable | `EMAIL_LOGIN` | `true` hoặc `false` |

Không đặt `SUPABASE_URL`/`SUPABASE_ANON_KEY` thì site deploy với `config.js` trống (chỉ chế độ offline). Xoá file `ci_deploy` trên máy sau khi đã dán vào GitHub.

## Vận hành

- **Sao lưu:** `docker exec supabase-db pg_dump -U postgres postgres > backup.sql` (cron hằng ngày).
- **Xem kết quả cả lớp:** truy vấn mẫu cuối `deploy/schema.sql`, chạy trong Studio (bỏ qua RLS).
- **Xoá tiến độ** trên trang chủ chỉ xoá kho của chế độ đang dùng (online: xoá trên tài khoản).
- Đặt lại mật khẩu / email xác nhận cần SMTP; site chưa có màn hình đặt lại mật khẩu (dùng Google/Microsoft thì không cần).
