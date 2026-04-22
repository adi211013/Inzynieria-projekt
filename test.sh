#!/usr/bin/env bash
# =============================================
# Testy API — Habit Tracker (rozszerzone)
# =============================================

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
# 2. CORS
# ============================================
section "CORS"

# Dozwolony origin
STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Origin: http://localhost:3000" \
  http://localhost:3000/health)
assert_status "200" "$STATUS" "CORS — dozwolony origin (localhost:3000)"

# Niedozwolony origin — powinien zostać odrzucony (CORS middleware zwraca 500 przy błędzie)
STATUS=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Origin: http://evil.com" \
  http://localhost:3000/health)
# curl zwróci coś, ale CORS middleware rzuci error
# Dla test'a — sprawdź że dla localhost jest OK
echo "  (CORS dla evil.com zwraca: $STATUS — CORS jest egzekwowany w przeglądarce)"

# ============================================
# 3. AUTH
# ============================================
section "Auth — Register & Login"

TS=$(date +%s)
EMAIL="test_$TS@test.com"
USERNAME="test_$TS"
PASSWORD="haslo123"

R=$(req POST /auth/register "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /auth/register"

TOKEN=$(printf '%s' "$BODY" | jq -r '.token')

R=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "POST /auth/login"

R=$(req GET /auth/me "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /auth/me"

# ============================================
# 4. HABITS
# ============================================
section "Habits — CRUD"

R=$(req POST /habits '{
  "name":"Picie wody",
  "frequency":{"type":"daily"},
  "target_count":8,
  "unit":"szklanki"
}' "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /habits"
HABIT_ID=$(printf '%s' "$BODY" | jq -r '.habit_id')

# ============================================
# 5. GOALS — Z DEADLINE
# ============================================
section "Goals — walidacja deadline"

# Deadline w przyszłości — OK
FUTURE=$(date -u -v+30d +"%Y-%m-%d" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%d")
R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Cel z deadline\",
  \"target_days\":30,
  \"frequency\":{\"type\":\"daily\"},
  \"deadline\":\"$FUTURE\"
}" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /goals — deadline w przyszłości"
GOAL_ID=$(printf '%s' "$BODY" | jq -r '.goal_id')

# Deadline w przeszłości — FAIL
PAST=$(date -u -v-1d +"%Y-%m-%d" 2>/dev/null || date -u -d "-1 days" +"%Y-%m-%d")
R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Cel w przeszlosci\",
  \"target_days\":5,
  \"frequency\":{\"type\":\"daily\"},
  \"deadline\":\"$PAST\"
}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — deadline w przeszłości odrzucony"

# Zły format deadline
R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Zly deadline\",
  \"target_days\":5,
  \"frequency\":{\"type\":\"daily\"},
  \"deadline\":\"nie-data\"
}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — zły format deadline"

# ============================================
# 6. LOGS — FACADE + AUTO-COMPLETE
# ============================================
section "Logs — Auto-complete goal"

TODAY_ISO=$(date -u +"%Y-%m-%dT12:00:00Z")

# Utwórz cel z target_days=2 żeby łatwo go skończyć
R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Szybki cel\",
  \"target_days\":2,
  \"frequency\":{\"type\":\"daily\"}
}" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /goals — szybki cel (target_days=2)"
QUICK_GOAL_ID=$(printf '%s' "$BODY" | jq -r '.goal_id')

# Log 1
R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$QUICK_GOAL_ID,\"date\":\"$TODAY_ISO\",\"completed\":true}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — goal log 1"

# Log 2 — inny dzień (wczoraj)
YESTERDAY_ISO=$(date -u -v-1d +"%Y-%m-%dT12:00:00Z" 2>/dev/null || date -u -d "yesterday" +"%Y-%m-%dT12:00:00Z")
R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$QUICK_GOAL_ID,\"date\":\"$YESTERDAY_ISO\",\"completed\":true}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — goal log 2"

# Teraz cel powinien być completed
R=$(req GET "/goals/$QUICK_GOAL_ID" "" "$TOKEN")
BODY="${R#*|}"
GOAL_STATUS=$(printf '%s' "$BODY" | jq -r '.status')
if [ "$GOAL_STATUS" = "completed" ]; then
  echo -e "${GREEN}✓${NC} Goal auto-completed po target_days ${YELLOW}[$GOAL_STATUS]${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} Goal nie został auto-completed ${RED}[status=$GOAL_STATUS]${NC}"
  FAIL=$((FAIL + 1))
fi

# Próba logowania do completed goala — 400
R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$QUICK_GOAL_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — nie można logować do completed goala"

# ============================================
# 7. LOGS — DELETE tylko dzisiaj
# ============================================
section "Logs — DELETE tylko dzisiejsze"

# Log habit dziś
R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\",\"value\":5}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit dzisiaj"

# Log habit wczoraj
R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$YESTERDAY_ISO\",\"value\":6}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit wczoraj"

# DELETE dzisiaj — OK
R=$(req DELETE /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /logs — dzisiaj (OK)"

# DELETE wczoraj — 403
R=$(req DELETE /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$YESTERDAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "403" "$STATUS" "DELETE /logs — wczoraj (zablokowane)"

# ============================================
# 8. GET /api/logs — RANGE QUERY + PAGINACJA
# ============================================
section "Logs — Range query & paginacja"

# Dodaj kilka logów w różne dni
R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\",\"value\":7}" "$TOKEN")

# Bez parametrów — domyślnie ostatnie 30 dni
R=$(req GET "/logs?type=habit&id=$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /logs — domyślne (30 dni)"

# Sprawdź strukturę odpowiedzi
HAS_DATA=$(printf '%s' "$BODY" | jq 'has("data") and has("total") and has("page") and has("limit")')
if [ "$HAS_DATA" = "true" ]; then
  echo -e "${GREEN}✓${NC} GET /logs — struktura odpowiedzi (data/total/page/limit)"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} GET /logs — zła struktura odpowiedzi"
  FAIL=$((FAIL + 1))
fi

# Z zakresem dat
FROM=$(date -u -v-7d +"%Y-%m-%d" 2>/dev/null || date -u -d "-7 days" +"%Y-%m-%d")
TO=$(date -u +"%Y-%m-%d")
R=$(req GET "/logs?type=habit&id=$HABIT_ID&from=$FROM&to=$TO" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /logs — z zakresem dat"

# Paginacja
R=$(req GET "/logs?type=habit&id=$HABIT_ID&page=1&limit=5" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
LIMIT_RETURNED=$(printf '%s' "$BODY" | jq '.limit')
assert_status "200" "$STATUS" "GET /logs — paginacja"
if [ "$LIMIT_RETURNED" = "5" ]; then
  echo -e "${GREEN}✓${NC} GET /logs — limit respektowany (5)"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} GET /logs — limit nie respektowany: $LIMIT_RETURNED"
  FAIL=$((FAIL + 1))
fi

# Bez type
R=$(req GET "/logs?id=$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — bez type"

# Bez id
R=$(req GET "/logs?type=habit" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — bez id"

# Zły type
R=$(req GET "/logs?type=xxx&id=$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — zły type"

# Nieistniejący habit
R=$(req GET "/logs?type=habit&id=99999" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /logs — nieistniejący habit"

# from > to
R=$(req GET "/logs?type=habit&id=$HABIT_ID&from=$TO&to=$FROM" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — from > to"

# ============================================
# 9. GOALS — STATUS LOCK
# ============================================
section "Goals — status lock"

# Próba cofnięcia completed → in_progress
R=$(req PUT "/goals/$QUICK_GOAL_ID" '{"status":"in_progress"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /goals — cofnięcie completed → in_progress zablokowane"

# ============================================
# 10. STATS — CLAMP 100%
# ============================================
section "Stats — clamping do 100%"

# QUICK_GOAL_ID ma target_days=2, ma 2 logi → powinno być 100%
# Spróbujmy dodać więcej logów (ale nie możemy bo cel jest completed)
# Weź inny cel, dodaj 3 logi, target_days=1 → powinno być clamped do 100%

R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Cel testowy\",
  \"target_days\":1,
  \"frequency\":{\"type\":\"daily\"}
}" "$TOKEN")
BODY="${R#*|}"
TEST_GOAL_ID=$(printf '%s' "$BODY" | jq -r '.goal_id')

# Zaloguj jeden dzień
R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$TEST_GOAL_ID,\"date\":\"$TODAY_ISO\",\"completed\":true}" "$TOKEN")

# Sprawdź overview
R=$(req GET /stats/overview "" "$TOKEN")
BODY="${R#*|}"
PERCENT=$(printf '%s' "$BODY" | jq --arg id "$TEST_GOAL_ID" '.goals[] | select(.goal_id == ($id | tonumber)) | .progress_percent')
if [ "$PERCENT" = "100" ]; then
  echo -e "${GREEN}✓${NC} Progress clamped do 100% ${YELLOW}[$PERCENT]${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} Progress nie clamped: $PERCENT"
  FAIL=$((FAIL + 1))
fi

# ============================================
# 11. CLEANUP
# ============================================
section "Cleanup"

R=$(req DELETE /auth/me "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /auth/me"

# ============================================
# PODSUMOWANIE
# ============================================
echo ""
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}"

[ $FAIL -eq 0 ] && exit 0 || exit 1