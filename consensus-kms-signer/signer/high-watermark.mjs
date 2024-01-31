/*!
 * Copyright (c) 2023 MIDLDEV OU
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
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
