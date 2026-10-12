# On-demand portfolio demo

The portfolio launcher sends `POST {"action":"start"}` to a public Lambda Function URL, then polls with `POST {"action":"status"}` every ten seconds for up to five minutes. Only `start` can start the configured EC2 instance. Lambda updates DuckDNS to the current public IP and checks DNS and frontend HTTPS before the launcher redirects. The launcher source lives in the separate [portfolio repository](https://github.com/liakosV/portfolio).

## Lambda configuration

- Function: `messenger-demo-start`, region `eu-north-1`, Python 3.13, 128 MB, 30-second timeout, no VPC.
- Source: `lambda_function.py`; handler `lambda_function.lambda_handler`.
- Execution role: basic Lambda logging permissions plus `start-policy.json`.
- Environment: `DUCKDNS_DOMAIN=liakos-messenger` and a private `DUCKDNS_TOKEN`.
- Function URL: auth `NONE`, buffered responses; CORS origin `https://liakosv.github.io`, method `POST`, header `content-type`, credentials disabled.

The function URL is public. CORS is not authentication, rate limiting, or a spending cap. A third party can request startup or forge activity signals. The current implementation has no CAPTCHA, durable startup quota, or maximum uptime limit; idle shutdown reduces normal demo runtime but does not prevent abuse. Retained EBS storage still costs money while EC2 is stopped. Keep billing alerts enabled.

For another deployment, change the instance ID/region in the Lambda code, instance ARN in the IAM policy, DNS hostname in Caddy, frontend origin in Compose and the activity receiver, CORS origin, and launcher endpoint.

## Activity and idle shutdown

`frontend/src/demoActivity.ts` reports page entry, visible-tab return, and trusted pointer, keyboard, or scroll events at most once every 30 seconds. Background polling and Lambda readiness checks do not report activity. A visible but untouched page can become idle. Activity from any visitor resets the shared timestamp.

`docker/demo-idle/activity.py` accepts empty POST requests through Caddy at `/_demo/activity` and atomically writes the last activity time. It stores no user identity or message data. The activity container has no published port and runs with the UID/GID of the host directory owner. Defaults are 1000:1000; verify with `id -u` and `id -g`, or set `DEMO_UID`/`DEMO_GID` in the server `.env`.

Create `/home/ubuntu/messenger-idle` as the deployment user before starting the three Compose files. Initialize the timestamp for a fresh installation:

```bash
mkdir -p /home/ubuntu/messenger-idle
python3 -c 'import time; from pathlib import Path; Path("/home/ubuntu/messenger-idle/last-activity").write_text(str(time.time()))'
sudo docker compose --env-file .env -f compose.aws.yaml -f compose.https.yaml -f compose.idle.yaml up -d --build
```

The host systemd timer checks every approximately 30 seconds. After 900 seconds without activity it requests a graceful OS poweroff. At least 15 minutes are allowed after boot. Missing, invalid, or future timestamps skip shutdown, so receiver failure can leave the server running. The checker and activity receiver are not a distributed lock; activity arriving during the final shutdown decision can race with poweroff.

**Before enabling shutdown, EC2 instance-initiated shutdown behavior must be `Stop`, not `Terminate`.**

## Install systemd units

On the Ubuntu server, from the project root:

```bash
sudo install -m 644 deployment/on-demand/messenger-idle-check.py /usr/local/sbin/messenger-idle-check.py
sudo install -m 644 deployment/on-demand/systemd/messenger-idle-check.service /etc/systemd/system/
sudo install -m 644 deployment/on-demand/systemd/messenger-idle-check.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now messenger-idle-check.timer
sudo systemctl start messenger-idle-check.service
sudo journalctl -u messenger-idle-check.service -n 10 --no-pager
```

The checked-in service defaults to `DRY_RUN=1` for safe installation. The live server was explicitly switched to `DRY_RUN=0`. To enable real shutdown after testing:

```bash
sudo sed -i 's/Environment=DRY_RUN=1/Environment=DRY_RUN=0/' /etc/systemd/system/messenger-idle-check.service
sudo systemctl daemon-reload
```

If already idle for 15 minutes, the next check may stop the server immediately. SSH alone does not count as demo activity.

## Maintenance

Disable the timer before server maintenance:

```bash
sudo systemctl stop messenger-idle-check.timer
```

This stops the timer for the current boot. For maintenance spanning reboots, use `sudo systemctl disable --now messenger-idle-check.timer`, then restore it with `sudo systemctl enable --now messenger-idle-check.timer` when finished.

Watch idle checks:

```bash
sudo journalctl -u messenger-idle-check.service -f -n 10
```

Use all three Compose files for updates and diagnostics. Never add `-v` to `compose down` on the deployed stack. Keep `.env`, RSA keys, SQL backups and DuckDNS credentials outside Git.

## Validation performed

Manual tests confirmed public HTTPS, login and live messages, activity timestamp updates, unchanged timestamps with no visitors, EC2 automatic Stop after inactivity, and subsequent startup and login through the portfolio launcher. SQL backup restoration was independently verified in an isolated MySQL container. These checks do not establish automated backups, abuse protection, or high availability.

These sources preserve the setup installed during the guided deployment. SSH retrieval at finalization timed out, so they were reconstructed from the tested commands rather than compared byte-for-byte with the live server. The Compose UID/GID defaults are parameterized and the checked-in systemd service deliberately starts in dry-run mode.
