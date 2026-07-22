@echo off
setlocal
title Gem Merchant - Local Game Server

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found.
  echo Install Node.js 20 or later, then run this file again:
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo Starting Gem Merchant local server...
echo.
echo Copy the following address into your browser:
echo http://127.0.0.1:4173
echo.
echo Keep this window open while playing.
node server.mjs

echo.
echo Game server stopped.
pause
