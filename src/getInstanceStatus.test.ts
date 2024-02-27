// getInstanceStatus.test.ts
import axios from 'axios'
import * as core from '@actions/core'
import {getInstanceStatus} from './getInstanceStatus'

jest.mock('axios')
jest.mock('@actions/core')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCore = core as jest.Mocked<typeof core>

describe('getInstanceStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully detect an instance reaching the "Up" state', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({status: 200, data: {state: 'Submitted'}})
      .mockResolvedValueOnce({status: 200, data: {state: 'Configuring'}})
      .mockResolvedValueOnce({
        status: 200,
        data: {
          state: 'Up',
          instance_id: 'inst123',
          instance_name: 'test-instance',
          connection_info: {
            host: 'test-host',
            port: 5432,
            user: 'test-user',
            password: 'test-password'
          }
        }
      })

    const instanceDetails = await getInstanceStatus(
      'https://api.tembo.io',
      'org123',
      'inst123',
      'token123',
      100,
      5
    )

    expect(mockedCore.info).toHaveBeenCalledWith('Instance is up and running.')
    expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    expect(instanceDetails).toEqual({
      instance_id: 'inst123',
      instance_name: 'test-instance',
      host: 'test-host',
      port: '5432',
      user: 'test-user',
      password: 'test-password'
    })
  })

  it('should handle 401 Unauthorized error', async () => {
    mockedAxios.get.mockRejectedValue({
      isAxiosError: true,
      response: {status: 401, data: 'Unauthorized'}
    })

    await expect(
      getInstanceStatus(
        'https://api.tembo.io',
        'org123',
        'inst123',
        'token123',
        100,
        5
      )
    ).rejects.toThrow('Tembo API request failed with status 401: Unauthorized')
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
  })

  // Additional tests for other scenarios...
})
