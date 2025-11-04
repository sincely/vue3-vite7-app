import fs from 'fs'

const commitMsgFilePath = process.argv[2]
const commitMsg = fs.readFileSync(commitMsgFilePath, 'utf-8').trim()
const rules = [
  { type: 'feat', symbol: '✨' },
  { type: 'fix', symbol: '🐞' },
  { type: 'docs', symbol: '📝' },
  { type: 'style', symbol: '🎨' },
  { type: 'refactor', symbol: '📸' },
  { type: 'test', symbol: '🧪' },
  { type: 'chore', symbol: '🎓' },
  { type: 'revert', symbol: '💫' },
  { type: 'ci', symbol: '🤖' },
  { type: 'build', symbol: '🏭' }
]

let updatedCommitMsg = commitMsg
for (const rule of rules) {
  if (commitMsg.startsWith(`${rule.type}:`)) {
    updatedCommitMsg = `${rule.symbol} ${commitMsg}`
    break
  }
}

fs.writeFileSync(commitMsgFilePath, updatedCommitMsg)
