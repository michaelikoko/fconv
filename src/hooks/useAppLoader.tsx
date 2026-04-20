import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'


export function useAppLoader() {
  const { setAppInfo, isLoaded } = useAppStore()

  useEffect(() => {
    if (isLoaded) return
    
    window.checkLibreOfficeAvailability().then((info) => {
        console.log('LibreOffice availability:', info)
      if (info) setAppInfo(info)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}