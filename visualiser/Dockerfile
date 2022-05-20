FROM node:16
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ENV PORT=8888

WORKDIR /app

COPY . .

RUN npm install

# the chord package is broken, I fix it
COPY src/styles/chord.css node_modules/react-chord-diagram/es/main.css

EXPOSE 8888

ENV CHOKIDAR_USEPOLLING="true"
CMD ["npm", "run", "start"]