@echo off
echo 🚀 Desplegando cambios...

REM Agregar todos los archivos
git add .

REM Crear mensaje de commit con timestamp
for /f "tokens=1-4 delims=/ " %%i in ('date /t') do set mydate=%%i-%%j-%%k
for /f "tokens=1-2 delims=: " %%i in ('time /t') do set mytime=%%i:%%j
set "commit_msg=Auto-deploy %mydate% %mytime%: Updated project files"

REM Hacer commit
echo 💬 Commit: %commit_msg%
git commit -m "%commit_msg%"

REM Push a origin
echo 📤 Enviando a origin...
git push origin

if %errorlevel% equ 0 (
    echo ✅ Despliegue exitoso!
) else (
    echo ❌ Error en el despliegue
)

echo 🏁 Terminado.
pause