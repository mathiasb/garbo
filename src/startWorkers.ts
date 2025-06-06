import discord from './discord'
import { workers } from './workers'

console.log('Starting workers...')

Promise.all(workers.map((worker) => worker.run()))
  .then((results) => results.join('\n'))
  .then(console.log)

await discord.login()
console.log('Discord bot started')
