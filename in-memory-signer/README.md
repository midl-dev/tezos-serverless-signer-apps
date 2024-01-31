# Tezos In-Memory Signer

In Beta - use at own risk.

* 🏃 Fast
* 💸 Cheap
* 🖇️ Few dependencies
* ⚙️ No configuration knobs

This Application leverages [Tezos Taquito](https://tezostaquito.io) to implement a simple in-memory signer for Tezos keys.

The private key is stored in Amazon Secret Manager and can be imported and exported.

It is pretty rudimentary and does not offer any filtering. However, for consensus operations, we offer another Serverless Application, Tezos-consensus-kms-signer.

### How to install

Deploy from [AWS Serverless Application Repository](https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-in-memory-signer).

# Brought to you by MIDL.dev

<img src="midl-dev-logo.png" alt="MIDL.dev" height="100"/>

We can help you deploy and manage a complete Tezos baking operation. [Hire us](https://midl.dev/tezos).
