cmake -B build -DLLAMA_CURL=OFF
cmake --build build --config Release

REM now setting model which I would run for inference, at C drive
 pip install -U "huggingface_hub[cli]"
 hf auth login 
 hf auth list 
 hf download netrunnerllm/Mistral-7B-Instruct-v0.3-Q4_K_M-GGUF mistral-7b-instruct-v0.3-q4_k_m.gguf --local-dir C:\models

REM now at llama.cpp, do this command
cd E:\LlamaCpp\llama.cpp\build\bin\Release
.\llama-cli.exe -m "C:\models\mistral-7b-instruct-v0.3-q4_k_m.gguf" -p "The meaning to life and the universe is"
 
REM for speeding up 7B model
cmake -B build -DLLAMA_BLAS=ON -DLLAMA_BLAS_VENDOR=OpenBLAS
REM First enable openBLAS
# 1. Clone and bootstrap vcpkg
cd C:\
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat

# 2. Install OpenBLAS for x64
.\vcpkg install openblas:x64-windows
.\vcpkg install pkgconf:x64-windows

choco install pkgconfiglite -y

cmake -B build -DCMAKE_TOOLCHAIN_FILE="C:/vcpkg/scripts/buildsystems/vcpkg.cmake" -DVCPKG_TARGET_TRIPLET="x64-windows" -DGGML_BLAS=ON  -DBLAS_VENDOR=OpenBLAS -DBLAS_INCLUDE_DIRS="C:/vcpkg/installed/x64-windows/include" -DBLAS_LIBRARIES="C:/vcpkg/installed/x64-windows/lib/openblas.lib"
REM made changes in llama.cpp/ggml/src/ggml-blas.cpp and changed #include<cblas.h> to #include<openblas/cblas.h>

@REM Then built again and configured to get open blas successfully downloaded

