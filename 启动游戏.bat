@echo off
setlocal
title Gem Merchant

set "ONLINE_GAME_URL=https://jing200327-cmyk.github.io/-/"

echo Checking online version...
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -Method Head -TimeoutSec 5 -Uri '%ONLINE_GAME_URL%' ^| Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo Opening online version: %ONLINE_GAME_URL%
  start "Gem Merchant Online" "%ONLINE_GAME_URL%"
  exit /b 0
)

echo Online version is unavailable. Starting local game instead.
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found and the online version is unavailable.
  echo Install Node.js 20 or later, then run this launcher again:
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo Starting local Gem Merchant...
echo Your browser will open http://127.0.0.1:4173
start "Gem Merchant Local" cmd /c "timeout /t 1 /nobreak ^>nul ^& start http://127.0.0.1:4173"
node server.mjs

echo.
echo Game server stopped.
pause
