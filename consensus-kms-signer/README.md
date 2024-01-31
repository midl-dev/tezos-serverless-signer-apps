# Tezos Consensus Signer on Amazon KMS in a Lambda Function

In Beta - use at own risk.

* 🏃 Fast
* 🐣 Small
* 💸 Cheap
* 🖇️ Few dependencies
* 🧐 Easy to audit
* ⚙️ No configuration knobs

This application does one thing and does it well: sign Tezos consensus messages from Amazon Key Management System (KMS). The KMS key is meant to be used as consensus key only.

Security features:

* only supports requests authenticated by a Tezos address (the baker's authorized key)
* filters by magic byte: only signs consensus operations
* prevents double signing and slashing by atomically storing a high watermark on DynamoDB

Read more on the [Medium article introducing the project](https://midl-dev.medium.com/tezos-consensus-signing-with-aws-lambda-dynamodb-and-kms-d6e1da85dc62).

### How to install

Deploy from [AWS Serverless Application Repository](https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-consensus-kms-signer).

# Brought to you by MIDL.dev

We can help you deploy and manage a complete Tezos baking operation. [Hire us](https://midl.dev/tezos).
