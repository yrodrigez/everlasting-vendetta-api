FROM node:26-alpine3.22 AS builder

WORKDIR /app

RUN apk upgrade --no-cache

RUN npm install -g pnpm@11.8.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY build.mjs tsconfig.json ./
COPY src ./src

RUN pnpm run build


FROM node:26-alpine3.22 AS runner

WORKDIR /app

RUN apk upgrade --no-cache

ENV NODE_ENV=production
ENV TZ=Europe/Madrid
ENV PORT=8080

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["node", "dist/server.js"]