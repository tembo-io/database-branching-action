jest.mock('@actions/core')
jest.mock('./getInputs')
jest.mock('./branching')
jest.mock('./deleteInstance')

// Import the actual functions after mocking
import * as core from '@actions/core'
import {getInputs} from './getInputs'
import {branching} from './branching'
import {deleteInstance} from './deleteInstance'
import {run} from './main'

// Type casting for mocked modules
const mockedGetInputs = getInputs as jest.MockedFunction<typeof getInputs>
const mockedBranching = branching as jest.MockedFunction<typeof branching>
const mockedDeleteInstance = deleteInstance as jest.MockedFunction<
  typeof deleteInstance
>

describe('run function in main.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks() // Clear mocks between tests
  })

  it('calls branching with correct inputs for "branch" action', async () => {
    // Setup mocked inputs
    mockedGetInputs.mockReturnValue({
      action: 'branch',
      temboApiEndpoint: 'https://api.tembo.io',
      orgId: 'org123',
      instanceId: 'instance456',
      instanceName: 'test-instance',
      temboToken: 'token789',
      env: 'prod',
      pollInterval: 5000,
      maxAttempt: 60
    })

    await run()

    expect(mockedBranching).toHaveBeenCalledWith({
      temboApiEndpoint: 'https://api.tembo.io',
      instanceId: 'instance456',
      orgId: 'org123',
      instanceName: 'test-instance',
      env: 'prod',
      temboToken: 'token789',
      pollInterval: 5000,
      maxAttempt: 60
    })
  })

  it('calls deleteInstance with correct inputs for "delete" action', async () => {
    // Setup mocked inputs for delete action
    mockedGetInputs.mockReturnValue({
      action: 'delete',
      temboApiEndpoint: 'https://api.tembo.io',
      orgId: 'org123',
      instanceId: 'instance456',
      instanceName: 'unique-name',
      temboToken: 'token789',
      env: 'prod',
      pollInterval: 5000,
      maxAttempt: 60
    })

    await run()

    // Verify that deleteInstance was called with the expected arguments
    expect(mockedDeleteInstance).toHaveBeenCalledWith({
      temboApiEndpoint: 'https://api.tembo.io',
      orgId: 'org123',
      instanceId: 'instance456',
      temboToken: 'token789'
    })
  })

  it('handles unsupported actions correctly', async () => {
    mockedGetInputs.mockReturnValue({
      action: 'create',
      temboApiEndpoint: 'https://api.tembo.io',
      orgId: 'org123',
      instanceId: 'instance456',
      instanceName: 'unique-name',
      temboToken: 'token789',
      env: 'prod',
      pollInterval: 5000,
      maxAttempt: 60
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Unsupported operation: create')
    )
  })
})
