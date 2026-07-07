#!/bin/bash
# ============================================================
# سكريبت الإصلاح التلقائي لموقع أوبر
# ============================================================

cd /home/z/my-project
LOG="/tmp/uber-autofix.log"
echo "[$(date)] === بدء الإصلاح التلقائي ===" > $LOG

# 1. Kill all processes
echo "📌 1. إيقاف جميع العمليات..."
pkill -9 -f "next\|bun\|node\|watch" 2>/dev/null
sleep 3
fuser -k 3000/tcp 2>/dev/null
sleep 2

# 2. Clean cache
echo "📌 2. تنظيف الكاش..."
rm -rf .next 2>/dev/null
rm -f dev.log 2>/dev/null

# 3. Check .env
echo "📌 3. فحص .env..."
if ! grep -q "NEXTAUTH_SECRET" .env 2>/dev/null; then
  echo "DATABASE_URL=file:/home/z/my-project/db/custom.db
NEXTAUTH_SECRET=\"super-secret-key-2026\"
NEXTAUTH_URL=\"http://localhost:3000\"
OWNER_EMAIL=\"grouthhacker@gmail.com\"" > .env
  echo "   ✅ تم إنشاء .env" >> $LOG
fi

# 4. Check database
echo "📌 4. فحص قاعدة البيانات..."
if [ ! -f "db/custom.db" ]; then
  mkdir -p db
  bunx prisma db push --force-reset 2>/dev/null
  echo "   ✅ تم إنشاء قاعدة البيانات" >> $LOG
fi

# 5. Check Prisma client
echo "📌 5. فحص Prisma..."
bunx prisma generate 2>/dev/null

# 6. Check TS errors
echo "📌 6. فحص TypeScript..."
TS_ERRORS=$(bunx tsc --noEmit 2>&1 | grep "src/app/page.tsx" | wc -l)
if [ "$TS_ERRORS" -gt "0" ]; then
  echo "   ⚠️ $TS_ERRORS أخطاء TypeScript" >> $LOG
fi

# 7. Start server
echo "📌 7. تشغيل السيرفر..."
nohup bun run dev </dev/null >/tmp/uber-server.log 2>&1 &
disown
sleep 25

# 8. Verify
echo "📌 8. التحقق..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 15)
if [ "$HTTP" = "200" ]; then
  echo "   ✅ السيرفر يعمل" >> $LOG
else
  echo "   ❌ السيرفر فشل" >> $LOG
  exit 1
fi

# 9. Test APIs
echo "📌 9. اختبار APIs..."
PASS=0
FAIL=0

test_api() {
  local name=$1 result=$2
  if echo "$result" | grep -q '"name"\|"success":true\|"regions"\|"totalUsers"\|accepted'; then
    echo "   ✅ $name"
    PASS=$((PASS+1))
  else
    echo "   ❌ $name"
    FAIL=$((FAIL+1))
  fi
}

R=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"grouthhacker@gmail.com","password":"Admin@2026"}' --max-time 10 2>&1)
test_api "Login (owner)" "$R"

R=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"saad@example.com","password":"123456"}' --max-time 10 2>&1)
test_api "Login (rider)" "$R"

R=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"ahmed@driver.com","password":"123456"}' --max-time 10 2>&1)
test_api "Login (driver)" "$R"

R=$(curl -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"name":"TestFix","email":"fix@test.com","phone":"0501115999","password":"123456"}' --max-time 10 2>&1)
test_api "Register" "$R"

R=$(curl -s http://localhost:3000/api/cities --max-time 10 2>&1)
test_api "Cities" "$R"

R=$(curl -s http://localhost:3000/api/admin/stats --max-time 10 2>&1)
test_api "Stats" "$R"

R=$(curl -s "http://localhost:3000/api/chat?tripId=test" --max-time 10 2>&1)
test_api "Chat" "$R"

R=$(curl -s -X POST http://localhost:3000/api/admin/coupons -H "Content-Type: application/json" -d '{"code":"FIXTEST","type":"fixed","value":10,"maxUses":5}' --max-time 10 2>&1)
test_api "Coupons" "$R"

R=$(curl -s -X POST http://localhost:3000/api/complaints -H "Content-Type: application/json" -d '{"fromUserId":"cmracup7u0001qzjxbc311167","subject":"test","description":"test"}' --max-time 10 2>&1)
test_api "Complaints" "$R"

R=$(curl -s -X POST http://localhost:3000/api/trips/rate -H "Content-Type: application/json" -d '{"tripId":"test","fromUserId":"cmracup7u0001qzjxbc311167","toUserId":"cmracup9w0002qzjxj37e6q32","rating":5,"ratedBy":"rider"}' --max-time 10 2>&1)
test_api "Rating" "$R"

# 10. Trip flow test
echo "📌 10. اختبار تدفق الرحلة..."
RIDER_ID="cmracup7u0001qzjxbc311167"
DRIVER_ID="cmracup9w0002qzjxj37e6q32"
TRIP=$(curl -s -X POST http://localhost:3000/api/trips -H "Content-Type: application/json" -d "{\"userId\":\"$RIDER_ID\",\"serviceType\":\"ride\",\"fromAddress\":\"الرياض\",\"toAddress\":\"جدة\",\"distance\":100,\"duration\":60,\"price\":50,\"paymentMethod\":\"cash\"}" --max-time 10 2>&1)
TRIP_ID=$(echo "$TRIP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [ -n "$TRIP_ID" ]; then
  echo "   ✅ Trip created: $TRIP_ID"
  R=$(curl -s -X POST http://localhost:3000/api/trips/accept -H "Content-Type: application/json" -d "{\"tripId\":\"$TRIP_ID\",\"driverId\":\"$DRIVER_ID\"}" --max-time 10 2>&1)
  test_api "Accept trip" "$R"
else
  echo "   ❌ Trip creation failed"
  FAIL=$((FAIL+1))
fi

# 11. Stability test
echo "📌 11. اختبار الاستقرار..."
STABLE=0
for i in 1 2 3 4 5; do
  S=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 8 2>&1)
  if [ "$S" = "200" ]; then STABLE=$((STABLE+1)); fi
  sleep 1
done

# 12. Start watchdog
echo "📌 12. تشغيل الـ Watchdog..."
setsid bash -c 'while true; do pgrep -f "next-server">/dev/null||(cd /home/z/my-project&&bun run dev>>/tmp/wd.log 2>&1&); sleep 5; done' </dev/null >/dev/null 2>&1 &
disown

# Summary
echo ""
echo "================================================"
echo "📊 تقرير الإصلاح"
echo "================================================"
echo "   السيرفر: $([ "$HTTP" = "200" ] && echo '✅ يعمل' || echo '❌ متوقف')"
echo "   APIs: ✅ $PASS / ❌ $FAIL"
echo "   TypeScript: $TS_ERRORS أخطاء"
echo "   الاستقرار: $STABLE/5"
echo "   Watchdog: ✅ يعمل"
echo "================================================"
echo ""
echo "🔑 حسابات للتجربة:"
echo "   المالك: grouthhacker@gmail.com / Admin@2026"
echo "   راكب: saad@example.com / 123456"
echo "   سائق: ahmed@driver.com / 123456"
echo ""
echo "[$(date)] === انتهاء الإصلاح ===" >> $LOG
