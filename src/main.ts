import * as core from '@actions/core'
import axios from 'axios'
import { getInstanceStatus } from './getInstanceStatus'

export async function run(): Promise<void> {
    try {
        // Retreive inputs from the action
        const temboApiEndpoint: string = core.getInput('tembo-api-endpoint') || 'https://api.tembo.io'
        const orgId: string = core.getInput('org-id', {required: true})
        const instanceId: string = core.getInput('instance-id', {required: true})
        const instanceName: string = core.getInput('instance-name', {required: true})
        const temboToken: string = core.getInput('tembo-token', {required: true})
        const env: string = core.getInput('environment') || 'prod'
        const pollInterval: number = Number(core.getInput('polling-interval')) || 5000
        const maxAttempt: number = Number(core.getInput('max-polling-attempts')) || 60

        const apiEndpoint = `${temboApiEndpoint}/api/v1/orgs/${orgId}/restore`

        // Construct the branching payload
        // https://api.tembo.io/redoc#tag/instance/operation/restore_instance
        const payload = {
            instance_name: instanceName,
            restore: {
                instance_id: instanceId
            },
            environment: env
        }

        // Call the branching API
        const response = await axios.post(apiEndpoint, payload, {
            headers: {
              'Authorization': `Bearer ${temboToken}`,
              'Content-Type': 'application/json'
            }
          })

        // For now lets just handle the response
        if (response.status == 202) {
            core.info(`Database branch initiated successfully.`)

            // Extract fields needed from the response
            const responseData = response.data
            const { instance_id, instance_name, connection_info } = responseData

            // Decode username and password for the new instance
            //const user = Buffer.from(connection_info.user, 'base64').toString('ascii')
            //const passwd = Buffer.from(connection_info.password, 'base64').toString('ascii')

            core.setOutput('instance_id', instance_id)
            core.setOutput('instance_name', instance_name)
            core.setOutput('host', connection_info.host)
            core.setOutput('port', connection_info.port.toString())
            core.setOutput('user', connection_info.user)
            core.setOutput('password', connection_info.password)
            
            // Logging or further processing
            console.log(`Instance ID: ${instance_id}`)
            console.log(`Instance Name: ${instance_name}`)

            // Now, check the status of the instance
            await getInstanceStatus(temboApiEndpoint, orgId, instance_id, temboToken, pollInterval, maxAttempt)
        } else {
            core.setFailed(`Tembo API responded with status code: ${response.status}`)
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            core.setFailed(`Tembo API request failed: ${error.message}`)
        } else {
            core.setFailed(`Action failed: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
}

if (require.main === module) {
    run().catch(err => {
        console.error(err)
        core.setFailed(`Unhandled error: ${err}`)
    })
}