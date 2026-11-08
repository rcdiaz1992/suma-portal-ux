# build
FROM registry.aduana.gob.bo/node-compiler:1.0 AS node
WORKDIR /app
COPY . .
RUN npm install --force
RUN npm run set-version
RUN npm run build
# image
FROM registry.aduana.gob.bo/nginx:1.0
COPY --from=node /app/dist/demo /usr/share/nginx/html/demo/
COPY --from=node /app/nginx.conf /etc/nginx/conf.d/default.conf