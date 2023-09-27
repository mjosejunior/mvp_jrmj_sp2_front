# Dockerfile

# Use a lightweight nginx image
FROM nginx:alpine

# Copie os arquivos estáticos para o diretório nginx
COPY . /usr/share/nginx/html

# Expose the port
EXPOSE 80

# nginx will automatically start and serve the files at port 80
