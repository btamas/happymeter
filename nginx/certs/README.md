# SSL Certificates

This directory contains self-signed SSL certificates for local development.

## Generate Certificates

Run this command from the project root:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/server.key \
  -out nginx/certs/server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

Or from this directory:

```bash
cd nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Files (gitignored)

- `server.crt` - SSL certificate
- `server.key` - Private key

**Note:** These files are excluded from git for security. Each developer must generate their own certificates locally.
