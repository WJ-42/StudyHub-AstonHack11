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
  const data = (result.data as string[][]).filter((row) => row.length > 0)
  if (!data.length) return data
  return data.map((row) => row.map((cell) => (cell ?? '').trim()))
}

function normalizeForNumber(s: string): string {
  return String(s).trim().replace(/,/g, '').replace(/\s/g, '')
}

function isNumericValue(val: string): boolean {
  if (val == null || String(val).trim() === '') return false
  const n = Number(normalizeForNumber(val))
  return Number.isFinite(n)
}

function isColumnNumeric(rows: string[][], colIndex: number): boolean {
  let numeric = 0
  let total = 0
  for (const row of rows) {
    const val = row[colIndex]
    if (val == null || String(val).trim() === '') continue
    total++
    if (isNumericValue(String(val))) numeric++
  }
  return total > 0 && numeric >= total / 2
}

function parseNumber(val: string): number | null {
  if (val == null || String(val).trim() === '') return null
  const n = Number(normalizeForNumber(val))
  return Number.isFinite(n) ? n : null
}

function isDateLike(val: string): boolean {
  const s = String(val).trim()
  return /^\d{4}-\d{2}-\d{2}/.test(s) || /^\d+$/.test(s)
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
  const aggregation = prefs?.aggregation ?? 'sum'

  const xColIndex = headers.indexOf(xCol)
  const yColIndex = headers.indexOf(yCol)
  const yColNumeric = yColIndex >= 0 && isColumnNumeric(dataRows, yColIndex)
  const xColNumeric = xColIndex >= 0 && isColumnNumeric(dataRows, xColIndex)

  const rawChartData = dataRows.map((row) => {
    const obj: Record<string, string | number | null> = {}
    headers.forEach((h, i) => {
      const val = row[i] ?? ''
      const num = parseNumber(String(val))
      obj[h] = num !== null ? num : (val || '')
    })
    return obj
  })

  const yValuesParseable = rawChartData.some((row) => {
    const v = row[yCol]
    return v !== undefined && v !== null && v !== '' && (typeof v === 'number' || !Number.isNaN(Number(v)))
  })
  const yHasNumeric = yColNumeric || yValuesParseable

  let chartData: Record<string, string | number | null>[]
  if (chartType === 'line') {
    chartData = [...rawChartData].map((row) => ({
      ...row,
      [yCol]: typeof row[yCol] === 'number' ? row[yCol] : parseNumber(String(row[yCol] ?? '')),
    })) as Record<string, string | number | null>[]
    if (xCol && chartData.length > 0) {
      const firstX = chartData[0][xCol]
      if (xColNumeric && typeof firstX === 'number') {
        chartData.sort((a, b) => (Number(a[xCol]) ?? 0) - (Number(b[xCol]) ?? 0))
      } else if (typeof firstX === 'string' && isDateLike(firstX)) {
        chartData.sort((a, b) => String(a[xCol]).localeCompare(String(b[xCol])))
      }
    }
  } else {
    const map = new Map<string, { sum: number; count: number }>()
    for (const row of rawChartData) {
      const xVal = String(row[xCol] ?? '')
      const yNum = typeof row[yCol] === 'number' ? row[yCol] : parseNumber(String(row[yCol] ?? ''))
      const y = yNum ?? 0
      const cur = map.get(xVal)
      if (!cur) map.set(xVal, { sum: y, count: 1 })
      else {
        cur.sum += y
        cur.count += 1
      }
    }
    const order = [...new Set(rawChartData.map((r) => String(r[xCol] ?? '')))]
    chartData = order.map((xVal) => {
      const cur = map.get(xVal)!
      const y = aggregation === 'average' ? cur.sum / cur.count : cur.sum
      return { [xCol]: xVal, [yCol]: y } as Record<string, string | number>
    })
  }

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
              {chartType === 'bar' && (
                <div>
                  <label htmlFor="csv-agg" className="mr-2 text-sm text-slate-600 dark:text-slate-400">Aggregation</label>
                  <select
                    id="csv-agg"
                    className="rounded border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    value={aggregation}
                    onChange={(e) => savePrefs({ aggregation: e.target.value as 'sum' | 'average' })}
                  >
                    <option value="sum">Sum</option>
                    <option value="average">Average</option>
                  </select>
                </div>
              )}
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
            {xCol && yCol && !yHasNumeric ? (
              <p className="text-amber-600 dark:text-amber-400">Selected Y column has no numeric data.</p>
            ) : xCol && yCol && chartData.length > 0 && yHasNumeric ? (
              <ResponsiveContainer width="100%" height="90%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis
                      dataKey={xCol}
                      className="text-xs"
                      tickFormatter={(v) => (String(v).length > 12 ? String(v).slice(0, 10) + '…' : v)}
                    />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(v) => (typeof v === 'number' && (v >= 1e6 || v <= -1e6 || (v < 0.01 && v > -0.01 && v !== 0)) ? v.toExponential(1) : String(v))}
                    />
                    <Tooltip />
                    <Bar dataKey={yCol} fill="#3b82f6" />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                    <XAxis
                      dataKey={xCol}
                      className="text-xs"
                      tickFormatter={(v) => (String(v).length > 12 ? String(v).slice(0, 10) + '…' : v)}
                    />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(v) => (typeof v === 'number' && (v >= 1e6 || v <= -1e6 || (v < 0.01 && v > -0.01 && v !== 0)) ? v.toExponential(1) : String(v))}
                    />
                    <Tooltip />
                    <Line type="monotone" dataKey={yCol} stroke="#3b82f6" connectNulls={false} />
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
