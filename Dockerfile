# Build the source
FROM node:12 as builder

WORKDIR /code

# First install dependencies. This part will be cached as long as
# the package(-lock).json files remain identical.
COPY package*.json /code/
RUN npm install

# Load code to be built
COPY ./build /code/build
COPY ./js /code/js

RUN npm run build:docker

# Production Nginx image
FROM nginxinc/nginx-unprivileged:1.17-alpine
USER root

# Directory where atlas files will be stored
ENV ATLAS_HOME=/usr/share/nginx/html/atlas
# URL where WebAPI can be queried by the client
ENV WEBAPI_URL=http://localhost:8080/WebAPI/
# Hostname for nginx configuration
ENV ATLAS_HOSTNAME=localhost

# Configure webserver
COPY ./docker/nginx.conf /etc/nginx/nginx.conf
# this is required so the sed command run by the enginx user in entrypoint.sh
# has permission to create a temp file in the /etc/nginx dir.
RUN chown -R nginx:nginx /etc/nginx

COPY ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Load code
WORKDIR $ATLAS_HOME
RUN chown nginx:nginx ${ATLAS_HOME}
COPY ./images ./images
COPY ./index.html ./README.md ./LICENSE ./
COPY --from=builder /code/node_modules ./node_modules
COPY --from=builder --chown=nginx:nginx /code/js ./js

# Load Atlas configuration
COPY --chown=nginx:nginx ./docker/config-local.js ./js/config-local.js

USER nginx

ENTRYPOINT ["/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
