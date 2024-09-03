# Use the official Node.js 18 Alpine image
FROM node:18-alpine

# Install necessary dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn

# Set the Puppeteer environment variables
# Skip Chromium download as it's installed via apk
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install --production

# Bundle app source code
COPY . .

# Create the directory for PDFs
RUN mkdir -p pdfs

# Expose the port that the app runs on
EXPOSE 5009

# Command to run the application
CMD ["node", "server.js"]
