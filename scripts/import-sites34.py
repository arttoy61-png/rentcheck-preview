"""Import the exact approved archive once, preserving all application/data bytes."""
from pathlib import Path, PurePosixPath
import hashlib, io, json, stat, sys, urllib.request, zipfile

ARCHIVE_URL = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3IDBI0waiBn60lYtWWKmKzM268s/1eced8fd-5f06-4be5-9c5b-3954474a9226.zip'
ARCHIVE_SHA256 = '3439f56dbe7cb54c7a893c09bfd20a4e10218a7d743bedc93eff675cbc57f06a'
root = Path.cwd()
if (root / 'app/index.html').exists():
    print('Application already imported; no source overwrite.')
    raise SystemExit(0)
if len(sys.argv) == 2:
    raw = Path(sys.argv[1]).read_bytes()
else:
    request = urllib.request.Request(ARCHIVE_URL, headers={'User-Agent': 'RentCheck-approved-source-import/1.0'})
    with urllib.request.urlopen(request, timeout=90) as response:
        raw = response.read(20_000_001)
if len(raw) > 20_000_000 or hashlib.sha256(raw).hexdigest() != ARCHIVE_SHA256:
    raise SystemExit('Archive integrity check failed; no source was imported.')
source_hashes = {}
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
    entries = [i for i in archive.infolist() if not i.is_dir()]
    if len(entries) != 933 or sum(i.file_size for i in entries) > 20_000_000:
        raise SystemExit('Unexpected archive contents.')
    for info in entries:
        name = PurePosixPath(info.filename)
        allowed = name.parts[0] == 'app' or str(name) in ('README.txt', 'START_WINDOWS.bat', '검수요약.txt')
        if name.is_absolute() or '..' in name.parts or not allowed or stat.S_ISLNK(info.external_attr >> 16):
            raise SystemExit('Unsafe archive member rejected.')
        data = archive.read(info)
        source_hashes[str(name)] = hashlib.sha256(data).hexdigest()
        target = root.joinpath(*name.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
index = root / 'app/index.html'
html = index.read_text(encoding='utf-8')
anchor = '<script src="kakao-session.js" defer></script>'
if html.count(anchor) != 1:
    raise SystemExit('Expected Sites34 SDK script anchor was not found.')
html = html.replace(anchor, '<script src="config.public.js" defer></script>' + anchor)
html = html.replace('</body>', '<script src="kakao-autoconnect.js" defer></script></body>')
index.write_text(html, encoding='utf-8')
(root / 'app/.nojekyll').write_text('', encoding='utf-8')
changed = [p for p, h in source_hashes.items() if hashlib.sha256((root/p).read_bytes()).hexdigest() != h]
if changed != ['app/index.html']:
    raise SystemExit('Unexpected source changes: ' + ', '.join(changed))
data_paths = [p for p in source_hashes if p.startswith('app/data/')]
receipt = {
    'version': 'Sites34', 'archive_sha256': ARCHIVE_SHA256,
    'original_files': len(source_hashes), 'original_files_byte_identical': len(source_hashes)-len(changed),
    'data_files_byte_identical': len(data_paths), 'modified_original_files': changed,
    'added_runtime_files': ['app/config.public.js', 'app/kakao-autoconnect.js', 'app/.nojekyll'],
    'source_hashes': source_hashes,
    'production_site_modified': False,
}
(root/'UPLOAD_RECEIPT.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Imported',len(source_hashes),'original files; unchanged data files:',len(data_paths))
print('Only original index.html changed to load automatic map configuration; key values are not logged.')
