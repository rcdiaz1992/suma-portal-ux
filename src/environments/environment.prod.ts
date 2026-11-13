export const environment = {
  production: true,
  environmentName: 'produccion',
  useMockAuth: false,
  api: 'https://servicios.aduana.gob.bo',
  ssoApi: 'https://suma.aduana.gob.bo/b-sso/rest',
  hostIp: 'https://suma.aduana.gob.bo',
  legacyPortalHome: 'https://suma.aduana.gob.bo/portal/index.html#/home',
  keycloak: {
    url: 'https://login.aduana.gob.bo',
    realm: 'login',
    clientId: 'app-inicio',
  },
};
