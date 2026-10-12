import os
import subprocess
import time
from pathlib import Path

IDLE_SECONDS = 15 * 60
STATE = Path('/home/ubuntu/messenger-idle/last-activity')
dry_run = os.environ.get('DRY_RUN', '1') != '0'

now = time.time()
uptime = float(Path('/proc/uptime').read_text().split()[0])
boot_time = now - uptime

try:
    last_activity = float(STATE.read_text())
    if not (0 < last_activity <= now):
        raise ValueError('Invalid activity timestamp')
except (OSError, ValueError):
    print('Activity timestamp unavailable; shutdown skipped.', flush=True)
    raise SystemExit(0)

idle = now - max(last_activity, boot_time)
if idle < IDLE_SECONDS:
    print(f'Active: {int(idle)} seconds idle; no shutdown.', flush=True)
elif dry_run:
    print(f'DRY RUN: {int(idle)} seconds idle; would stop the server.', flush=True)
else:
    print(f'Idle for {int(idle)} seconds; stopping the server.', flush=True)
    subprocess.run(['/usr/bin/systemctl', 'poweroff'], check=True)
