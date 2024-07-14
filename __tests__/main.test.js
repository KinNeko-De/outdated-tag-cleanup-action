/**
 * Unit tests for the action's main functionality, src/main.js
 */
const core = require('@actions/core')
const github = require('@actions/github')
const main = require('../src/main')

// Mock the GitHub Actions core library
const debugMock = jest.spyOn(core, 'debug').mockImplementation()
const getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
jest.mock('@actions/core')
jest.mock('@actions/github')

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Other utilities

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock GitHub context
    github.context.repo = {
      owner: 'mockOwner',
      repo: 'mockRepo'
    }
  })

  it('deletes a tag for a non-existing branch', async () => {
    const tagTobeDeleted = 'v1.0.1-iamnotthereanymore.1'

    const octokitMock = {
      rest: {
        repos: {
          listBranches: jest.fn().mockResolvedValue({
            data: [{ name: 'main' }] // Only the data needed for this test
          })
        },
        git: {
          listMatchingRefs: jest.fn().mockResolvedValue({
            data: [{ ref: `refs/tags/${tagTobeDeleted}` }]
          }),
          deleteRef: jest.fn().mockResolvedValue({})
        }
      }
    }
    github.getOctokit.mockReturnValue(octokitMock)

    await main.run()

    // Assuming a function to check tag-to-branch association is implemented
    // and tags v1.0.0 and v1.0.1 do not correspond to any existing branch
    expect(github.getOctokit().rest.git.deleteRef).toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: `tags/${tagTobeDeleted}`
    })
  })

  it('does not delete a tag for an existing branch', async () => {
    const tagToBeNotDeleted = 'v1.0.1-iamstillhere.1'

    const octokitMock = {
      rest: {
        repos: {
          listBranches: jest.fn().mockResolvedValue({
            data: [{ name: 'main' }, { name: 'feature/iamstillhere' }] // Only the data needed for this test
          })
        },
        git: {
          listMatchingRefs: jest.fn().mockResolvedValue({
            data: [{ ref: `refs/tags/${tagToBeNotDeleted}` }]
          }),
          deleteRef: jest.fn().mockResolvedValue({})
        }
      }
    }
    github.getOctokit.mockReturnValue(octokitMock)

    await main.run()

    // Check that deleteRef was not called for tags associated with existing branches
    expect(github.getOctokit().rest.git.deleteRef).not.toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: `tags/${tagToBeNotDeleted}`
    })
  })

  it('never deletes tags on the main branch', async () => {
    const octokitMock = {
      rest: {
        repos: {
          listBranches: jest.fn().mockResolvedValue({
            data: [{ name: 'main' }, { name: 'feature/iamstillhere' }] // Only the data needed for this test
          })
        },
        git: {
          listMatchingRefs: jest.fn().mockResolvedValue({
            data: [{ ref: `refs/tags/v1.0.1}` }]
          }),
          deleteRef: jest.fn().mockResolvedValue({})
        }
      }
    }
    github.getOctokit.mockReturnValue(octokitMock)

    await main.run()

    expect(github.getOctokit().rest.git.deleteRef).not.toHaveBeenCalledWith({
      owner: 'mockOwner',
      repo: 'mockRepo',
      ref: 'tags/v1.0.1'
    })
  })
})
