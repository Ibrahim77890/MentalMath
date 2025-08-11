@echo off
cd /d E:\LlamaCpp\llama.cpp\build\bin\Release
.\llama-server.exe -m "C:\models\qwen2.5-3b-instruct-q5_k_m.gguf" --host 127.0.0.1 --port 8080