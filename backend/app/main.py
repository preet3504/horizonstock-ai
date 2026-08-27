import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.services.stock_list_cache import stock_cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load the NSE stock list into memory
    print("[Startup] Initializing NSE stock list cache...")
    await stock_cache.initialize()
    print(f"[Startup] Stock list cache ready — {stock_cache.stock_count} symbols loaded.")
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="HorizonStock AI API",
    description="Backend API for stock analysis and recommendation.",
    version="1.0.0",
    lifespan=lifespan,
)

# Build CORS origins list: always allow localhost, add production URL if set
cors_origins = ["http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    cors_origins.append(frontend_url)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
