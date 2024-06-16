---
slug: /register-consensus-key
sidebar_position: 3
---

# Register your Consensus Key

At the end of this guide,  your baker will be set up to bake with the consensus key. Make sure you followed the previous guide: [Deploy a Consensus Signer](deploy-consensus-signer).

We will assume your baker address is in a Ledger device.

In order to bake using the KMS, we need to register the KMS Public Key as consensus key.

This is an on-chain operation to be performed on your baker.

For more information about Consensus Keys, read:
* [A Consensus Key for Tezos Bakers](https://midl-dev.medium.com/a-consensus-key-for-tezos-bakers-16a3ac8178cf) by MIDL.dev
* [Consensus Key](https://tezos.gitlab.io/user/key-management.html#consensus-key) from Octez Documentation. 

## Import Consensus Public Key into baker

At the previous step, you retrieved the Remote Signer URL of the Consensus Key from the AWS Console.

Now, on your baker, import it (replace with the URL from your AWS account):

```
octez-client --endpoint https://rpc.tzbeta.net import secret key acme-consensus \
  https://xxxxxxxxxx.execute-api.us-east-2.amazonaws.com/prod/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/tz2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

You should see the address added with the correct public key hash.

```
Tezos address added: tz2E3CrMygbvk5wggB3J6XWZvY6HfzQyzZD5
```

Then, with the Ledger connected and the Wallet app open, issue the command:

```
octez-client --endpoint https://rpc.tzbeta.net set consensus key for acme-bakery to acme-consensus
```

Replace `acme-bakery` with your baker alias.

Confirm the operation on the Ledger screen.

Following this operation, it takes 6 cycles for the consensus key to become active. Until then, you must bake using the Ledger device as usual.

You may check that your consensus key was registered properly on the [TzKT Consensus Key Page](https://tzkt.io/update_consensus_key). This also indicates the activation cycle of your consensus key.

## Start the consensus key baker process

At the activation cycle of your consensus key, the existing baker process (set to `bake for` your baker address) will no longer get any rights.

Therefore you need to start a new baker, in parallel to your existing baker, baking for the consensus key.

```
octez-baker-<proto> run with local node ~/.tezos-node acme-consensus --liquidity-baking-toggle-vote pass
```

Replace the proto with actual protocol, `acme-consensus` with your baker alias, and add any commands you might be using on the other baker.

This is **similar to a Tezos protocol upgrade**. Therefore, you might run two baker processes in parallel: one for the baking key and one for the consensus key. The baking operations will switch seamlessly.
