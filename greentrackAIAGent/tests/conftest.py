import os
import sys

# ai_agent.py refuses to start without a key; tests never call the real API.
os.environ.setdefault("OPENAI_API_KEY", "test-key-not-used")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
