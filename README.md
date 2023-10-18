## Tezos Consensus Signer on Amazon KMS in a Lambda Function

* Fast
* Small
* Cheap
* Few dependencies
* Easy to audit
* No configuration knobs

This function can be deployed on AWS Lambda with a Node 18 runtime.

It does one thing and does it well: sign Tezos consensus messages from Amazon Key Management System (KMS). The KMS key is meant to be used as consensus key only.

Security features:

* only supports requests authenticated by a Tezos address (the baker's authorized key)
* filters by magic byte: only signs consensus operations
* prevents double signing and slashing by storing a high watermark on DynamoDB with Mutex

### How to install

Guide coming soon.
