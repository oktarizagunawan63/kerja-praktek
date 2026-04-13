import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, MapPin, Shield, AlertTriangle, CheckCircle, X } from 'lucide-react'
import Button from './Button'
import toast from 'react-hot-toast'

// GPS accuracy validation
const MIN_GPS_ACCURACY = 50 // meters
const MAX_GPS_AGE = 30000 // 30 seconds

// Anti-fake GPS detection
const detectFakeGPS = (position) => {
  const warnings = []
  
  // Check accuracy - fake GPS often has perfect accuracy
  if (position.coords.accuracy < 5) {
    warnings.push('GPS accuracy suspiciously high')
  }
  
  // Check if coordinates are too precise (fake GPS often uses exact decimals)
  const lat = position.coords.latitude
  const lng = position.coords.longitude
  const latDecimals = lat.toString().split('.')[1]?.length || 0
  const lngDecimals = lng.toString().split('.')[1]?.length || 0
  
  if (latDecimals > 10 || lngDecimals > 10) {
    warnings.push('GPS coordinates suspiciously precise')
  }
  
  // Check for common fake GPS coordinates (0,0 or other obvious fakes)
  if ((lat === 0 && lng === 0) || 
      (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001)) {
    warnings.push('Invalid GPS coordinates detected')
  }
  
  // Check timestamp - fake GPS might have old timestamps
  const now = Date.now()
  const gpsTime = position.timestamp
  if (now - gpsTime > MAX_GPS_AGE) {
    warnings.push('GPS data is too old')
  }
  
  return warnings
}

export default function CameraAttendance({ onCapture, onCancel, type = 'check-in' }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [gpsData, setGpsData] = useState(null)
  const [gpsWarnings, setGpsWarnings] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true)
      
      // Request camera with high quality
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user', // Front camera for selfie
          frameRate: { ideal: 30 }
        },
        audio: false
      })
      
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
      
      // Get GPS location immediately
      await getCurrentLocation()
      
    } catch (error) {
      console.error('Camera access error:', error)
      toast.error('Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.')
      setIsCapturing(false)
    }
  }, [])

  // Get current location with anti-fake GPS
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung'))
        return
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Force fresh GPS reading
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Anti-fake GPS detection
          const warnings = detectFakeGPS(position)
          setGpsWarnings(warnings)
          
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          }
          
          setGpsData(locationData)
          
          if (warnings.length > 0) {
            toast.error(`GPS Warning: ${warnings.join(', ')}`)
          } else {
            toast.success(`GPS acquired: ±${Math.round(position.coords.accuracy)}m accuracy`)
          }
          
          resolve(locationData)
        },
        (error) => {
          let message = 'Gagal mendapatkan lokasi GPS'
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Akses GPS ditolak. Mohon izinkan akses lokasi.'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'GPS tidak tersedia. Pastikan GPS aktif.'
              break
            case error.TIMEOUT:
              message = 'Timeout GPS. Coba lagi di area dengan sinyal GPS yang baik.'
              break
          }
          toast.error(message)
          reject(new Error(message))
        },
        options
      )
    })
  }, [])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !gpsData) {
      toast.error('Kamera atau GPS belum siap')
      return
    }
    
    if (gpsWarnings.length > 0) {
      toast.error('Tidak dapat melanjutkan karena ada warning GPS')
      return
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Add timestamp and GPS overlay
    context.fillStyle = 'rgba(0, 0, 0, 0.7)'
    context.fillRect(0, canvas.height - 100, canvas.width, 100)
    
    context.fillStyle = 'white'
    context.font = '16px Arial'
    const timestamp = new Date().toLocaleString('id-ID')
    const gpsText = `GPS: ${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)} (±${Math.round(gpsData.accuracy)}m)`
    
    context.fillText(`${type.toUpperCase()} - ${timestamp}`, 10, canvas.height - 70)
    context.fillText(gpsText, 10, canvas.height - 45)
    context.fillText(`Accuracy: ${Math.round(gpsData.accuracy)}m | Alt: ${gpsData.altitude?.toFixed(1) || 'N/A'}m`, 10, canvas.height - 20)
    
    // Convert to blob
    canvas.toBlob((blob) => {
      const imageUrl = URL.createObjectURL(blob)
      setCapturedImage(imageUrl)
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }, 'image/jpeg', 0.9)
  }, [gpsData, gpsWarnings, stream, type])

  // Submit attendance
  const submitAttendance = useCallback(async () => {
    if (!capturedImage || !gpsData) {
      toast.error('Foto atau data GPS tidak lengkap')
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Convert image to base64
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const reader = new FileReader()
      
      reader.onloadend = () => {
        const base64Image = reader.result
        
        const attendanceData = {
          type,
          photo: base64Image,
          gps: gpsData,
          gps_warnings: gpsWarnings,
          timestamp: new Date().toISOString(),
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        }
        
        onCapture(attendanceData)
      }
      
      reader.readAsDataURL(blob)
      
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Gagal mengirim data attendance')
      setIsProcessing(false)
    }
  }, [capturedImage, gpsData, gpsWarnings, type, onCapture])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [stream, capturedImage])

  // Retake photo
  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
      setCapturedImage(null)
    }
    startCamera()
  }, [capturedImage, startCamera])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'check-in' ? 'Check In' : 'Check Out'} dengan Kamera
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {!isCapturing && !capturedImage && (
          <div className="text-center py-8">
            <Camera className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-4">
              Ambil foto selfie untuk {type === 'check-in' ? 'check in' : 'check out'}
            </p>
            <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
              <Camera size={16} />
              Buka Kamera
            </Button>
          </div>
        )}

        {isCapturing && !capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* GPS Status Overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  {gpsData ? (
                    <span className="text-green-400">GPS Ready</span>
                  ) : (
                    <span className="text-yellow-400">Getting GPS...</span>
                  )}
                </div>
              </div>
              
              {/* GPS Warnings */}
              {gpsWarnings.length > 0 && (
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs">
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>GPS Warning</span>
                  </div>
                </div>
              )}
            </div>

            {/* GPS Info */}
            {gpsData && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="text-green-600" size={16} />
                  <span className="font-medium">GPS Information</span>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p>Koordinat: {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)}</p>
                  <p>Akurasi: ±{Math.round(gpsData.accuracy)} meter</p>
                  {gpsData.altitude && (
                    <p>Ketinggian: {gpsData.altitude.toFixed(1)} meter</p>
                  )}
                </div>
                
                {gpsWarnings.length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700 text-xs font-medium">Peringatan GPS:</p>
                    {gpsWarnings.map((warning, index) => (
                      <p key={index} className="text-red-600 text-xs">• {warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={!gpsData || gpsWarnings.length > 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Camera size={16} />
                Ambil Foto
              </Button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured attendance"
                className="w-full rounded-lg"
              />
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-green-600" size={16} />
                <span className="font-medium text-green-800">Foto Berhasil Diambil</span>
              </div>
              <p className="text-green-700 text-sm">
                Foto sudah dilengkapi dengan timestamp dan data GPS
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
              >
                Ambil Ulang
              </Button>
              <Button
                onClick={submitAttendance}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? 'Mengirim...' : `${type === 'check-in' ? 'Check In' : 'Check Out'}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}