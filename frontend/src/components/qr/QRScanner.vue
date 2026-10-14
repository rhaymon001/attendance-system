<template>
  <div class="relative w-full h-[470px] bg-gray-900 rounded-xl overflow-hidden flex flex-col justify-between p-4 shadow-sm select-none">
    <!-- Camera Video Element -->
    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="absolute inset-0 w-full h-full object-cover"
    ></video>

    <!-- Hidden Canvas for jsQR frame processing -->
    <canvas ref="canvasRef" class="hidden"></canvas>

    <!-- Fallback Gradient if camera loading / unpermitted -->
    <div
      v-if="!isStreaming"
      class="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 flex flex-col items-center justify-center p-6 text-center"
    >
      <template v-if="cameraError">
        <span class="material-symbols-outlined text-4xl text-red-500 mb-2">videocam_off</span>
        <h4 class="text-white text-sm font-semibold mb-1">Camera Access Required</h4>
        <p class="text-xs text-gray-400 max-w-xs mb-4">
          Please allow camera permission in your browser settings to scan the roll-call QR code.
        </p>
        <button
          type="button"
          class="px-4 py-2 bg-primary hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
          @click="startCamera"
        >
          Grant Access
        </button>
      </template>
      <template v-else>
        <span class="material-symbols-outlined animate-spin text-3xl text-primary mb-2">progress_activity</span>
        <span class="text-xs text-gray-400">Initializing camera feed...</span>
      </template>
    </div>

    <!-- Technical Optical Alignment Grid -->
    <svg class="absolute inset-0 w-full h-full opacity-20 pointer-events-none" height="100%" width="100%">
      <defs>
        <pattern height="32" id="grid" patternunits="userSpaceOnUse" width="32">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#ffffff" stroke-width="0.5"></path>
        </pattern>
      </defs>
      <rect fill="url(#grid)" height="100%" width="100%"></rect>
      <circle cx="50%" cy="46%" fill="none" r="130" stroke="#ffffff" stroke-dasharray="4 4" stroke-width="0.75"></circle>
      <line stroke="#ffffff" stroke-opacity="0.2" stroke-width="0.5" x1="50%" x2="50%" y1="0" y2="100%"></line>
      <line stroke="#ffffff" stroke-opacity="0.2" stroke-width="0.5" x1="0" x2="100%" y1="46%" y2="46%"></line>
    </svg>

    <!-- Top Viewfinder Header Overlay -->
    <div class="relative z-10 flex items-center justify-between w-full">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm">
        <span class="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span class="text-xs font-medium text-gray-900">{{ venueLabel }}</span>
      </div>
      <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-md">
        <span class="material-symbols-outlined text-sm text-blue-400">satellite_alt</span>
        <span class="text-xs font-medium">GPS Ready</span>
      </div>
    </div>

    <!-- Center QR Target Box & Animated Scanning Laser -->
    <div class="relative z-10 flex items-center justify-center my-auto">
      <div class="relative w-[260px] h-[260px] flex items-center justify-center">
        <!-- 4 Corner Focus Brackets -->
        <span class="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-primary rounded-tl-sm pointer-events-none"></span>
        <span class="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-primary rounded-tr-sm pointer-events-none"></span>
        <span class="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-primary rounded-bl-sm pointer-events-none"></span>
        <span class="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-primary rounded-br-sm pointer-events-none"></span>

        <!-- Center Crosshairs Reticle -->
        <div class="w-8 h-8 flex items-center justify-center opacity-40 pointer-events-none text-white">
          <span class="material-symbols-outlined text-2xl">filter_center_focus</span>
        </div>

        <!-- Vertically Pulsating Scanning Laser Line -->
        <div
          v-if="isStreaming"
          class="absolute left-1 right-1 h-[2.5px] bg-primary shadow-[0_0_12px_2px_#2563eb] rounded-full pointer-events-none animate-scan"
        ></div>
      </div>
    </div>

    <!-- Bottom Controls & Clear Optical Instructions -->
    <div class="relative z-10 flex flex-col items-center gap-3 w-full">
      <p class="text-sm font-medium text-white text-center tracking-tight drop-shadow-sm">
        Point camera at the QR code on the lecture screen
      </p>

      <!-- Optical Control Utility Buttons -->
      <div class="flex items-center justify-center gap-4">
        <!-- Torch Button -->
        <button
          v-if="supportsTorch"
          type="button"
          class="h-10 px-3.5 rounded-full backdrop-blur-md flex items-center justify-center gap-1.5 shadow-sm text-xs font-medium transition-all"
          :class="isTorchOn ? 'bg-primary text-white' : 'bg-white/90 text-gray-800 hover:bg-white'"
          @click="toggleTorch"
        >
          <span class="material-symbols-outlined text-lg">
            {{ isTorchOn ? 'flashlight_off' : 'flashlight_on' }}
          </span>
          <span>{{ isTorchOn ? 'Torch On' : 'Flash' }}</span>
        </button>

        <!-- Flip Camera Button -->
        <button
          type="button"
          class="h-10 px-3.5 rounded-full bg-white/90 hover:bg-white text-gray-800 backdrop-blur-md flex items-center justify-center gap-1.5 shadow-sm text-xs font-medium transition-all"
          @click="flipCamera"
        >
          <span class="material-symbols-outlined text-lg">flip_camera_ios</span>
          <span>Flip</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import jsQR from 'jsqr'

defineProps({
  venueLabel: {
    type: String,
    default: 'Geofence Active'
  }
})

const emit = defineEmits(['decoded', 'error'])

const videoRef = ref(null)
const canvasRef = ref(null)
const isStreaming = ref(false)
const cameraError = ref(false)
const facingMode = ref('environment')
const isTorchOn = ref(false)
const supportsTorch = ref(false)

let streamTrack = null
let animationFrameId = null
let hasDecoded = false

const startCamera = async () => {
  stopCamera()
  hasDecoded = false
  cameraError.value = false

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
      isStreaming.value = true
    }

    streamTrack = stream.getVideoTracks()[0]
    if (streamTrack) {
      const capabilities = streamTrack.getCapabilities ? streamTrack.getCapabilities() : {}
      supportsTorch.value = !!capabilities.torch
    }

    startScanningLoop()
  } catch (err) {
    console.error('Camera access error:', err)
    cameraError.value = true
    isStreaming.value = false
    emit('error', 'camera_denied')
  }
}

const stopCamera = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (streamTrack) {
    streamTrack.stop()
    streamTrack = null
  }
  if (videoRef.value && videoRef.value.srcObject) {
    const tracks = videoRef.value.srcObject.getTracks()
    tracks.forEach((t) => t.stop())
    videoRef.value.srcObject = null
  }
  isStreaming.value = false
}

const toggleTorch = async () => {
  if (!streamTrack || !supportsTorch.value) return
  try {
    isTorchOn.value = !isTorchOn.value
    await streamTrack.applyConstraints({
      advanced: [{ torch: isTorchOn.value }]
    })
  } catch (err) {
    console.warn('Could not toggle flashlight:', err)
  }
}

const flipCamera = async () => {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  await startCamera()
}

const startScanningLoop = () => {
  const scan = () => {
    if (hasDecoded) return

    if (
      videoRef.value &&
      canvasRef.value &&
      videoRef.value.readyState === videoRef.value.HAVE_ENOUGH_DATA
    ) {
      const video = videoRef.value
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      })

      if (code && code.data && !hasDecoded) {
        hasDecoded = true
        stopCamera()
        emit('decoded', code.data)
        return
      }
    }

    animationFrameId = requestAnimationFrame(scan)
  }

  animationFrameId = requestAnimationFrame(scan)
}

onMounted(() => {
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
@keyframes scan {
  0% {
    top: 5%;
  }
  50% {
    top: 92%;
  }
  100% {
    top: 5%;
  }
}

.animate-scan {
  animation: scan 2.2s ease-in-out infinite;
}
</style>
