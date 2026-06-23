@echo off
chcp 65001 >nul
echo Отправляем код на GitHub...
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/XxLocharaxX/gracemap.git
"C:\Program Files\Git\cmd\git.exe" branch -M main
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
echo Если выскочило окно входа в GitHub - войдите через браузер.
echo Если всё прошло успешно, вы увидите надпись "Branch 'main' set up to track remote branch 'main'".
pause
