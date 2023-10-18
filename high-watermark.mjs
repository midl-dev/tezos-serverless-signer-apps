import { DynamoDB } from "@aws-sdk/client-dynamodb";

export default class TezosHighWatermark {
  constructor(dynamoTableName, region, publicKeyHash) {
    this.dynamodb = new DynamoDB({ region: region });
    this.tableName = dynamoTableName;
    this.publicKeyHash = publicKeyHash;
  }

  async read(opType) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          publicKeyHash: { S: this.publicKeyHash },
          opType: { S: opType }
        }
      };

      const result = await this.dynamodb.getItem(params);
      if (!result.Item) {
        // Returning zero as high watermark is not initialized yet
        return { blockLevel: 0, blockRound: 0 };
      }

      return {
        blockLevel: parseInt(result.Item.blockLevel.N, 10),
        blockRound: parseInt(result.Item.blockRound.N, 10)
      };
    } catch (error) {
      console.error("Error reading high watermark:", error);
      throw error;
    }
  }

  async write(opType, blockLevel, blockRound, currentBlockLevel, currentBlockRound) {
    try {
      const params = {
        TableName: this.tableName,
        Item: {
          publicKeyHash: { S: this.publicKeyHash },
          opType: { S: opType },
          blockLevel: { N: blockLevel.toString() },
          blockRound: { N: blockRound.toString() }
        },
        ConditionExpression: "attribute_not_exists(opType) OR (blockLevel = :currentBlockLevel AND blockRound = :currentBlockRound)",
        ExpressionAttributeValues: {
          ":currentBlockLevel": { N: currentBlockLevel.toString() },
          ":currentBlockRound": { N: currentBlockRound.toString() }
        }
      };

      await this.dynamodb.putItem(params);
    } catch (error) {
      if (error.name === "ConditionalCheckFailedException") {
        const error = new Error('High Watermark Mutual Exclusion Violation');
        error.code = 400;
        throw error;
      }

      console.error("Error updating high watermark:", error);
      throw error;
    }
  }
}
