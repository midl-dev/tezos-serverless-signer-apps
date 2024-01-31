# Tezos Serverless Signer Apps

In Beta - use at own risk.

A suite of Serverless apps to sign Tezos Operations on AWS.

Install from the AWS Web console with just a few clicks. No instances, no command-line interface.

## Useful Links

* [How to switch your Tezos Baker to a Cloud KMS Setup](https://midl-dev.github.io/tezos-serverless-signer-apps/).


## List of Apps

| | [In-Memory Signer](in-memory-signer/) | [Consensus KMS Signer](consensus-kms-signer/) |
| - | - | - |
| Purpose | Sign any operation, for example Tezos Baker Payout Operations | Sign Consensus Messages Only |
| Security | Medium 🟠 | High 🟢 |
| Key import/export | Yes | No |
| Lines of code (including dependencies) | 402,070 🟠 | 18,685 🟢 |
| Tezos Supported Key Types | `tz1`, `tz2`, `tz3`, `tz4` | `tz2` only |

<!-- Line of code calculation:
nochem@peck ~/workspace/tezos-serverless-signer-apps () $ (find in-memory-signer/taquito-signer in-memory-signer/taquito-signer/node_modules -type f \( -name "*.js" -o -name "*.mjs" \) | xargs cat) | wc -l
402070
nochem@peck ~/workspace/tezos-serverless-signer-apps () $ (find consensus-kms-signer/signer -type f \( -name "*.js" -o -name "*.mjs" \) -exec cat {} +; find consensus-kms-signer/signer/node_modules/@noble/curves -type f \( -name "secp256k1.js" -o -name "secp256k1.js.map" \) -exec cat {} +; find consensus-kms-signer/signer/node_modules/@noble/hashes -type f \( -name "blake2b.js" -o -name "blake2b.js.map" \) -exec cat {} +) | wc -l
18685
nochem@peck ~/workspace/tezos-serverless-signer-apps () $

-->


### A viable solution for Tezos Bakers

You may deploy a Tezos baker with:

* a Consensus KMS signer as consensus key
* an In-Memory Signer for payouts

This approach leverages the reliability and security of AWS for signing operations.

Meanwhile, you are free to set up the baker in another account, another region or on-prem.

See Guide: [How to switch your Tezos Baker to a Cloud KMS Setup](https://midl-dev.github.io/tezos-serverless-signer-apps/).

Read more on the [Medium article introducing the project](https://midl-dev.medium.com/tezos-consensus-signing-with-aws-lambda-dynamodb-and-kms-d6e1da85dc62).

### Ease of deployment

These Serverless Apps are available in Amazon's Serverless Application Repository:

* [Tezos In-Memory Signer](https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-in-memory-signer)
* [Tezos Consensus KMS Signer](https://serverlessrepo.aws.amazon.com/applications/us-east-2/030073751340/tezos-consensus-kms-signer)

# Brought to you by MIDL.dev

<img src="midl-dev-logo.png" alt="MIDL.dev" height="100"/>

We can help you deploy and manage a complete Tezos baking operation. [Hire us](https://midl.dev/tezos).
