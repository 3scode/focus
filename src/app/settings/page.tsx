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
import * as api from "@/lib/api"

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

  const handleDeleteCategory = useCallback(async (id: string) => {
    if (localCats.length <= 1) return
    await api.deleteCategory(id)
    saveCats(localCats.filter((c) => c.id !== id))
    toast.success("Kategori dihapus")
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
        for (const b of data.blocks as Block[]) { await api.saveBlock(b) }
      }
      if (data.focusSessions) {
        for (const s of data.focusSessions as FocusSession[]) { await api.saveFocusSession(s) }
      }
      toast.success("Data berhasil diimpor")
      window.location.reload()
    } catch {
      toast.error("Gagal membaca file")
    }
    e.target.value = ""
  }, [updateCategories, updateSettings])

  const handleExport = useCallback(async () => {
    const focusSessions = await api.getFocusSessions()
    const data = { blocks, categories: localCats, focusSessions, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "focus-export.json"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Data berhasil diexport")
  }, [blocks, localCats, settings])

  const handleClear = useCallback(async () => {
    await clearData()
    setLocalCats([])
    setShowClearConfirm(false)
  }, [clearData])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-xl mx-auto px-4 py-6 space-y-8">
          <h1 className="text-lg font-semibold text-[#EDEDEF]">Settings</h1>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#8A8F98]">Categories</h2>
              <button onClick={handleAddCategory} className="p-1 rounded-lg hover:bg-white/[0.05] text-[#8A8F98]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {localCats.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="relative">
                    <div
                      className="w-6 h-6 rounded-full cursor-pointer border-2 border-white/[0.1]"
                      style={{ backgroundColor: cat.color }}
                      onClick={() => { if (editingCat === cat.id) { setEditingCat(null); setPendingColor(null) } else { setEditingCat(cat.id); setPendingColor(cat.color) } }}
                    />
                    {editingCat === cat.id && (
                      <div
                        className="absolute top-8 left-0 z-10 p-3 space-y-3 rounded-xl"
                        style={{
                          background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                          border: "1px solid rgba(255,255,255,0.06)",
                          boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.5)",
                        }}
                      >
                        <div className="grid grid-cols-4 gap-1">
                          {SWATCHES.map((s) => (
                            <button
                              key={s}
                              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${pendingColor === s ? "border-[#5E6AD2] scale-110" : "border-white/[0.1]"}`}
                              style={{ backgroundColor: s }}
                              onClick={() => setPendingColor(s)}
                            />
                          ))}
                        </div>
                        <div className="flex justify-center gap-2">
                          <button
                            className="px-4 py-1.5 text-sm font-medium text-[#8A8F98] hover:text-[#EDEDEF] rounded-lg transition-colors"
                            style={{ background: "rgba(255,255,255,0.05)" }}
                            onClick={() => { setEditingCat(null); setPendingColor(null) }}
                          >
                            Cancel
                          </button>
                          <button
                            className="px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-colors bg-[#5E6AD2] hover:bg-[#6872D9]"
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
                    className="flex-1 bg-transparent text-sm text-[#EDEDEF] focus:outline-none border-b border-transparent focus:border-[#5E6AD2]"
                  />
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1 rounded hover:bg-white/[0.05] text-[#8A8F98] hover:text-[#EF4444] transition-colors"
                    disabled={localCats.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[#8A8F98] mb-3">Preferences</h2>
            <div className="space-y-2">
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-sm text-[#EDEDEF]">Day start</span>
                <input
                  type="time"
                  value={settings.dayStart ?? "08:00"}
                  onChange={(e) => updateSettings({ ...settings, dayStart: e.target.value })}
                  className="font-mono text-sm bg-transparent text-[#EDEDEF] focus:outline-none"
                />
              </div>
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-sm text-[#EDEDEF]">Day end</span>
                <input
                  type="time"
                  value={settings.dayEnd ?? "18:00"}
                  onChange={(e) => updateSettings({ ...settings, dayEnd: e.target.value })}
                  className="font-mono text-sm bg-transparent text-[#EDEDEF] focus:outline-none"
                />
              </div>
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-sm text-[#EDEDEF]">Focus timer (min)</span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.defaultTimer ?? 25}
                  onChange={(e) => updateSettings({ ...settings, defaultTimer: parseInt(e.target.value) || 25 })}
                  className="font-mono text-sm bg-transparent text-[#EDEDEF] focus:outline-none w-16 text-right"
                />
              </div>
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-sm text-[#EDEDEF]">Break (min)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.breakDuration ?? 5}
                  onChange={(e) => updateSettings({ ...settings, breakDuration: parseInt(e.target.value) || 5 })}
                  className="font-mono text-sm bg-transparent text-[#EDEDEF] focus:outline-none w-16 text-right"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[#8A8F98] mb-3">Data</h2>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start" onClick={handleImport}>
                <Upload className="w-4 h-4" /> Import Data
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
              <Button variant="secondary" className="w-full justify-start" onClick={handleExport}>
                <Download className="w-4 h-4" /> Export Data
              </Button>
              <Button variant="ghost" className="w-full justify-start text-[#EF4444] hover:text-[#EF4444]" onClick={() => setShowClearConfirm(true)}>
                <AlertTriangle className="w-4 h-4" /> Clear All Data
              </Button>
            </div>
          </section>
        </div>
      </main>
      <BottomTab />

      <Modal open={showClearConfirm} title="Clear All Data?" onClose={() => setShowClearConfirm(false)}>
        <div className="space-y-4">
          <p className="text-sm text-[#8A8F98]">This will permanently delete all your blocks, categories, and settings. This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleClear} style={{ background: "#EF4444" }}>Clear Everything</Button>
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
