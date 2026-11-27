/**
 * Block reward of Cascoin mainnet (src/validation.cpp GetBlockSubsidy + src/miner.cpp CreateNewBlock,
 * read directly from github.com/Casraw/Cascoin -- see cascoin-project memory for the full derivation).
 *
 * GetBlockSubsidy(): a plain Bitcoin-style halving, 50 COIN base, halving every
 * nSubsidyHalvingInterval=840000 blocks (nSubsidy >>= halvings) -- NOT TDC's doubling-interval/quartering
 * scheme, this coin is the ordinary Bitcoin halving shape. Historical one-off special cases (genesis block,
 * a premine issued once at the old scrypt->dual-PoW fork height, a slow-start ramp for the first N blocks
 * after that same fork) are all in the past relative to the real current chain height and irrelevant here.
 *
 * CreateNewBlock() (the non-Labyrinth branch -- the only one our pool ever uses, we never mine Labyrinth):
 * coinbaseTx.vout[0].nValue = GetBlockSubsidy(height) >> 1 (once MinotaurX is enabled, which it always is
 * post-fork) -- an unconditional 50/50 split between the PoW side (us) and the Labyrinth/"mice" side (not
 * us), NOT a masternode/dev-fund cut. getblocktemplate's own `coinbasevalue` already reports this exact
 * final net number -- this constant is only a fallback for when no block has unlocked yet, see api.js's
 * getLastBlockData() and the mandatory recheck rule in the new-coin-launch-checklist memory.
 *
 * COIN is NOT the usual 1e8: Cascoin's own src/amount.h defines `COIN = 100000000 / COIN_SCALE` with
 * COIN_SCALE=10 (a historical "10:1 coinswap" redenomination) -- 1 CAS = 10,000,000 atomic units. Getting
 * this wrong silently inflates every displayed amount 10x, see critical-wrong-coin-unit-scale memory.
 **/
const CAS_UNIT = 10000000; // 1e8 / 10 (Cascoin's own COIN_SCALE=10 redenomination)
const BASE_SUBSIDY = 50 * CAS_UNIT;
const HALVING_INTERVAL = 840000;

exports.minerReward = function (height) {
	if (!(height >= 0)) return 0;
	let halvings = Math.floor(height / HALVING_INTERVAL);
	if (halvings >= 64) return 0;
	let subsidy = Math.floor(BASE_SUBSIDY / Math.pow(2, halvings));
	// PoW side is 50% of the base subsidy (the other 50% is the Labyrinth/mice side, which this pool never produces).
	return Math.floor(subsidy / 2);
};
