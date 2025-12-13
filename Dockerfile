# --- Base image ---
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# --- Install dependencies ---
COPY package*.json ./
RUN npm install --legacy-peer-deps

# --- Copy source code ---
COPY . .

# --- Generate Prisma ---
RUN npx prisma generate

# --- Build the app ---
RUN npm run build

# --- Expose app port ---
EXPOSE 3001

# --- Run app ---
CMD ["npm", "run", "start:prod"]
