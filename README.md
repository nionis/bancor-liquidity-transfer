# Bancor Liquidity Transfer

Open sourced DAPP that allows liquidity providers to transfer their liquidity from an
existing Bancor liquidity pool (using BNT) to a Bancor liquidity pool
that utilizes USDB.

The idea for the DAPP is that a user will enter his token address, and then there will be
a step by step process on how to transfer the liquidity throught transactions.
Temporary contracts which are not registered to converter registry are saved in localstorage.

## Setup

1. `npm install`
2. update `src/env.js` when testings locally
3. `npm run dev`

## Improvements

Here are some improvements I will be implementing:

* fix any bugs that appear on mainnet but not on localhost
* provide more context to each step, include stuff like user balance, etc
* polish UI