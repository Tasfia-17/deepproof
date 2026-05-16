import axios from 'axios'
import chalk from 'chalk'
import ora from 'ora'

const API_URL = process.env.DEEPPROOF_API_URL || 'http://localhost:3001'

export async function query(hash) {
  const spinner = ora('Querying 0G Chain...').start()
  
  try {
    const { data } = await axios.get(`${API_URL}/verify/${hash}`)
    
    if (!data.exists) {
      spinner.fail('Not found on-chain')
      process.exit(1)
    }

    spinner.succeed('Found')
    
    const color = data.verdictLabel === 'authentic' ? chalk.green : chalk.red
    console.log('\n' + color.bold(`${data.verdictLabel.toUpperCase()} (${data.confidence}%)`))
    console.log('\n' + chalk.bold('Hashes:'))
    console.log(`  SHA-256: ${chalk.cyan(data.sha256)}`)
    console.log(`  pHash:   ${chalk.cyan(data.pHash)}`)
    console.log('\n' + chalk.bold('Metadata:'))
    console.log(`  Model:     ${data.modelVersion}`)
    console.log(`  Timestamp: ${new Date(data.timestamp * 1000).toLocaleString()}`)
    console.log(`  Token ID:  ${data.tokenId || 'N/A'}`)
    console.log('\n' + chalk.bold('Evidence:'))
    console.log(`  Root Hash: ${chalk.cyan(data.evidenceRootHash)}`)
    console.log(`  TEE Sig:   ${chalk.dim(data.teeSignature.slice(0, 40) + '...')}`)
  } catch (e) {
    spinner.fail('Query failed')
    console.error(chalk.red(e.response?.data?.message || e.message))
    process.exit(1)
  }
}
