import { useState, useEffect } from 'react'
import { MapPin, ChevronDown, Search } from 'lucide-react'

// Data provinsi dan kota/kabupaten Indonesia (sample data - bisa diperluas)
const INDONESIA_LOCATIONS = {
  'DKI Jakarta': [
    'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur', 'Kepulauan Seribu'
  ],
  'Jawa Barat': [
    'Bandung', 'Bekasi', 'Bogor', 'Cirebon', 'Depok', 'Sukabumi', 'Tasikmalaya', 'Banjar', 'Cimahi',
    'Bandung Barat', 'Cianjur', 'Garut', 'Indramayu', 'Karawang', 'Kuningan', 'Majalengka', 'Pangandaran',
    'Purwakarta', 'Subang', 'Sumedang', 'Ciamis'
  ],
  'Jawa Tengah': [
    'Semarang', 'Solo', 'Yogyakarta', 'Magelang', 'Pekalongan', 'Salatiga', 'Tegal', 'Banyumas',
    'Batang', 'Blora', 'Boyolali', 'Brebes', 'Cilacap', 'Demak', 'Grobogan', 'Jepara', 'Karanganyar',
    'Kebumen', 'Kendal', 'Klaten', 'Kudus', 'Pati', 'Pemalang', 'Purbalingga', 'Purworejo', 'Rembang',
    'Sragen', 'Temanggung', 'Wonogiri', 'Wonosobo'
  ],
  'Jawa Timur': [
    'Surabaya', 'Malang', 'Kediri', 'Blitar', 'Madiun', 'Mojokerto', 'Pasuruan', 'Probolinggo', 'Batu',
    'Bangkalan', 'Banyuwangi', 'Bojonegoro', 'Bondowoso', 'Gresik', 'Jember', 'Jombang', 'Lamongan',
    'Lumajang', 'Magetan', 'Nganjuk', 'Ngawi', 'Pacitan', 'Pamekasan', 'Ponorogo', 'Sampang', 'Sidoarjo',
    'Situbondo', 'Sumenep', 'Trenggalek', 'Tuban', 'Tulungagung'
  ],
  'Banten': [
    'Tangerang', 'Tangerang Selatan', 'Cilegon', 'Serang', 'Lebak', 'Pandeglang'
  ],
  'Bali': [
    'Denpasar', 'Badung', 'Bangli', 'Buleleng', 'Gianyar', 'Jembrana', 'Karangasem', 'Klungkung', 'Tabanan'
  ],
  'Sumatera Utara': [
    'Medan', 'Binjai', 'Gunungsitoli', 'Padangsidimpuan', 'Pematangsiantar', 'Sibolga', 'Tanjungbalai', 'Tebing Tinggi',
    'Asahan', 'Batubara', 'Dairi', 'Deli Serdang', 'Humbang Hasundutan', 'Karo', 'Labuhanbatu', 'Langkat',
    'Mandailing Natal', 'Nias', 'Pakpak Bharat', 'Samosir', 'Serdang Bedagai', 'Simalungun', 'Tapanuli Selatan',
    'Tapanuli Tengah', 'Tapanuli Utara', 'Toba Samosir'
  ],
  'Sumatera Barat': [
    'Padang', 'Bukittinggi', 'Padangpanjang', 'Pariaman', 'Payakumbuh', 'Sawahlunto', 'Solok',
    'Agam', 'Dharmasraya', 'Kepulauan Mentawai', 'Lima Puluh Kota', 'Padang Pariaman', 'Pasaman',
    'Pasaman Barat', 'Pesisir Selatan', 'Sijunjung', 'Solok Selatan', 'Tanah Datar'
  ],
  'Riau': [
    'Pekanbaru', 'Dumai', 'Bengkalis', 'Indragiri Hilir', 'Indragiri Hulu', 'Kampar', 'Kepulauan Meranti',
    'Kuantan Singingi', 'Pelalawan', 'Rokan Hilir', 'Rokan Hulu', 'Siak'
  ],
  'Sumatera Selatan': [
    'Palembang', 'Lubuklinggau', 'Pagar Alam', 'Prabumulih', 'Banyuasin', 'Empat Lawang', 'Lahat',
    'Muara Enim', 'Musi Banyuasin', 'Musi Rawas', 'Ogan Ilir', 'Ogan Komering Ilir', 'Ogan Komering Ulu',
    'Ogan Komering Ulu Selatan', 'Ogan Komering Ulu Timur'
  ],
  'Kalimantan Timur': [
    'Samarinda', 'Balikpapan', 'Bontang', 'Berau', 'Kutai Barat', 'Kutai Kartanegara', 'Kutai Timur',
    'Mahakam Ulu', 'Paser', 'Penajam Paser Utara'
  ],
  'Sulawesi Selatan': [
    'Makassar', 'Palopo', 'Parepare', 'Bantaeng', 'Barru', 'Bone', 'Bulukumba', 'Enrekang', 'Gowa',
    'Jeneponto', 'Luwu', 'Luwu Timur', 'Luwu Utara', 'Maros', 'Pangkep', 'Pinrang', 'Selayar',
    'Sidenreng Rappang', 'Sinjai', 'Soppeng', 'Takalar', 'Tana Toraja', 'Toraja Utara', 'Wajo'
  ]
}

export default function EnhancedLocationSelect({ 
  value = {}, 
  onChange, 
  error,
  disabled = false,
  required = false 
}) {
  const [searchProvince, setSearchProvince] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)

  const provinces = Object.keys(INDONESIA_LOCATIONS)
  
  // Filter provinces based on search
  const filteredProvinces = provinces.filter(province =>
    province.toLowerCase().includes(searchProvince.toLowerCase())
  )

  // Get cities for selected province
  const cities = value.province ? INDONESIA_LOCATIONS[value.province] || [] : []
  
  // Filter cities based on search
  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchCity.toLowerCase())
  )

  // Handle province selection
  const handleProvinceSelect = (province) => {
    onChange({
      ...value,
      province,
      city: '' // Reset city when province changes
    })
    setShowProvinceDropdown(false)
    setSearchProvince('')
  }

  // Handle city selection
  const handleCitySelect = (city) => {
    onChange({
      ...value,
      city
    })
    setShowCityDropdown(false)
    setSearchCity('')
  }

  // Handle other field changes
  const handleFieldChange = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  // Generate full location string for display
  const getLocationString = () => {
    const parts = []
    if (value.address) parts.push(value.address)
    if (value.city) parts.push(value.city)
    if (value.province) parts.push(value.province)
    if (value.postalCode) parts.push(value.postalCode)
    return parts.join(', ')
  }

  return (
    <div className="space-y-3">
      {/* Provinsi dan Kota/Kabupaten */}
      <div className="grid grid-cols-2 gap-3">
        {/* Provinsi Dropdown */}
        <div className="relative">
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Provinsi {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && setShowProvinceDropdown(!showProvinceDropdown)}
              disabled={disabled}
              className={`w-full px-3 py-2 text-sm border rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                error?.province 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            >
              <span className={value.province ? 'text-gray-900' : 'text-gray-500'}>
                {value.province || 'Pilih Provinsi'}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {/* Provinsi Dropdown */}
            {showProvinceDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchProvince}
                      onChange={(e) => setSearchProvince(e.target.value)}
                      placeholder="Cari provinsi..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                {/* Options */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredProvinces.length === 0 ? (
                    <div className="py-3 px-3 text-sm text-gray-500 text-center">
                      Provinsi tidak ditemukan
                    </div>
                  ) : (
                    filteredProvinces.map((province) => (
                      <button
                        key={province}
                        type="button"
                        onClick={() => handleProvinceSelect(province)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          value.province === province ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        {province}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {error?.province && (
            <p className="text-xs text-red-500 mt-1">{error.province}</p>
          )}
        </div>

        {/* Kota/Kabupaten Dropdown */}
        <div className="relative">
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Kota/Kabupaten {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && value.province && setShowCityDropdown(!showCityDropdown)}
              disabled={disabled || !value.province}
              className={`w-full px-3 py-2 text-sm border rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                error?.city 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled || !value.province ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
            >
              <span className={value.city ? 'text-gray-900' : 'text-gray-500'}>
                {value.city || (value.province ? 'Pilih Kota/Kabupaten' : 'Pilih provinsi dulu')}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {/* Kota Dropdown */}
            {showCityDropdown && value.province && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder="Cari kota/kabupaten..."
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                {/* Options */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCities.length === 0 ? (
                    <div className="py-3 px-3 text-sm text-gray-500 text-center">
                      Kota/Kabupaten tidak ditemukan
                    </div>
                  ) : (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          value.city === city ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        {city}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {error?.city && (
            <p className="text-xs text-red-500 mt-1">{error.city}</p>
          )}
        </div>
      </div>

      {/* Alamat Lengkap */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Alamat Lengkap {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
          <textarea
            value={value.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
            placeholder="Jalan, nomor, RT/RW, kelurahan, kecamatan..."
            disabled={disabled}
            rows={2}
            className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error?.address 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
          />
        </div>
        {error?.address && (
          <p className="text-xs text-red-500 mt-1">{error.address}</p>
        )}
      </div>

      {/* Kode Pos */}
      <div className="w-1/2">
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Kode Pos <span className="text-gray-400">(opsional)</span>
        </label>
        <input
          type="text"
          value={value.postalCode || ''}
          onChange={(e) => {
            // Only allow numbers and limit to 5 digits
            const val = e.target.value.replace(/\D/g, '').slice(0, 5)
            handleFieldChange('postalCode', val)
          }}
          placeholder="12345"
          disabled={disabled}
          maxLength={5}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            error?.postalCode 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-200 hover:border-gray-300'
          } ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
        />
        {error?.postalCode && (
          <p className="text-xs text-red-500 mt-1">{error.postalCode}</p>
        )}
      </div>

      {/* Preview Lokasi Lengkap */}
      {(value.province || value.city || value.address) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-700 mb-1">Preview Lokasi:</p>
              <p className="text-sm text-blue-800 leading-relaxed">
                {getLocationString() || 'Lengkapi form untuk melihat preview lokasi'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdowns when clicking outside */}
      {(showProvinceDropdown || showCityDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowProvinceDropdown(false)
            setShowCityDropdown(false)
          }}
        />
      )}
    </div>
  )
}