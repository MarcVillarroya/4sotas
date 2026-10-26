"""Run final QA, retaining exact command results without changing editorial state."""
from pathlib import Path
from hashlib import sha256
import subprocess
import json
from typing import Any

commands = [
    'npm run check',
    'npm test',
    'npm run build',
    'npm run build:fixtures',
    'npm run verificar:plantillas',
    'node scripts/validate-content.mjs --root . --dist dist --inventory data/inventory-snapshot.json --site https://marcvillarroya.github.io --base /4sotas --json qa/visual/content-validation.json',
    'node scripts/visual-qa.mjs after',
    'node scripts/visual-states.mjs',
    'node scripts/visual-sweep.mjs',
    '/usr/bin/python3 scripts/visual-contact.py',
    'git diff --check',
]
report: dict[str, Any] = {'commands': []}
output = Path('qa/visual/verification.json')
for command in commands:
    run = subprocess.run(command, shell=True, text=True, capture_output=True)
    report['commands'].append({'command': command, 'exit_code': run.returncode, 'stdout': run.stdout, 'stderr': run.stderr})
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f'{run.returncode}: {command}', flush=True)
    if run.returncode:
        print(run.stdout + run.stderr)
        raise SystemExit(run.returncode)

summary = {}
for phase in ['before', 'after']:
    manifest = json.loads(Path(f'qa/visual/{phase}/manifest.json').read_text())
    entries = manifest['entries']
    png = [e for e in entries if e['file']]
    assert len(entries) == 24 and len(png) == 18
    assert len({(e['name'], e['width']) for e in entries}) == 24
    for entry in png:
        assert sha256(Path(entry['file']).read_bytes()).hexdigest() == entry['sha256']
    summary[phase] = {
        'views': len(entries), 'png': len(png),
        'overflow': sum(e['document'] > e['width'] for e in entries),
        'duplicate_h1': sum(e['h1'] != 1 for e in entries),
        'axe_violations': sum(len(e['violations']) for e in entries),
    }
summary['route_sweep'] = json.loads(Path('qa/visual/route-sweep.json').read_text())
summary['ui'] = json.loads(Path('qa/visual/states/results.json').read_text())
report['summary'] = summary
report['source_sha256'] = {str(p): sha256(p.read_bytes()).hexdigest() for p in sorted(Path('src').rglob('*')) if p.is_file()}
report['editorial_diff'] = subprocess.check_output(['git', 'diff', '--name-only', '--', 'src/content'], text=True).strip()
assert not report['editorial_diff']
output.write_text(json.dumps(report, indent=2, ensure_ascii=False))
print('Final QA verified; 36 capture hashes, no editorial changes.', flush=True)
