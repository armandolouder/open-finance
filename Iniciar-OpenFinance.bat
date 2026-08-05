@echo off
echo Iniciando o Laragon...
start "" "C:\laragon\laragon.exe"

echo Iniciando o Open Finance...
cd /d "C:\laragon\www\OPEN_FINANCE"
start cmd /k "npm run dev"

echo Tudo pronto! O servidor vai iniciar em http://localhost:3000
exit
