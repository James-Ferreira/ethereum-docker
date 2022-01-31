FROM node:16
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ENV PORT=8888

COPY /app ./

RUN npm install
RUN npm install cytoscape
RUN npm install react-cytoscapejs 

EXPOSE 8888/tcp

ENV CHOKIDAR_USEPOLLING="true"
CMD ["npm", "run", "start"]