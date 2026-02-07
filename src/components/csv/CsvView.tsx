import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getCsvPrefs, setCsvPrefs, type CsvPrefs } from '@/store/csvPrefs'
import type { WorkspaceFile } from '@/types/workspace'
import { isFile } from '@/types/workspace'

function parseCsv(content: string): string[][] {
  const result = Papa.parse<string[]>(content, { skipEmptyLines: true })
  return result.data
}

export function CsvView() {
  const { items, getItem } = useWorkspace()
  const csvFiles = items.filter((i): i is WorkspaceFile => isFile(i) && i.fileType === 'csv')
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [prefs, setPrefsState] = useState<CsvPrefs | null>(null)
  const [rows, setRows] = useState<string[][]>([])

  const file = selectedFileId ? getItem(selectedFileId) : null
  const selectedFile = file && isFile(file) ? file : null

  useEffect(() => {
    if (!selectedFileId) {
      setRows([])
      return
    }
    getCsvPrefs(selectedFileId).then((p) => setPrefsState(p ?? { fileId: selectedFileId }))
  }, [selectedFileId])

  useEffect(() => {
    if (!selectedFile) {
      setRows([])
      return
    }
    setRows(parseCsv(selectedFile.content))
  }, [selectedFile])

  const savePrefs = useCallback(async (next: Partial<CsvPrefs>) => {
    if (!selectedFileId) return
    const merged = { ...prefs, ...next, fileId: selectedFileId }
    setPrefsState(merged)
    await setCsvPrefs(merged)
  }, [selectedFileId, prefs])

  const headers = rows[0] ?? []
  const dataRows = rows.slice(1)
  const xCol = prefs?.xColumn && headers.includes(prefs.xColumn) ? prefs.xColumn : headers[0]
  const yCol = prefs?.yColumn && headers.includes(prefs.yColumn) ? prefs.yColumn : headers[1]
  const chartType = prefs?.chartType ?? 'bar'

  const chartData = dataRows.map((row) => {
    const obj: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      const val = row[i]
      obj[h] = Number.isFinite(Number(val)) ? Number(val) : (val ?? '')
    })
    return obj
  })

  if (csvFiles.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">CSV Visualizer</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          No CSV files in your workspace. Import a CSV file from the Workspace section first.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label htmlFor="csv-file-select" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Select CSV file
        </label>
        <select
          id="csv-file-select"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          value={selectedFileId ?? ''}
          onChange={(e) => setSelectedFileId(e.target.value || null)}
        >
          <option value="">Choose a file...</option>
          {csvFiles.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {selectedFile && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Chart options</h3>
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="csv-x" className="mr-2 text-sm text-slate-600 dark:text-slate-400">X axis</label>
                <select
                  id="csv-x"
                  className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  value={xCol}
                  onChange={(e) => savePrefs({ xColumn: e.target.value })}
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="csv-y" className="mr-2 text-sm text-slate-600 dark:text-slate-400">Y axis</label>
                <select
                  id="csv-y"
                  className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  value={yCol}
                  onChange={(e) => savePrefs({ yColumn: e.target.value })}
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="csv-type" className="mr-2 text-sm text-slate-600 dark:text-slate-400">Chart type</label>
                <select
                  id="csv-type"
                  className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  value={chartType}
                  onChange={(e) => savePrefs({ chartType: e.target.value as 'bar' | 'line' })}
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    {headers.map((h) => (
                      <th key={h} className="px-2 py-1.5 font-medium text-slate-800 dark:text-slate-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                      {headers.map((_, j) => (
                        <td key={j} className="px-2 py-1.5 text-slate-600 dark:text-slate-400">{row[j]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {dataRows.length > 50 && (
                <p className="mt-2 text-xs text-slate-500">Showing first 50 rows.</p>
              )}
            </div>
          </div>

          <div className="h-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-100">Chart</h3>
            {xCol && yCol && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis dataKey={xCol} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey={yCol} fill="#3b82f6" />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis dataKey={xCol} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey={yCol} stroke="#3b82f6" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500">Select X and Y columns to show a chart.</p>
            )}
          </div>
        </>
      )}

      {selectedFileId && !selectedFile && (
        <p className="text-slate-500">File not found. It may have been deleted.</p>
      )}
    </div>
  )
}
