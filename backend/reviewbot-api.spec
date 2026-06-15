# PyInstaller spec for the ReviewBot API sidecar
from PyInstaller.utils.hooks import collect_all

block_cipher = None

# collect_all gathers submodules + data files + native DLLs for each package.
# This is required for onnxruntime (native DLLs) and chromadb (embedding model data).
chroma_datas,   chroma_binaries,   chroma_hidden   = collect_all('chromadb')
onnx_datas,     onnx_binaries,     onnx_hidden     = collect_all('onnxruntime')
tok_datas,      tok_binaries,      tok_hidden      = collect_all('tokenizers')

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=chroma_binaries + onnx_binaries + tok_binaries,
    datas=[
        ('database/schema.sql', 'database'),
        *chroma_datas,
        *onnx_datas,
        *tok_datas,
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'fastapi',
        'pdfplumber',
        'pptx',
        'pandas',
        'fpdf',
        'httpx',
        'psutil',
        *chroma_hidden,
        *onnx_hidden,
        *tok_hidden,
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='reviewbot-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
