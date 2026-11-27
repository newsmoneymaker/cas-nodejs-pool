# Changes

## 1.0.0

* First release: Cascoin (CAS, MinotaurX-only) pool derived from tdc-nodejs-pool/scash-nodejs-pool/veil-nodejs-pool/qwc-nodejs-pool. SHA256 (the ASIC side of Cascoin's dual PoW) is
  intentionally never supported here, and "Labyrinth Mining" (the coin's unrelated mice/cheese block-production mechanism) is a wallet/node-level feature this pool never touches.
* The pool builds the blocks itself from `getblocktemplate` (called against a node started with `-powalgo=minotaurx`; `lib/blockBuilder.js`): a plain coinbase (BIP34 height, extranonce,
  the pool's output, the witness commitment if present), the merkle branch and the 80 byte header; a solved block is sent with `submitblock`.
* `lib/pool.js` speaks Bitcoin Stratum v1 (prevhash with every 4 byte word reversed, version / ntime / nbits big endian, the nonce as the hex of the number, extranonce1 of
  4 bytes and extranonce2 of 4 bytes). Job ids are per miner (`<job>.<n>`) and carry the difficulty of that miner: the miner applies a new difficulty with its next job.
* `hasher/mxhash` is a small C++ program that calls poolpayminer's own real MinotaurX implementation directly (`hasher/minotaurx-src`, copied verbatim from
  `poolpayminer/src/crypto/minotaurx` + the ghostrider sph_* primitives and yespower core it links against): `make -C hasher`, links against OpenSSL (SHA512) only.
* Payments and unlocker as in Bitcoin based pools (`sendmany`, `gettransaction`, coinbase maturity 100), legacy base58 (`M...`/P2SH) or bech32 (`cas1...`) addresses.
* Reward formula (`lib/reward.js`): `GetBlockSubsidy(height) >> 1` -- Cascoin's own 50/50 split between the PoW side (us) and the Labyrinth/mice side, NOT a masternode/dev-fund cut. COIN
  is 1e7 (this coin's own 10:1 redenomination), not the usual 1e8 -- see the memory's critical-wrong-coin-unit-scale note.
* The variable difficulty of a worker is remembered across reconnects (`poolServer.diffMemoryMinutes`, default 15).
* Not yet checked on a block found on mainnet: the real payout end-to-end (`payments.dryRun: true` until then).
