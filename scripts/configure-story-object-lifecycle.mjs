import {
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || process.env.Account_Id;
const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.Access_Key_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.Secret_Access_key;
const bucket = "post";
const ruleId = "pola-expire-stories-after-24-hours";

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error("Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY before running this setup.");
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

let existingRules = [];
try {
  const current = await client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
  existingRules = current.Rules || [];
} catch (error) {
  if (error?.name !== "NoSuchLifecycleConfiguration" && error?.$metadata?.httpStatusCode !== 404) {
    throw error;
  }
}

const rules = existingRules.filter((rule) => rule.ID !== ruleId);
rules.push({
  ID: ruleId,
  Filter: { Prefix: "stories/" },
  Status: "Enabled",
  Expiration: { Days: 1 },
});

await client.send(new PutBucketLifecycleConfigurationCommand({
  Bucket: bucket,
  LifecycleConfiguration: { Rules: rules },
}));

console.log(`Configured the ${bucket} R2 bucket to expire stories/ objects after one day.`);
