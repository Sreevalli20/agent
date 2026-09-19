"""Startup script for Render deployment that seeds demo data before starting server"""
import sys
import subprocess
import os

def seed_demo_data():
    """Seed demo data if not exists"""
    try:
        from seed_demo_data import seed_demo_alex
        seed_demo_alex()
    except Exception as e:
        print(f"Warning: Could not seed demo data: {e}")
        # Continue anyway - server should start even if seeding fails

def start_server():
    """Start the FastAPI server"""
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # No reload in production
    )

if __name__ == "__main__":
    print("Starting EduPath Backend with demo data seeding...")
    seed_demo_data()
    start_server()