import { handler } from '../index';
import * as AWSMock from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';

AWSMock.setSDKInstance(AWS);

describe('Lambda handler', () => {
  beforeEach(() => {
    process.env.TABLE_NAME = 'test-table';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    AWSMock.restore('S3');
    AWSMock.restore('DynamoDB.DocumentClient');
  });

  it('should correctly get object from S3 and put items into DynamoDB', async () => {
    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'test-key',
            },
          },
        },
      ],
    };

    const mockS3Response = {
      Body: JSON.stringify([{ id: 1, name: 'Test' }]),
    };

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('S3', 'getObject', (params, callback) => {
      callback(null as any, mockS3Response);
    });

    const dynamoPutSpy = jest.fn().mockReturnValue({
      promise: () => Promise.resolve(),
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'put', dynamoPutSpy);

    const result = await handler(mockEvent);

    expect(dynamoPutSpy).toHaveBeenCalledWith(
      {
        TableName: 'test-table',
        Item: { id: 1, name: 'Test' },
      },
      expect.any(Function),
    );

    expect(result).toEqual({ message: 'ok' });
  });

  it('should throw an error when S3 getObject fails', async () => {
    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'test-key',
            },
          },
        },
      ],
    };

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('S3', 'getObject', (params, callback) => {
      callback(new Error('S3 error') as any, null as any);
    });

    await expect(handler(mockEvent)).rejects.toThrow('S3 error');
  });

  it('should throw an error when DynamoDB put fails', async () => {
    const mockEvent = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'test-bucket',
            },
            object: {
              key: 'test-key',
            },
          },
        },
      ],
    };

    const mockS3Response = {
      Body: JSON.stringify([{ id: 1, name: 'Test' }]),
    };

    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('S3', 'getObject', (params, callback) => {
      callback(null as any, mockS3Response);
    });

    AWSMock.mock('DynamoDB.DocumentClient', 'put', (params: any, callback: (arg0: Error, arg1: null) => void) => {
      callback(new Error('DynamoDB error'), null);
    });

    await expect(handler(mockEvent)).rejects.toThrow('DynamoDB error');
  });
});
