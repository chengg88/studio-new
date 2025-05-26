
# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if you use yarn)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set build-time environment variables if needed (e.g., for API keys not committed)
# ARG NEXT_PUBLIC_API_KEY
# ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY

# Build the Next.js application
RUN npm run build

# Stage 2: Production image - a lean image for running the Next.js server
FROM node:20-alpine
WORKDIR /app

# Set NODE_ENV to production for Next.js optimizations
ENV NODE_ENV production

# Copy only necessary artifacts from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
# If you have a custom server.js, copy it as well:
# COPY --from=builder /app/server.js ./server.js

# Expose the port Next.js will run on (default 3000, or as specified by PORT env var)
EXPOSE 3000

# Set the default command to start the Next.js application in production mode
# This will use the PORT environment variable if set, otherwise defaults to 3000.
CMD ["npm", "start"]
