# Use an official Node.js runtime as a parent image
# Alpine Linux is used for a smaller image size, suitable for Raspberry Pi
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if you use Yarn)
COPY package*.json ./

# Install dependencies
# Using --frozen-lockfile (or --pure-lockfile for yarn) is good practice for CI/CD
# but for general local building, a simple install is fine.
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# This step will create the .next folder with the production build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from the builder stage for a lean production image
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
# If you have a custom next.config.js or other root config files, copy them too
# COPY --from=builder /app/next.config.js ./next.config.js
# COPY --from=builder /app/.env.production ./.env.production # If you use a specific prod env file

# Expose the port the app runs on (Next.js default is 3000)
EXPOSE 3000

# Define environment variables that can be overridden at runtime
# These are placeholders; actual values should be set when running the container.
ENV NODE_ENV=production
ENV PORT=3000
# Example: These would be overridden by `docker run -e ...`
# ENV REDIS_URL=redis://localhost:6379
# ENV SQLITE_DB_PATH=/data/oven_data.db

# Command to run the application
# This will start the Next.js server
CMD ["npm", "start"]
