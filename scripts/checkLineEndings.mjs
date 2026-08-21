import { execFileSync } from 'node:child_process';

const entries = execFileSync('git', ['ls-files', '--eol'], { encoding: 'utf8' })
	.split(/\r?\n/)
	.filter(Boolean);

const invalidEntries = entries.filter((entry) => /\sw\/(?:crlf|mixed)\s/.test(entry));

if (invalidEntries.length > 0) {
	console.error('Tracked text files with CRLF or mixed line endings:');
	invalidEntries.forEach((entry) => console.error(entry));
	process.exitCode = 1;
} else {
	console.log('All tracked text files use LF line endings.');
}
