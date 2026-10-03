@echo off
chcp 65001 >nul
title The Witness 技术文档 · 中英对照阅读器
cd /d "%~dp0"
echo.
echo   正在启动阅读器...（关掉这个窗口就停止服务）
echo.
node serve.mjs
echo.
echo   服务已停止。按任意键关闭窗口。
pause >nul
