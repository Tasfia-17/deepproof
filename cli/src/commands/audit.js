import chalk from 'chalk'
import ora from 'ora'
import axios from 'axios'

export async function audit() {
  const apiUrl = process.env.API_URL || 'http://localhost:3001/api/v1'
  const spinner = ora('Fetching on-chain XOR sum...').start()

  try {
    const { data } = await axios.get(`${apiUrl}/audit`)
    spinner.succeed('Audit complete')

    console.log(chalk.bold('\nXOR Completeness Audit'))
    console.log(`  Registry:     ${chalk.cyan(data.registryAddress || 'not deployed')}`)
    console.log(`  Total records: ${chalk.cyan(data.totalRecords)}`)
    console.log(`  On-chain XOR: ${chalk.cyan(data.onChainXor)}`)

    if (data.intact) {
      console.log(chalk.green('\n✓ Integrity verified — all evidence intact'))
    } else {
      console.log(chalk.red('\n✗ Integrity violation — evidence missing or tampered'))
      process.exit(1)
    }

    if (data.note) console.log(chalk.yellow(`\nNote: ${data.note}`))
  } catch (e) {
    spinner.fail('Audit failed')
    console.error(chalk.red(e.response?.data?.message || e.message))
    process.exit(1)
  }
}
