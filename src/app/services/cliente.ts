export interface Objetoabstracto <T> {
    createArchivado(pArchivado: string): T;
    getArchivadoList() : T;
    getArchivado(pId: number):T;
    updateArchivado(pId: number, pArchivado: string): T;
    deleteArchivado(pId: number): T;
}  