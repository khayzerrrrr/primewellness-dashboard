import { test, expect } from '@playwright/test'

test('homepage loads and has title', async ({ page }) => {
  const base = process.env.BASE_URL || 'http://localhost:3000'
  await page.goto(base)
  const title = await page.title()
  expect(title.toLowerCase()).toContain('prime wellness')
})
