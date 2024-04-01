import * as contentstack from 'contentstack';
const Stack = (envConfig) => {
  return contentstack.Stack({
    api_key: envConfig.CONTENTSTACK_API_KEY,
    delivery_token: envConfig.CONTENTSTACK_DELIVERY_TOKEN,
    environment: envConfig.CONTENTSTACK_ENVIRONMENT,
  });
};

export const getEntry = async ({contentTypeUid, envConfig}) => {
  return new Promise((resolve, reject) => {
    const query = Stack(envConfig).ContentType(contentTypeUid).Query();
    query
      .toJSON()
      .includeCount()
      .find()
      .then(
        (result) => {
          resolve(result[0][0]);
        },
        (error) => {
          reject(error);
        },
      );
  });
};
