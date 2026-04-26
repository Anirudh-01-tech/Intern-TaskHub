FROM node:20-bookworm-slim
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=development

COPY package.json ./
RUN npm cache clean --force \
 && npm install --include=dev --no-package-lock \
 && test -f /app/node_modules/vite/bin/vite.js \
 && test -d /app/node_modules/@vitejs/plugin-react

COPY index.html vite.config.ts tsconfig.json tsconfig.node.json postcss.config.js tailwind.config.js ./
COPY src ./src

EXPOSE 5173
CMD ["npm", "run", "dev"]