FROM node:22-alpine
WORKDIR /app
COPY package.json index.mjs glama.json server.json ./
COPY etuki-finops-mcp ./etuki-finops-mcp
RUN npm install --ignore-scripts || true
ENTRYPOINT ["node", "index.mjs"]
