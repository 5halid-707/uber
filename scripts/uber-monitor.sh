#!/bin/bash
# ============================================================
# سكريبت المراقبة والإصلاح الدائم لموقع أوبر
# يعمل كل 30 ثانية للتحقق + إصلاح تلقائي
# ============================================================

cd /home/z/my-project
LOG="/tmp/uber-monitor.log"
PIDFILE="/tmp/uber-monitor.pid"
echo $$ > $PIDFILE

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  # 1. Check if server is running
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] ⚠️ Server died - restarting..." >> $LOG
    pkill -9 -f "next\|bun" 2>/dev/null
    sleep 2
    fuser -k 3000/tcp 2>/dev/null
    sleep 1
    rm -rf .next 2>/dev/null
    nohup bun run dev </dev/null >>/tmp/uber-server.log 2>&1 &
    disown
    sleep 20
    echo "[$TIMESTAMP] ✅ Server restarted" >> $LOG
  fi
  
  # 2. Quick HTTP check
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 8 2>&1)
  if [ "$HTTP" != "200" ]; then
    echo "[$TIMESTAMP] ⚠️ HTTP=$HTTP - killing and restarting..." >> $LOG
    pkill -9 -f "next-server" 2>/dev/null
    sleep 3
    nohup bun run dev </dev/null >>/tmp/uber-server.log 2>&1 &
    disown
    sleep 20
    echo "[$TIMESTAMP] ✅ Server restarted after HTTP failure" >> $LOG
  fi
  
  # 3. Check login API (most critical)
  LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"grouthhacker@gmail.com","password":"Admin@2026"}' --max-time 10 2>&1)
  if ! echo "$LOGIN" | grep -q '"name"'; then
    echo "[$TIMESTAMP] ⚠️ Login API failed - restarting..." >> $LOG
    pkill -9 -f "next-server" 2>/dev/null
    sleep 3
    nohup bun run dev </dev/null >>/tmp/uber-server.log 2>&1 &
    disown
    sleep 20
    echo "[$TIMESTAMP] ✅ Server restarted after login failure" >> $LOG
  fi
  
  # Log status every 5 minutes (10 iterations)
  COUNT_FILE="/tmp/uber-monitor-count"
  COUNT=$(cat $COUNT_FILE 2>/dev/null || echo "0")
  COUNT=$((COUNT+1))
  echo $COUNT > $COUNT_FILE
  if [ $COUNT -ge 10 ]; then
    echo "[$TIMESTAMP] ✅ All systems running (HTTP=$HTTP)" >> $LOG
    echo "0" > $COUNT_FILE
  fi
  
  sleep 30
done
