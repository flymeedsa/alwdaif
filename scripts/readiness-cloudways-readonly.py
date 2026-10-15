"""Read-only release evidence. Never invokes deployment or reads private configuration."""
import sys
import json
import hashlib
import datetime
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / 'cloudways'))
import deploy_release

client, sftp = deploy_release.connect()
evidence = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'access': 'SFTP read-only', 'files': []}
try:
    for name in deploy_release.HANDLERS + ['spa-index.html']:
        remote = 'public_html/' + name
        try:
            with sftp.open(remote, 'rb') as stream:
                data = stream.read()
            item = {'file': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
            local = root / 'cloudways/public_html' / name
            if local.is_file(): item['matchesWorkingTree'] = hashlib.sha256(local.read_bytes()).hexdigest() == item['sha256']
            head = subprocess.run(['git','show','HEAD:cloudways/public_html/'+name], cwd=root, capture_output=True)
            if head.returncode == 0: item['matchesLocalHEAD'] = hashlib.sha256(head.stdout).hexdigest() == item['sha256']
            evidence['files'].append(item)
        except FileNotFoundError:
            evidence['files'].append({'file':name,'missing':True})
    evidence['releaseCommit'] = 'UNVERIFIED: current deployment does not publish a commit attestation'
finally:
    sftp.close(); client.close()
(root/'docs/readiness/cloudways-files.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf8')
print(json.dumps(evidence,indent=2))
