FROM node:24-alpine

WORKDIR /app

COPY apps/dashboard/package*.json ./
RUN npm ci

COPY apps/dashboard .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
