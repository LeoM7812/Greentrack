import os
import sys

# ai_agent.py refuses to start without a key; tests never call the real API.
os.environ.setdefault("OPENAI_API_KEY", "test-key-not-used")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest


@pytest.fixture(autouse=True)
def no_erse_download(monkeypatch):
    """Os testes nunca vão buscar os preços à ERSE; quem precisa usa um .zip de exemplo."""
    import erse

    def offline(*args, **kwargs):
        raise OSError("sem rede nos testes")
    monkeypatch.setattr(erse, "download", offline)
