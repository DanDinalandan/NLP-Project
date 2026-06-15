# PyInstaller spec for the ReviewBot API sidecar
from PyInstaller.utils.hooks import collect_all

block_cipher = None

chroma_datas, chroma_binaries, chroma_hidden = collect_all('chromadb')

# Strip the ONNX embedding module — we stub it out via the runtime hook instead.
# Keeping it in the bundle would let FrozenImporter override our sys.modules stub.
_ONNX_MODS = {
    'chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2',
    'onnxruntime',
    'tokenizers',
}
chroma_hidden = [h for h in chroma_hidden if not any(h == m or h.startswith(m + '.') for m in _ONNX_MODS)]

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=chroma_binaries,
    datas=[
        ('database/schema.sql', 'database'),
        *chroma_datas,
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
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=['pyi_rth_chromadb.py'],
    excludes=['onnxruntime', 'tokenizers', 'chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2'],
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
