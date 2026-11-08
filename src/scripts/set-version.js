/* import fs from 'fs';
import path from 'path';
import  packageJson  from '../../package.json' assert { type: 'json' };
const version = packageJson.version;
const versionFilePath = path.join('./src/environments/version.ts');
const versionFileContent = `export const APP_VERSION: string = '${version}';\n`;

fs.writeFileSync(versionFilePath, versionFileContent);
console.log('Versión actualizada en src/environments/version.ts'); */


const fs = require('fs');
const path = require('path');
const packageJson = require('../../package.json');

const version = packageJson.version;
const versionFilePath = path.join('./src/environments/version.ts');
const versionFileContent = `export const APP_VERSION: string = '${version}';\n`;

fs.writeFileSync(versionFilePath, versionFileContent);
console.log('Versión actualizada en src/environments/version.ts');