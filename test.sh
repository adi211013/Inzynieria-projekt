#!/usr/bin/env bash
# =============================================
# Testy API — Habit Tracker
# =============================================
# Użycie: ./test-api.sh
# Wymaga: curl, jq (brew install jq)

BASE_URL="http://localhost:3000/api"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

assert_status() {
  local expected=$1
  local actual=$2
  local name=$3

  if [ "$expected" = "$actual" ]; then
    echo -e "${GREEN}✓${NC} $name ${YELLOW}[$actual]${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $name ${RED}[expected $expected, got $actual]${NC}"
    FAIL=$((FAIL + 1))
  fi
}

section() {
  echo ""
  echo -e "${BLUE}═══ $1 ═══${NC}"
}

# req <method> <endpoint> <data> <token>
# Każde wywołanie buduje tablicę argumentów curla — bez problemów z quotingiem.
# Wynik: "STATUS|BODY"
req() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4

  local -a args=(-s -w '\n%{http_code}' -X "$method")

  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi

  if [ -n "$data" ]; then
    args+=(-H "Content-Type: application/json" -d "$data")
  fi

  args+=("$BASE_URL$endpoint")

  local response
  response=$(curl "${args[@]}")

  local status
  status=$(printf '%s\n' "$response" | tail -n1)
  local body
  body=$(printf '%s\n' "$response" | sed '$d')

  printf '%s|%s' "$status" "$body"
}

# ============================================
# 1. HEALTH
# ============================================
section "Health Check"

STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/health)
assert_status "200" "$STATUS" "GET /health"

# ============================================
# 2. AUTH — REGISTER
# ============================================
section "Auth — Register"

TS=$(date +%s)
EMAIL="test_$TS@test.com"
USERNAME="test_$TS"
PASSWORD="haslo123"

R=$(req POST /auth/register "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /auth/register"

TOKEN=$(printf '%s' "$BODY" | jq -r '.token')

R=$(req POST /auth/register "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "")
STATUS="${R%%|*}"
assert_status "409" "$STATUS" "POST /auth/register — duplikat"

R=$(req POST /auth/register '{"email":"x@x.com"}' "")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /auth/register — brakujące pola"

# ============================================
# 3. AUTH — LOGIN
# ============================================
section "Auth — Login"

R=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "POST /auth/login — poprawne"

R=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"zle\"}" "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "POST /auth/login — złe hasło"

R=$(req POST /auth/login '{"email":"xxx@xxx.com","password":"x"}' "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "POST /auth/login — nieistniejący email"

# ============================================
# 4. AUTH — ME
# ============================================
section "Auth — Me"

R=$(req GET /auth/me "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /auth/me — z tokenem"

R=$(req GET /auth/me "" "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "GET /auth/me — bez tokenu"

R=$(req GET /auth/me "" "zly_token_xyz")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "GET /auth/me — zły token"

# ============================================
# 5. AUTH — UPDATE
# ============================================
section "Auth — Update"

R=$(req PUT /auth/me '{"display_name":"Testowy User"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — display_name"

R=$(req PUT /auth/me '{"theme":"dark"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — theme dark"

R=$(req PUT /auth/me '{"theme":"pink"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły theme"

R=$(req PUT /auth/me '{"language":"de"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły language"

R=$(req PUT /auth/me '{"timezone":"Europe/London"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — poprawny timezone"

R=$(req PUT /auth/me '{"timezone":"Mars/Curiosity"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły timezone"

R=$(req PUT /auth/me '{"reminder_time":"25:00"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły reminder_time"

R=$(req PUT /auth/me '{"reminder_time":"09:30"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — poprawny reminder_time"

R=$(req PUT /auth/me '{}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — pusty body"

# ============================================
# 6. HABITS
# ============================================
section "Habits — CRUD"

R=$(req GET /habits "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /habits"

R=$(req GET /habits "" "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "GET /habits — bez tokenu"

R=$(req POST /habits '{
  "name":"Picie wody",
  "description":"8 szklanek dziennie",
  "category":"health",
  "icon":"water",
  "color":"#3B82F6",
  "frequency":{"type":"daily"},
  "target_count":8,
  "unit":"szklanki"
}' "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /habits — daily"
HABIT_ID=$(printf '%s' "$BODY" | jq -r '.habit_id')

R=$(req POST /habits '{"name":"Siłownia","frequency":{"type":"weekly_days","days":[1,3,5]}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /habits — weekly_days"

R=$(req POST /habits '{"name":"Medytacja","frequency":{"type":"times_per_week","count":3}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /habits — times_per_week"

R=$(req POST /habits '{"frequency":{"type":"daily"}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — bez name"

R=$(req POST /habits '{"name":"test"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — bez frequency"

R=$(req POST /habits '{"name":"test","frequency":{"type":"monthly"}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — zły typ frequency"

R=$(req POST /habits '{"name":"test","frequency":{"type":"weekly_days","days":[7,8]}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — zły dzień"

R=$(req GET "/habits/$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /habits/:id"

R=$(req GET /habits/99999 "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /habits/:id — nieistniejący"

R=$(req PUT "/habits/$HABIT_ID" '{"name":"Picie wody (zmienione)"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /habits/:id"

# ============================================
# 7. GOALS
# ============================================
section "Goals — CRUD"

R=$(req POST /goals '{"name":"Cel","target_days":30,"frequency":{"type":"daily"}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — bez habit_id"

R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Pić wodę 30 dni\",
  \"target_days\":30,
  \"frequency\":{\"type\":\"daily\"}
}" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /goals — poprawny"
GOAL_ID=$(printf '%s' "$BODY" | jq -r '.goal_id')

R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Zły\",
  \"target_days\":-5,
  \"frequency\":{\"type\":\"daily\"}
}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — ujemne target_days"

R=$(req POST /goals '{
  "habit_id":99999,
  "name":"X",
  "target_days":5,
  "frequency":{"type":"daily"}
}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "POST /goals — nieistniejący habit"

R=$(req GET /goals "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /goals"

R=$(req PUT "/goals/$GOAL_ID" '{"status":"completed"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /goals/:id — status"

R=$(req PUT "/goals/$GOAL_ID" '{"status":"weird"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /goals/:id — zły status"

# ============================================
# 8. LOGS
# ============================================
section "Logs — Facade"

TODAY_ISO=$(date -u +"%Y-%m-%dT12:00:00Z")
YESTERDAY_ISO=$(date -u -v-1d +"%Y-%m-%dT12:00:00Z" 2>/dev/null || date -u -d "yesterday" +"%Y-%m-%dT12:00:00Z")

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\",\"value\":5}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit"

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\",\"value\":8}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit upsert"

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$YESTERDAY_ISO\",\"value\":6}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit (wczoraj)"

R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$GOAL_ID,\"date\":\"$TODAY_ISO\",\"completed\":true}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — goal"

R=$(req POST /logs "{\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — bez type"

R=$(req POST /logs "{\"type\":\"xxx\",\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — zły type"

R=$(req POST /logs "{\"type\":\"habit\",\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — bez habit_id"

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":99999,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "POST /logs — nieistniejący habit"

R=$(req DELETE /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$YESTERDAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /logs"

# ============================================
# 9. STATS
# ============================================
section "Stats"

R=$(req GET /stats/overview "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /stats/overview"

echo ""
echo -e "${YELLOW}Overview snapshot:${NC}"
printf '%s' "$BODY" | jq '{total_habits, total_goals, total_logs, today_logs, longest_current_streak}' 2>/dev/null || printf '%s' "$BODY"

R=$(req GET "/stats/habits/$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /stats/habits/:id"

R=$(req GET /stats/habits/99999 "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /stats/habits/:id — nieistniejący"

# ============================================
# 10. IZOLACJA
# ============================================
section "Izolacja userów"

EMAIL2="test2_$TS@test.com"
USERNAME2="test2_$TS"
R=$(req POST /auth/register "{\"username\":\"$USERNAME2\",\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\"}" "")
BODY="${R#*|}"
TOKEN2=$(printf '%s' "$BODY" | jq -r '.token')

R=$(req GET "/habits/$HABIT_ID" "" "$TOKEN2")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "User 2 nie widzi habita User 1"

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN2")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "User 2 nie może logować habita User 1"

# ============================================
# 11. SOFT DELETE
# ============================================
section "Soft Delete"

R=$(req DELETE "/habits/$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /habits/:id"

R=$(req GET "/habits/$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /habits/:id — po soft-delete"

R=$(req DELETE "/goals/$GOAL_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /goals/:id"

# ============================================
# 12. DELETE USER
# ============================================
section "Delete konto"

R=$(req DELETE /auth/me "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /auth/me"

R=$(req GET /auth/me "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /auth/me — po usunięciu konta"

req DELETE /auth/me "" "$TOKEN2" > /dev/null

# ============================================
# PODSUMOWANIE
# ============================================
echo ""
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"

[ $FAIL -eq 0 ] && exit 0 || exit 1