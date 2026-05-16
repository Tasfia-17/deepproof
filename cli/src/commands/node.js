import axios from 'axios'
import chalk from 'chalk'
import ora from 'ora'
import Table from 'cli-table3'

const API_URL = process.env.DEEPPROOF_API_URL || 'http://localhost:3001'

export async function node(options) {
  if (options.list) {
    const spinner = ora('Fetching nodes...').start()
    
    try {
      const { data } = await axios.get(`${API_URL}/nodes`)
      spinner.succeed(`${data.nodes.length} active nodes`)
      
      const table = new Table({
        head: ['Address', 'Stake', 'Accuracy', 'Verdicts', 'Status'],
        style: { head: ['cyan'] }
      })
      
      data.nodes.forEach(n => {
        table.push([
          n.address.slice(0, 10) + '...',
          `${n.stake} 0G`,
          n.accuracy >= 90 ? chalk.green(`${n.accuracy}%`) : chalk.red(`${n.accuracy}%`),
          n.verdictCount,
          n.active ? chalk.green('ACTIVE') : chalk.red('SLASHED')
        ])
      })
      
      console.log('\n' + table.toString())
    } catch (e) {
      spinner.fail('Failed')
      console.error(chalk.red(e.message))
      process.exit(1)
    }
  } else if (options.stake) {
    console.log(chalk.yellow('Staking not yet implemented'))
    console.log(chalk.dim('Use the web interface or contract directly'))
  } else {
    console.log(chalk.yellow('Use --list to view nodes or --stake <amount> to stake'))
  }
}
