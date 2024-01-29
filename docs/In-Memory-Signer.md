# In-Memory Signer

## Prerequisites

You need an AWS Account.

## Pick a region

For best performance, locate your signer in close geographical proximity with your Tezos application.

On the top right of the AWS console, pick your region of choice.

## Create a Signer

From the AWS Console, navigate to "Serverless Application Repository" by typing "SAR" in the search bar.

In the Application Search Bar, enter `tezos-in-memory-signer`.

Click "Show apps that create custom IAM roles or resource policies".

Then, select "tezos-in-memory-signer".

In the bottom right of the next screen, under "Application settings", pick a name for your signer, for example `ACME-Bakery-Payout-Signer` Then, press "Deploy".

### Retrieve Signer URL

One the Serverless Application is launched, the URL for your signer is stored in the CloudFormation Outputs. Here is how to retrieve it:

1. Navigate to the "Deployments" tab.
1. CLick the "CloudFormation Stack" link. This takes you to the CloudFormation page.
1. Navigate to the "Outputs" tab.

The signer URL is located under the "SignerURL" output.

## Import an Existing Tezos Secret Key

If you already have an existing key that you wish to import, proceed as follows.

In the AWS Console search bar, search "AWS Secret Manager" then pick "Store a new Secret".

Under "Secret Type", pick "Other type of secret".

Under "Key/value pairs", enter "secretKey" as key and your Tezos unencrypted secret key as value.

It is a base58-encoded string. For `tz1` addresses, it starts with `edsk`.

Press `Next`, then under secret name, pick a name, for example `ACME-Bakery-Secret-Key`

Then press `Next` to go to the review screen. Scroll down and press "Store".

Then, select the secret you just created. Under the secret page, copy the Secret ARN.

Then, refer to the section "Create a signer". Under Application Settings, SecretArn setting, paste the ARN of the secret you just created.


