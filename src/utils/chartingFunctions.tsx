// Rounding unix time down
export const roundDownUnixTime = (unixTime: number): number => {
    let formatted = new Date(unixTime * 1000)
    let seconds = formatted.getSeconds()
    return unixTime - seconds
}

// Different resolutions for the charting library
export type Resolution = '1' | '3' | '5' | '15' | '30' | '60' | '120' | '240' | '1D'

export const convertChartIntervalToUnix = (resolution: Resolution) => {
    const RESOLUTIONS = {
      '1': 60000,
      '3': 3 * 60000,
      '5': 5 * 60000,
      '15': 15 * 60000,
      '30': 30 * 60000,
      '60': 60 * 60000,
      '120': 120 * 60000,
      '240': 240 * 60000,
      '1D': 24 * 60 * 60000,
    }
    return RESOLUTIONS[resolution]
}