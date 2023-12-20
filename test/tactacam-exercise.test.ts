import * as cdk from '@aws-cdk/core';
import { Template } from 'aws-cdk-lib/assertions';
import { TactacamExerciseStack }from '../lib/tactacam-exercise-stack';

describe('TactacamExerciseStack', () => {
  const app = new cdk.App();

  const stack = new TactacamExerciseStack(app, 'MyTestStack');

  const template = Template.fromStack(stack as any);

  

  it('creates an S3 bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
          Status: 'Enabled',
      }
    });
  });

  it('creates a DynamoDB table', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
      })
  });

  it('creates a Lambda function', () => {
 template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs16.x',
      })
  });

  it('grants read access to the S3 bucket and write access to the DynamoDB for the Lambda function', () => {
   template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
						{
							Action: ["s3:GetObject*", "s3:GetBucket*", "s3:List*"],
							Effect: "Allow",
						},
						{
							Action: [
								"dynamodb:BatchWriteItem",
								"dynamodb:PutItem",
								"dynamodb:UpdateItem",
								"dynamodb:DeleteItem",
								"dynamodb:DescribeTable"
							],
							Effect: "Allow",
						}
					],
        },
      })
  });
});