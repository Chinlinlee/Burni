FROM eclipse-temurin:17-jdk-jammy

# replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ENV NODE_VERSION 18.17.0

# Installing Node
SHELL ["/bin/bash", "--login", "-i", "-c"]
RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN source /root/.bashrc && nvm install $NODE_VERSION
RUN n=$(which node);n=${n%/bin/node}; chmod -R 755 $n/bin/*; cp -r $n/{bin,lib,share} /usr/local
SHELL ["/bin/bash", "--login", "-c"]

WORKDIR /
RUN mkdir -p /nodejs/fhir-burni/
WORKDIR /nodejs/fhir-burni/
# Bundle APP files
COPY package*.json /nodejs/fhir-burni/
COPY . /nodejs/fhir-burni/

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV production
RUN npm i -g pm2
RUN npm ci --only=production
RUN node config/generate-config-allResources.js
RUN npm run build

# Show current folder structure in logs
CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--node-args=\"--max-old-space-size=4096\""]