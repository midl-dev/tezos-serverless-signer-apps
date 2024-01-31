# Tezos Serverless Signer Apps

A suite of Serverless apps to sign Tezos Operations on AWS.

| | In-Memory Signer | Consensus KMS Signer |
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

The baking setup might be in another account, another region or on-prem.

### Ease of deployment

These Serverless Apps are available in Amazon's Serverless Application Repository.

Install with just one click, without any software to install or CLI interaction.
