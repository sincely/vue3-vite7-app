import progress from 'vite-plugin-progress'
import colors from 'picocolors'
export default function progressPlugin() {
  return progress({ format: `${colors.green(colors.bold('Building'))} ${colors.cyan('[:bar]')} :percent` })
}
