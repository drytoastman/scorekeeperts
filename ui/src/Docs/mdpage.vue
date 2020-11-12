<template>
    <div class='markdown' v-html="mdhtml">
    </div>
</template>

<script>
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import MarkdownItAttrs from 'markdown-it-attrs'

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
            md.use(MarkdownItAttrs, { allowedAttributes: ['class'] })
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
    mounted() { this.downloadPage() }
}
</script>
