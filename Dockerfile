# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
# Using npm ci for potentially faster and more reliable installs in CI/build environments
RUN npm ci

# Copy the rest of the application code
# .dockerignore will handle exclusions
COPY . .

# Build the Next.js application
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV production

# The Genkit AI might need this. User should set it at runtime via -e or docker-compose.
# Example: docker run -e GOOGLE_GENAI_API_KEY="your_actual_api_key" ...
# ENV GOOGLE_GENAI_API_KEY your_api_key_here

# Create a non-root user for security best practices
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy necessary files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/messages ./messages
COPY --from=builder --chown=nextjs:nodejs /app/.env ./.env
COPY --from=builder --chown=nextjs:nodejs /app/src/i18n.ts ./src/i18n.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/middleware.ts ./src/middleware.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/navigation.ts ./src/navigation.ts


# Change ownership of the app directory to the new user
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on (default is 3000 for next start)
EXPOSE 3000

# Set the default command to run the application
# The "start" script in package.json is `next start`
# To run on a different port, set the PORT environment variable, e.g., -e PORT=9002
CMD ["npm", "run", "start"]
