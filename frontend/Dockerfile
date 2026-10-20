FROM node:24.21.0-alpine3.24

WORKDIR /frontend

COPY ./frontend/package.json ./frontend/package-lock.json ./

RUN npm ci

COPY ./frontend/ ./

EXPOSE 3001

CMD [ "npm" , "run" , "dev" ]