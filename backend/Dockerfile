FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled code
COPY dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
