export default class Log {
  label: any
  render: boolean
  constructor(label, render = true) {
    this.label = label
    this.render = render
  }
  success(title, v1?: any) {
    if (this.render) {
      console.info('✅ ✅ ✅ ✅ ' + this.label)
      this.showArgs('✅ ', arguments)
      console.info('')
    }
  }
  log(title, v1?) {
    if (this.render) {
      this.showArgs(`${this.label} ↠`, arguments)
    }
  }
  error(e) {
    console.info('📛 📛 📛 📛 📛 📛 ')
    console.info('📛 ' + this.label)
    this.showArgs('📛', arguments)
    console.info('📛 📛 📛 📛 📛 📛 ')
    console.info('')
  }

  notice(e) {
    console.info('👯👯👯👯👯👯👯👯👯👯👯👯👯👯👯👯👯')
    console.info('👯 ' + this.label)
    this.showArgs('👯', arguments)
    console.info('👯👯👯👯👯👯👯👯👯👯👯👯👯👯👯👯👯')
    console.info('')
  }
  showArgs(emoji, args) {
    if (args) {
      for (let i = 0; i < args.length; i++) {
        console.info(i == 0 ? '⭐️ ' + emoji : '✨   ', args[i])
      }
    }
  }
}
