FROM node:22-bookworm-slim

WORKDIR /app

# 1. Copiar primero solo los archivos de dependencias para aprovechar la caché
COPY package*.json ./

# 2. Instalar dependencias
RUN npm ci

# 3. ¡MOVER AQUÍ! Copiar todo el código fuente del proyecto al contenedor
COPY . .

# 1. Declarar que necesitas esta variable durante el build
ARG NEXT_PUBLIC_DJANGO_API_URL
# 2. Hacerla disponible para el proceso de Node.js
ENV NEXT_PUBLIC_DJANGO_API_URL=$NEXT_PUBLIC_DJANGO_API_URL


# 4. Compilar la aplicación (ahora sí encontrará las carpetas 'app' o 'pages')
RUN npm run build

# 5. Exponer el puerto que usa tu app
EXPOSE 3001

# 6. Comando de arranque en producción
CMD ["npm", "run", "start"]
