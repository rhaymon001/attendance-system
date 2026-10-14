# Ground Rules: Secrets & Sensitive Files

## Never read, open, print, or search these unless I explicitly give permission in the current message:
- `.env`, `.env.*` (including `.env.local`, `.env.production`), except `.env.example`
- Any file containing credentials: `*.pem`, `*.key`, `*.p12`, `id_rsa*`, `credentials.json`, `serviceAccount*.json`
- Config or secret stores such as `~/.aws`, `~/.ssh`, `~/.config`, `.npmrc`, `.netrc`
- Shell history and git config files holding tokens

## How to behave
1. **No indirect access.** Don't use `cat`, `grep`, `head`, `tail`, `printenv`, `env`, `echo $VAR`, `git diff`, `git log -p`, or any other shell command to reveal the contents of these files or of environment variables.
2. **No silent workarounds.** If a task seems to need a secret, stop and ask me. Don't look for it elsewhere.
3. **Use `.env.example` instead.** Work from variable names and placeholders only. When you need a new variable, add it to `.env.example` with a dummy value and tell me to set the real one myself.
4. **Never write real secrets** into source code, logs, commit messages, tests, or documentation. Always reference them through `process.env.NAME`.
5. **Never send secrets** to any external service, URL, or tool call.
6. **Don't commit sensitive files.** Make sure `.env` is in `.gitignore`, and warn me if it isn't.
7. **If you accidentally see a secret,** don't repeat it in your output. Tell me which file it came from so I can rotate it.

## Permission
Permission to read a sensitive file applies only to the single file and task I name in that message. It does not carry over to later requests. When in doubt, ask.