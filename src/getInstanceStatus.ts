import axios from 'axios'
import * as core from '@actions/core'

export async function getInstanceStatus(
  temboApi: string,
  orgId: string,
  instanceId: string,
  temboToken: string,
  pollInterval: number,
  maxAttempts: number
): Promise<void> {
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

      if (response.status === 200) {
        state = response.data.state
        console.log(`Current state: ${state}`)

        if (state === 'Up') {
          core.info('Instance is up and running.')
          break
        } else if (state === 'Error') {
          core.setFailed('Instance encountered an error.')
          break
        }

        // If state is 'Submitted' or 'Configuring', wait for the next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      } else {
        core.setFailed(
          `Failed to check instance status: HTTP ${response.status}`
        )
        break
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        core.setFailed(`Failed to check instance status: ${error.message}`)
      } else if (error instanceof Error) {
        core.setFailed(`Failed to check instance status: ${error.message}`)
      } else {
        core.setFailed(
          `Failed to check instance status: An unknown error occurred.`
        )
      }
      break
    }

    attempts++
  }

  if (attempts >= maxAttempts && state !== 'Up') {
    core.setFailed(
      'Instance did not reach the "Up" state within the expected time.'
    )
  }
}
