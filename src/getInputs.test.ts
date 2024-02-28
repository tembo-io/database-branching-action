import * as core from '@actions/core'
import {getInputs} from './getInputs'
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  animals
} from 'unique-names-generator'

// Mock the core module and unique-names-generator
jest.mock('@actions/core')
jest.mock('unique-names-generator', () => ({
  uniqueNamesGenerator: jest.fn(() => 'unique-name')
}))

const randomNameConfig: Config = {
  dictionaries: [animals, adjectives],
  separator: '-',
  length: 2
}
const testRandomName: string = uniqueNamesGenerator(randomNameConfig)

describe('getInputs', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()

    // Setup default mocks for @actions/core
    jest.spyOn(core, 'getInput').mockImplementation(inputName => {
      switch (inputName) {
        case 'tembo-api-endpoint':
          return 'https://api.tembo.io'
        case 'org-id':
          return 'org123'
        case 'instance-id':
          return 'instance456'
        case 'tembo-token':
          return 'token789'
        case 'environment':
          return 'prod'
        case 'polling-interval':
          return '5000'
        case 'max-polling-attempts':
          return '60'
        default:
          return ''
      }
    })
  })

  it('should return all inputs with defaults when necessary', () => {
    const inputs = getInputs()
    expect(inputs).toEqual({
      action: 'branch', // Default action
      temboApiEndpoint: 'https://api.tembo.io',
      orgId: 'org123',
      instanceId: 'instance456',
      instanceName: testRandomName,
      temboToken: 'token789',
      env: 'prod',
      pollInterval: 5000,
      maxAttempt: 60
    })
  })

  it('should use provided action and instance-name when available', () => {
    jest.spyOn(core, 'getInput').mockImplementation(inputName => {
      if (inputName === 'action') return 'delete'
      if (inputName === 'instance-name') return 'custom-instance'
      return ''
    })

    const inputs = getInputs()
    expect(inputs.action).toBe('delete')
    expect(inputs.instanceName).toBe('custom-instance')
  })

  // Add more test cases as needed to cover different scenarios
})

describe('Action input handling in getInputs', () => {
  // Test for "branch" action
  it('correctly handles action input when "branch"', () => {
    jest.spyOn(core, 'getInput').mockImplementation(inputName => {
      if (inputName === 'action') return 'branch'
      return ''
    })

    const inputs = getInputs()
    expect(inputs.action).toBe('branch')
  })

  // Test for "delete" action
  it('correctly handles action input when "delete"', () => {
    jest.spyOn(core, 'getInput').mockImplementation(inputName => {
      if (inputName === 'action') return 'delete'
      return ''
    })

    const inputs = getInputs()
    expect(inputs.action).toBe('delete')
  })

  // Test for an invalid action like "create"
  it('throws an error for unsupported action input "create"', () => {
    jest.spyOn(core, 'getInput').mockImplementation(inputName => {
      if (inputName === 'action') return 'create'
      return ''
    })

    // Check if the error is thrown as expected
    expect(() => {
      getInputs()
    }).toThrow('Unsupported operation: create')
  })
})
