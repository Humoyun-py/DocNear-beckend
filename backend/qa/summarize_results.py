"""Turn pytest JUnit properties into an observed permission matrix (no credentials)."""
import json
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path


def main():
    source = Path(sys.argv[1])
    root = Path(__file__).resolve().parents[2]
    xml = ET.parse(source).getroot()
    run_date = next(xml.iter('testsuite')).get('timestamp', '')[:10]
    tests = list(xml.iter('testcase'))
    results, groups = [], defaultdict(lambda: {'passed':0,'failed':0,'skipped':0})
    for test in tests:
        failed = test.find('failure') is not None or test.find('error') is not None
        status = 'failed' if failed else 'skipped' if test.find('skipped') is not None else 'passed'
        groups[test.get('classname')][status] += 1
        props = {p.get('name'):p.get('value') for p in test.findall('properties/property')}
        if 'endpoint' in props:
            results.append({**props,'test_result':status})
    summary = {'source':str(source.name),'date':run_date,'total':len(tests),
               'passed':sum(g['passed'] for g in groups.values()),'failed':sum(g['failed'] for g in groups.values()),
               'skipped':sum(g['skipped'] for g in groups.values()),'permission_probes':len(results),'modules':dict(groups)}
    out = root/'Docs/qa'
    (out/'test-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    (out/'permission-results.json').write_text(json.dumps(results,indent=2)+'\n')
    by_endpoint = defaultdict(list)
    for row in results:
        by_endpoint[(row['endpoint'],row['method'])].append(row)
    lines = ['# DocNear observed permission matrix', '', f'Source: pytest JUnit report, {run_date}. Each API method is exercised with anonymous access and real JWTs for patient, doctor, clinic owner, admin, and super admin.', '',
        '**Interpretation:** these are role-boundary probes. Authorized writes use empty input and detail probes use a deliberately missing record ID, so 400/404 indicate validation or object scope, not a broken endpoint. Successful business flows are tested separately. Expected denial: anonymous 401; wrong role 403. Bot endpoints require a separate secret and a linked patient, even when a JWT is supplied.', '',
        '**Super admin scope:** platform-wide access is via admin endpoints. Personal patient, doctor and owner URLs remain role-scoped; blanket impersonation is not implemented. This is a documented discrepancy with the prompt’s literal “access everything” wording.', '',
        f'{len(results)} observed probes across {len(by_endpoint)} business API operations. Swagger and OpenAPI are documentation endpoints and are tested separately.', '']
    for (path,method),rows in sorted(by_endpoint.items()):
        lines += [f'## {method} {path}', '']
        lines += [f"- {r['role']}: HTTP {r['status']}; expected {r['expected']}; {r['test_result']}." for r in rows]
        lines.append('')
    (out/'PERMISSION_MATRIX.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps({k:v for k,v in summary.items() if k!='modules'}))

if __name__=='__main__':
    main()
