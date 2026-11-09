FROM node:22-alpine
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["node", "etuki-finops-mcp/index.mjs"]
