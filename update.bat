@echo off
rem Rebuilds the blog posts, notes and profile text into the site/ folder.
rem Run this after you edit anything in content/ or data/, then publish (see README.md).
cd /d "%~dp0"
python -m pip install --quiet markdown pyyaml
python scripts\build_site.py
if errorlevel 1 (
  echo.
  echo Something went wrong above. Your live site is NOT affected until you publish.
) else (
  echo.
  echo Done. Now commit and push your changes to publish them.
)
pause
