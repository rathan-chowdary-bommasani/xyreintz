"""
WindDesk API: the JSON API under /api that the frontend calls.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from routes import wind_routes

app = FastAPI(
    title="WindDesk API",
    description="Day-ahead wind forecast monitoring for GB power procurement (Elexon FUELHH / WINDFOR).",
    version="1.0.0",
)

app.add_middleware(GZipMiddleware, minimum_size=1024)
# Read-only public data, so any frontend origin may call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(wind_routes.router, prefix="/api")


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, log_level="warning")
