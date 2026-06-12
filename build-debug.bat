@echo off
:: MindTalk — Debug APK build shortcut
:: Fixes:
::  1. Windows JDK 17.0.19+ Unix Domain Socket issue (TEMP/TMP must be short path)
::  2. C++ native clean task broken — skipped safely (native code doesn't change)

set ANDROID_HOME=C:\Users\Lenovo-LOQ\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot
set TEMP=C:\Tmp
set TMP=C:\Tmp

cd /d "%~dp0android"

if "%1"=="clean" (
    echo Cleaning build...
    call gradlew.bat clean assembleDebug -x externalNativeBuildCleanDebug -x externalNativeBuildCleanRelease
) else (
    call gradlew.bat assembleDebug
)

echo.
if %errorlevel%==0 (
    echo BUILD SUCCESSFUL
    echo APK: android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo BUILD FAILED
)
pause
