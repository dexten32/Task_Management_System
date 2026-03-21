# syntax=docker/dockerfile:1
ARG NODE_VERSION=20.19.5
FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
