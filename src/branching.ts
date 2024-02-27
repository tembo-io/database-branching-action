import * as core from '@actions/core'
import axios from 'axios'
import {getInstanceStatus} from './getInstanceStatus'

export async function run(): Promise<void> {
  try {
    // Retreive inputs from the action
    const temboApiEndpoint: string =
      core.getInput('tembo-api-endpoint') || 'https://api.tembo.io'
    const orgId: string = core.getInput('org-id', {required: true})
    const instanceId: string = core.getInput('instance-id', {required: true})
    const instanceName: string = core.getInput('instance-name', {
      required: true
    })
    const temboToken: string = core.getInput('tembo-token', {required: true})
    const env: string = core.getInput('environment') || 'prod'
    const pollInterval: number =
      Number(core.getInput('polling-interval')) || 5000
    const maxAttempt: number =
      Number(core.getInput('max-polling-attempts')) || 60

    const apiBranchingEndpoint = `${temboApiEndpoint}/api/v1/orgs/${orgId}/restore`

    // Construct the branching payload
    // https://api.tembo.io/redoc#tag/instance/operation/restore_instance
    const payload = {
      instance_name: instanceName,
      restore: {
        instance_id: instanceId
      },
      environment: env
    }

    // Check if the instance already exists, and return early
    const doesExist = await instanceExists(
      temboApiEndpoint,
      orgId,
      instanceName,
      temboToken
    )
    if (doesExist) {
      core.info(
        `Database instance with name "${instanceName}" already exists, skipping creation`
      )
      return
    }

    // Call the branching API
    const response = await axios.post(apiBranchingEndpoint, payload, {
      headers: {
        Authorization: `Bearer ${temboToken}`,
        'Content-Type': 'application/json'
      }
    })

    // For now lets just handle the response
    if (response.status == 202) {
      core.info(`Database branch initiated successfully.`)

      // Extract fields needed from the response
      const responseData = response.data
      const {instance_id, instance_name, connection_info} = responseData

      core.setOutput('instance_id', instance_id)
      core.setOutput('instance_name', instance_name)
      core.setOutput('host', connection_info?.host)
      core.setOutput('port', connection_info?.port.toString())
      core.setOutput('user', connection_info?.user)
      core.setOutput('password', connection_info?.password)

      // Now, check the status of the instance
      await getInstanceStatus(
        temboApiEndpoint,
        orgId,
        instance_id,
        temboToken,
        pollInterval,
        maxAttempt
      )
    } else {
      core.setFailed(`Tembo API responded with status code: ${response.status}`)
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      switch (error.response?.status) {
        case 400:
          core.setFailed(`Tembo API Bad Request: ${error.message}`)
          break
        case 401:
          core.setFailed(`Tembo API Unauthorized: ${error.message}`)
          break
        case 403:
          core.setFailed(`Tembo API Forbidden: ${error.message}`)
          break
        case 409:
          core.setFailed(`Tembo API Conflict: ${error.message}`)
          break
        default:
          core.setFailed(
            `Tembo API request failed with status ${error.response?.status}: ${error.message}`
          )
      }
    } else {
      core.setFailed(
        `Action failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err)
    core.setFailed(`Unhandled error: ${err}`)
  })
}

async function instanceExists(
  endpoint: string,
  orgId: string,
  instanceName: string,
  token: string
): Promise<boolean> {
  const apiEndpoint = `${endpoint}/api/v1/orgs/${orgId}/instances`

  try {
    const response = await axios.get(apiEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    // Check if the response is successful and contains an array
    if (response.status === 200 && Array.isArray(response.data)) {
      // Search for an instance with the matching name
      return response.data.some(
        instance => instance.instance_name === instanceName
      )
    } else {
      // If the response is not 200 or not an array, log and treat as if the instance doesn't exist
      console.log(`Unexpected response format or status: ${response.status}`)
      return false
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle known error statuses
      const errorMessage = `Tembo API request failed with status ${error.response?.status}: ${error.message}`
      console.error(errorMessage)
      core.setFailed(errorMessage)

      // Rethrow or handle specific status codes as needed
      if (
        error.response?.status === 400 ||
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.response?.status === 409
      ) {
        throw new Error(errorMessage)
      }
    } else {
      // Handle generic errors
      const genericErrorMessage = `Action failed: ${error instanceof Error ? error.message : String(error)}`
      console.error(genericErrorMessage)
      core.setFailed(genericErrorMessage)
    }
    throw error
  }
}
