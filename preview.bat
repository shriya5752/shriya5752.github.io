@echo off
rem Rebuilds the content and serves the site at http://localhost:8765 (opens your browser).
rem Close this window to stop it.
cd /d "%~dp0"
python -m pip install --quiet markdown pyyaml
python scripts\build_site.py
start "" http://localhost:8765/
python scripts\serve.py
