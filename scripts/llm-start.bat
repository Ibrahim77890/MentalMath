@echo off
cd /d E:\LlamaCpp\llama.cpp\build\bin\Release
.\llama-server.exe -m "C:\models\mistral-7b-instruct-v0.3-q4_k_m.gguf" --host 127.0.0.1 --port 8080