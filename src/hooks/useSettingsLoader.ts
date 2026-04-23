import { useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

export function useSettingsLoader() {
  const { loadSettings, isLoaded } = useSettingsStore()

  useEffect(() => {
    if (isLoaded) return

    window.getSettings().then((settings) => {
      if (settings) loadSettings(settings)
    })
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}


