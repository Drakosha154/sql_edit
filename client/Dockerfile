# Этап сборки
FROM node:18 AS build

WORKDIR /app

# Копируем package.json для кэширования
COPY package*.json ./
RUN npm install

# Копируем исходный код и собираем
COPY . .
RUN npm run build

# Этап production
FROM nginx:stable-alpine

# Копируем собранное приложение
COPY --from=build /app/build /usr/share/nginx/html

# Конфигурация nginx для SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]