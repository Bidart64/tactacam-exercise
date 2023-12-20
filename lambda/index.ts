import * as AWS from 'aws-sdk';

export const handler = async (event: any = {}): Promise<any> => {
  const s3 = new AWS.S3();
  const dynamo = new AWS.DynamoDB.DocumentClient();
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    const data = await s3.getObject(params).promise();
    const elementsString = data.Body?.toString() || '';
    const elements = JSON.parse(elementsString);
    for (const item of elements) {
      const params = {
        TableName: process.env.TABLE_NAME || '',
        Item: item,
      };
      await dynamo.put(params).promise();
    }
    return { message: 'ok' };
  } catch (err) {
    console.log(err);
    throw err;
  }
};
