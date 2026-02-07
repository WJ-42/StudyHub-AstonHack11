import { idbGet, idbPut } from './storage'

const STORE = 'csvPrefs'

export interface CsvPrefs {
  fileId: string
  xColumn?: string
  yColumn?: string
  chartType?: 'bar' | 'line'
}

export async function getCsvPrefs(fileId: string): Promise<CsvPrefs | undefined> {
  return idbGet<CsvPrefs>(STORE, fileId)
}

export async function setCsvPrefs(prefs: CsvPrefs): Promise<void> {
  await idbPut(STORE, { ...prefs, fileId: prefs.fileId })
}
