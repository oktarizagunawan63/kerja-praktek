import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, MapPin, Shield, AlertTriangle, CheckCircle, X } from '@icons'
import Button from './Button'
import toast from 'react-hot-toast'

// No GPS validation - just capture coordinates

export default function CameraAttendance({ onCapture, onCancel, type = 'check-in', workLocations = [] }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [gpsData, setGpsData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validWorkLocation, setValidWorkLocation] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3 // Earth's radius in meters
    const phi1 = lat1 * Math.PI / 180
    const phi2 = lat2 * Math.PI / 180
    const deltaPhi = (lat2 - lat1) * Math.PI / 180
    const deltaLambda = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  // Check if current location is within any work location
  const validateWorkLocation = (currentLat, currentLng) => {
    if (!workLocations || workLocations.length === 0) {
      return { isValid: true, location: null, distance: 0 }
    }

    for (const location of workLocations) {
      const distance = calculateDistance(currentLat, currentLng, location.lat, location.lng)
      if (distance <= location.radius) {
        return { isValid: true, location, distance: Math.round(distance) }
      }
    }

    // Find closest location for error message
    const distances = workLocations.map(loc => ({
      ...loc,
      distance: calculateDistance(currentLat, currentLng, loc.lat, loc.lng)
    }))
    const closest = distances.reduce((min, loc) => loc.distance < min.distance ? loc : min)

    return { isValid: false, location: closest, distance: Math.round(closest.distance) }
  }

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

  // Get current location - no validation, just get coordinates
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung'))
        return
      }
      
      const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            provider: 'browser_geolocation'
          }
          
          // Validate work location (optional check, doesn't block)
          const workLocationCheck = validateWorkLocation(
            position.coords.latitude, 
            position.coords.longitude
          )
          
          setValidWorkLocation(workLocationCheck)
          setGpsData(locationData)
          
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
  }, [workLocations])

  // Capture photo - ALWAYS ALLOW
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Kamera belum siap')
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
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'
    context.fillRect(0, canvas.height - 100, canvas.width, 100)
    
    context.fillStyle = 'white'
    context.font = '16px Arial'
    const timestamp = new Date().toLocaleString('id-ID')
    
    let gpsText = 'GPS: Tidak tersedia'
    let locationText = 'Lokasi: Tidak diketahui'
    
    if (gpsData) {
      gpsText = `GPS: ${gpsData.latitude.toFixed(6)}, ${gpsData.longitude.toFixed(6)}`
      
      if (validWorkLocation?.location) {
        locationText = `Lokasi: ${validWorkLocation.location.name} (${validWorkLocation.distance}m)`
      } else {
        locationText = 'Lokasi: Valid'
      }
    }
    
    context.fillText(`${type.toUpperCase().replace('-', ' ')} - ${timestamp}`, 10, canvas.height - 75)
    context.fillText(gpsText, 10, canvas.height - 50)
    context.fillText(locationText, 10, canvas.height - 25)
    
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
  }, [gpsData, validWorkLocation, stream, type])

  // Submit attendance - ALWAYS ALLOW
  const submitAttendance = useCallback(async () => {
    if (!capturedImage) {
      toast.error('Foto tidak tersedia')
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
        
        // Simple status based on GPS availability
        let attendanceStatus = 'present'
        
        if (!gpsData) {
          attendanceStatus = 'no_gps'
        } else if (validWorkLocation && !validWorkLocation.isValid) {
          attendanceStatus = 'outside_area'
        }
        
        const attendanceData = {
          type,
          photo: base64Image,
          latitude: gpsData?.latitude || null,
          longitude: gpsData?.longitude || null,
          gps_data: gpsData || null,
          status: attendanceStatus,
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
  }, [capturedImage, gpsData, validWorkLocation, type, onCapture])

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl w-full h-full md:h-auto md:max-w-md md:w-full overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {type === 'check-in' ? 'Check In' : 
               type === 'check-out' ? 'Check Out' : 
               type === 'visit-photo' ? 'Ambil Foto Visit' : 'Kamera'} dengan Kamera
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X size={24} />
            </button>
          </div>

        {!isCapturing && !capturedImage && (
          <div className="text-center py-8">
            <Camera className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-4">
              Ambil foto {type === 'check-in' ? 'selfie untuk check in' : 
                         type === 'check-out' ? 'selfie untuk check out' :
                         type === 'visit-photo' ? 'bukti kunjungan' : 'dengan kamera'}
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
                    <span className="text-green-400">GPS Active</span>
                  ) : (
                    <span className="text-yellow-400">Getting GPS...</span>
                  )}
                </div>
              </div>
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
                  {gpsData.altitude && (
                    <p>Ketinggian: {gpsData.altitude.toFixed(1)} meter</p>
                  )}
                </div>
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
    </div>
  )
}
