import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from .config import Base, engine
from .routers import leads, dashboard

# Auto-create tables in MySQL
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Sales CRM API",
    description="FastAPI equivalent of Express.js backend integrating Leads CRUD and Meta Ads API",
    version="1.0.0"
)

# Configure CORS (allow local react frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(leads.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/privacy", response_class=HTMLResponse)
def privacy_policy():
    return "<html><body><h1>Privacy Policy</h1><p>Privacy Policy for CRM. We do not sell or share your data.</p></body></html>"

@app.get("/")
def read_root():
    return {"status": "FastAPI CRM Backend is running."}
