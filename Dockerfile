FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm i
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
EXPOSE 3333
CMD ["npm", "run", "start:prod"]