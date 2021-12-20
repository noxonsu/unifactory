import puppeteer from 'puppeteer'
import fs from 'fs'

let link = 'http://localhost:9001/'

if (process.env.ACTIONS) {
  link = ``
}

// if it's true then you will be able to see puppeteer's browser
// Github flows don't work with that
const isDebug = true

export const createBrowser = async (): Promise<{
  browser: puppeteer.Browser
  page: puppeteer.Page
}> => {
  const browser = await puppeteer.launch({
    headless: !isDebug,
    // slowMo: 100,
  })

  const page = await browser.newPage()
  await page.setViewport({
    width: 1100,
    height: 1080,
  })

  page.on('error', (err) => {
    console.error('[puppeteer] error: ', err)
  })

  await page.goto(link)

  return { browser, page }
}

export const clickOn = async (params) => {
  const { page, selector } = params

  await page.$(selector).then(async (item) => {
    if (item) {
      item.click()
      await timeOut(1_000)
    } else {
      throw new Error(`Selector (${selector}) is not found`)
    }
  })
}

const screenPath = 'test/screenshots'

export const takeScreenshot = async (page: puppeteer.Page, fileName: string) => {
  const dir = screenPath

  if (!fs.existsSync(dir)) {
    await fs.mkdir(dir, (err) => {
      if (err) throw err

      console.log(`${screenPath} directory is created`)
    })
  }

  await page.screenshot({
    path: `${screenPath}/${fileName}.jpg`,
    type: 'jpeg',
  })
}

export const timeOut = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default {
  createBrowser,
  takeScreenshot,
  timeOut,
}
