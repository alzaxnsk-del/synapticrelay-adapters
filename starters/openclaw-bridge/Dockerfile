FROM node:18-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install --omit=dev && npm install typescript

COPY src ./src
RUN npx tsc

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
