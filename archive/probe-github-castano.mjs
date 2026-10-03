// Ask the GitHub API for castano's repos and print just name + description.
import https from 'node:https';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'node', Accept: 'application/vnd.github+json' } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
  });
}

for (let page = 1; page <= 3; page++) {
  const r = await get(`https://api.github.com/users/castano/repos?per_page=100&page=${page}&sort=created`);
  if (r.status !== 200) {
    console.log('status', r.status);
    break;
  }
  const arr = JSON.parse(r.body);
  if (!arr.length) break;
  for (const x of arr) {
    console.log(
      `${(x.created_at || '').slice(0, 10)}  ${x.name.padEnd(26)} ${x.fork ? '[fork]' : '      '} ★${String(x.stargazers_count).padStart(5)}  ${x.language || ''}  ${x.description || ''}`,
    );
  }
  if (arr.length < 100) break;
}
