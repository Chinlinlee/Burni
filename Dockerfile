FROM node:18-bookworm-slim

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
