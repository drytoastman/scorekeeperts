// UI(Browser) uses ES6 version of the imports for size
// Server(NodeJS) will use whole module import for conversion to debuggable files via tsc/VSCode
import isNumeric from 'validator/es/lib/isNumeric'
import isEmail from 'validator/es/lib/isEmail'
import isISO8601 from 'validator/es/lib/isISO8601'
import isURL from 'validator/es/lib/isURL'
import isUUID from 'validator/es/lib/isUUID'
import isInt from 'validator/es/lib/isInt'
import isDecimal from 'validator/es/lib/isDecimal'
import isCurrency from 'validator/es/lib/isCurrency'
import isFQDN from 'validator/es/lib/isFQDN'
import isAlphanumeric from 'validator/es/lib/isAlphanumeric'
export default { isNumeric, isEmail, isISO8601, isURL, isUUID, isInt, isDecimal, isCurrency, isFQDN, isAlphanumeric }
