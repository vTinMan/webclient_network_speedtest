window.addEventListener("load", function() {
  // 10 Mb content
  setTimeout(function() {
    const $speedtestWeightForm = document.querySelector(".speedtest-weight-form")
    if (!$speedtestWeightForm) { return }

    for(i in (new Array(10))) {
      w_input = document.createElement('input')
      w_input.setAttribute('type', 'hidden')
      w_input.setAttribute('name', 'speedtest_weight[]')
      w_input.value = "0123456789abcdef".repeat(65536)
      $speedtestWeightForm.append(w_input)
    }
  }, 0)



  class ExecutionLogger {
    constructor(toggle, text) {
      this.$toggle = toggle
      this.$text = text
      this.$currentLine = null
    }

    log(text) {
      const time_s = new Date().toLocaleTimeString('ru-RU', { hour: "2-digit", minute: "2-digit", second: "2-digit"})
      this.$currentLine = document.createElement("span")
      this.$currentLine.innerHTML = text
      const dateLine = document.createElement("p")
      dateLine.innerHTML = `${time_s} >  `
      dateLine.append(this.$currentLine)
      this.$text.append(dateLine)
    }

    logLine(text) {
      this.$currentLine.innerHTML = text
    }

    logAppend(text) {
      this.$currentLine.innerHTML += text
    }

    clear() {
      this.$text.innerHTML = ''
    }

    show() {
      this.$toggle.checked = true
    }

    hide() {
      this.$toggle.checked = false
    }
  }

  const executionLogger = new ExecutionLogger(document.querySelector("#speedtest-execution #toggle-execution"),
                                              document.querySelector("#speedtest-execution .execution-text"))



  const COMMON_TIMEOUT = 10000

  class SpeedTester {
    $speedtestWeightForm = document.querySelector(".speedtest-weight-form");
    $speedMessage;
    $errorMessage;
    speedtestType;
    callback;
    url;
    loaded;
    startTime;
    finishTime;
    xhr;

    constructor(options) {
      this.speedtestType = options["speedtestType"]
      this.callback = options["callback"]
      this.url = options["url"]
      this.$speedMessage = document.querySelector(options["speedMessageSelector"])
      this.$errorMessage = document.querySelector(options["errorMessageSelector"])
    }

    speedtest() {
      this.$errorMessage.classList.add('hide')
      if (!this.url) {
        if (this.callback) { this.callback() }
        return
      }
      this.startTime = new Date().getTime()
      this.finishTime = null
      this.loaded = null
      executionLogger.log(`[${'_'.repeat(100)}]`)
      if (this.speedtestType == "download") {
        const request = this.makeXhr('GET')
        request.send()
      } else if (this.speedtestType == "upload") {
        const request = this.makeXhr('POST')
        const formData = new FormData(this.$speedtestWeightForm)
        request.send(formData)
      }
      setTimeout(this.completeTest, COMMON_TIMEOUT)
    }

    makeXhr(reqType) {
      const xhr = new XMLHttpRequest()
      xhr.open(reqType, this.url)
      xhr.timeout = COMMON_TIMEOUT
      xhr.onload = this.finished
      xhr.ontimeout = this.timeouterror
      if (this.speedtestType == "download") {
        xhr.addEventListener("progress", this.progress, false)
      } else if (this.speedtestType == "upload") {
        xhr.upload.addEventListener("progress", this.progress, false)
      }
      return xhr
    }

    progress = (evt)=> {
      if (!this.startTime) { return }

      this.loaded = evt.loaded
      const percents = Math.floor(evt.loaded / (evt.total || 10485760) * 100)
      let line = "["
      line += '#'.repeat(percents)
      if (100-percents > 0) { line += '_'.repeat(100-percents) }
      line += "]"
      executionLogger.logLine(line)
    }

    finished = (e)=> {
      if (!this.startTime) { return }

      executionLogger.logLine(`[${'#'.repeat(100)}]`)
      this.finishTime = new Date().getTime()
      const xhr = e.target
      if (xhr.status == 200) {
        executionLogger.logAppend("  - ok")
      } else {
        this.loaded = null
        executionLogger.logAppend("  - fail")
      }
      this.completeTest()
    }

    timeouterror = ()=> {
      if (!this.startTime) { return }

      this.loaded = null
      executionLogger.logAppend("  - fail")
      this.completeTest()
    }

    completeTest = ()=> {
      if (!this.startTime) { return }

      if (this.callback) { setTimeout(this.callback, 0) }
      const endTime = this.finishTime ? this.finishTime : new Date().getTime()
      const resultTime = endTime - this.startTime

      if (!this.finishTime && this.loaded) { executionLogger.logAppend("  - timeout") }
      if (this.loaded) {
        this.$speedMessage.innerHTML = (this.loaded*8/resultTime/1000).toFixed(2) + " Mbit/s"
      } else {
        this.$errorMessage.classList.remove('hide')
        this.$speedMessage.innerHTML = ''
      }
      this.startTime = null
      this.finishTime = null
      this.loaded = null
      this.xhr = null
    }
  }



  class SpeedtestCoordinator {
    $speedtestResults = document.querySelector("#speedtest-results");
    $speedtestRunner = document.querySelector("#speedtest-runner");
    testerQueue;
    testerIterator;

    constructor() {
      this.testerQueue = []
      this.testerQueue.push(new SpeedTester({
        speedtestType: "download",
        callback: this.stepForward,
        url: document.querySelector("#speedtest_download_url").value,
        speedMessageSelector: ".speedtest-download-speed",
        errorMessageSelector: ".speedtest-download-speed-error"
      }))
      this.testerQueue.push(new SpeedTester({
        speedtestType: "upload",
        callback: this.stepForward,
        url: document.querySelector("#speedtest_upload_url").value,
        speedMessageSelector: ".speedtest-upload-speed",
        errorMessageSelector: ".speedtest-upload-speed-error"
      }))
      this.testerQueue.push(new SpeedTester({
        speedtestType: "download",
        callback: this.stepForward,
        url: document.querySelector("#speedtest_storage_url").value,
        speedMessageSelector: ".speedtest-image-storage-speed",
        errorMessageSelector: ".speedtest-image-storage-speed-error"
      }))
    }

    allComplete() {
      this.testerIterator = null
      executionLogger.log('network speed test is completed')
      setTimeout(()=> {
        executionLogger.hide()
        this.$speedtestRunner.innerHTML = 'Perform'
        this.$speedtestRunner.removeAttribute('disabled')
        this.$speedtestResults.classList.remove('hide')
      }, 2000)
    }

    stepForward = ()=> {
      this.testerIterator = (this.testerIterator != null) ? this.testerIterator + 1 : 0
      if (this.testerIterator == this.testerQueue.length) {
        this.allComplete()
        return
      }

      let currentTester = this.testerQueue[this.testerIterator]
      executionLogger.log(`starting test: ${currentTester.speedtestType}, ${currentTester.url}`)
      currentTester.speedtest()
    }

    startSpeedtests = ()=> {
      if (this.$speedtestResults.getAttribute('disabled')) { return }

      this.$speedtestResults.classList.add('hide')
      executionLogger.clear()
      executionLogger.show()
      executionLogger.log('network speed test is starting')
      this.$speedtestRunner.setAttribute('disabled', 'disabled')
      this.$speedtestRunner.innerHTML = 'running...'
      this.stepForward()
    }
  }

  const speedtestCoordinator = new SpeedtestCoordinator()
  const $speedtestRunner = document.querySelector("#speedtest-runner")
  $speedtestRunner.addEventListener("click", speedtestCoordinator.startSpeedtests.bind(speedtestCoordinator))
})
