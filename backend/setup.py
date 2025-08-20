from setuptools import setup, find_packages

setup(
    name="sacsmax-backend",
    version="2.1.0",
    description="SACSMAX Backend - Sistema de Automação de Contatos e Feedback",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "python-multipart==0.0.6",
        "sqlalchemy==2.0.23",
        "psycopg2-binary==2.9.9",
        "python-dotenv==1.0.0",
        "pydantic==2.5.0",
        "python-jose[cryptography]==3.3.0",
        "passlib[bcrypt]==1.7.4",
        "aiofiles==23.2.1",
        "gunicorn==21.2.0",
    ],
    python_requires=">=3.11",
)
