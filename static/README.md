## How to use

Step 1. Clone repository
```
git clone https://github.com/tornadocash/ui-minified.git
cd ui-minified
```
Step 2. Serve the folder with your favorite http server
```
python3 -m http.server 8080
```
Or use any other http web server, such as https://www.npmjs.com/package/http-server

Step 3. Open your web browser at http://localhost:8080

## Running a TOR service

If you wish to serve tornado cash UI on an .onion domain, there is an easy way to do it using docker-compose. Paste the following into `docker-compose.yml` and run `docker-compose up -d`

```yaml
version: '2'

services:
  tornado_ui:
    image: tornadocash/ui
    restart: always
    container_name: tornado_ui
  watchtower:
    image: v2tec/watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 60 tornado_ui
  tor:
    image: strm/tor
    restart: always
    depends_on: [ tornado_ui ]
    environment:
      LISTEN_PORT: 80
      REDIRECT: tornado_ui:80
      # Generate a new key with
      # docker run --rm --entrypoint shallot strm/tor-hiddenservice-nginx ^torn
      PRIVATE_KEY: |
        -----BEGIN RSA PRIVATE KEY-----
        ...
        -----END RSA PRIVATE KEY-----
```
