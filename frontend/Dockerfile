FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Prisma CLI + schema/migrations, so `npx prisma migrate deploy` can run
# against this image directly (the standalone build above only traces
# runtime imports, which excludes the CLI, its engine binaries, and the
# raw schema/migration files).
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "server.js"]
