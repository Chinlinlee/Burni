FROM keymetrics/pm2:latest-alpine


WORKDIR /
RUN mkdir -p /nodejs/fhir-burni/
WORKDIR /nodejs/fhir-burni/
# Bundle APP files
COPY package*.json /nodejs/fhir-burni/
COPY . /nodejs/fhir-burni/

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
RUN npm rebuild

# Show current folder structure in logs
#RUN ls -al -R

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]