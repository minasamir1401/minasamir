FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first for better caching
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy the rest of the source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Final production image
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies and built code
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create the database file if it doesn't exist (optional, usually handled by volume)
# RUN touch ./prisma/dev.db

EXPOSE 5001

# Run migrations and start the server
# Note: In production, you might want to run 'npx prisma migrate deploy'
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && node dist/index.js"]
