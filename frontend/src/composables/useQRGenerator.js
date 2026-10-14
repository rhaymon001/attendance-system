import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

export function useQRGenerator() {
  const canvasRef = ref(null)
  const error = ref(null)

  const renderQR = async (text) => {
    if (!canvasRef.value || !text) return

    try {
      error.value = null
      await QRCode.toCanvas(canvasRef.value, text, {
        width: 256,
        margin: 1,
        color: {
          dark: '#111827',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
    } catch (err) {
      console.error('Failed to render QR Code on canvas:', err)
      error.value = err
    }
  }

  return {
    canvasRef,
    renderQR,
    error
  }
}
