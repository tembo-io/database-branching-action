import * as core from '@actions/core'
import axios from 'axios'
import {getInstanceStatus} from './getInstanceStatus'

interface BranchInstanceParams {
  temboApiEndpoint: string
  instanceId: string
  orgId: string
  instanceName: string
  env: string
  temboToken: string
  pollInterval: number
  maxAttempt: number
}

export async function branching({
  temboApiEndpoint,
  instanceId,
  orgId,
  instanceName,
  env,
  temboToken,
  pollInterval,
  maxAttempt
}: BranchInstanceParams): Promise<void> {
  try {
    // Check if the instance already exists, and return early if it does
    const doesExist = await instanceExists({
      temboApiEndpoint,
      orgId,
      instanceName,
      temboToken
    })
    if (doesExist) {
      core.info(
        `Database instance with name "${instanceName}" already exists, skipping creation`
      )
      return
    } else {
      core.info(
        `Database instance with name "${instanceName}" doesn't exist, creating...`
      )
    }
    // Construct the branching payload
    // https://api.tembo.io/redoc#tag/instance/operation/restore_instance
    const apiBranchingEndpoint = `${temboApiEndpoint}/api/v1/orgs/${orgId}/restore`
    const payload = {
      instance_name: instanceName,
      restore: {
        instance_id: instanceId
      },
      environment: env
    }

    // Call the branching API
    const branchResponse = await axios.post(apiBranchingEndpoint, payload, {
      headers: {
        Authorization: `Bearer ${temboToken}`,
        'Content-Type': 'application/json'
      }
    })

    // For now lets just handle the response
    if (branchResponse.status == 202) {
      core.info(`Database branch initiated successfully.`)

      // Extract fields needed from the response
      const branchResponseData = branchResponse.data
      const branched_instance_id = branchResponseData.instance_id
      if (typeof branched_instance_id !== 'string') {
        // Handle the case where branched_instance_id is not a string
        core.setFailed('branched_instance_id must be a string')
        return
      }

      // Now, check the status of the instance
      const instanceStatus = await getInstanceStatus(
        temboApiEndpoint,
        orgId,
        branched_instance_id,
        temboToken,
        pollInterval,
        maxAttempt
      )

      // Set outputs
      core.setOutput('instance_id', instanceStatus.instance_id)
      core.setOutput('instance_name', instanceStatus.instance_name)
      if (instanceStatus.host) core.setOutput('host', instanceStatus.host)
      if (instanceStatus.port) core.setOutput('port', instanceStatus.port)
      if (instanceStatus.user) core.setOutput('user', instanceStatus.user)
      if (instanceStatus.password)
        core.setOutput('password', instanceStatus.password)
      if (
        instanceStatus.host &&
        instanceStatus.port &&
        instanceStatus.user &&
        instanceStatus.password
      )
        core.setOutput(
          'database_url',
          `postgresql://${instanceStatus.user}:${instanceStatus.password}@${instanceStatus.host}:${instanceStatus.port}`
        )
    } else {
      core.setFailed(
        `Tembo API responded with status code: ${branchResponse.status}`
      )
    }
  } catch (error) {
    console.log('Error:', error)
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

interface InstanceExistsParams {
  temboApiEndpoint: string
  orgId: string
  instanceName: string
  temboToken: string
}

async function instanceExists({
  temboApiEndpoint,
  orgId,
  instanceName,
  temboToken
}: InstanceExistsParams): Promise<boolean> {
  const apiEndpoint = `${temboApiEndpoint}/api/v1/orgs/${orgId}/instances`

  try {
    const response = await axios.get(apiEndpoint, {
      headers: {
        Authorization: `Bearer ${temboToken}`,
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
      core.setFailed(genericErrorMessage)
    }
    throw error
  }
}
