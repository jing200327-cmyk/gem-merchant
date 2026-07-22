@echo off
setlocal
title 宝石商人 - 本地游戏服务器

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo 未检测到 Node.js。
  echo 请安装 Node.js 20 或更高版本后，再双击本文件。
  echo 下载地址：https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo 正在启动宝石商人……
echo 浏览器将打开 http://127.0.0.1:4173
start "宝石商人" cmd /c "timeout /t 1 /nobreak ^>nul ^& start http://127.0.0.1:4173"
node server.mjs

echo.
echo 游戏服务器已停止。
pause
