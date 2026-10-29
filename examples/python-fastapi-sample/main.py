import os

db_url = os.environ.get("DATABASE_URL", "postgresql://localhost/dev")
redis_host = os.getenv("REDIS_HOST", "localhost")
port = int(os.environ.get("PORT", "8000"))

print(f"[Sample FastAPI] Starting with DB {db_url} and Redis {redis_host} on port {port}")
