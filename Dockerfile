FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
# The repository lockfile is shared with pnpm 11 in local/CI while this image
# intentionally uses the package-manager-pinned pnpm 10. Let pnpm reconcile
# compatible metadata instead of failing before the application is built.
RUN corepack enable && pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
