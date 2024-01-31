# Tezos Serverless Signer Apps

In Beta - use at own risk.

A suite of Serverless apps to sign Tezos Operations on AWS.

Install with just one click, without any software to install or CLI interaction.

| | [In-Memory Signer](in-memory-signer/) | [Consensus KMS Signer](consensus-kms-signer/) |
| - | - | - |
| Purpose | Sign any operation, for example Tezos Baker Payout Operations | Sign Consensus Messages Only |
| Security | Medium | High |
| Key import/export | Yes | No |
| Lines of code (including dependencies) | | |
| Tezos Supported Key Types | `tz1`, `tz2`, `tz3`, `tz4` | `tz2` only |

### A viable solution for Tezos Bakers

You may deploy a Tezos baker with:

* a Consensus KMS signer as consensus key
* an In-Memory Signer for payouts

This approach leverages the reliability and security of AWS for signing operations.

Meanwhile, you are free to set up the baker in another account, another region or on-prem.

Read more on the [Medium article introducing the project](https://midl-dev.medium.com/tezos-consensus-signing-with-aws-lambda-dynamodb-and-kms-d6e1da85dc62).

### Ease of deployment

These Serverless Apps are available in Amazon's Serverless Application Repository:

* [Tezos In-Memory Signer](https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-in-memory-signer)
* [Tezos Consensus KMS Signer](https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-consensus-kms-signer)

# Brought to you by MIDL.dev

<img src="midl-dev-logo.png" alt="MIDL.dev" height="100"/>

We can help you deploy and manage a complete Tezos baking operation. [Hire us](https://midl.dev/tezos).
