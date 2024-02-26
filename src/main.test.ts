jest.mock('@actions/core');
jest.mock('axios');

import { run } from './main';
import * as core from '@actions/core';
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedCore = core as jest.Mocked<typeof core>;

describe('run function', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      mockedCore.getInput.mockImplementation((name: string) => {
        const inputs: { [key: string]: string } = {
          'tembo-api-endpoint': 'https://api.tembo.io',
          'org-id': 'test-org-id',
          'instance-id': 'test-instance-id',
          'instance-name': 'test-instance-name',
          'tembo-token': 'test-token',
          'environment': 'prod',
        };
        return inputs[name] || '';
      });
    });
  
    it('should initiate database branch successfully and set outputs correctly', async () => {
      // Mock Axios response with detailed connection_info
      const mockResponseData = {
        instance_id: 'inst_123456789',
        instance_name: 'test-instance',
        connection_info: {
          host: 'test-host',
          port: 5432,
          user: Buffer.from('test-user').toString('base64'),
          password: Buffer.from('test-password').toString('base64'),
        }
      };

      mockedAxios.post.mockResolvedValue({
        status: 202,
        data: mockResponseData
      });
  
      await run();
  
      // Assertions to ensure axios.post was called correctly
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.tembo.io/api/v1/orgs/test-org-id/restore',
        expect.objectContaining({
          instance_name: 'test-instance-name',
          restore: {
            instance_id: 'test-instance-id'
          },
          environment: 'prod'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          })
        })
      );

      // Assertions to ensure outputs were set correctly
      expect(mockedCore.setOutput).toHaveBeenCalledWith('instance_id', mockResponseData.instance_id);
      expect(mockedCore.setOutput).toHaveBeenCalledWith('instance_name', mockResponseData.instance_name);
      expect(mockedCore.setOutput).toHaveBeenCalledWith('host', mockResponseData.connection_info.host);
      expect(mockedCore.setOutput).toHaveBeenCalledWith('port', mockResponseData.connection_info.port.toString());
      expect(mockedCore.setOutput).toHaveBeenCalledWith('user', mockResponseData.connection_info.user);
      expect(mockedCore.setOutput).toHaveBeenCalledWith('password', mockResponseData.connection_info.password);

      // Ensure the info log was called
      expect(mockedCore.info).toHaveBeenCalledWith('Database branch initiated successfully.');
    });
  
    // Add more tests as needed for error handling, different responses, etc.
});