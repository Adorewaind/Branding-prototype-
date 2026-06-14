import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts, RGB } from 'pdf-lib'

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

const W = 612
const H = 792
const MARGIN = 40

async function drawHeader(page: Awaited<ReturnType<PDFDocument['addPage']>>, title: string, subtitle: string, accent: RGB, boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>) {
  page.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: accent })
  page.drawText(title, { x: MARGIN, y: H - 48, size: 22, font: boldFont, color: rgb(1, 1, 1) })
  if (subtitle) {
    page.drawText(subtitle, { x: MARGIN, y: H - 66, size: 10, font: boldFont, color: rgb(1, 1, 1, ) })
  }
}

function drawSectionLabel(page: Awaited<ReturnType<PDFDocument['addPage']>>, text: string, y: number, boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>, accent: RGB) {
  page.drawText(text, { x: MARGIN, y, size: 9, font: boldFont, color: accent })
}

function drawLine(page: Awaited<ReturnType<PDFDocument['addPage']>>, x1: number, y: number, x2: number) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
}

function drawCheckbox(page: Awaited<ReturnType<PDFDocument['addPage']>>, x: number, y: number) {
  page.drawRectangle({ x, y, width: 11, height: 11, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.8, color: rgb(1, 1, 1) })
}

function drawFooter(page: Awaited<ReturnType<PDFDocument['addPage']>>, authorName: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>) {
  if (authorName) {
    page.drawText(`© ${authorName} — Personal & Commercial Use`, { x: MARGIN, y: 18, size: 7, font, color: rgb(0.7, 0.7, 0.7) })
  }
  page.drawLine({ start: { x: MARGIN, y: 28 }, end: { x: W - MARGIN, y: 28 }, thickness: 0.4, color: rgb(0.85, 0.85, 0.85) })
}

export async function POST(req: NextRequest) {
  const { template, title, subtitle, accentColor, authorName } = await req.json()
  const accent = hexToRgb(accentColor || '#6b8cff')

  const doc = await PDFDocument.create()
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const page = doc.addPage([W, H])

  const t = title || 'My Planner'
  const s = subtitle || ''
  const auth = authorName || ''

  if (template === 'daily-planner') {
    await drawHeader(page, t, s, accent, boldFont)
    let y = H - 100

    page.drawText('DATE: _____________________   DAY: _____________________', { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 24

    drawSectionLabel(page, "TODAY'S PRIORITIES", y, boldFont, accent)
    y -= 14
    for (let i = 1; i <= 3; i++) {
      drawCheckbox(page, MARGIN, y)
      page.drawText(`${i}.`, { x: MARGIN + 16, y: y + 2, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
      drawLine(page, MARGIN + 28, y + 2, W - MARGIN)
      y -= 20
    }
    y -= 8

    drawSectionLabel(page, 'TIME BLOCKS', y, boldFont, accent)
    y -= 14
    const times = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM']
    for (const time of times) {
      page.drawText(time, { x: MARGIN, y: y + 2, size: 7, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
      drawLine(page, MARGIN + 38, y + 2, W - MARGIN)
      y -= 18
    }
    y -= 6

    drawSectionLabel(page, 'NOTES', y, boldFont, accent)
    y -= 14
    for (let i = 0; i < 5; i++) {
      drawLine(page, MARGIN, y, W - MARGIN)
      y -= 18
    }
    y -= 6

    drawSectionLabel(page, 'WATER INTAKE', y, boldFont, accent)
    y -= 14
    for (let i = 0; i < 8; i++) {
      page.drawCircle({ x: MARGIN + 10 + i * 22, y: y + 5, size: 7, borderColor: accent, borderWidth: 0.8, color: rgb(1, 1, 1) })
    }

    drawFooter(page, auth, font)
  }

  else if (template === 'weekly-planner') {
    await drawHeader(page, t, s, accent, boldFont)
    let y = H - 100

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    const colW = (W - MARGIN * 2) / 7
    for (let d = 0; d < 7; d++) {
      const x = MARGIN + d * colW
      page.drawRectangle({ x, y: y - 16, width: colW - 2, height: 16, color: rgb(0.96, 0.96, 0.98) })
      page.drawText(days[d], { x: x + 4, y: y - 12, size: 8, font: boldFont, color: accent })
    }
    y -= 20
    for (let row = 0; row < 12; row++) {
      for (let d = 0; d < 7; d++) {
        const x = MARGIN + d * colW
        drawLine(page, x + 2, y, x + colW - 4)
      }
      y -= 18
    }
    y -= 12

    drawSectionLabel(page, 'GOALS THIS WEEK', y, boldFont, accent)
    y -= 14
    for (let i = 0; i < 5; i++) {
      drawCheckbox(page, MARGIN, y)
      drawLine(page, MARGIN + 16, y + 2, W - MARGIN)
      y -= 18
    }
    y -= 8

    drawSectionLabel(page, 'NOTES', y, boldFont, accent)
    y -= 14
    page.drawRectangle({ x: MARGIN, y: y - 50, width: W - MARGIN * 2, height: 54, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5, color: rgb(0.99, 0.99, 0.99) })

    drawFooter(page, auth, font)
  }

  else if (template === 'habit-tracker') {
    await drawHeader(page, t, s, accent, boldFont)
    let y = H - 100

    page.drawText('MONTH: _______________________', { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 24

    const labelW = 130
    const cellW = (W - MARGIN * 2 - labelW) / 31

    page.drawText('HABIT', { x: MARGIN + 4, y: y - 10, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) })
    for (let d = 1; d <= 31; d++) {
      page.drawText(String(d), { x: MARGIN + labelW + (d - 1) * cellW + cellW / 2 - 3, y: y - 10, size: 6, font: boldFont, color: rgb(0.4, 0.4, 0.4) })
    }
    y -= 16

    for (let h = 0; h < 8; h++) {
      page.drawRectangle({ x: MARGIN, y: y - 16, width: labelW, height: 16, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.4, color: rgb(0.99, 0.99, 0.99) })
      for (let d = 0; d < 31; d++) {
        page.drawRectangle({ x: MARGIN + labelW + d * cellW, y: y - 16, width: cellW, height: 16, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.4, color: rgb(1, 1, 1) })
      }
      y -= 16
    }
    y -= 12

    drawSectionLabel(page, 'NOTES', y, boldFont, accent)
    y -= 14
    for (let i = 0; i < 4; i++) {
      drawLine(page, MARGIN, y, W - MARGIN)
      y -= 18
    }

    drawFooter(page, auth, font)
  }

  else if (template === 'budget-tracker') {
    await drawHeader(page, t, s, accent, boldFont)
    let y = H - 100

    page.drawText('MONTH: _______________________   YEAR: ____________', { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 22

    const drawTable = (label: string, rows: number) => {
      drawSectionLabel(page, label, y, boldFont, accent)
      y -= 14
      const cols = [140, 80, W - MARGIN * 2 - 220]
      const headers = ['CATEGORY', 'AMOUNT', 'NOTES']
      let x = MARGIN
      for (let i = 0; i < 3; i++) {
        page.drawRectangle({ x, y: y - 14, width: cols[i], height: 14, color: rgb(0.93, 0.93, 0.97) })
        page.drawText(headers[i], { x: x + 4, y: y - 10, size: 7, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
        x += cols[i]
      }
      y -= 14
      for (let r = 0; r < rows; r++) {
        x = MARGIN
        for (let i = 0; i < 3; i++) {
          page.drawRectangle({ x, y: y - 14, width: cols[i], height: 14, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.4, color: rgb(1, 1, 1) })
          x += cols[i]
        }
        y -= 14
      }
      y -= 8
    }

    drawTable('INCOME', 4)
    drawTable('EXPENSES', 7)

    drawSectionLabel(page, 'SUMMARY', y, boldFont, accent)
    y -= 14
    for (const label of ['Total Income:', 'Total Expenses:', 'Difference:']) {
      page.drawText(label, { x: MARGIN, y: y - 10, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
      drawLine(page, MARGIN + 100, y - 8, MARGIN + 220)
      y -= 18
    }

    drawFooter(page, auth, font)
  }

  else if (template === 'gratitude-journal') {
    await drawHeader(page, t, s, accent, boldFont)
    let y = H - 100

    page.drawText('DATE: _____________________', { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 26

    const sections = [
      { label: 'I AM GRATEFUL FOR...', lines: 4 },
      { label: "TODAY'S INTENTION", lines: 3 },
      { label: 'POSITIVE AFFIRMATION', lines: 2 },
      { label: 'END OF DAY REFLECTION', lines: 4 },
    ]

    for (const sec of sections) {
      drawSectionLabel(page, sec.label, y, boldFont, accent)
      y -= 14
      for (let i = 0; i < sec.lines; i++) {
        drawLine(page, MARGIN, y, W - MARGIN)
        y -= 18
      }
      y -= 10
    }

    page.drawText('MOOD TODAY:', { x: MARGIN, y, size: 8, font: boldFont, color: accent })
    const moods = ['😊', '😐', '😔', '😤', '😴']
    page.drawText(moods.join('  '), { x: MARGIN + 80, y, size: 11, font, color: rgb(0.5, 0.5, 0.5) })

    drawFooter(page, auth, font)
  }

  else if (template === 'meal-planner') {
    await drawHeader(page, t, s, accent, boldFont)
    let y = H - 100

    page.drawText('WEEK OF: _____________________', { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 18

    const days2 = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    const meals = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS']
    const mealW = (W - MARGIN * 2 - 60) / 4
    const rowH = 52

    page.drawText('DAY', { x: MARGIN + 4, y: y - 10, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) })
    for (let m = 0; m < 4; m++) {
      page.drawRectangle({ x: MARGIN + 60 + m * mealW, y: y - 16, width: mealW, height: 16, color: rgb(0.93, 0.93, 0.97) })
      page.drawText(meals[m], { x: MARGIN + 60 + m * mealW + 4, y: y - 11, size: 7, font: boldFont, color: accent })
    }
    y -= 16

    for (const day of days2) {
      page.drawRectangle({ x: MARGIN, y: y - rowH, width: 58, height: rowH, color: rgb(0.95, 0.95, 0.98) })
      page.drawText(day, { x: MARGIN + 4, y: y - 22, size: 7, font: boldFont, color: accent })
      for (let m = 0; m < 4; m++) {
        page.drawRectangle({ x: MARGIN + 60 + m * mealW, y: y - rowH, width: mealW, height: rowH, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.4, color: rgb(1, 1, 1) })
      }
      y -= rowH
    }
    y -= 12

    drawSectionLabel(page, 'GROCERY LIST', y, boldFont, accent)
    y -= 14
    const colW2 = (W - MARGIN * 2) / 2
    for (let i = 0; i < 6; i++) {
      drawCheckbox(page, MARGIN, y)
      drawLine(page, MARGIN + 16, y + 2, MARGIN + colW2 - 8)
      drawCheckbox(page, MARGIN + colW2, y)
      drawLine(page, MARGIN + colW2 + 16, y + 2, W - MARGIN)
      y -= 18
    }

    drawFooter(page, auth, font)
  }

  else if (template === 'checklist') {
    await drawHeader(page, t, s, accent, boldFont)
    let y = H - 100

    for (let i = 0; i < 30; i++) {
      drawCheckbox(page, MARGIN, y)
      drawLine(page, MARGIN + 18, y + 2, W - MARGIN)
      y -= 20
      if (y < 80) break
    }

    drawSectionLabel(page, 'NOTES', y - 4, boldFont, accent)
    drawFooter(page, auth, font)
  }

  else if (template === 'goal-setting') {
    await drawHeader(page, t, s || 'GOAL SETTING WORKSHEET', accent, boldFont)
    let y = H - 100

    drawSectionLabel(page, 'MY MAIN GOAL', y, boldFont, accent)
    y -= 14
    for (let i = 0; i < 3; i++) { drawLine(page, MARGIN, y, W - MARGIN); y -= 18 }
    y -= 6

    drawSectionLabel(page, 'WHY THIS MATTERS TO ME', y, boldFont, accent)
    y -= 14
    for (let i = 0; i < 2; i++) { drawLine(page, MARGIN, y, W - MARGIN); y -= 18 }
    y -= 6

    drawSectionLabel(page, 'ACTION STEPS', y, boldFont, accent)
    y -= 14
    for (let i = 1; i <= 5; i++) {
      page.drawText(`${i}.`, { x: MARGIN, y: y + 2, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
      drawLine(page, MARGIN + 14, y + 2, W - MARGIN)
      y -= 16
      drawLine(page, MARGIN + 18, y + 2, W - MARGIN)
      y -= 18
    }
    y -= 4

    drawSectionLabel(page, 'POTENTIAL OBSTACLES & SOLUTIONS', y, boldFont, accent)
    y -= 14
    const obsW = (W - MARGIN * 2) / 2
    page.drawText('OBSTACLE', { x: MARGIN + 4, y: y - 10, size: 7, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
    page.drawText('SOLUTION', { x: MARGIN + obsW + 4, y: y - 10, size: 7, font: boldFont, color: rgb(0.5, 0.5, 0.5) })
    y -= 14
    for (let i = 0; i < 3; i++) {
      drawLine(page, MARGIN, y, MARGIN + obsW - 8)
      drawLine(page, MARGIN + obsW, y, W - MARGIN)
      y -= 18
    }
    y -= 8

    page.drawText('TARGET DATE: ________________________', { x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    page.drawText('ACCOUNTABILITY PARTNER: ________________________', { x: MARGIN + 220, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 20

    drawSectionLabel(page, 'MILESTONES', y, boldFont, accent)
    y -= 14
    const msW = (W - MARGIN * 2 - 16) / 3
    for (let i = 0; i < 3; i++) {
      page.drawRectangle({ x: MARGIN + i * (msW + 8), y: y - 44, width: msW, height: 44, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5, color: rgb(0.99, 0.99, 0.99) })
      page.drawText(`MILESTONE ${i + 1}`, { x: MARGIN + i * (msW + 8) + 6, y: y - 12, size: 7, font: boldFont, color: accent })
    }

    drawFooter(page, auth, font)
  }

  const pdfBytes = await doc.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${template}-by-${(authorName || 'me').replace(/\s+/g, '-').toLowerCase()}.pdf"`,
    },
  })
}
