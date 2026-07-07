#!/bin/bash
# ============================================================
# سكريبت الإصلاح التلقائي الشامل - يعمل كل دقيقة
# ============================================================
cd /home/z/my-project
LOG="/tmp/uber-autofix.log"

while true; do
  TS=$(date '+%H:%M:%S')
  
  # 1. Check server process
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$TS] RESTART: Server process dead" >> $LOG
    pkill -9 -f "next\|bun" 2>/dev/null
    sleep 2
    fuser -k 3000/tcp 2>/dev/null
    sleep 1
    nohup bun run dev </dev/null >>/tmp/uber-server.log 2>&1 &
    disown
    sleep 20
  fi
  
  # 2. Check HTTP
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 8 2>&1)
  if [ "$HTTP" != "200" ]; then
    echo "[$TS] RESTART: HTTP=$HTTP" >> $LOG
    pkill -9 -f "next-server" 2>/dev/null
    sleep 3
    nohup bun run dev </dev/null >>/tmp/uber-server.log 2>&1 &
    disown
    sleep 20
  fi
  
  # 3. Check login API
  LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"identifier":"grouthhacker@gmail.com","password":"Admin@2026"}' --max-time 8 2>&1)
  if ! echo "$LOGIN" | grep -q '"name"'; then
    echo "[$TS] RESTART: Login API failed" >> $LOG
    pkill -9 -f "next-server" 2>/dev/null
    sleep 3
    nohup bun run dev </dev/null >>/tmp/uber-server.log 2>&1 &
    disown
    sleep 20
  fi
  
  sleep 60
done
