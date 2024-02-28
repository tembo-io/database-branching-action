import axios from 'axios'
import * as core from '@actions/core'
import {deleteInstance} from './deleteInstance'

jest.mock('axios')
jest.mock('@actions/core')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCore = core as jest.Mocked<typeof core>

it('successfully deletes an instance', async () => {
  mockedAxios.delete.mockResolvedValue({status: 202})

  await deleteInstance({
    temboApiEndpoint: 'https://api.tembo.io',
    orgId: 'org123',
    instanceId: 'instance456',
    temboToken: 'token789'
  })

  expect(mockedAxios.delete).toHaveBeenCalled()
  expect(mockedCore.setFailed).not.toHaveBeenCalled()
})

it('handles unexpected errors', async () => {
  mockedAxios.delete.mockRejectedValue(new Error('Network error'))

  await deleteInstance({
    temboApiEndpoint: 'https://api.tembo.io',
    orgId: 'org123',
    instanceId: 'instance456',
    temboToken: 'token789'
  })

  expect(mockedCore.setFailed).toHaveBeenCalledWith(
    'An unexpected error occurred while deleting instance instance456: Error: Network error'
  )
})
