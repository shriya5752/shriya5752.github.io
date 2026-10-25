@echo off
rem Builds the site data and serves ./site at http://localhost:8765 (opens your browser).
cd /d "%~dp0"
python scripts\build_site.py
start "" http://localhost:8765/
python scripts\serve.py
