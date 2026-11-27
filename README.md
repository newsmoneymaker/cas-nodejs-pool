# cas-nodejs-pool

Mining pool software for **Cascoin (CAS)**, **MinotaurX side only**, written in Node.js: a stratum server for Cascoin's CPU-hardened **MinotaurX** PoW (the standard Bitcoin Stratum protocol),
share checking, block building from the node's block template, block accounting through the pool wallet, and batch payouts. This pool deliberately never mines Cascoin's other PoW type
(SHA256, meant for ASICs) and never touches its unrelated "Labyrinth Mining" ("mice") block-production path, which is a wallet/node-level feature, not a form of PoW at all. It is a fork of
[cryptonote-nodejs-pool](https://github.com/dvandal/cryptonote-nodejs-pool) by Dvandal (GNU GPL v2) and of its adaptations
[tdc-nodejs-pool](https://github.com/newsmoneymaker/tdc-nodejs-pool), [scash-nodejs-pool](https://github.com/newsmoneymaker/scash-nodejs-pool),
[veil-nodejs-pool](https://github.com/newsmoneymaker/veil-nodejs-pool) and [qwc-nodejs-pool](https://github.com/newsmoneymaker/qwc-nodejs-pool), written for the Bitcoin Core based node and
wallet RPC of Cascoin (forked from litecoincash-project/litecoincash). Live example: <https://cas.pool-pay.com>.

**Important node-side requirement:** Cascoin's `getblocktemplate` does NOT take a per-request PoW-type parameter -- the daemon must be started with `-powalgo=minotaurx` (default is `sha256d`,
the ASIC side) or this pool will be handed the wrong kind of block template entirely.

## What it does

* **Stratum server** (plain TCP and TLS ports, Bitcoin Stratum v1 in the form MinotaurX miners such as [poolpayminer](https://github.com/newsmoneymaker/poolpayminer) use): the pool asks the
  node for a block template (`getblocktemplate`), **builds the block itself** (a coinbase with the BIP34 height, the extranonce, the pool's output, the SegWit witness commitment when the
  template has one; the merkle branch; the 80 byte header) and sends every miner `mining.notify` with a share difficulty that follows the miner's hashrate (vardiff, remembered across
  reconnects). It checks every share itself with a small C++ helper (`hasher/mxhash`): the MinotaurX hash of the header, computed by poolpayminer's own real MinotaurX implementation
  (`hasher/minotaurx-src`, copied verbatim from `poolpayminer/src/crypto/minotaurx`). A share that meets the network target is submitted to the node as a whole block with `submitblock`.
* **Cascoin MinotaurX proof of work:** SHA512 of the 80 byte header, then a fixed 22-node binary hash tree ("Torture Garden", 16 candidate SPH primitives chosen once from the initial hash's
  own bytes, branching left/right by the last byte of each step's result), with the final gate always forced to a yespower pass (N=2048, r=8, pers="et in arcadia ego") -- the "X" hardening
  that makes this side ASIC/GPU-resistant. Block time 2.5 minutes. Base subsidy 50 CAS (COIN=1e7, this coin's own 10:1 redenomination -- NOT the usual 1e8), halved every 840000 blocks, of which
  the PoW side (us) always gets exactly 50% -- the other 50% funds the unrelated Labyrinth/mice side. No masternode or dev-fund cut exists.
* **Accounts** are Cascoin addresses (legacy P2PKH/P2SH or bech32 `cas1...`; base58check/bech32 verified), optionally `.worker` or `+worker`, with a reward mode prefix `prop:` (shared, default) or `solo:`.
* **Rewards:** PROP with time weighting (slush) or SOLO.
* **Block unlocker:** a block is settled after `depth` blocks (coinbase maturity is 100). The reward is what the pool wallet received in the block's coinbase transaction (`gettransaction`);
  a block that is no longer on the chain is marked orphaned and nothing is credited.
* **Payment processor:** everyone who is due is paid in **one `sendmany` transaction per round**. The balance is debited before sending; a batch whose outcome is unknown (crash, timeout) is found
  again in the wallet by its comment and never sent twice; refused or stuck batches go back to the balances. Dry-run mode, a whitelist for rehearsals and an emergency brake (`deployment/pause-payments.sh`).
* **Website and API:** a ready website (`website_example/`) with the dashboard and its graphs, blocks, payments, top miners, worker statistics, a "Getting started" page with a config generator,
  and the public read-only JSON API.
* **Protection against connection floods:** limits per IP, a login deadline, an optional IP allow list, banning of miners with many invalid shares.
* **Tests** (`test/`): address handling, the yespower helper against **real Yenten mainnet blocks** (`test-real-blocks.js`), and `test-ytn-proposal.js`, which builds a block from the template of a
  **real, synchronised node** and lets the node validate it as a block proposal (coinbase, developer output, merkle root: the node answers `null`), and refuses a block that pays one atom too much.

## Developer donation

The pool can take a **developer donation** from the reward of every block it finds, before the miners' shares are computed (`blockUnlocker.donations`, a table `Yenten address -> percent`, up to 10% per
entry; **empty by default in `config_examples/ytn.json`**). It is your pool and the license is the GPL: set what you want and tell your miners the truth about the fees of your pool. This has nothing to do
with the miner poolpayminer (a separate project with its own fee).

## Installation

See [docs/INSTALL.md](docs/INSTALL.md): the Yenten node and wallet (build from source, or the project's release binaries and bootstrap), the yespower helper, Redis, the pool services (systemd templates in
`deployment/`), the website and the first payout rehearsal.

Requirements: Linux, Node.js 18 or newer, Redis, a Yenten node (`yentend`, 4.0.3.x / 6.x) synchronised with the network, a C compiler for the helper, a web server for the website and a
TLS certificate for the TLS stratum ports.

## Miners

[poolpayminer](https://github.com/newsmoneymaker/poolpayminer) (Windows and Linux, free, has its own fee) knows it as `-a yespower-r16`.
Example: `poolpayminer -a yespower-r16 --tls -o ytn.pool-pay.com:3901 -u YYourAddress+rigname -p x -k`.

## Tests

```
npm install
node test/test-account.js                  # address handling, needs nothing else
make -C hasher                             # the yespower helper, needs only a C compiler
node test/test-real-blocks.js              # the hash of real mainnet blocks, needs only the helper
node test/test-ytn-proposal.js config.json   # needs a running synchronised yentend (config.node) and poolServer.poolAddress from its wallet
```

## Money warning

The payment processor moves real coins. Rehearse first: `"dryRun": true`, then a whitelist (`onlyAccounts`) with a few small payouts of your own, then enable it. A transaction that has been sent to the
network can not be cancelled. Keep the wallet backup (`dumpwallet` / `backupwallet`) and the RPC password private.

## License and credits

GNU GPL v2 (see LICENSE), like the original. Based on cryptonote-nodejs-pool by Dvandal and contributors. The block builder, the Bitcoin Stratum server, the yespower helper and the Yenten adaptation are
part of this project.
