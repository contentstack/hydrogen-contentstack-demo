import * as contentstack from 'contentstack';
import * as Utils from '@contentstack/utils';
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
          resolve(result);
        },
        (error) => {
          reject(error);
        },
      );
  });
};

export const getEntryByUid = async ({contentTypeUid, entryUid, envConfig}) => {
  return new Promise((resolve, reject) => {
    const blogQuery = Stack(envConfig)
      .ContentType(contentTypeUid)
      .Entry(entryUid);
    blogQuery
      .toJSON()
      .fetch()
      .then(
        (result) => {
          resolve(result);
        },
        (error) => {
          reject(error);
        },
      );
  });
};
