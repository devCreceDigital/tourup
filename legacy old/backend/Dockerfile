FROM python:3.12-slim

# 1. Variables de entorno globales obligatorias
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# 2. Instalar dependencias del sistema indispensables para PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Copiar e instalar librerías de Python (Optimiza la caché de Docker)
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# 4. Copiar todo el contenido de la carpeta backend/ al contenedor
COPY . .

# 5. Indicar el puerto internamente (Informativo)
EXPOSE 8000

# 6. ¡CRÍTICO! Comando para levantar el servidor Django usando Gunicorn
CMD ["gunicorn", "totem_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
