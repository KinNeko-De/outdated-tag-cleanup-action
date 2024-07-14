const core = require('@actions/core')
const github = require('@actions/github')

async function run() {
  try {
    const token = core.getInput('token', { required: true })
    const octokit = github.getOctokit(token)

    const existingFeatureBranches = (
      await octokit.rest.repos.listBranches({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
      })
    ).data.map(branch => branch.name)

    console.log('Existing feature branches:', existingFeatureBranches)

    const tags = await octokit.rest.git.listMatchingRefs({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      ref: 'tags/v'
    })

    for (const tag of tags.data) {
      const tagName = tag.ref.replace('refs/tags/', '')
      core.debug('Tag: ' + tagName)

      const tagParts = /^v[0-9]*\.[0-9]*\.[0-9]*-(.*)\.([0-9]*)$/.exec(tagName)
      if (tagParts) {
        const featureBranchName = tagParts[1]
        core.debug('Feature branch name: ' + featureBranchName)

        if (!existingFeatureBranches.includes(`feature/${featureBranchName}`)) {
          core.log(
            `Branch ${featureBranchName} does not exist, so deleting tag ${tagName}`
          )
          await octokit.rest.git.deleteRef({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            ref: `tags/${tagName}`
          })
        } else {
          core.debug(
            `Branch ${featureBranchName} exists, so not deleting tag ${tagName}`
          )
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
