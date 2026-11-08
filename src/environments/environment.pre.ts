export const environment = {
  production: true,
  environmentName: 'pre-producción',
  useMockAuth: false,
  api: 'http://10.0.2.36/api-demo-rest',
  api2: 'http://10.0.2.36/otro-api-rest',
  ssoApi: 'https://suma-pre.aduana.gob.bo/b-sso/rest',
  hostIp: 'https://suma-pre.aduana.gob.bo',
  keycloak: {
    url: 'http://pre-login.aduana.gob.bo:8083',
    realm: 'login',
    clientId: 'angular-test',
  },
};
