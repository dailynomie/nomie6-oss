import Logger from '../../utils/log/log'
import { DEVICE_KEYS, getDeviceSetting, setDeviceSetting } from '../../store/device-settings'
import { Lang } from '../../store/lang'

// consts
const console = new Logger('🗺 locate.js')
const LOC_CACHE_KEY = DEVICE_KEYS.locationCache

type LocationLookupResponse = {
  time: number
  latitude: number
  longitude: number
}

export default (): Promise<LocationLookupResponse> => {
  let getRealLocation = (): Promise<LocationLookupResponse> => {
    return new Promise((resolve, reject) => {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            let payload = {
              time: new Date().getTime(),
              latitude: pos.coords.latitude,
              lat: pos.coords.latitude,
              longitude: pos.coords.longitude,
              lng: pos.coords.longitude,
            }
            setDeviceSetting(LOC_CACHE_KEY, JSON.stringify(payload))
            resolve(payload)
          },
          (e) => {
            // console.error(e);
            reject(e)
          },
          {
            timeout: 3000,
          }
        )
      } catch (e) {
        reject(e)
      }
    })
  }

  return new Promise((resolve, reject) => {
    let cachedRaw = JSON.parse(getDeviceSetting(LOC_CACHE_KEY) || 'null')

    try {
      if (cachedRaw) {
        if (new Date().getTime() - cachedRaw.time < 1000 * 60 * 2) {
          resolve({
            time: cachedRaw.time,
            latitude: cachedRaw.latitude,
            longitude: cachedRaw.longitude,
          })
        } else {
          if (!navigator.geolocation) {
            reject({ message: Lang.t('ui.no-geolocation-service-found', 'No geolocation service found') })
          } else {
            getRealLocation().then(resolve).catch(reject)
          } // end if have geo lookup
        } // end if cache exists
      } else {
        getRealLocation().then(resolve).catch(reject)
      }
    } catch (e) {
      reject(e)
    }
  })
}
