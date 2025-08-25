#!/usr/bin/env python3
"""
SacsMax Backend - Ponto de entrada principal
"""

import uvicorn
import os
from app.app import app

if __name__ == "__main__":
    PORT = int(os.environ.get('BACKEND_PORT', 5000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info"
    )

