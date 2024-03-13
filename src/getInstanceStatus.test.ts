import * as core from '@actions/core'
import axios from 'axios'
import {getInstanceStatus} from './getInstanceStatus'

jest.mock('axios')
jest.mock('@actions/core')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCore = core as jest.Mocked<typeof core>

it('successfully retrieves instance status when instance becomes Up', async () => {
  mockedAxios.get
    .mockResolvedValueOnce({
      data: {state: 'Configuring'}
    })
    .mockResolvedValueOnce({
      data: {
        state: 'Up',
        instance_id: '123',
        instance_name: 'testInstance',
        connection_info: {
          host: 'localhost',
          port: 5432,
          user: 'admin',
          password: 'password'
        }
      }
    })

  const status = await getInstanceStatus(
    'https://api.tembo.io',
    'org123',
    '123',
    'token789',
    1000,
    2
  )

  expect(status).toEqual({
    instance_id: '123',
    instance_name: 'testInstance',
    host: 'localhost',
    port: '5432',
    user: 'admin',
    password: 'password'
  })
  expect(mockedCore.info).toHaveBeenCalledWith('Instance is up and running.')
})

it('retries when instance encounters an "Error" state and eventually becomes Up', async () => {
  mockedAxios.get
    .mockResolvedValueOnce({
      data: {state: 'Error'}
    })
    .mockResolvedValueOnce({
      data: {state: 'Configuring'}
    })
    .mockResolvedValueOnce({
      data: {
        state: 'Up',
        instance_id: '123',
        instance_name: 'testInstance',
        connection_info: {
          host: 'localhost',
          port: 5432,
          user: 'admin',
          password: 'password'
        }
      }
    })

  const status = await getInstanceStatus(
    'https://api.tembo.io',
    'org123',
    '123',
    'token789',
    1000,
    3
  )

  expect(status).toEqual({
    instance_id: '123',
    instance_name: 'testInstance',
    host: 'localhost',
    port: '5432',
    user: 'admin',
    password: 'password'
  })
  expect(mockedCore.info).toHaveBeenCalledWith('Instance is up and running.')
  expect(mockedCore.warning).toHaveBeenCalledWith(
    'Instance encountered an error. Retrying...'
  )
})

it('throws an error when max attempts are exceeded without reaching "Up" state', async () => {
  mockedAxios.get.mockResolvedValue({
    data: {state: 'Configuring'}
  })

  await expect(
    getInstanceStatus(
      'https://api.tembo.io',
      'org123',
      '123',
      'token789',
      1000,
      2
    )
  ).rejects.toThrow(
    'Instance did not reach the "Up" state within the expected time.'
  )
})
