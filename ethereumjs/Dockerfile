FROM node:16

WORKDIR /usr/ibis

# install ethereumjs monorepo
RUN git clone https://github.com/ethereumjs/ethereumjs-monorepo.git \
    && cd ethereumjs-monorepo \
    && git submodule init \
    && git submodule update \
    && npm i \
    && npm run build --workspaces

RUN apt update \
    && apt install vim -y

COPY /files /files