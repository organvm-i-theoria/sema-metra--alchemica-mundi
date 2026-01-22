#!/usr/bin/env node
/**
 * sēma-mētra--alchemica-mundi CLI
 * Signal-Matrix for World-Alchemy
 */

import { Command } from 'commander';
import {
  initCommand,
  rollCommand,
  modulateCommand,
  toggleCommand,
  inspectCommand,
  ritualCommand,
  ritualsListCommand,
  fxCommand,
  patchCommand,
  resetCommand,
} from './commands.js';

const program = new Command();

program
  .name('sema')
  .description('sēma-mētra--alchemica-mundi: Signal-Matrix for World-Alchemy')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize the system and load data files')
  .action(initCommand);

program
  .command('roll <die>')
  .description('Roll a die (d4, d6, d8, d10, d12, d20, d100, d1000)')
  .action(rollCommand);

program
  .command('modulate <dualityId> <value>')
  .description('Set a duality value (-1.0 to +1.0)')
  .action(modulateCommand);

program
  .command('toggle <binaryId> [state]')
  .description('Toggle a binary gate or set to specific state')
  .action(toggleCommand);

program
  .command('inspect')
  .description('Inspect system state')
  .option('-d, --duality <id>', 'Inspect a specific duality')
  .option('-b, --binary <id>', 'Inspect a specific binary')
  .option('-h, --hybrid <id>', 'Inspect a specific hybrid')
  .option('-a, --all', 'Show all non-default states')
  .action(inspectCommand);

program
  .command('ritual <name>')
  .description('Execute a ritual')
  .option('-c, --check', 'Check if ritual would pass without executing')
  .action(ritualCommand);

program
  .command('rituals')
  .description('List all available rituals')
  .action(ritualsListCommand);

program
  .command('fx')
  .description('FX gods and chain management')
  .option('-l, --list', 'List all FX gods')
  .option('-i, --invoke <id>', 'Invoke an FX god')
  .action(fxCommand);

program
  .command('patch <action> [name]')
  .description('Patch management (save, load, preset, snapshot, capture)')
  .option('-p, --preset <name>', 'Apply a preset')
  .action(patchCommand);

program
  .command('reset')
  .description('Reset the system to initial state')
  .action(resetCommand);

program.parse();
