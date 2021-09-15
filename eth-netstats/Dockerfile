FROM node:16-alpine

RUN apk add --update git

RUN git clone https://github.com/cubedro/eth-netstats

WORKDIR /eth-netstats

RUN npm install
RUN npm install -g grunt-cli
RUN grunt

EXPOSE 3000

CMD ["npm", "start"]

# ~/bin/www/bin/update.sh
# It will stop the current netstats client processes, 
# automatically detect your ethereum implementation and version, 
# update it to the latest develop build, update netstats client 
# and reload the processes.