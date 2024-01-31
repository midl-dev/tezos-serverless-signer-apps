This package is released manually.

To make a new release:

* update version in all node packages inside the lambdas
* update all versions in template.yaml
* for each serverless app, run:

```
sam package --output-template-file packaged.yaml --s3-bucket tezos-serverless-signer-apps
sam publish --template-file packaged.yaml  --region us-east-2
```
