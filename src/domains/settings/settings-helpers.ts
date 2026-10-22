import { Interact } from '../../store/interact'
import { Lang } from '../../store/lang'

export const showNomieConnectPopup = () => {
  Interact.alert(Lang.t('settings.nomie-connect-placeholder', 'Remove me - settings-helper.ts'))
}
