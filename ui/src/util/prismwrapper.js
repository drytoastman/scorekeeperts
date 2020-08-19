import 'vue-prism-editor/dist/prismeditor.min.css'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/themes/prism-coy.css'
const prismlangs = {
    html(code) { return highlight(code, languages.html, 'html') },
    css(code) { return highlight(code, languages.css, 'css') }
}
export { prismlangs }
