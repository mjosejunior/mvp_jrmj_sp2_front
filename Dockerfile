# Dockerfile

# Use a lightweight nginx image
FROM nginx:alpine

# Copy the static files to the nginx directory
COPY . /usr/share/nginx/html

# Expose the port
EXPOSE 80

# nginx will automatically start and serve the files at port 80
