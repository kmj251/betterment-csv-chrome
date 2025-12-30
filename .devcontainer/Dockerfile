FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

USER root
ADD http://ppa.sherwin.com/certs/ca/keyfactorswroot /usr/local/share/ca-certificates/keyfactorswroot.crt
RUN update-ca-certificates --fresh && apt update
RUN apt update && apt install -y npm node-grunt-cli 
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt

#RUN npm install is-wsl