FROM node:16

WORKDIR /usr/ibis

RUN apt update \
    && apt install vim -y

# download ethereumjs monorepo
RUN git clone https://github.com/ethereumjs/ethereumjs-monorepo.git

# install tests
RUN cd ethereumjs-monorepo \
    && git submodule init \
    && git submodule update

# copy custom src files
COPY /src/ibis_dpt.ts /usr/ibis/ethereumjs-monorepo/packages/devp2p/src/dpt/dpt.ts
COPY /src/ibis_server.ts /usr/ibis/ethereumjs-monorepo/packages/devp2p/src/dpt/server.ts

# installnpm
RUN cd ethereumjs-monorepo \
    && npm i
    # && npm run build --workspaces
    # && npm run build --workspace=@ethereumjs/devp2p

RUN npm install crypto-js

RUN echo 'alias ibis="cd /usr/ibis/ethereumjs-monorepo;\
        npm i;\
        cd /usr/ibis/ethereumjs-monorepo/packages/devp2p/";\
        DEBUG=devp2p:* node -r ts-node/register ./examples/peer-communications.ts' >> ~/.bashrc