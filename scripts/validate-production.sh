#!/bin/bash

set -e

echo "MediCare AI - Production Environment Validation"
echo "=================================================="

ERRORS=0

pass() {
  echo "[ok] $1"
}

fail() {
  echo "[fail] $1"
  ERRORS=$((ERRORS + 1))
}

check_command() {
  if command -v "$1" >/dev/null 2>&1; then
    pass "$2"
  else
    fail "$2"
  fi
}

check_file() {
  if [ -f "$1" ]; then
    pass "$2"
  else
    fail "$2"
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    pass "$2"
  else
    fail "$2"
  fi
}

check_grep() {
  if grep -Eq "$2" "$1"; then
    pass "$3"
  else
    fail "$3"
  fi
}

check_command node "Node.js installed"
check_command pnpm "pnpm installed"
check_command docker "Docker installed"

check_file .env.production ".env.production exists"
check_file .env.staging ".env.staging exists"
check_file Dockerfile "Dockerfile exists"
check_file docker-compose.yml "docker-compose.yml exists"
check_file DEPLOYMENT.md "DEPLOYMENT.md exists"

check_dir apps/api "API app exists"
check_dir apps/web "Web app exists"
check_dir apps/mobile "Mobile app exists"

check_file apps/api/package.json "API package.json exists"
check_file apps/web/package.json "Web package.json exists"
check_file packages/core/package.json "Core package.json exists"
check_file packages/api-client/package.json "API client package.json exists"

check_grep apps/api/package.json '"express"' "API has express"
check_grep apps/web/package.json '"next"' "Web has Next.js"
check_grep packages/core/package.json '"build"' "Core package has build script"
check_grep packages/api-client/package.json '"build"' "API client package has build script"

check_grep .env.production '^CORS_ORIGIN=https://.+' ".env.production restricts CORS origin"
check_grep .env.production '^NEXT_PUBLIC_API_BASE_URL=https://.+' ".env.production uses HTTPS API URL for web"
check_grep .env.production '^EXPO_PUBLIC_API_BASE_URL=https://.+' ".env.production uses HTTPS API URL for mobile"
check_grep .env.production '^API_BASE_URL=https://.+' ".env.production uses HTTPS API URL"
check_grep .env.production '^AUTH_SECRET=.+' ".env.production defines AUTH_SECRET"

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "All validations passed"
  exit 0
else
  echo "$ERRORS validation(s) failed"
  exit 1
fi
