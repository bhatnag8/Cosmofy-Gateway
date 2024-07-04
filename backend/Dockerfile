FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9221
CMD ["npx", "ts-node", "src/index.ts"]
