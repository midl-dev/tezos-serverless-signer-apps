# Deploy Tezos Consensus Signer Lambda with Pulumi

You need an AWS account with credentials configured.

Deploy this file in a new directory:

```
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface ConsensusSignerArgs {
  secretUrlPath: pulumi.Input<string>;
  bakerAuthorizedKey: pulumi.Input<string>;
}

export class ConsensusSigner extends pulumi.ComponentResource<ConsensusSignerArgs> {
  public readonly url: pulumi.Output<string>;

  constructor(name: string, args: ConsensusSignerArgs, opts?: pulumi.ComponentResourceOptions) {
    super("my:module:ConsensusSigner", name, {}, opts);

    // Create an AWS KMS Key
    const kmsKey = new aws.kms.Key(`tezos-consensus-key-${name}`,
      {
        customerMasterKeySpec: "ECC_SECG_P256K1",
        deletionWindowInDays: 7,
        isEnabled: true,
        keyUsage: "SIGN_VERIFY",
        multiRegion: false,
      }, { parent: this });

    // Create a DynamoDB table
    const dynamoTable = new aws.dynamodb.Table(`high-watermark-${name}`, {
      attributes: [
        { name: "publicKeyHash", type: "S" },
        { name: "opType", type: "S" },
      ],
      hashKey: "publicKeyHash",
      rangeKey: "opType",
      readCapacity: 1,
      writeCapacity: 1,
    }, { parent: this });

    // Create IAM Role for Lambda
    const lambdaRole = new aws.iam.Role(`${name}-lambdaRole`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com"
          }
        }]
      })
    }, { parent: this });

    // Attach AWSLambdaBasicExecutionRole policy for CloudWatch logs
    new aws.iam.RolePolicyAttachment(`${name}-lambdaCloudWatchPolicy`, {
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      role: lambdaRole,
    }, { parent: this });

    // Attach Policies
    new aws.iam.RolePolicy(`${name}-dynamoPolicy`, {
      role: lambdaRole.id,
      policy: dynamoTable.arn.apply(arn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
          ],
          Resource: arn,
        }]
      })),
    }, { parent: this });

    new aws.iam.RolePolicy(`${name}-kmsPolicy`, {
      role: lambdaRole.id,
      policy: kmsKey.arn.apply(arn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "kms:GetParametersForImport",
            "kms:DescribeCustomKeyStores",
            "kms:GetPublicKey",
            "kms:GetKeyRotationStatus",
            "kms:GetKeyPolicy",
            "kms:DescribeKey",
            "kms:Sign"
          ],
          Resource: arn,
        }]
      })),
    }, { parent: this });


    // Create Lambda Function
    const lambda = new aws.lambda.Function(`${name}-lambda`, {
      runtime: "nodejs18.x",
      role: lambdaRole.arn,
      handler: "index.handler",
      code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./app/tezos-kms-consensus-lambda-v0.1.0.zip"),
      }),
      environment: {
        variables: {
          BAKER_AUTHORIZED_KEY: args.bakerAuthorizedKey,
          DYNAMODB_TABLE_NAME: dynamoTable.name,
          KMS_KEY_ID: kmsKey.arn,
          SECRET_URL_PATH: args.secretUrlPath,
        }
      },
    }, { parent: this });

    // Create a Lambda Function URL
    const lambdaUrl = new aws.lambda.FunctionUrl(`${name}-lambdaUrl`, {
      functionName: lambda.name,
      authorizationType: "NONE",
    }, { parent: this });

    // Export the Function URL
    this.url = lambdaUrl.functionUrl;

    this.registerOutputs({
      url: this.url
    });
  }
}
```

Download the lambda zip file from the releases and put it in the `app` directory:

```
mkdir app
curl https://github.com/midl-dev/tezos-kms-consensus-lambda/releases/download/v0.1.0/tezos-kms-consensus-lambda-v0.1.0.zip app/
```

On your baker, create an authorized key:

```
octez-client gen keys signer-authorized-key --sig secp256k1
# Show the public key
octez-client show address signer-authorized-key
```

Generate a random string. This is the secrjet path for your Lambda signer.

With the public key (starting with `sppk`) and the random string, instantiate a Consensus Signer resource:

```
const consensusSigner = new ConsensusSigner("privatenet", {
  secretUrlPath: "...",
  bakerAuthorizedKey: "sppk..."
});

// Exporting the Lambda URL
export const url = consensusSigner.url;
```

Run:

```
pulumi new --force
npm intall @pulumi/aws
pulumi up
```

Your setup will deploy, and the URL for the signer will be displayed as a Pulumi output.

Test it with curl:

```
curl <url from output>/authorized_keys
```

Go to the Lambda console and look at logs. The public key hash of your consensus key will show. You may configure your baker to use this key.
