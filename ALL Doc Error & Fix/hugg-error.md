===== Build Queued at 2026-02-10 02:45:45 / Commit SHA: 185c8ea =====

--> FROM docker.io/library/python:3.9@sha256:da5aee29682d12a6649f51c8d6f15b87deb3e6c524b923c41d0cb3304d07c913
DONE 9.4s

DONE 9.7s

DONE 10.1s

DONE 10.1s

--> RUN useradd -m -u 1000 user
DONE 0.0s

--> WORKDIR /app
DONE 0.0s

--> COPY --chown=user ./requirements.txt requirements.txt
DONE 0.0s

--> RUN pip install --no-cache-dir --upgrade -r requirements.txt
Defaulting to user installation because normal site-packages is not writeable
Collecting fastapi
  Downloading fastapi-0.128.6-py3-none-any.whl (103 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 103.7/103.7 kB 31.1 MB/s eta 0:00:00
Collecting uvicorn
  Downloading uvicorn-0.39.0-py3-none-any.whl (68 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 68.5/68.5 kB 65.3 MB/s eta 0:00:00
Collecting python-multipart
  Downloading python_multipart-0.0.20-py3-none-any.whl (24 kB)
Collecting paddlepaddle
  Downloading paddlepaddle-3.3.0-cp39-cp39-manylinux1_x86_64.whl (193.7 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 193.7/193.7 MB 25.1 MB/s eta 0:00:00
Collecting paddleocr
  Downloading paddleocr-3.4.0-py3-none-any.whl (87 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87.8/87.8 kB 329.2 MB/s eta 0:00:00
Collecting opencv-python-headless
  Downloading opencv_python_headless-4.13.0.92-cp37-abi3-manylinux_2_28_x86_64.whl (60.4 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60.4/60.4 MB 176.6 MB/s eta 0:00:00
Collecting numpy
  Downloading numpy-2.0.2-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (19.5 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 19.5/19.5 MB 310.7 MB/s eta 0:00:00
Collecting pydantic>=2.7.0
  Downloading pydantic-2.12.5-py3-none-any.whl (463 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 463.6/463.6 kB 274.0 MB/s eta 0:00:00
Collecting typing-extensions>=4.8.0
  Downloading typing_extensions-4.15.0-py3-none-any.whl (44 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 44.6/44.6 kB 252.1 MB/s eta 0:00:00
Collecting annotated-doc>=0.0.2
  Downloading annotated_doc-0.0.4-py3-none-any.whl (5.3 kB)
Collecting typing-inspection>=0.4.2
  Downloading typing_inspection-0.4.2-py3-none-any.whl (14 kB)
Collecting starlette<1.0.0,>=0.40.0
  Downloading starlette-0.49.3-py3-none-any.whl (74 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 74.3/74.3 kB 292.0 MB/s eta 0:00:00
Collecting h11>=0.8
  Downloading h11-0.16.0-py3-none-any.whl (37 kB)
Collecting click>=7.0
  Downloading click-8.1.8-py3-none-any.whl (98 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 98.2/98.2 kB 333.2 MB/s eta 0:00:00
Collecting opt_einsum==3.3.0
  Downloading opt_einsum-3.3.0-py3-none-any.whl (65 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 65.5/65.5 kB 309.6 MB/s eta 0:00:00
Collecting Pillow
  Downloading pillow-11.3.0-cp39-cp39-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl (6.6 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 6.6/6.6 MB 347.7 MB/s eta 0:00:00
Collecting networkx
  Downloading networkx-3.2.1-py3-none-any.whl (1.6 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.6/1.6 MB 342.3 MB/s eta 0:00:00
Collecting protobuf>=3.20.2
  Downloading protobuf-6.33.5-cp39-abi3-manylinux2014_x86_64.whl (323 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 323.5/323.5 kB 321.1 MB/s eta 0:00:00
Collecting safetensors>=0.6.0
  Downloading safetensors-0.7.0-cp38-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (507 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 507.2/507.2 kB 430.2 MB/s eta 0:00:00
Collecting httpx
  Downloading httpx-0.28.1-py3-none-any.whl (73 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 73.5/73.5 kB 307.8 MB/s eta 0:00:00
Collecting paddlex[ocr-core]<3.5.0,>=3.4.0
  Downloading paddlex-3.4.1-py3-none-any.whl (2.0 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.0/2.0 MB 268.6 MB/s eta 0:00:00
Collecting PyYAML>=6
  Downloading pyyaml-6.0.3-cp39-cp39-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (750 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 750.8/750.8 kB 378.0 MB/s eta 0:00:00
Collecting requests
  Downloading requests-2.32.5-py3-none-any.whl (64 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 64.7/64.7 kB 280.1 MB/s eta 0:00:00
Collecting PyYAML>=6
  Downloading PyYAML-6.0.2-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (737 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 737.4/737.4 kB 172.7 MB/s eta 0:00:00
Collecting prettytable
  Downloading prettytable-3.16.0-py3-none-any.whl (33 kB)
Collecting pandas>=1.3
  Downloading pandas-2.3.3-cp39-cp39-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl (12.8 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 12.8/12.8 MB 281.8 MB/s eta 0:00:00
Collecting aistudio-sdk>=0.3.5
  Downloading aistudio_sdk-0.3.8-py3-none-any.whl (62 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 63.0/63.0 kB 305.7 MB/s eta 0:00:00
Collecting filelock
  Downloading filelock-3.19.1-py3-none-any.whl (15 kB)
Collecting packaging
  Downloading packaging-26.0-py3-none-any.whl (74 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 74.4/74.4 kB 323.1 MB/s eta 0:00:00
Collecting chardet
  Downloading chardet-5.2.0-py3-none-any.whl (199 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 199.4/199.4 kB 289.0 MB/s eta 0:00:00
Collecting ujson
  Downloading ujson-5.11.0-cp39-cp39-manylinux_2_24_x86_64.manylinux_2_28_x86_64.whl (57 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 57.4/57.4 kB 282.4 MB/s eta 0:00:00
Collecting ruamel.yaml
  Downloading ruamel_yaml-0.19.1-py3-none-any.whl (118 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 118.1/118.1 kB 362.8 MB/s eta 0:00:00
Collecting modelscope>=1.28.0
  Downloading modelscope-1.34.0-py3-none-any.whl (6.1 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 6.1/6.1 MB 116.2 MB/s eta 0:00:00
Collecting colorlog
  Downloading colorlog-6.10.1-py3-none-any.whl (11 kB)
Collecting huggingface-hub
  Downloading huggingface_hub-1.4.1-py3-none-any.whl (553 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 553.3/553.3 kB 383.3 MB/s eta 0:00:00
Collecting py-cpuinfo
  Downloading py_cpuinfo-9.0.0-py3-none-any.whl (22 kB)
Collecting opencv-contrib-python==4.10.0.84
  Downloading opencv_contrib_python-4.10.0.84-cp37-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (68.7 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 68.7/68.7 MB 124.6 MB/s eta 0:00:00
Collecting pypdfium2>=4
  Downloading pypdfium2-5.4.0-py3-none-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (3.0 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.0/3.0 MB 84.3 MB/s eta 0:00:00
Collecting pyclipper
  Downloading pyclipper-1.3.0.post6-cp39-cp39-manylinux_2_5_x86_64.manylinux1_x86_64.whl (674 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 674.2/674.2 kB 399.7 MB/s eta 0:00:00
Collecting python-bidi
  Downloading python_bidi-0.6.7-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (302 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 302.1/302.1 kB 141.1 MB/s eta 0:00:00
Collecting imagesize
  Downloading imagesize-1.4.1-py2.py3-none-any.whl (8.8 kB)
Collecting shapely
  Downloading shapely-2.0.7-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (2.5 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.5/2.5 MB 176.1 MB/s eta 0:00:00
Collecting annotated-types>=0.6.0
  Downloading annotated_types-0.7.0-py3-none-any.whl (13 kB)
Collecting pydantic-core==2.41.5
  Downloading pydantic_core-2.41.5-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (2.1 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.1/2.1 MB 402.8 MB/s eta 0:00:00
Collecting anyio<5,>=3.6.2
  Downloading anyio-4.12.1-py3-none-any.whl (113 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 113.6/113.6 kB 321.2 MB/s eta 0:00:00
Collecting certifi
  Downloading certifi-2026.1.4-py3-none-any.whl (152 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 152.9/152.9 kB 384.2 MB/s eta 0:00:00
Collecting idna
  Downloading idna-3.11-py3-none-any.whl (71 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 71.0/71.0 kB 327.9 MB/s eta 0:00:00
Collecting httpcore==1.*
  Downloading httpcore-1.0.9-py3-none-any.whl (78 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 78.8/78.8 kB 324.4 MB/s eta 0:00:00
Collecting charset_normalizer<4,>=2
  Downloading charset_normalizer-3.4.4-cp39-cp39-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (153 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 154.0/154.0 kB 306.5 MB/s eta 0:00:00
Collecting urllib3<3,>=1.21.1
  Downloading urllib3-2.6.3-py3-none-any.whl (131 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 131.6/131.6 kB 367.5 MB/s eta 0:00:00
Collecting tqdm
  Downloading tqdm-4.67.3-py3-none-any.whl (78 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 78.4/78.4 kB 313.4 MB/s eta 0:00:00
Collecting bce-python-sdk
  Downloading bce_python_sdk-0.9.60-py3-none-any.whl (395 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 395.4/395.4 kB 412.8 MB/s eta 0:00:00
Collecting psutil
  Downloading psutil-7.2.2-cp36-abi3-manylinux2010_x86_64.manylinux_2_12_x86_64.manylinux_2_28_x86_64.whl (155 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 155.6/155.6 kB 393.1 MB/s eta 0:00:00
Collecting exceptiongroup>=1.0.2
  Downloading exceptiongroup-1.3.1-py3-none-any.whl (16 kB)
Requirement already satisfied: setuptools in /usr/local/lib/python3.9/site-packages (from modelscope>=1.28.0->paddlex[ocr-core]<3.5.0,>=3.4.0->paddleocr->-r requirements.txt (line 5)) (79.0.1)
Collecting tzdata>=2022.7
  Downloading tzdata-2025.3-py2.py3-none-any.whl (348 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 348.5/348.5 kB 401.3 MB/s eta 0:00:00
Collecting python-dateutil>=2.8.2
  Downloading python_dateutil-2.9.0.post0-py2.py3-none-any.whl (229 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 229.9/229.9 kB 417.2 MB/s eta 0:00:00
Collecting pytz>=2020.1
  Downloading pytz-2025.2-py2.py3-none-any.whl (509 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 509.2/509.2 kB 398.2 MB/s eta 0:00:00
Collecting fsspec>=2023.5.0
  Downloading fsspec-2025.10.0-py3-none-any.whl (200 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 201.0/201.0 kB 393.3 MB/s eta 0:00:00
Collecting shellingham
  Downloading shellingham-1.5.4-py2.py3-none-any.whl (9.8 kB)
Collecting typer-slim
  Downloading typer_slim-0.21.1-py3-none-any.whl (47 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 47.4/47.4 kB 263.1 MB/s eta 0:00:00
Collecting hf-xet<2.0.0,>=1.2.0
  Downloading hf_xet-1.2.0-cp37-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (3.3 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.3/3.3 MB 360.5 MB/s eta 0:00:00
Collecting wcwidth
  Downloading wcwidth-0.6.0-py3-none-any.whl (94 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 94.2/94.2 kB 346.8 MB/s eta 0:00:00
Collecting six>=1.5
  Downloading six-1.17.0-py2.py3-none-any.whl (11 kB)
Collecting pycryptodome>=3.8.0
  Downloading pycryptodome-3.23.0-cp37-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (2.3 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.3/2.3 MB 408.2 MB/s eta 0:00:00
Collecting future>=0.6.0
  Downloading future-1.0.0-py3-none-any.whl (491 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 491.3/491.3 kB 436.0 MB/s eta 0:00:00
Installing collected packages: pytz, python-bidi, pyclipper, py-cpuinfo, wcwidth, urllib3, ujson, tzdata, typing-extensions, tqdm, six, shellingham, safetensors, ruamel.yaml, PyYAML, python-multipart, pypdfium2, pycryptodome, psutil, protobuf, Pillow, packaging, numpy, networkx, imagesize, idna, hf-xet, h11, future, fsspec, filelock, colorlog, click, charset_normalizer, chardet, certifi, annotated-types, annotated-doc, uvicorn, typing-inspection, typer-slim, shapely, requests, python-dateutil, pydantic-core, prettytable, opt_einsum, opencv-python-headless, opencv-contrib-python, httpcore, exceptiongroup, bce-python-sdk, pydantic, pandas, modelscope, anyio, aistudio-sdk, starlette, httpx, paddlepaddle, huggingface-hub, fastapi, paddlex, paddleocr
Successfully installed Pillow-11.3.0 PyYAML-6.0.2 aistudio-sdk-0.3.8 annotated-doc-0.0.4 annotated-types-0.7.0 anyio-4.12.1 bce-python-sdk-0.9.60 certifi-2026.1.4 chardet-5.2.0 charset_normalizer-3.4.4 click-8.1.8 colorlog-6.10.1 exceptiongroup-1.3.1 fastapi-0.128.6 filelock-3.19.1 fsspec-2025.10.0 future-1.0.0 h11-0.16.0 hf-xet-1.2.0 httpcore-1.0.9 httpx-0.28.1 huggingface-hub-1.4.1 idna-3.11 imagesize-1.4.1 modelscope-1.34.0 networkx-3.2.1 numpy-2.0.2 opencv-contrib-python-4.10.0.84 opencv-python-headless-4.13.0.92 opt_einsum-3.3.0 packaging-26.0 paddleocr-3.4.0 paddlepaddle-3.3.0 paddlex-3.4.1 pandas-2.3.3 prettytable-3.16.0 protobuf-6.33.5 psutil-7.2.2 py-cpuinfo-9.0.0 pyclipper-1.3.0.post6 pycryptodome-3.23.0 pydantic-2.12.5 pydantic-core-2.41.5 pypdfium2-5.4.0 python-bidi-0.6.7 python-dateutil-2.9.0.post0 python-multipart-0.0.20 pytz-2025.2 requests-2.32.5 ruamel.yaml-0.19.1 safetensors-0.7.0 shapely-2.0.7 shellingham-1.5.4 six-1.17.0 starlette-0.49.3 tqdm-4.67.3 typer-slim-0.21.1 typing-extensions-4.15.0 typing-inspection-0.4.2 tzdata-2025.3 ujson-5.11.0 urllib3-2.6.3 uvicorn-0.39.0 wcwidth-0.6.0

[notice] A new release of pip is available: 23.0.1 -> 26.0.1
[notice] To update, run: pip install --upgrade pip
DONE 40.2s

--> RUN apt-get update && apt-get install -y     libgl1-mesa-glx     libgomp1     && rm -rf /var/lib/apt/lists/*
Get:1 http://deb.debian.org/debian trixie InRelease [140 kB]
Get:2 http://deb.debian.org/debian trixie-updates InRelease [47.3 kB]
Get:3 http://deb.debian.org/debian-security trixie-security InRelease [43.4 kB]
Get:4 http://deb.debian.org/debian trixie/main amd64 Packages [9670 kB]
Get:5 http://deb.debian.org/debian trixie-updates/main amd64 Packages [5412 B]
Get:6 http://deb.debian.org/debian-security trixie-security/main amd64 Packages [104 kB]
Fetched 10.0 MB in 1s (13.2 MB/s)
Reading package lists...
Reading package lists...
Building dependency tree...
Reading state information...
Package libgl1-mesa-glx is not available, but is referred to by another package.
This may mean that the package is missing, has been obsoleted, or
is only available from another source

E: Package 'libgl1-mesa-glx' has no installation candidate

--> ERROR: process "/bin/sh -c apt-get update && apt-get install -y     libgl1-mesa-glx     libgomp1     && rm -rf /var/lib/apt/lists/*" did not complete successfully: exit code: 100

 