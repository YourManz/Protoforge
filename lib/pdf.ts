import type { ProtoforgeProject } from '@/types/project'

export async function exportToPDF(project: ProtoforgeProject) {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  const el = document.getElementById('project-export-root')
  if (!el) throw new Error('Export root not found')

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f172a',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgRatio = canvas.height / canvas.width
  const imgH = pageW * imgRatio

  let y = 0
  let remaining = imgH

  while (remaining > 0) {
    if (y > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
    y += pageH
    remaining -= pageH
  }

  pdf.save(`${project.title.replace(/\s+/g, '_')}.pdf`)
}
