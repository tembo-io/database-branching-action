import axios from 'axios'
import * as core from '@actions/core'
import { getInstanceStatus } from './getInstanceStatus'

// Mocking axios and @actions/core
jest.mock('axios')
jest.mock('@actions/core')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCore = core as jest.Mocked<typeof core>

describe('getInstanceStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully detect an instance reaching the "Up" state', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: { state: 'Submitted' },
    }).mockResolvedValueOnce({
      status: 200,
      data: { state: 'Configuring' },
    }).mockResolvedValueOnce({
      status: 200,
      data: { state: 'Up' },
    })

    await getInstanceStatus('https://api.tembo.io', 'org123', 'inst123', 'token123', 100, 5)

    expect(mockedCore.info).toHaveBeenCalledWith('Instance is up and running.')
    expect(mockedAxios.get).toHaveBeenCalledTimes(3)
  })

  it('should handle instance encountering an error state', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { state: 'Error' },
    })

    await getInstanceStatus('https://api.tembo.io', 'org123', 'inst123', 'token123', 100, 5)

    expect(mockedCore.setFailed).toHaveBeenCalledWith('Instance encountered an error.')
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
  })

  it('should fail after maximum attempts without reaching "Up" state', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: { state: 'Configuring' },
    })

    await getInstanceStatus('https://api.tembo.io', 'org123', 'inst123', 'token123', 100, 3)

    expect(mockedCore.setFailed).toHaveBeenCalledWith('Instance did not reach the "Up" state within the expected time.')
    expect(mockedAxios.get).toHaveBeenCalledTimes(3)
  })

  // todo: Add more tests
})