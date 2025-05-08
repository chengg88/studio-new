# Use a lightweight base image that supports ARM architecture (like Alpine Linux with Node.js)
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# This will create the .next folder with the production build
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Copy built assets from builder stage
# We need the .next folder (production build)
COPY --from=builder /app/.next ./.next
# We need the public folder for static assets
COPY --from=builder /app/public ./public
# We need package.json to run `npm start` which executes `next start`
COPY --from=builder /app/package.json ./package.json
# We need node_modules for runtime dependencies.
# For a leaner image, consider using `output: "standalone"` in next.config.js
# and copying the .next/standalone directory instead.
COPY --from=builder /app/node_modules ./node_modules

# Next.js runs on port 3000 by default.
# The user wants to map host port 80 to this container port.
EXPOSE 3000

# Start the Next.js production server
# The `start` script in package.json is `next start`
CMD ["npm", "start"]
