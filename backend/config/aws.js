const AWS = require('aws-sdk');
require('dotenv').config();

const isRealCredential = (value) => (
  Boolean(value)
  && !value.startsWith('your_')
  && !value.startsWith('placeholder')
);

const awsConfig = { region: process.env.AWS_REGION || 'ap-south-1' };
if (
  isRealCredential(process.env.AWS_ACCESS_KEY_ID)
  && isRealCredential(process.env.AWS_SECRET_ACCESS_KEY)
) {
  awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}

// Without explicit credentials, the SDK uses its standard chain (including ECS task roles).
AWS.config.update(awsConfig);

const s3 = new AWS.S3();

module.exports = {
  s3,
  bucket: process.env.AWS_S3_BUCKET
};
