import { DiscordJob, DiscordWorker } from '../lib/DiscordWorker'
import { apiFetch } from '../lib/api'
import saveToAPI from './saveToAPI'

export class JobData extends DiscordJob {
  declare data: DiscordJob['data'] & {
    companyName?: string
    description?: string
    wikidata: any
    fiscalYear: any
    childrenValues?: any
    approved?: boolean
  }
}

const checkDB = new DiscordWorker('checkDB', async (job: JobData) => {
  const {
    companyName,
    description,
    url,
    fiscalYear,
    wikidata,
    threadId,
    channelId,
  } = job.data

  const childrenValues = await job.getChildrenEntries()
  await job.updateData({ ...job.data, childrenValues })

  job.sendMessage(`🤖 kontrollerar om ${companyName} finns i API...`)
  const wikidataId = wikidata.node
  const existingCompany = await apiFetch(`/companies/${wikidataId}`).catch(
    () => null
  )

  if (!existingCompany) {
    const metadata = {
      source: url,
      comment: 'Created by Garbo AI',
    }

    job.sendMessage(
      `🤖 Ingen tidigare data hittad för ${companyName} (${wikidataId}). Skapar...`
    )
    const body = {
      name: companyName,
      description,
      wikidataId,
      metadata,
    }
    await apiFetch(`/companies`, { body })
  }

  const { scope12, scope3, biogenic, industry, economy, goals, initiatives } =
    childrenValues
  const base = {
    companyName,
    url,
    fiscalYear,
    wikidata,
    threadId,
    channelId,
  }

  // TODO convert to flow
  // Send to done, which is a simple worker to post a message to discord
  // Include the link to the company webpage, and the link to the JSON data for the company
  // Link to localhost or the production website
  // We want to know when all steps have been completed to print a message to discord

  if (scope12 || scope3 || biogenic) {
    await job.editMessage(`🤖 Skapar jobb för att spara utsläppsdata...`)
    saveToAPI.queue.add(companyName + ' emissions', {
      ...base,
      apiSubEndpoint: 'emissions',
      scope12,
      scope3,
      biogenic,
    })
  }

  if (industry) {
    await job.editMessage(`🤖 Skapar jobb för att spara branschdata...`)
    saveToAPI.queue.add(companyName + ' industry', {
      ...base,
      apiSubEndpoint: 'industry',
      industry,
    })
  }

  if (economy) {
    await job.editMessage(`🤖 Skapar jobb för att spara ekonomidata...`)
    saveToAPI.queue.add(companyName + ' economy', {
      ...base,
      apiSubEndpoint: 'economy',
      economy,
    })
  }

  if (goals) {
    await job.editMessage(`🤖 Skapar jobb för att spara mål...`)
    saveToAPI.queue.add(companyName + ' goals', {
      ...base,
      apiSubEndpoint: 'goals',
      goals,
    })
  }

  if (initiatives) {
    await job.editMessage(`🤖 Skapar jobb för att spara initiativ...`)
    saveToAPI.queue.add(companyName + ' initiatives', {
      ...base,
      apiSubEndpoint: 'initiatives',
      initiatives,
    })
  }

  return JSON.stringify(childrenValues, null, 2)
})

export default checkDB
