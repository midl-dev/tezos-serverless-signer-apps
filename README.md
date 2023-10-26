# Tezos Consensus Signer on Amazon KMS in a Lambda Function

In Beta - use at own risk.

* 🏃 Fast
* 🐣 Small
* 💸 Cheap
* 🖇️ Few dependencies
* 🧐 Easy to audit
* ⚙️ No configuration knobs

This function can be deployed on AWS Lambda with a Node 18 runtime.

It does one thing and does it well: sign Tezos consensus messages from Amazon Key Management System (KMS). The KMS key is meant to be used as consensus key only.

Security features:

* only supports requests authenticated by a Tezos address (the baker's authorized key)
* filters by magic byte: only signs consensus operations
* prevents double signing and slashing by atomically storing a high watermark on DynamoDB

Read more on the [Medium article introducing the project](https://midl-dev.medium.com/tezos-consensus-signing-with-aws-lambda-dynamodb-and-kms-d6e1da85dc62).

### How to install

* with Pulumi: [guide](docs/Pulumi.md)
* with CloudFormation: coming soon
* by hand: coming soon
