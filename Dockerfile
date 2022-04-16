FROM keymetrics/pm2:latest-alpine

WORKDIR /
RUN mkdir -p /nodejs/fhir-burni/
RUN chown -R node:node /nodejs
WORKDIR /nodejs/fhir-burni/
# Bundle APP files
COPY --chown=node:node package*.json /nodejs/fhir-burni/
COPY --chown=node:node . /nodejs/fhir-burni/

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV production
RUN npm ci --only=production

# Show current folder structure in logs
#RUN ls -al -R
USER node
CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]