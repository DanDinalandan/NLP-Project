import os

# Supabase anon key — safe to ship in the binary.
# The anon key is public by design (same model as Firebase web API keys).
# Row Level Security policies in Supabase are the actual access control layer.
#
# Dev override: set SUPABASE_URL / SUPABASE_ANON_KEY in backend/.env
SUPABASE_URL      = os.getenv("SUPABASE_URL",      "https://glngkssxfqjqdprvpyde.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_vo-6pr_LXBQfwKcjo9XS7w_WTcbx0Ue")
