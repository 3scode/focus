"use client"

import { useState, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { Trash2, Plus, Download, Upload, AlertTriangle } from "lucide-react"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Sidebar, BottomTab } from "@/components/layout/Nav"
import { useApp } from "@/store"
import type { Block, Category, FocusSession } from "@/types"
import * as storage from "@/lib/storage"

const SWATCHES = [
  "#3B82F6", "#10B981", "#F43F5E", "#8B5CF6",
  "#F59E0B", "#6B7280", "#EF4444", "#22C55E",
  "#14B8A6", "#6366F1", "#EC4899", "#F97316",
]

function SettingsContent() {
  const { blocks, categories, settings, updateCategories, updateSettings, clearData } = useApp()
  const [localCats, setLocalCats] = useState<Category[]>(categories)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [pendingColor, setPendingColor] = useState<string | null>(null)

  const saveCats = useCallback((cats: Category[]) => {
    setLocalCats(cats)
    updateCategories(cats)
  }, [updateCategories])

  const handleEditName = useCallback((id: string, name: string) => {
    saveCats(localCats.map((c) => (c.id === id ? { ...c, name } : c)))
  }, [localCats, saveCats])

  const handleEditColor = useCallback((id: string, color: string) => {
    saveCats(localCats.map((c) => (c.id === id ? { ...c, color } : c)))
  }, [localCats, saveCats])

  const handleAddCategory = useCallback(() => {
    const newCat: Category = {
      id: uuidv4(),
      name: "New Category",
      color: SWATCHES[Math.floor(Math.random() * SWATCHES.length)],
      order: localCats.length,
    }
    saveCats([...localCats, newCat])
  }, [localCats, saveCats])

  const handleDeleteCategory = useCallback((id: string) => {
    if (localCats.length <= 1) return
    saveCats(localCats.filter((c) => c.id !== id))
  }, [localCats, saveCats])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.categories || !data.settings) {
        toast.error("Format file tidak valid")
        return
      }
      await updateCategories(data.categories)
      updateSettings(data.settings)
      setLocalCats(data.categories)
      if (data.blocks) {
        await storage.setBlocks(data.blocks as Block[])
      }
      if (data.focusSessions) {
        await storage.setFocusSessions(data.focusSessions as FocusSession[])
      }
      toast.success("Data berhasil diimpor")
      window.location.reload()
    } catch {
      toast.error("Gagal membaca file")
    }
    e.target.value = ""
  }, [updateCategories, updateSettings])

  const handleExport = useCallback(async () => {
    const focusSessions = await storage.getFocusSessions()
    const data = { blocks, categories: localCats, focusSessions, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "time-blocking-export.json"
    a.click()
    URL.revokeObjectURL(url)
  }, [blocks, localCats, settings])

  const handleClear = useCallback(async () => {
    await clearData()
    setLocalCats([])
    setShowClearConfirm(false)
  }, [clearData])

  const toggleTheme = useCallback(() => {
    const next = settings.theme === "light" ? "dark" : "light"
    updateSettings({ ...settings, theme: next })
    document.documentElement.classList.toggle("dark", next === "dark")
  }, [settings, updateSettings])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-8">
          <h1 className="text-lg font-semibold">Settings</h1>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-secondary">Categories</h2>
              <button onClick={handleAddCategory} className="p-1 rounded hover:bg-border text-text-secondary">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {localCats.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-2 bg-surface rounded-radius-md border border-border">
                  <div className="relative">
                    <div
                      className="w-6 h-6 rounded-full cursor-pointer border-2 border-border"
                      style={{ backgroundColor: cat.color }}
                      onClick={() => { if (editingCat === cat.id) { setEditingCat(null); setPendingColor(null) } else { setEditingCat(cat.id); setPendingColor(cat.color) } }}
                    />
                    {editingCat === cat.id && (
                      <div className="absolute top-8 left-0 z-10 bg-surface rounded-radius-md border border-border shadow-md p-3 space-y-3">
                        <div className="grid grid-cols-4 gap-1">
                          {SWATCHES.map((s) => (
                            <button
                              key={s}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${pendingColor === s ? "border-primary scale-110" : "border-border"}`}
                              style={{ backgroundColor: s }}
                              onClick={() => setPendingColor(s)}
                            />
                          ))}
                        </div>
                        <div className="flex justify-center gap-2">
                          <button
                            className="px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary bg-background rounded-radius-md border border-border hover:bg-border transition-colors"
                            onClick={() => { setEditingCat(null); setPendingColor(null) }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-radius-md hover:bg-primary-hover transition-colors"
                            onClick={() => { if (pendingColor) handleEditColor(cat.id, pendingColor); setEditingCat(null); setPendingColor(null) }}
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => handleEditName(cat.id, e.target.value)}
                    className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none border-b border-transparent focus:border-primary"
                  />
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 rounded hover:bg-background text-text-secondary hover:text-error transition-colors"
                    disabled={localCats.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Preferences</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-radius-md border border-border">
                <span className="text-sm">Day start</span>
                <input
                  type="time"
                  value={settings.dayStart ?? "08:00"}
                  onChange={(e) => updateSettings({ ...settings, dayStart: e.target.value })}
                  className="font-mono text-sm bg-transparent text-text-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-radius-md border border-border">
                <span className="text-sm">Day end</span>
                <input
                  type="time"
                  value={settings.dayEnd ?? "18:00"}
                  onChange={(e) => updateSettings({ ...settings, dayEnd: e.target.value })}
                  className="font-mono text-sm bg-transparent text-text-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-radius-md border border-border">
                <span className="text-sm">Focus timer (min)</span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.defaultTimer ?? 25}
                  onChange={(e) => updateSettings({ ...settings, defaultTimer: parseInt(e.target.value) || 25 })}
                  className="font-mono text-sm bg-transparent text-text-primary focus:outline-none w-16 text-right"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-radius-md border border-border">
                <span className="text-sm">Break (min)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.breakDuration ?? 5}
                  onChange={(e) => updateSettings({ ...settings, breakDuration: parseInt(e.target.value) || 5 })}
                  className="font-mono text-sm bg-transparent text-text-primary focus:outline-none w-16 text-right"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-radius-md border border-border">
                <span className="text-sm">Theme</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.theme === "dark"} onChange={toggleTheme} />
                  <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-text-secondary mb-3">Data</h2>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start" onClick={handleImport}>
                <Upload className="w-4 h-4" /> Import Data
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              <Button variant="secondary" className="w-full justify-start" onClick={handleExport}>
                <Download className="w-4 h-4" /> Export Data
              </Button>
              <Button variant="ghost" className="w-full justify-start text-error hover:text-error" onClick={() => setShowClearConfirm(true)}>
                <AlertTriangle className="w-4 h-4" /> Clear All Data
              </Button>
            </div>
          </section>
        </div>
      </main>
      <BottomTab />

      <Modal open={showClearConfirm} title="Clear All Data?" onClose={() => setShowClearConfirm(false)}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">This will permanently delete all your blocks, categories, and settings. This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button className="flex-1 bg-error hover:bg-red-600" onClick={handleClear}>Clear Everything</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}
