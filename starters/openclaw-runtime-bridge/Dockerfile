FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json tsconfig.json ./

# Copy source
COPY src ./src

# Install ignoring monorepo roots since we deploy this standalone
RUN npm install
RUN npm run build 

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
