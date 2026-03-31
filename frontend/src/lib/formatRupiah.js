/**
 * Format angka ke Rupiah singkat
 * 1000000000 → Rp 1 M
 * 500000000  → Rp 500 Jt
 * 1500000    → Rp 1,5 Jt
 * 750000     → Rp 750 Rb
 * 5000       → Rp 5.000
 */
export const formatRupiah = (val) => {
  const n = parseFloat(val) || 0
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Jt`
  if (n >= 1_000)         return `Rp ${(n / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}
