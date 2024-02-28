import axios from 'axios'
import * as core from '@actions/core'
import {branching} from './branching'

// Mocking axios, core, and getInstanceStatus
jest.mock('axios')
jest.mock('@actions/core')
jest.mock('./getInstanceStatus', () => ({
  getInstanceStatus: jest.fn().mockResolvedValue({
    instance_id: 'test',
    instance_name: 'testInstance'
    // other fields as necessary
  })
}))

const mockedAxios = axios as jest.Mocked<typeof axios>
//const mockedCore = core as jest.Mocked<typeof core>

describe('branching function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls branching successfully when instance does not exist', async () => {
    // Mock axios to simulate instance does not exist and branching successful
    mockedAxios.get.mockResolvedValueOnce({status: 200, data: []})
    mockedAxios.post.mockResolvedValueOnce({
      status: 202,
      data: {instance_id: '123', instance_name: 'testInstance'}
    })

    await branching({
      temboApiEndpoint: 'https://api.tembo.io',
      instanceId: '123',
      orgId: 'org123',
      instanceName: 'testInstance',
      env: 'prod',
      temboToken: 'token789',
      pollInterval: 5000,
      maxAttempt: 60
    })

    expect(mockedAxios.post).toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('successfully')
    )
  })

  it('skips branching if instance already exists', async () => {
    // Mock axios to simulate instance already exists
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: [{instance_name: 'testInstance'}]
    })

    await branching({
      temboApiEndpoint: 'https://api.tembo.io',
      instanceId: '123',
      orgId: 'org123',
      instanceName: 'testInstance',
      env: 'prod',
      temboToken: 'token789',
      pollInterval: 5000,
      maxAttempt: 60
    })

    expect(mockedAxios.post).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(
      expect.stringContaining('already exists, skipping creation')
    )
  })
})
