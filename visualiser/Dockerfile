FROM node:16
WORKDIR /app
# ENV PATH /app/node_modules/.bin:$PATH
ENV PORT=8888

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8888

ENV CHOKIDAR_USEPOLLING="true"
CMD ["npm", "run", "start"]