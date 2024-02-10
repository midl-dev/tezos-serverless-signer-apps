# Tezos In-Memory Signer

In Beta - use at own risk.

* 🏃 Fast
* 💸 Cheap
* ⚙️ No configuration knobs

This Application leverages [Tezos Taquito](https://tezostaquito.io) to implement a simple in-memory signer for Tezos keys.

The private key is stored in Amazon Secret Manager and can be imported and exported.

It is pretty rudimentary and does not offer any filtering. However, for consensus operations, we offer another Serverless Application, [Tezos-consensus-kms-signer](https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/create/app?applicationId=arn:aws:serverlessrepo:us-east-2:030073751340:applications/tezos-consensus-kms-signer).

### How to install

Deploy from the [AWS Serverless Application Repository](https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-in-memory-signer).

# Brought to you by [MIDL.dev](https://midl.dev)

We can help you deploy and manage a complete Tezos baking operation. [Hire us](https://midl.dev/tezos).
