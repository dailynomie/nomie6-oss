FROM node:20-alpine AS build

WORKDIR /usr/app
# A dependency downloads a browser on install; the build does not need it
ENV PUPPETEER_SKIP_DOWNLOAD=1

# Install from the lockfile, so the image matches what was tested
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY ./ /usr/app
RUN NODE_OPTIONS=--max-old-space-size=8192 npm run vbuild

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /usr/app/dist /usr/share/nginx/html

EXPOSE 80
