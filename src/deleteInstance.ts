import * as core from '@actions/core'
import axios from 'axios'

interface DeleteInstanceParams {
  temboApiEndpoint: string
  orgId: string
  instanceId: string
  temboToken: string
}

async function deleteInstance({
  temboApiEndpoint,
  orgId,
  instanceId,
  temboToken
}: DeleteInstanceParams): Promise<void> {
  const url = `${temboApiEndpoint}/api/v1/orgs/${orgId}/instances/${instanceId}`
  const headers = {
    Authorization: `Bearer ${temboToken}`,
    'Content-Type': 'application/json'
  }

  try {
    const response = await axios.delete(url, {headers})
    if (response.status === 202) {
      ;`Instance ${instanceId} deleted successfully.`
    } else {
      core.setFailed(
        `Failed to delete instance ${instanceId}. Status code: ${response.status}`
      )
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      core.setFailed(
        `Error deleting instance ${instanceId}: ${error.response?.data}`
      )
    } else {
      core.setFailed(
        `An unexpected error occurred while deleting instance ${instanceId}: ${error}`
      )
    }
  }
}

export {deleteInstance}
