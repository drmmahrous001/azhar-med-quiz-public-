# Security Policy

## Reporting a vulnerability

Please do not disclose security vulnerabilities in public issues. Contact the repository owner privately through GitHub.

## Secret handling

- Never commit API keys, passwords, access tokens, database service-role keys, or private student data.
- Keep secrets in deployment environment settings.
- Rotate any credential that may have been exposed.
- Public API routes must enforce input validation, request-size limits, and abuse protection.
- Administrative endpoints must verify authorization on the server; hiding controls in the browser is not authentication.

## Release scope

Only redistribute source code and assets for which publication rights are confirmed. Do not add private exam banks, copyrighted course materials, extracted book content, or student records.
