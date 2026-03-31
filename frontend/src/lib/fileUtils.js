/**
 * Convert File object to base64 data URL
 * Bisa disimpan di localStorage dan tetap bisa dipreview/download
 */
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result) // data:image/png;base64,...
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

/**
 * Trigger download dari base64 atau blob URL
 */
export const downloadFile = (url, fileName) => {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'file'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
