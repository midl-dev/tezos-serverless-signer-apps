---
slug: /
sidebar_position: 1
---

# Tezos Signer Apps

Brought to you by [MIDL.dev](https://midl.dev), a Tezos infrastructure company.

This guide assumes you have already set up a Tezos Baker. See [instructions on Tezos.com](https://docs.tezos.com/architecture/baking).

In order to switch your baking setup to KMS signing, please follow the below guides in order:

* How to [deploy a Tezos Remote Signer for a Consensus Key on AWS](deploy-consensus-signer)
* How to [set the consensus key of your baker](register-consensus-key)

It is possible to set a public baker that pays delegation rewards. Rewards can not be paid from the consensus signer. Instead, you must set up an in-memory signer by following this guide:

* How to [deploy an in-memory signer](deploy-in-memory-signer)
