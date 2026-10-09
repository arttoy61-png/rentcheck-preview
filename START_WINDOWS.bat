@echo off
cd /d "%~dp0app"
echo Open http://127.0.0.1:8000/#map/redevelopment
python -m http.server 8000 --bind 127.0.0.1
pause
