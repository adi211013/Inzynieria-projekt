#!/usr/bin/env bash
# =============================================
# Testy API — Habit Tracker (pełna wersja)
# =============================================
# Użycie: ./test-api.sh
# Wymaga: curl, jq (brew install jq)

BASE_URL="http://localhost:3001/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
PASS=0
FAIL=0

assert_status() {
  local expected=$1 actual=$2 name=$3
  if [ "$expected" = "$actual" ]; then
    echo -e "${GREEN}✓${NC} $name ${YELLOW}[$actual]${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $name ${RED}[expected $expected, got $actual]${NC}"
    FAIL=$((FAIL + 1))
  fi
}

assert_field() {
  local value=$1 expected=$2 name=$3
  if [ "$value" = "$expected" ]; then
    echo -e "${GREEN}✓${NC} $name ${YELLOW}[$value]${NC}"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $name ${RED}[expected $expected, got $value]${NC}"
    FAIL=$((FAIL + 1))
  fi
}

section() {
  echo ""
  echo -e "${BLUE}═══ $1 ═══${NC}"
}

req() {
  local method=$1 endpoint=$2 data=$3 token=$4
  local -a args=(-s -w '\n%{http_code}' -X "$method")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$data" ]  && args+=(-H "Content-Type: application/json" -d "$data")
  args+=("$BASE_URL$endpoint")
  local response
  response=$(curl "${args[@]}")
  local status body
  status=$(printf '%s\n' "$response" | tail -n1)
  body=$(printf '%s\n' "$response" | sed '$d')
  printf '%s|%s' "$status" "$body"
}

# Daty
TS=$(date +%s)
TODAY_ISO=$(date -u +"%Y-%m-%dT12:00:00Z")
YESTERDAY_ISO=$(date -u -v-1d +"%Y-%m-%dT12:00:00Z" 2>/dev/null || date -u -d "yesterday" +"%Y-%m-%dT12:00:00Z")
TWO_DAYS_AGO_ISO=$(date -u -v-2d +"%Y-%m-%dT12:00:00Z" 2>/dev/null || date -u -d "2 days ago" +"%Y-%m-%dT12:00:00Z")
FUTURE_DATE=$(date -u -v+30d +"%Y-%m-%d" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%d")
PAST_DATE=$(date -u -v-1d +"%Y-%m-%d" 2>/dev/null || date -u -d "-1 days" +"%Y-%m-%d")
TODAY_DATE=$(date -u +"%Y-%m-%d")
FROM_DATE=$(date -u -v-7d +"%Y-%m-%d" 2>/dev/null || date -u -d "-7 days" +"%Y-%m-%d")

# ============================================
# 1. HEALTH
# ============================================
section "Health Check"

STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health)
assert_status "200" "$STATUS" "GET /health"

# ============================================
# 2. AUTH — REGISTER
# ============================================
section "Auth — Register"

EMAIL="test_$TS@test.com"
USERNAME="test_$TS"
PASSWORD="haslo123"

R=$(req POST /auth/register "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" "")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /auth/register"
TOKEN=$(printf '%s' "$BODY" | jq -r '.token')

# Nowe pola w rejestracji
HAS_THEME=$(printf '%s' "$BODY" | jq -r '.user.theme')
assert_field "$HAS_THEME" "light" "register — domyślny theme=light"

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
assert_status "200" "$STATUS" "POST /auth/login"

R=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"zle\"}" "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "POST /auth/login — złe hasło"

R=$(req POST /auth/login '{"email":"nikt@nikt.com","password":"x"}' "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "POST /auth/login — nieistniejący email"

# ============================================
# 4. AUTH — ME + UPDATE
# ============================================
section "Auth — Me & Update"

R=$(req GET /auth/me "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /auth/me"

# Sprawdź nowe pola w profilu
for field in theme timezone language notifications_enabled reminder_time display_name; do
  HAS=$(printf '%s' "$BODY" | jq "has(\"$field\")")
  assert_field "$HAS" "true" "GET /auth/me — pole $field istnieje"
done

R=$(req GET /auth/me "" "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "GET /auth/me — bez tokenu"

R=$(req GET /auth/me "" "zly_token")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "GET /auth/me — zły token"

# Update — poprawne pola
R=$(req PUT /auth/me '{"display_name":"Testowy User"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — display_name"

R=$(req PUT /auth/me '{"theme":"dark"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — theme dark"

R=$(req PUT /auth/me '{"language":"en"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — language en"

R=$(req PUT /auth/me '{"timezone":"Europe/London"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — timezone"

R=$(req PUT /auth/me '{"reminder_time":"08:00"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — reminder_time"

R=$(req PUT /auth/me '{"notifications_enabled":true}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — notifications_enabled"

# Update — błędne wartości
R=$(req PUT /auth/me '{"theme":"pink"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły theme"

R=$(req PUT /auth/me '{"language":"de"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły language"

R=$(req PUT /auth/me '{"timezone":"Mars/Curiosity"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły timezone"

R=$(req PUT /auth/me '{"reminder_time":"25:00"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — zły reminder_time"

R=$(req PUT /auth/me '{}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /auth/me — pusty body"

# Zmiana hasła i ponowne logowanie
R=$(req PUT /auth/me '{"password":"nowe_haslo"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /auth/me — zmiana hasła"

R=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"nowe_haslo\"}" "")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "POST /auth/login — po zmianie hasła"
TOKEN=$(printf '%s' "$BODY" | jq -r '.token') # odśwież token

# ============================================
# 5. HABITS — CRUD
# ============================================
section "Habits — CRUD"

R=$(req GET /habits "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /habits — lista"

R=$(req GET /habits "" "")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "GET /habits — bez tokenu"

# Tworzenie — różne typy frequency
R=$(req POST /habits '{
  "name":"Picie wody",
  "description":"8 szklanek",
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
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /habits — weekly_days"
HABIT2_ID=$(printf '%s' "$BODY" | jq -r '.habit_id')

R=$(req POST /habits '{"name":"Medytacja","frequency":{"type":"times_per_week","count":3},"category":"mindfulness"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /habits — times_per_week"

# Walidacja frequency
R=$(req POST /habits '{"frequency":{"type":"daily"}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — bez name"

R=$(req POST /habits '{"name":"test"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — bez frequency"

R=$(req POST /habits '{"name":"test","frequency":{"type":"monthly"}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — zły typ frequency"

R=$(req POST /habits '{"name":"test","frequency":{"type":"weekly_days","days":[0,7]}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — dzień poza zakresem"

R=$(req POST /habits '{"name":"test","frequency":{"type":"times_per_week","count":8}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /habits — count > 7"

# Get / Update
R=$(req GET "/habits/$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /habits/:id"

R=$(req GET /habits/99999 "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /habits/:id — nieistniejący"

R=$(req PUT "/habits/$HABIT_ID" '{"name":"Picie wody (update)","category":"health"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /habits/:id"

# ============================================
# 6. HABITS — ARCHIWUM
# ============================================
section "Habits — Archiwum"

# Przed soft-delete: archived nie powinien zwracać aktywnych
R=$(req GET "/habits?archived=true" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /habits?archived=true — odpowiada 200"
COUNT_BEFORE=$(printf '%s' "$BODY" | jq 'length')

# Soft-delete habit2
R=$(req DELETE "/habits/$HABIT2_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /habits/:id — soft-delete"

# Po soft-delete: nie widoczny w normalnej liście
R=$(req GET /habits "" "$TOKEN")
BODY="${R#*|}"
ACTIVE_IDS=$(printf '%s' "$BODY" | jq '[.[].habit_id]')
IS_GONE=$(printf '%s' "$ACTIVE_IDS" | jq "contains([$HABIT2_ID]) | not")
assert_field "$IS_GONE" "true" "GET /habits — usuniętego nie ma na liście aktywnych"

# Po soft-delete: widoczny w archiwum
R=$(req GET "/habits?archived=true" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /habits?archived=true — 200 po soft-delete"
ARCHIVED_IDS=$(printf '%s' "$BODY" | jq '[.[].habit_id]')
IS_ARCHIVED=$(printf '%s' "$ARCHIVED_IDS" | jq "contains([$HABIT2_ID])")
assert_field "$IS_ARCHIVED" "true" "GET /habits?archived=true — usunięty jest w archiwum"

# ============================================
# 7. GOALS — CRUD
# ============================================
section "Goals — CRUD"

R=$(req GET /goals "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /goals"

# Walidacja
R=$(req POST /goals '{"name":"Cel","target_days":30,"frequency":{"type":"daily"}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — bez habit_id"

R=$(req POST /goals "{\"habit_id\":$HABIT_ID,\"name\":\"Zły\",\"target_days\":-1,\"frequency\":{\"type\":\"daily\"}}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — ujemne target_days"

R=$(req POST /goals '{"habit_id":99999,"name":"X","target_days":5,"frequency":{"type":"daily"}}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "POST /goals — nieistniejący habit"

# Deadline walidacja
R=$(req POST /goals "{\"habit_id\":$HABIT_ID,\"name\":\"Zły deadline\",\"target_days\":5,\"frequency\":{\"type\":\"daily\"},\"deadline\":\"$PAST_DATE\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — deadline w przeszłości"

R=$(req POST /goals "{\"habit_id\":$HABIT_ID,\"name\":\"Zły format\",\"target_days\":5,\"frequency\":{\"type\":\"daily\"},\"deadline\":\"nie-data\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /goals — zły format deadline"

# Poprawne tworzenie
R=$(req POST /goals "{
  \"habit_id\":$HABIT_ID,
  \"name\":\"Pić wodę 30 dni\",
  \"target_days\":30,
  \"frequency\":{\"type\":\"daily\"},
  \"deadline\":\"$FUTURE_DATE\"
}" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /goals — z deadline"
GOAL_ID=$(printf '%s' "$BODY" | jq -r '.goal_id')

# Update
R=$(req PUT "/goals/$GOAL_ID" '{"name":"Pić wodę (update)"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "PUT /goals/:id"

# Status lock — nie można cofnąć completed/failed → in_progress (testujemy po auto-complete)
R=$(req PUT "/goals/$GOAL_ID" '{"status":"weird"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /goals/:id — zły status"

# ============================================
# 8. LOGS — POST + UPSERT
# ============================================
section "Logs — POST & Upsert"

# Habit log dziś
R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\",\"value\":5}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit dziś"

# Upsert — drugi raz ten sam dzień
R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\",\"value\":8}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit upsert (ten sam dzień)"

# Habit log wczoraj i przedwczoraj (do streaka)
R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$YESTERDAY_ISO\",\"value\":6}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit wczoraj"

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TWO_DAYS_AGO_ISO\",\"value\":7}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — habit przedwczoraj"

# Goal log
R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$GOAL_ID,\"date\":\"$TODAY_ISO\",\"completed\":true}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "201" "$STATUS" "POST /logs — goal"

# Walidacja
R=$(req POST /logs "{\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — bez type"

R=$(req POST /logs "{\"type\":\"xxx\",\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — zły type"

R=$(req POST /logs "{\"type\":\"habit\",\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — habit bez habit_id"

R=$(req POST /logs "{\"type\":\"goal\",\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — goal bez goal_id"

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":99999,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "POST /logs — nieistniejący habit"

# ============================================
# 9. LOGS — AUTO-COMPLETE GOAL
# ============================================
section "Logs — Auto-complete goal"

# Cel z target_days=2 — po 2 logach powinien być completed
R=$(req POST /goals "{\"habit_id\":$HABIT_ID,\"name\":\"Szybki cel\",\"target_days\":2,\"frequency\":{\"type\":\"daily\"}}" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "201" "$STATUS" "POST /goals — szybki cel (target_days=2)"
QUICK_GOAL_ID=$(printf '%s' "$BODY" | jq -r '.goal_id')

R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$QUICK_GOAL_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
assert_status "201" "${R%%|*}" "POST /logs — goal log 1/2"

R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$QUICK_GOAL_ID,\"date\":\"$YESTERDAY_ISO\"}" "$TOKEN")
assert_status "201" "${R%%|*}" "POST /logs — goal log 2/2"

R=$(req GET "/goals/$QUICK_GOAL_ID" "" "$TOKEN")
GOAL_STATUS=$(printf '%s' "${R#*|}" | jq -r '.status')
assert_field "$GOAL_STATUS" "completed" "Goal auto-completed po osiągnięciu target_days"

# Próba logowania do completed goala
R=$(req POST /logs "{\"type\":\"goal\",\"goal_id\":$QUICK_GOAL_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "POST /logs — blokada logowania do completed goala"

# Status lock
R=$(req PUT "/goals/$QUICK_GOAL_ID" '{"status":"in_progress"}' "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "PUT /goals — cofnięcie completed→in_progress zablokowane"

# ============================================
# 10. LOGS — DELETE (tylko dziś)
# ============================================
section "Logs — DELETE"

# DELETE dziś — OK
R=$(req DELETE /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /logs — dziś (OK)"

# Dodaj z powrotem
req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\",\"value\":8}" "$TOKEN" > /dev/null

# DELETE wczoraj — 403
R=$(req DELETE /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$YESTERDAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "403" "$STATUS" "DELETE /logs — wczoraj (zablokowane 403)"

# Walidacja
R=$(req DELETE /logs "{\"type\":\"habit\",\"date\":\"$TODAY_ISO\"}" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "DELETE /logs — bez habit_id"

# ============================================
# 11. GET LOGS — RANGE + PAGINACJA
# ============================================
section "Logs — GET range & paginacja"

R=$(req GET "/logs?type=habit&id=$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /logs — domyślne (30 dni)"

# Struktura odpowiedzi
for field in data total page limit from to; do
  HAS=$(printf '%s' "$BODY" | jq "has(\"$field\")")
  assert_field "$HAS" "true" "GET /logs — pole $field w odpowiedzi"
done

R=$(req GET "/logs?type=habit&id=$HABIT_ID&from=$FROM_DATE&to=$TODAY_DATE" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /logs — z zakresem dat"

R=$(req GET "/logs?type=habit&id=$HABIT_ID&page=1&limit=2" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /logs — paginacja limit=2"
LIMIT_VAL=$(printf '%s' "$BODY" | jq '.limit')
assert_field "$LIMIT_VAL" "2" "GET /logs — limit respektowany"

R=$(req GET "/logs?type=goal&id=$GOAL_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "GET /logs — goal logs"

# Błędy
R=$(req GET "/logs?id=$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — bez type"

R=$(req GET "/logs?type=habit" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — bez id"

R=$(req GET "/logs?type=xxx&id=$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — zły type"

R=$(req GET "/logs?type=habit&id=99999" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /logs — nieistniejący habit"

R=$(req GET "/logs?type=habit&id=$HABIT_ID&from=$TODAY_DATE&to=$FROM_DATE" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /logs — from > to"

# ============================================
# 12. STATS — OVERVIEW
# ============================================
section "Stats — Overview"

R=$(req GET /stats/overview "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /stats/overview"

# Struktura
for field in total_habits total_goals total_logs today_logs longest_current_streak habits goals; do
  HAS=$(printf '%s' "$BODY" | jq "has(\"$field\")")
  assert_field "$HAS" "true" "overview — pole $field istnieje"
done

# completed_today w habits
HAS_CT=$(printf '%s' "$BODY" | jq '.habits[0] | has("completed_today")')
assert_field "$HAS_CT" "true" "overview — habits[0] ma completed_today"

# Sprawdź że habit z logiem dziś ma completed_today=true
CT_VALUE=$(printf '%s' "$BODY" | jq --arg id "$HABIT_ID" '.habits[] | select(.habit_id == ($id | tonumber)) | .completed_today')
assert_field "$CT_VALUE" "true" "overview — completed_today=true dla nawyk z logiem dziś"

# Streak >= 3 (mamy logi 3 dni z rzędu: today, yesterday, two_days_ago)
STREAK=$(printf '%s' "$BODY" | jq --arg id "$HABIT_ID" '.habits[] | select(.habit_id == ($id | tonumber)) | .streak')
if [ "$STREAK" -ge 3 ] 2>/dev/null; then
  echo -e "${GREEN}✓${NC} overview — streak >= 3 ${YELLOW}[$STREAK]${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} overview — streak powinien być >= 3, got $STREAK"
  FAIL=$((FAIL + 1))
fi

# Progress clamped do 100%
R=$(req POST /goals "{\"habit_id\":$HABIT_ID,\"name\":\"Clamp test\",\"target_days\":1,\"frequency\":{\"type\":\"daily\"}}" "$TOKEN")
CLAMP_GOAL_ID=$(printf '%s' "${R#*|}" | jq -r '.goal_id')
req POST /logs "{\"type\":\"goal\",\"goal_id\":$CLAMP_GOAL_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN" > /dev/null

R=$(req GET /stats/overview "" "$TOKEN")
PERCENT=$(printf '%s' "${R#*|}" | jq --arg id "$CLAMP_GOAL_ID" '.goals[] | select(.goal_id == ($id | tonumber)) | .progress_percent')
assert_field "$PERCENT" "100" "overview — progress_percent clamped do 100%"

# ============================================
# 13. STATS — HABIT STATS
# ============================================
section "Stats — Habit Stats"

R=$(req GET "/stats/habits/$HABIT_ID" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /stats/habits/:id"

for field in habit streak total_completions recent_logs page limit; do
  HAS=$(printf '%s' "$BODY" | jq "has(\"$field\")")
  assert_field "$HAS" "true" "habitStats — pole $field istnieje"
done

R=$(req GET "/stats/habits/$HABIT_ID?limit=2" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /stats/habits/:id?limit=2"
LIMIT_VAL=$(printf '%s' "$BODY" | jq '.limit')
assert_field "$LIMIT_VAL" "2" "habitStats — limit respektowany"

R=$(req GET /stats/habits/99999 "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /stats/habits/:id — nieistniejący"

# ============================================
# 14. STATS — HISTORY
# ============================================
section "Stats — History"

R=$(req GET /stats/history "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /stats/history — domyślne (30 dni)"

# Struktura
HAS_DAILY=$(printf '%s' "$BODY" | jq 'has("daily")')
HAS_CAT=$(printf '%s' "$BODY" | jq 'has("by_category")')
assert_field "$HAS_DAILY" "true" "history — pole daily istnieje"
assert_field "$HAS_CAT" "true" "history — pole by_category istnieje"

# daily[] ma pola date, completed, total
if [ "$(printf '%s' "$BODY" | jq '.daily | length')" -gt 0 ]; then
  for field in date completed total; do
    HAS=$(printf '%s' "$BODY" | jq ".daily[0] | has(\"$field\")")
    assert_field "$HAS" "true" "history — daily[0] ma $field"
  done
fi

# by_category[] ma pola category, completed
if [ "$(printf '%s' "$BODY" | jq '.by_category | length')" -gt 0 ]; then
  for field in category completed; do
    HAS=$(printf '%s' "$BODY" | jq ".by_category[0] | has(\"$field\")")
    assert_field "$HAS" "true" "history — by_category[0] ma $field"
  done
fi

# Z zakresem dat
R=$(req GET "/stats/history?from=$FROM_DATE&to=$TODAY_DATE" "" "$TOKEN")
STATUS="${R%%|*}"; BODY="${R#*|}"
assert_status "200" "$STATUS" "GET /stats/history — z zakresem dat"

DAYS=$(printf '%s' "$BODY" | jq '.daily | length')
if [ "$DAYS" -ge 7 ] 2>/dev/null; then
  echo -e "${GREEN}✓${NC} history — 7 lub więcej dni w odpowiedzi ${YELLOW}[$DAYS]${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} history — za mało dni: $DAYS"
  FAIL=$((FAIL + 1))
fi

# Błędy
R=$(req GET "/stats/history?from=$TODAY_DATE&to=$FROM_DATE" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "400" "$STATUS" "GET /stats/history — from > to"

# ============================================
# 15. IZOLACJA USERÓW
# ============================================
section "Izolacja userów"

EMAIL2="test2_$TS@test.com"
USERNAME2="test2_$TS"
R=$(req POST /auth/register "{\"username\":\"$USERNAME2\",\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\"}" "")
TOKEN2=$(printf '%s' "${R#*|}" | jq -r '.token')

R=$(req GET "/habits/$HABIT_ID" "" "$TOKEN2")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "Izolacja — user2 nie widzi habitu user1"

R=$(req POST /logs "{\"type\":\"habit\",\"habit_id\":$HABIT_ID,\"date\":\"$TODAY_ISO\"}" "$TOKEN2")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "Izolacja — user2 nie może logować habitu user1"

R=$(req GET "/goals/$GOAL_ID" "" "$TOKEN2")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "Izolacja — user2 nie widzi celu user1"

R=$(req GET /stats/overview "" "$TOKEN2")
BODY="${R#*|}"
COUNT2=$(printf '%s' "$BODY" | jq '.total_habits')
assert_field "$COUNT2" "0" "Izolacja — user2 ma 0 nawyków w overview"

# ============================================
# 16. SOFT DELETE — GOALS
# ============================================
section "Soft Delete — Goals"

R=$(req DELETE "/goals/$GOAL_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /goals/:id"

R=$(req GET "/goals/$GOAL_ID" "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /goals/:id — po soft-delete niewidoczny"

# ============================================
# 17. DELETE KONTO
# ============================================
section "Delete konto"

req DELETE /auth/me "" "$TOKEN2" > /dev/null

R=$(req DELETE /auth/me "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "200" "$STATUS" "DELETE /auth/me"

R=$(req GET /auth/me "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "404" "$STATUS" "GET /auth/me — po usunięciu konta"

R=$(req GET /habits "" "$TOKEN")
STATUS="${R%%|*}"
assert_status "401" "$STATUS" "GET /habits — token po usuniętym koncie odrzucony (user nie istnieje → 401 lub 404)"

# ============================================
# PODSUMOWANIE
# ============================================
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
TOTAL=$((PASS + FAIL))
echo -e "${YELLOW}Total:  $TOTAL${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ Wszystkie testy przeszły!${NC}"
  exit 0
else
  echo -e "${RED}✗ Niektóre testy nie przeszły${NC}"
  exit 1
fi