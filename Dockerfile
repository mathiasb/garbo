FROM node:alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    python3 \
    make \
    g++ \
    ca-certificates \
    ttf-freefont \
    pixman-dev \
    cairo-dev \
    pango-dev \
    giflib-dev \
    libjpeg-turbo-dev

COPY package*.json /app/
COPY prisma /app/
WORKDIR /app
RUN npm install --omit=dev
RUN npx prisma generate

COPY . /app
CMD ["npm", "start"]
