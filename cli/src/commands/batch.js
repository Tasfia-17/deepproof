import fs from 'fs'
import path from 'path'
import axios from 'axios'
import chalk from 'chalk'
import ora from 'ora'
import FormData from 'form-data'

const API_URL = process.env.DEEPPROOF_API_URL || 'http://localhost:3001'

export async function batch(directory, options) {
  if (!fs.existsSync(directory)) {
    console.error(chalk.red('✗ Directory not found'))
    process.exit(1)
  }

  const files = fs.readdirSync(directory)
    .filter(f => /\.(jpg|jpeg|png|webp|mp4|webm|mov)$/i.test(f))
    .map(f => path.join(directory, f))

  if (files.length === 0) {
    console.error(chalk.red('✗ No media files found'))
    process.exit(1)
  }

  console.log(chalk.bold(`Found ${files.length} files\n`))

  const results = []
  for (const file of files) {
    const spinner = ora(`Processing ${path.basename(file)}...`).start()
    
    try {
      const form = new FormData()
      form.append('file', fs.createReadStream(file))
      if (options.address) form.append('recipientAddress', options.address)

      const { data } = await axios.post(`${API_URL}/detect`, form, {
        headers: form.getHeaders()
      })

      spinner.succeed(`${path.basename(file)} → ${data.jobId}`)
      results.push({ file: path.basename(file), jobId: data.jobId })
    } catch (e) {
      spinner.fail(`${path.basename(file)} failed`)
      results.push({ file: path.basename(file), error: e.message })
    }
  }

  console.log(chalk.bold(`\n${results.filter(r => r.jobId).length}/${files.length} submitted`))
}
