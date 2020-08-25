FROM keymetrics/pm2:latest-alpine
WORKDIR /usr/src/app
ADD . /usr/src/app  
# Ubuntu
# RUN echo "Asia/shanghai" > /etc/timezone
# CentOS
# RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN npm config set registry https://registry.npm.taobao.org/ && \  
    npm i
# RUN npm i
EXPOSE 3000
# CMD ["pm2-runtime", "start", "--json", "process.json"]
CMD ["pm2-runtime", "start",  "process.yml"]
