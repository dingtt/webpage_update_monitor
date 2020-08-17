FROM keymetrics/pm2:latest-alpine
ADD . /usr/src/app  
WORKDIR /usr/src/app
RUN npm config set registry https://registry.npm.taobao.org/ && \  
    npm i
# RUN npm i
EXPOSE 3000
# CMD ["pm2-runtime", "start", "--json", "process.json"]
CMD ["pm2-runtime", "start",  "process.yml"]
