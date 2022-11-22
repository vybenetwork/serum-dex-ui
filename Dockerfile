# build environment
FROM node:16-alpine as react-build
RUN apk add --no-cache git openssh

WORKDIR /app
COPY . ./

ARG REACT_APP_MIXPANEL_PROJECT_TOKEN
ENV REACT_APP_MIXPANEL_PROJECT_TOKEN=${REACT_APP_MIXPANEL_PROJECT_TOKEN}

RUN yarn
# unset this var after downloading the lib so the default one gets used in GKE

RUN yarn build

# server environment
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/configfile.template
ENV PORT 8080
ENV HOST 0.0.0.0
RUN sh -c "envsubst '\$PORT'  < /etc/nginx/conf.d/configfile.template > /etc/nginx/conf.d/default.conf"
COPY --from=react-build /app/build /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]