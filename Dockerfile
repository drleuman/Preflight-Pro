# Stage 1: Build the frontend, and install server dependencies
FROM node:22 AS builder

WORKDIR /app

# Copy all files from the current directory
COPY . ./
RUN echo "API_KEY=PLACEHOLDER" > ./.env
RUN echo "GEMINI_API_KEY=PLACEHOLDER" >> ./.env

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Install dependencies and build the frontend
WORKDIR /app
RUN mkdir dist
RUN bash -c 'if [ -f package.json ]; then npm install && npm run build; fi'


# Stage 2: Build the final server image
FROM node:22

# Install Ghostscript for server-side PDF fixes (RGB->CMYK, grayscale, rebuild dpi)
RUN apt-get update && apt-get install -y --no-install-recommends ghostscript \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install server deps in the final image to guarantee node_modules exist
# (Cloud Run runtime sometimes ends up without node_modules when copying from a builder layer.)
COPY --from=builder /app/server/package*.json ./
RUN npm install --omit=dev

# Copy server entry + built frontend
COPY --from=builder /app/server/server.js ./server.js
COPY --from=builder /app/dist ./dist

# Cloud Run expects the app to listen on $PORT (defaults to 8080).
EXPOSE 8080

CMD ["node", "server.js"]
