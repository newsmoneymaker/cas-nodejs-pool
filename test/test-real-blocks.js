// The MinotaurX helper (hasher/mxhash, poolpayminer's own real implementation) against REAL Cascoin
// mainnet blocks (test/real-blocks.json: the 80 byte headers of blocks confirmed to carry powtype=1,
// i.e. MinotaurX, in their version field -- (version >> 16) & 0xFF == 1, see src/primitives/block.h's
// GetPoWType()). Unlike a single-PoW coin, Cascoin's own block "hash" field (what getblockheader reports,
// and what's recorded here just for identification) is PLAIN SHA256d of the header regardless of PoW type
// (CBlockHeader::GetHash() -- see src/primitives/block.cpp) -- it is NOT the PoW hash and must NOT be
// compared against the helper's output. The actual consensus check is GetPoWHash() (MinotaurX for these
// blocks) against the target derived from `bits`, which is what this test verifies.
// Needs the helper: make -C hasher.   Run: node test/test-real-blocks.js
const path = require('path');
const {execFileSync} = require('child_process');
const blocks = require('./real-blocks.json');
const HASHER = path.join(__dirname, '..', 'hasher', 'mxhash');
let failed = 0;
const check = (name, ok, extra) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failed++; };

function targetFromBits (bitsHex) {
	const bits = parseInt(bitsHex, 16);
	const exp = bits >>> 24;
	const mant = BigInt(bits & 0x7fffff);
	return mant << BigInt(8 * (exp - 3));
}

for (const b of blocks) {
	const header = Buffer.from(b.header, 'hex');
	check('header is 80 bytes', header.length === 80, 'height ' + b.height);
	const version = header.readUInt32LE(0);
	const powType = (version >>> 16) & 0xFF;
	check('block ' + b.height + ' is really powtype MinotaurX (1) in its version field', powType === 1, 'version ' + version);
	const target = targetFromBits(b.bits);
	const hash = execFileSync(HASHER, ['--hash', b.header]).toString().trim();
	const value = BigInt('0x' + Buffer.from(hash, 'hex').reverse().toString('hex'));
	check('block ' + b.height + ': MinotaurX hash is below the target', value <= target, hash.slice(0, 16));
}

console.log(failed ? ('\n' + failed + ' check(s) FAILED') : '\nAll checks passed');
process.exit(failed ? 1 : 0);
