'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExhibitAudioMode } from '@/components/exhibit-audio-mode'

type ExhibitMode = 'playing' | 'killed'

export default function ExhibitControlPage() {
  const [mode, setMode] = useState<ExhibitMode>('playing')
  const [deviceModes, setDeviceModes] = useState<Record<number, ExhibitMode>>({
    1: 'playing', 2: 'playing', 3: 'playing', 4: 'playing',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/exhibit/state')
      const data = (await res.json()) as { mode?: string; devices?: Record<string, string> }
      if (data.mode === 'killed' || data.mode === 'playing') {
        setMode(data.mode)
      }
      if (data.devices) {
        const parsed: Record<number, ExhibitMode> = {}
        for (const [id, m] of Object.entries(data.devices)) {
          if (m === 'killed' || m === 'playing') parsed[Number(id)] = m
        }
        setDeviceModes((prev) => ({ ...prev, ...parsed }))
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch state')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  const setExhibitMode = useCallback(async (newMode: ExhibitMode) => {
    setError(null)
    try {
      const res = await fetch('/api/exhibit/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to set mode')
      }
      setMode(newMode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set mode')
    }
  }, [])

  const toggleDevice = useCallback(async (deviceId: number) => {
    const current = deviceModes[deviceId] ?? 'playing'
    const newMode: ExhibitMode = current === 'playing' ? 'killed' : 'playing'
    setError(null)
    try {
      const res = await fetch('/api/exhibit/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode, device: deviceId }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to set device mode')
      }
      setDeviceModes((prev) => ({ ...prev, [deviceId]: newMode }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set device mode')
    }
  }, [deviceModes])

  if (loading) {
    return (
      <main className="font-control flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8">
        <p className="text-xl text-neutral-400">Loading...</p>
      </main>
    )
  }

  return (
    <main className="font-control min-h-screen bg-neutral-950 p-8">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Exhibit controls */}
        <section className="rounded-lg border-2 border-neutral-600 bg-neutral-900/90 p-8">
          <h1 className="text-3xl font-semibold text-neutral-100 md:text-4xl">Video exhibit</h1>
          {error && <p className="mt-2 text-xl text-red-400">{error}</p>}

          {/* Global kill switch */}
          <div className="mt-6">
            <p className="mb-3 text-lg text-neutral-400">All devices</p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setExhibitMode('playing')}
                className={`rounded px-10 py-5 text-xl font-medium transition-colors md:text-2xl ${
                  mode === 'playing'
                    ? 'bg-green-700 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                Playing
              </button>
              <button
                onClick={() => setExhibitMode('killed')}
                className={`rounded px-10 py-5 text-xl font-medium transition-colors md:text-2xl ${
                  mode === 'killed'
                    ? 'bg-red-700 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                Killed
              </button>
            </div>
          </div>

          {/* Per-device controls */}
          <div className="mt-8">
            <p className="mb-3 text-lg text-neutral-400">Individual devices</p>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((id) => {
                const deviceMode = deviceModes[id] ?? 'playing'
                return (
                  <div key={id} className="flex items-center gap-4">
                    <button
                      onClick={() => toggleDevice(id)}
                      className={`w-28 rounded px-4 py-3 text-lg font-medium transition-colors ${
                        deviceMode === 'killed'
                          ? 'bg-red-700 text-white'
                          : 'bg-green-800 text-white hover:bg-green-700'
                      }`}
                    >
                      {deviceMode === 'killed' ? 'Killed' : 'Playing'}
                    </button>
                    <a
                      href={`/exhibit/device/${id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-neutral-400 hover:underline"
                    >
                      Device {id} ↗
                    </a>
                  </div>
                )
              })}
              <div className="flex items-center gap-4 pt-2">
                <a
                  href="/exhibit/test"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg text-neutral-500 hover:underline"
                >
                  Test (video only, no face detection) ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Audio interview controls */}
        <ExhibitAudioMode embedded />
      </div>
    </main>
  )
}
