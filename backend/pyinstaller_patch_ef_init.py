# Patched chromadb/utils/embedding_functions/__init__.py for PyInstaller compatibility.
#
# Problem: the original uses pkgutil.iter_modules([os.path.dirname(__file__)]) to
# discover embedding function modules at runtime. In a PyInstaller onefile bundle,
# Python modules live in the PYZ archive — pkgutil.iter_modules scans the filesystem
# and finds nothing, so ONNXMiniLM_L6_V2 is never injected into globals(), causing a
# NameError when DefaultEmbeddingFunction() is called at class-definition time in
# CollectionCommon.py.
#
# Fix:
#   1. Wrap each dynamic import in try/except so one missing module doesn't abort all.
#   2. Add an explicit fallback import for ONNXMiniLM_L6_V2 after the scan.
#   3. DefaultEmbeddingFunction returns None (not NameError) when ONNX is unavailable.
#      We always pass OllamaEmbeddingFunction to collections, so the default is unused.

import os
import importlib
import pkgutil
from types import ModuleType
from typing import Optional, Set, cast

from chromadb.api.types import Documents, EmbeddingFunction

from chromadb.utils.embedding_functions.chroma_langchain_embedding_function import (  # noqa: F401
    create_langchain_embedding,
)

_all_classes: Set[str] = set()
_all_classes.add("ChromaLangchainEmbeddingFunction")

try:
    from chromadb.is_thin_client import is_thin_client
except ImportError:
    is_thin_client = False


def _import_all_efs() -> Set[str]:
    imported_classes = set()
    _module_dir = os.path.dirname(__file__)
    for _, module_name, _ in pkgutil.iter_modules([_module_dir]):
        if module_name == __name__:
            continue
        try:
            module: ModuleType = importlib.import_module(f"{__name__}.{module_name}")
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (
                    isinstance(attr, type)
                    and isinstance(attr, EmbeddingFunction)
                    and attr is not EmbeddingFunction
                ):
                    globals()[attr.__name__] = attr
                    imported_classes.add(attr.__name__)
        except Exception:
            pass  # skip modules whose dependencies (onnxruntime, etc.) are unavailable

    # PyInstaller fallback: pkgutil.iter_modules finds nothing inside the PYZ archive,
    # so ONNXMiniLM_L6_V2 would never reach globals(). Explicitly import it here;
    # if sys.modules already has a stub (from our runtime hook) that import succeeds
    # immediately without needing onnxruntime on disk.
    if "ONNXMiniLM_L6_V2" not in globals():
        try:
            from chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2 import (
                ONNXMiniLM_L6_V2,
            )
            globals()["ONNXMiniLM_L6_V2"] = ONNXMiniLM_L6_V2
            imported_classes.add("ONNXMiniLM_L6_V2")
        except Exception:
            pass  # onnxruntime not available — DefaultEmbeddingFunction will return None

    return imported_classes


_all_classes.update(_import_all_efs())


def DefaultEmbeddingFunction() -> Optional[EmbeddingFunction[Documents]]:
    if is_thin_client:
        return None
    _onnx = globals().get("ONNXMiniLM_L6_V2")
    if _onnx is None:
        return None  # onnxruntime unavailable; caller must supply embedding_function
    return cast(EmbeddingFunction[Documents], _onnx())


def get_builtins() -> Set[str]:
    return _all_classes
