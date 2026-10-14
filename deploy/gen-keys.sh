#!/usr/bin/env bash
# In JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY (HS256, hạn 10 năm) để dán vào .env.
set -euo pipefail
b64() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
secret=${1:-$(openssl rand -hex 32)}
jwt() {
  local h p now exp
  now=$(date +%s); exp=$((now + 315360000))
  h=$(printf '{"alg":"HS256","typ":"JWT"}' | b64)
  p=$(printf '{"role":"%s","iss":"supabase","iat":%s,"exp":%s}' "$1" "$now" "$exp" | b64)
  printf '%s.%s.%s' "$h" "$p" "$(printf '%s.%s' "$h" "$p" | openssl dgst -sha256 -hmac "$secret" -binary | b64)"
}
echo "JWT_SECRET=$secret"
echo "ANON_KEY=$(jwt anon)"
echo "SERVICE_ROLE_KEY=$(jwt service_role)"
