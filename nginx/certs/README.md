# SSL Certificates

This directory contains self-signed SSL certificates for local development.

## Generate Certificates

Run this command from the project root:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/localhost.key \
  -out nginx/certs/localhost.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Files (gitignored)

- `localhost.crt` - SSL certificate
- `localhost.key` - Private key

**Note:** These files are excluded from git for security. Each developer must generate their own certificates locally.
