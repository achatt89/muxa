FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production && npm cache clean --force
COPY . .
EXPOSE 8081
CMD ["npm","start"]
