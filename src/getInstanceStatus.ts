// getInstanceStatus.ts
import axios from 'axios'
import * as core from '@actions/core'

interface GetInstanceStatusParams {
  instance_id: string
  instance_name: string
  host?: string
  port?: string
  user?: string
  password?: string
}

export async function getInstanceStatus(
  temboApi: string,
  orgId: string,
  instanceId: string,
  temboToken: string,
  pollInterval: number,
  maxAttempts: number
): Promise<GetInstanceStatusParams> {
  const apiStatusEndpoint = `${temboApi}/api/v1/orgs/${orgId}/instances/${instanceId}`
  let state = 'Submitted'

  let attempts = 0

  while (
    (state === 'Submitted' || state === 'Configuring') &&
    attempts < maxAttempts
  ) {
    try {
      const response = await axios.get(apiStatusEndpoint, {
        headers: {
          Authorization: `Bearer ${temboToken}`,
          'Content-Type': 'application/json'
        }
      })

      state = response.data.state
      core.info(`Current state: ${state}`)

      if (state === 'Up') {
        core.info('Instance is up and running.')
        const {instance_id, instance_name, connection_info} = response.data

        return {
          instance_id,
          instance_name,
          host: connection_info?.host,
          port: connection_info?.port?.toString(),
          user: connection_info?.user,
          password: connection_info?.password
        }
      } else if (state === 'Error') {
        throw new Error('Instance encountered an error.')
      } else {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
    } catch (error) {
      let errorMessage: string
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Tembo API request failed with status ${error.response.status}: ${error.message}`
      } else {
        errorMessage = `Failed to check instance status: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`
      }
      core.setFailed(errorMessage)
      throw new Error(errorMessage)
    }

    attempts++
  }

  throw new Error(
    'Instance did not reach the "Up" state within the expected time.'
  )
}
