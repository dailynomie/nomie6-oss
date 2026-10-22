import { Interact } from '../../store/interact'
import { Lang } from '../../store/lang'
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
    Interact.alert(Lang.t('general.copy-failed', 'Copy failed'), e.message)
  }
}
