---
slug: /deploy-in-memory-signer
sidebar_position: 3
---

# Deploy an In-Memory Signer

At the end of this guide, you will get the secret **Remote Signer URL** for an in-memory signer lambda based on Taquito, useful for paying delegation rewards of a Tezos Baker.

Unlike the Consensus Signer, the in-memory signer keeps a key in memory and stores it in Amazon Secrets Manager for long-term storage.

Therefore, it is possible to extract the key. Using is as baking key is possible but strongly discouraged.

This signer supports any Tezos key prefix (tz1, tz2, tz3 or tz4).

**Warning**: access to this signer URL allows signing any operation, including transfer.

## Prerequisites

You need:

* an AWS account
* pick a region close to the rest of your infrastructure - if you are deploying the consensus signer, deploy this signer in the same region

## Optional: import a private key

If you already have a payout account set up, you may import it into Amazon Secrets Manager:

* go to [AWS Secrets Manager]
* on the top right, select the proper region
* select "Store a new secret"
* as "Secret Type", pick "Other type of secret"
* under "Key/Value pairs", enter `secretKey` in the left text field (key)
* in the right text field, enter your secret key. If tz1, it should start with `edsk...`. Omit `unencrypted:`.
* leave "Encrpytion Key" unchanged as `AWS/secretsmanager`
* in the next screen, under "Secret Name", enter "Acme-Bakery-Payout-Key" (replace with your bakery name)
* leave the default selected in the next 2 screens
* finally, when your secret is created, select it and copy the secret ARN.

The ARN should look as: `arn:aws:secretsmanager:us-east-2:01234678901:secret:Acme-Bakery-Payout-Key-GWko9y`

## Install the tezos-in-memory-signer app

From the [AWS Lambda Console](https://us-east-2.console.aws.amazon.com/lambda/home?region=us-east-2#/applications), on the left sidebar, select "Applications", then click "Create application". Then, choose "Serverless Application".

In the search bar, enter "tezos" and select "Show apps that create custom IAM roles or resource policies". Then, pick "tezos-in-memory-signer"

* under "Application name", enter "ACME-Bakery-Payout-Signer" (replace with your bakery name).
* under "SecretArn", enter the ARN of the private key secret created above.

Then, select "I acknowledge" and click "Deploy".

## Retrieve the Signer URL

Wait one to 2 minutes and observe your resources being created.

Then, select the "Deployments" tab and click the "CloudFormation stack" link.

Then, select the "Outputs" tab.

Retrieve the **SignerURL** value: this is the URL of your Remote Signer.

You may test your signer URL with `curl` by removing the public key hash from the URL and replacing it with `authorized_keys`:

```
$ curl https://l1498fpieb.execute-api.us-east-2.amazonaws.com/prod/c28e79b248a8db9d0a4f7a33af2c5a3e/authorized_keys
```

You should see the empty set in response:
```
{}
```

You may now pass this remote signer URL to your payout engine (TRD, TezPay).

Keep it safe - anyone with the key can spend the rewards.
