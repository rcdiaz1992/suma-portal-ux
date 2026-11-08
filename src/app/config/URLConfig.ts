import { getAmbiente } from '@aduana/an-core';
import { environment } from 'src/environments/environment';
// import data from '../../assets/json/data.json';

export const serverDomain = environment.api;
// export const serverDomain = environment.api || getDomain ();

// export const 
export const URLEmpleados = getAmbiente() + '/sen-onion-demo-rest/empleados';


