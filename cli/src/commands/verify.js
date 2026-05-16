import fs from 'fs'
import axios from 'axios'
import chalk from 'chalk'
import ora from 'ora'
import FormData from 'form-data'

const API_URL = process.env.DEEPPROOF_API_URL || 'http://localhost:3001'

export async function verify(file, options) {
  if (!fs.existsSync(file)) {
    console.error(chalk.red('✗ File not found'))
    process.exit(1)
  }

  const spinner = ora('Uploading to 0G Storage...').start()
  
  try {
    const form = new FormData()
    form.append('file', fs.createReadStream(file))
    if (options.address) form.append('recipientAddress', options.address)

    const { data } = await axios.post(`${API_URL}/detect`, form, {
      headers: form.getHeaders()
    })

    spinner.text = `Job queued: ${data.jobId}`
    
    if (options.wait) {
      while (true) {
        await new Promise(r => setTimeout(r, 2000))
        const { data: status } = await axios.get(`${API_URL}/detect/${data.jobId}`)
        
        if (status.status === 'complete') {
          spinner.succeed('Detection complete')
          printResult(status)
          break
        } else if (status.status === 'error') {
          spinner.fail(`Error: ${status.error}`)
          process.exit(1)
        } else {
          spinner.text = `Status: ${status.status}`
        }
      }
    } else {
      spinner.succeed(`Job submitted: ${data.jobId}`)
      console.log(chalk.dim(`\nRun: deepproof query ${data.jobId}`))
    }
  } catch (e) {
    spinner.fail('Failed')
    console.error(chalk.red(e.response?.data?.message || e.message))
    process.exit(1)
  }
}

function printResult(job) {
  const { result } = job
  const color = result.verdictLabel === 'authentic' ? chalk.green : chalk.red
  
  console.log('\n' + color.bold(`${result.verdictLabel.toUpperCase()} (${result.confidence}%)`))
  console.log(chalk.dim(result.reasoning))
  console.log('\n' + chalk.bold('Hashes:'))
  console.log(`  SHA-256: ${chalk.cyan(job.sha256)}`)
  console.log(`  pHash:   ${chalk.cyan(result.pHash)}`)
  console.log('\n' + chalk.bold('On-Chain:'))
  console.log(`  Registry: ${chalk.cyan(job.registryTx)}`)
  if (job.mintTx) console.log(`  SPT Mint: ${chalk.cyan(job.mintTx)}`)
}
