# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Dipendenze
COPY package*.json ./
RUN npm install --production=false

# Codice
COPY . .

# Build NestJS
RUN npm run build

# Porta esposta (Nest di default usa 3000)
EXPOSE 3000

# Avvio app
CMD ["node", "dist/main.js"]
