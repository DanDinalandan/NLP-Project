# PyInstaller runtime hook — runs before main.py.
# Stubs out ONNXMiniLM_L6_V2 so chromadb imports without onnxruntime DLLs.
# The module is also excluded from the bundle in the spec so FrozenImporter
# cannot intercept the import and override this stub.
import sys
import types

_stub = types.ModuleType("chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2")


class ONNXMiniLM_L6_V2:
    def __init__(self):
        pass

    def __call__(self, input):
        raise RuntimeError("onnxruntime not bundled — use OllamaEmbeddingFunction")


_stub.ONNXMiniLM_L6_V2 = ONNXMiniLM_L6_V2
sys.modules["chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2"] = _stub
