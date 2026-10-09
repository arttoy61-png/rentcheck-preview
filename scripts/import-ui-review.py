"""Apply the user-approved, checksum-pinned UI review patch to one review branch only."""
from pathlib import Path
import hashlib
import io
import json
import os
import subprocess
import tempfile
import urllib.request
import zipfile

BASE = '494780e6b5c794105b898ad2cfa55e6033bcf9c1'
BRANCH = 'review/ui-20261009'
URL = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3IDBI0waiBn60lYtWWKmKzM268s/5b66a43f-a1a0-4f86-bfa1-fffef547bd95.zip'
ARCHIVE_HASH = 'be69950ef9fd43e490b28e89fb9e670a70695b52b88313b25a61a653b43dd783'
PATCH_HASH = '9b0a5dd8b0cdefa580ecbdcf342ee4f28aca35fc5f0a73115672546bb3ee3dd1'
ALLOWED = {'app/app.js', 'app/index.html', 'app/kakao-map-engine.js', 'app/ui-polish.css', 'app/ui-polish.js', 'docs/ui-review/README.md', 'docs/ui-review/browser-results.json', 'docs/ui-review/preservation.json'}

def git(*args):
    return subprocess.check_output(['git', *args])

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

require(os.environ.get('GITHUB_REPOSITORY') == 'arttoy61-png/rentcheck-preview', 'Wrong repository')
require(os.environ.get('GITHUB_REF') == 'refs/heads/' + BRANCH, 'Review branch only')
require(git('branch', '--show-current').decode().strip() == BRANCH, 'Wrong checkout')
subprocess.run(['git', 'fetch', 'origin', 'main'], check=True)
require(git('rev-parse', 'origin/main').decode().strip() == BASE, 'main changed; re-review before applying')
require(not git('status', '--porcelain').strip(), 'Checkout is not clean')
with urllib.request.urlopen(URL, timeout=45) as response:
    archive = response.read(16 * 1024 * 1024)
require(hashlib.sha256(archive).hexdigest() == ARCHIVE_HASH, 'Archive checksum mismatch')
with zipfile.ZipFile(io.BytesIO(archive)) as source:
    patch = source.read('changes.patch')
    manifest = json.loads(source.read('manifest.json'))
require(hashlib.sha256(patch).hexdigest() == PATCH_HASH, 'Patch checksum mismatch')
require(manifest['base'] == BASE and set(manifest['files']) == ALLOWED, 'Unexpected patch scope')
# Retry-safe: do not regenerate or overwrite already applied files.
if all(Path(p).is_file() and hashlib.sha256(Path(p).read_bytes()).hexdigest() == manifest['file_sha256'][p] for p in ALLOWED):
    print('Reviewed files already present; no changes.')
    raise SystemExit(0)
with tempfile.NamedTemporaryFile(suffix='.patch') as temporary:
    temporary.write(patch)
    temporary.flush()
    subprocess.run(['git', 'apply', '--check', temporary.name], check=True)
    subprocess.run(['git', 'apply', '--index', temporary.name], check=True)
changed = set(git('diff', '--cached', '--name-only').decode().splitlines())
require(changed == ALLOWED, 'Unexpected staged files')
for name in ALLOWED:
    require(hashlib.sha256(Path(name).read_bytes()).hexdigest() == manifest['file_sha256'][name], 'Reviewed file checksum mismatch: ' + name)
# Preserve every data file, article and connection setting exactly.
protected = [p for p in git('ls-tree', '-r', '--name-only', BASE, 'app').decode().splitlines() if p.startswith(('app/data/', 'app/articles/')) or p in {'app/config.public.js', 'app/kakao-session.js', 'app/kakao-autoconnect.js'}]
for name in protected:
    require(Path(name).read_bytes() == git('show', BASE + ':' + name), 'Protected file changed: ' + name)
print('Verified reviewed UI files:', len(ALLOWED))
print('Preserved data files:', sum(p.startswith('app/data/') for p in protected))
print('No key values, data content, or user input are logged.')
