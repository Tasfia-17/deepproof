#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import { verify } from './commands/verify.js'
import { batch } from './commands/batch.js'
import { query } from './commands/query.js'
import { node } from './commands/node.js'
import { audit } from './commands/audit.js'

const program = new Command()

program
  .name('deepproof')
  .description('DeepProof Nexus CLI - Decentralized deepfake detection')
  .version('1.0.0')

program
  .command('verify <file>')
  .description('Submit file for deepfake detection')
  .option('-a, --address <address>', 'SPT recipient address')
  .option('-w, --wait', 'Wait for result', false)
  .action(verify)

program
  .command('batch <directory>')
  .description('Batch verify all files in directory')
  .option('-a, --address <address>', 'SPT recipient address')
  .action(batch)

program
  .command('query <hash>')
  .description('Query on-chain registry by SHA-256 or pHash')
  .action(query)

program
  .command('node')
  .description('Node management commands')
  .option('-l, --list', 'List all active nodes')
  .option('-s, --stake <amount>', 'Stake tokens on node')
  .action(node)

program
  .command('audit')
  .description('Run XOR completeness audit')
  .action(audit)

program.parse()
