import releases from '../../config/releases.json'

export const AppVersion = import.meta.env.PACKAGE_VERSION

// The release date of the running version, from src/config/releases.json. Undefined if it has not been logged.
export const AppReleaseDate: string | undefined = releases.find((release) => release.version === AppVersion)?.date
