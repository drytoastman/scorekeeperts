<template>
    <div class='markdown' v-html="mdhtml">
    </div>
</template>

<script>
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import MarkdownItAttrs from 'markdown-it-attrs'
import MarkdownItDefList from 'markdown-it-deflist'

export default {
    name: 'MdPage',
    props: {
        pagename: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            pagedata: ''
        }
    },
    computed: {
        mdhtml() {
            return this.markdown.render(this.pagedata)
        },
        markdown() {
            const md = new MarkdownIt({ linkify: true })
            md.use(MarkdownItAttrs, { allowedAttributes: ['class', 'onclick'] })
            md.use(MarkdownItDefList)

            const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }
            // turn local links into standard vue router pushes
            md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
                for (const [t, d] of tokens[idx].attrs) {
                    if ((t === 'href') && (d[0] === '/')) {
                        tokens[idx].attrPush(['onclick', `return docrouter('${d.slice(5)}')`]) // add new attribute
                        break
                    }
                }
                return defaultRender(tokens, idx, options, env, self)
            }

            return md
        }
    },
    methods: {
        downloadPage() {
            if (this.pagename === 'blank') {
                this.pagedata = '### Select pages from above'
                return
            }
            this.pagedata = 'loading ...'
            axios.get(`/markdown/${this.pagename}.md`).then(res => {
                if (res.data) {
                    this.pagedata = res.data
                } else {
                    this.pagedata = 'missing data in response'
                }
            }).catch(error => {
                this.pagedata = error.toString()
            })
        }
    },
    watch: { pagename() { this.downloadPage() } },
    mounted() {
        this.downloadPage()
        window.docrouter = link => {
            this.$router.push(link)
            return false
        }
    }
}
</script>
