# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (ignoring any peer dependency warnings if they occur)
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend source code
COPY . .

# 👇 ADD THESE TWO LINES
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the React application for production
RUN npm run build

# Serve stage
FROM node:18-alpine

WORKDIR /app

# Install `serve` globally to serve static files
RUN npm install -g serve

# Copy only the compiled build output from the build stage
COPY --from=build /app/build ./build

# Expose port 3000 (the default for React and serve)
EXPOSE 3000

# Start the application, routing all requests to index.html for SPA support
CMD ["serve", "-s", "build", "-l", "3000"]
