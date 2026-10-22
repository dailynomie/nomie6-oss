import { Interact } from '../../store/interact'
export default function copy(str: string) {
  try {
    const el = document.createElement('textarea')
    el.value = str
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  } catch (e) {
    Interact.alert('Copy failed', e.message)
  }
}
