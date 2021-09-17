FROM ethereum/client-go:v1.10.1

# install required packages
RUN apk add --update git bash nodejs npm perl &&\
    apk update

# install eth-netstats api (req. for /netstats visual dashboard)
RUN cd /root &&\
    git clone https://github.com/cubedro/eth-net-intelligence-api &&\
    cd eth-net-intelligence-api &&\
    npm install &&\
    npm install pm2@latest -g &&\
    pm2 update

RUN apk add --update util-linux &&\
    whereis pm2


# add config files
COPY start.sh /root/start.sh
COPY app.json /root/eth-net-intelligence-api/app.json
RUN chmod +x /root/start.sh

ENTRYPOINT /root/start.sh
