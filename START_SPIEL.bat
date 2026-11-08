@echo off
title Thenerean Selvabankumar - GIBB Game
echo ====================================================
echo  Starte Thenerean Selvabankumar - GIBB Game...
echo ====================================================
if exist "Thenerean_Selvabankumar.exe" (
    start "" "Thenerean_Selvabankumar.exe"
) else (
    python start_game.py
)
