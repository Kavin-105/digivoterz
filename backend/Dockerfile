FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose the API port (assumes 5000 based on frontend proxy)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
