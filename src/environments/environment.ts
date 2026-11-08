export const environment = {
  production: false,
  environmentName: 'local',
  /** false = login contra b-sso. En local la URL es relativa y proxy.conf.json la manda a suma-dev. */
  useMockAuth: false,
  api: 'http://desa-servicios.aduana.gob.bo',
  ssoApi: '/b-sso/rest',
  /**
   * Vacío en local: las URLs del menú quedan en el mismo origen (proxy → suma-dev).
   * Así el listener OCE guarda token/cookies como en el portal real.
   */
  hostIp: '',
  keycloak: {
    url: 'https://desa-login.aduana.gob.bo',
    realm: 'login',
    clientId: 'app-inicio',
  },
};
