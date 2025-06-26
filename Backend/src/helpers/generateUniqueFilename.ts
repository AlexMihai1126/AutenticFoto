import path from 'path'
/** @internal
 * Funcție pentru generarea unui nume de fișier unic, bazat pe timpul curent și un prefix opțional
 * @param initialFilename Numele inițial al fișierului (pentru extragerea extensiei fișierului)
 * @param prefix Prefix opțional pentru numele fișierului generat
 * @returns Numele generat al fișierului
 */
function generateFilename(initialFilename:string, prefix?:string):string{
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(initialFilename);
    if(!prefix){
        return `${uniqueSuffix}${ext}`;
    }
    return `${prefix}-${uniqueSuffix}${ext}`;
}

export default generateFilename;