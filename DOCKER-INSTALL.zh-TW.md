# Docker

## 安裝方式

1. 從 [GitHub](https://github.com/Chinlinlee/Burni) 下載專案。

   ```bash
   gh repo clone Chinlinlee/Burni
   ```
2. 進入 Burni 資料夾並安裝 npm 套件。

   ```bash
   cd Burni
   npm install
   ```
   > 當在 Linux 上安裝時，可能會遇到 `npm install` 失敗，可參考此[說明文件](https://github.com/kelektiv/node.bcrypt.js/wiki/Installation-Instructions#linux)。（如果 Python 安裝失敗可以嘗試改為安裝 `python2`，並將 `python` 指令指向 `python2` ）

3. 設定環境變數。

   ```bash
   cp .env.template .env
   ```

   ```bash
   MONGODB_NAME="admin"
   MONGODB_HOSTS=["fhir-burni-mongodb"]
   MONGODB_PORTS=[27017]
   MONGODB_USER="root"
   MONGODB_PASSWORD="root"
   MONGODB_IS_SHARDING_MODE=false
   MONGODB_AUTH_DB=admin
   
   SERVER_PORT=8080
   SERVER_SESSION_SECRET_KEY="secretKey"
   
   FHIRSERVER_HOST="localhost"
   FHIRSERVER_PORT=8080
   FHIRSERVER_APIPATH="fhir"
   
   ENABLE_CHECK_ALL_RESOURCE_ID=false
   ENABLE_CHECK_REFERENCE=false
   
   ENABLE_CSHARP_VALIDATOR=false
   VALIDATION_FILES_ROOT_PATH="/validationResources"
   VALIDATION_API_URL="http://burni-fhir-validator-api:7414"
   ```
4. 產生所有 FHIR Resource 的設定檔。

   ```bash
   cp config/config.template.js config/config.js
   node config/generate-config-allResources.js
   npm run build
   ```

   > 本步驟中 `config.js` 可以用來設定支援的 FHIR Resource。執行 `generate-config-allResources.js` 則是可以產生支援所有 FHIR Resource 的 `config.js`。

5. 建立 Plug-in 的設定檔。

   ```bash
   cp plugins/config.template.js plugins/config.js
   ```

6. 建立 `Dockerfile`。

   ```bash
   FROM keymetrics/pm2:16-slim
   
   # Install JDK
   RUN apt update && apt install openjdk-11-jdk-headless make g++ python3 netcat curl iputils-ping -y
   
   WORKDIR /
   RUN mkdir -p /nodejs/fhir-burni/
   RUN chown -R node:node /nodejs
   WORKDIR /nodejs/fhir-burni/
   # Bundle APP files
   COPY --chown=node:node package*.json /nodejs/fhir-burni/
   COPY --chown=node:node . /nodejs/fhir-burni/
   
   # Install app dependencies
   ENV NPM_CONFIG_docLOGLEVEL warn
   ENV NODE_ENV production
   RUN npm ci --omit=dev
   
   # Show current folder structure in logs
   #RUN ls -al -R
   USER node
   CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--node-args=\"--max-old-space-size=4096\""]
   ```

7. 建立 `docker-compose.yml`。

   ```yaml
   version: '3.4'
   
   services:
     fhir-burni-mongodb:
       image: mongo:4.2
       container_name : fhir-burni-mongodb
       restart: always
       ports:
         - 27017:27017
       volumes:
         - ./mongodb/db:/data/db
       environment:
         # provide your credentials here
         - MONGO_INITDB_DATABASE=admin
         - MONGO_INITDB_ROOT_USERNAME=root
         - MONGO_INITDB_ROOT_PASSWORD=root
         - MONGO_PORT=27017
   
     fhir-burni:
       build: ./
       container_name: fhir-burni
       command: >
         /bin/sh -c '
         while ! nc -z fhir-burni-mongodb 27017;
         do
           echo "waiting for database ...";
           sleep 3;
         done;
         echo "db is ready!";
         pm2-runtime start ecosystem.config.js;
         '
       volumes :
         - ./:/nodejs/fhir-burni
         - /nodejs/fhir-burni/node_modules
       ports:
         - 8080:8080
       depends_on:
         - fhir-burni-mongodb
       tty : true
       restart: on-failure:3
       stdin_open : true
   ```


8. 啟動 Docker Compose 專案。
   
   ```bash
   docker compose up -d --build
   ```

> 已經成功架設 Burni。可以到 <http://localhost:8080> 開啟。

## 水平擴展

1. 移除所有容器的 `container_name`。擴展服務時同一服務會有多個容器，無法指定服務對應的容器名稱，會由 Docker 產生容器名稱，例如 `service-name-1`、`service-name-2`。

   ```yaml
   # docker-compose.yml
   
   services:
     fhir-burni-mongodb:
       # container_name : fhir-burni-mongodb
     
     fhir-burni:
       # container_name: fhir-burni
   ```
2. 從 `fhir-burni` 服務中移除 `ports` 欄位。後續步驟會使用網頁伺服器反向代理至各個 Burni 容器，不需要直接發佈 Burni 服務的 port。

   ```yaml
   # docker-compose.yml
   
   services:
     fhir-burni:
       # ports:
         # - 8080:8080
   ```
3. 在 Docker Compose 專案中加入 `nginx` 服務。

   ```yaml
   # docker-compose.yml
   
   services:
     # other services
   
     nginx:
       image: nginx:1.17.6-alpine
       restart: unless-stopped
       ports:
         - "8080:80"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
       depends_on:
         - fhir-burni
   ```
4. 建立 nginx.conf。

   
   > 在這裡使用 4 個 Burni 服務作為範例，可以根據需求調整 `upstream` 中的設定，格式為`server 容器名稱:port;`。負載平衡設定方式可以參考此[說明文件](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)。

   ```bash
   worker_processes 1;
   
   events {
       worker_connections 1024;
   }
   
   http {
       sendfile on;
       tcp_nopush on;
       tcp_nodelay on;
       keepalive_timeout 65;
       types_hash_max_size 2048;
   
       include /etc/nginx/mime.types;
       default_type application/octet-stream;
   
       upstream fhir_burni {
           server burni-fhir-burni-1:8080;
           server burni-fhir-burni-2:8080;
           server burni-fhir-burni-3:8080;
           server burni-fhir-burni-4:8080;
       }
   
       server {
           listen 80;
   
           location / {
               proxy_pass http://fhir_burni;
               proxy_http_version 1.1;
               proxy_set_header Upgrade $http_upgrade;
               proxy_set_header Connection 'upgrade';
               proxy_set_header Host $host;
               proxy_cache_bypass $http_upgrade;
           }
       }
   }
   ```
5. 啟動 Docker Compose 專案，可以根據需求更改容器數量。

   ```bash
   docker compose up -d --scale fhir-burni=4
   ```
6. 成功啟動後，可以到 <http://localhost:8080> 開啟。

   > 現在請求 (Request) 會從 Nginx 輪流傳送到各個 Burni 服務 :tada:
