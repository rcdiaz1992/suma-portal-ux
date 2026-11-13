export const environment = {
  production: true,
  environmentName: 'test',
  useMockAuth: false,
  api: 'http://10.0.2.36/api-demo-rest',
  api2: 'http://10.0.2.36/otro-api-rest',
  ssoApi: 'https://suma-test.aduana.gob.bo/b-sso/rest',
  hostIp: 'https://suma-test.aduana.gob.bo',
  legacyPortalHome: 'https://suma-test.aduana.gob.bo/portal/index.html#/home',
  keycloak: {
    url: 'http://cali-login.aduana.gob.bo:8083',
    realm: 'login',
    clientId: 'angular-test',
  },
};
