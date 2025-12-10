FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (dev + prod) for building
RUN npm ci

# Copy application code
COPY . .

# Build-time arguments for Next.js public env vars
# Railway automatically passes env vars as build args
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL

# Set them as env vars for the build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js app
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port (Railway uses 8080 by default)
EXPOSE 3000

# Start in production mode
CMD ["npm", "run", "start"]
