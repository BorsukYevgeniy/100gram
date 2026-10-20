FROM node:24.21.0-alpine3.24

WORKDIR /backend

COPY ./backend/package.json ./backend/package-lock.json ./

RUN npm ci

COPY ./backend/ ./

EXPOSE 3000

CMD [ "npm" , "run" , "docker:start:dev" ]