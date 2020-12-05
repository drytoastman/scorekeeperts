const DefaultReporter = require('@jest/reporters/build/DefaultReporter').default
const getResultHeader = require('@jest/reporters/build/getResultHeader').default

class FingersCrossedReporter extends DefaultReporter {
    printTestFileHeader(testPath, config, result) {
        this.log(getResultHeader(result, this._globalConfig, config))
        const consoleBuffer = result.console
        const testFailed = result.numFailingTests > 0
        if (testFailed && consoleBuffer && consoleBuffer.length) {
            for (const item of consoleBuffer) {
                this.log(item.message.trimRight()) // tighter log, less repeated crap than getConsoleBuffer
            }
        }
    }
}

module.exports = FingersCrossedReporter
