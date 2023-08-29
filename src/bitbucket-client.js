// TODO - create an abstraction for git client and implement it for different git providers then use dependency inversion in index.js(if needed)
export class BitbucketClient {
    API_BASE_URL = 'https://api.bitbucket.org/2.0';

    constructor(authToken, repository, targetBranch = 'master') {
        this.authToken = authToken;
        this.targetBranch = targetBranch;
        this.apiUrl = `${this.API_BASE_URL}/repositories/${repository}`;
    }

    handleErrorResponse(response) {
        if (response?.type === 'error') {
            throw new Error(response.error.message);
        }
        return response;
    }

    async makeApiRequest(endpoint, method = 'GET', body = null, headers = {}) {
        return fetch(`${this.apiUrl}/${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                ...headers,
            },
            body
        })
    }

    async formDataApiRequest(endpoint, method = 'POST', body, headers = {}) {
        const response = await this.makeApiRequest(endpoint, method, body, headers);
        const responseData = await response.text();
        if (responseData) {
            return this.handleErrorResponse(JSON.parse(responseData));
        }
        return responseData;
    }

    async apiRequest(endpoint, method = 'GET', body = null, headers = {}) {
        const response = await this.makeApiRequest(endpoint, method, body ? JSON.stringify(body) : null, headers);
        const responseData = await response.json();
        return this.handleErrorResponse(responseData);
    }

    async commitFile(filePath, content, message, branchName = this.targetBranch) {
        try {
            const endpoint = 'src';
            const bodyFormData = new FormData();
            bodyFormData.append('message', message);
            bodyFormData.append('branch', branchName);
            bodyFormData.append(filePath, content);
            const result = this.formDataApiRequest(endpoint, 'POST', bodyFormData);
            return result;
        } catch (e) {
            throw new Error('Error committing a file: ' + (e.message || e))
        }
    }

    async createPullRequest(branchName, title, description = title) {
        try {
            const endpoint = 'pullrequests';
            const headers = {'Content-Type': 'application/json'};
            const body = {
                title,
                description,
                source: {
                    branch: {
                        name: branchName
                    }
                },
                destination: {
                    branch: {
                        name: this.targetBranch
                    }
                }
            }
            const result = this.apiRequest(endpoint, 'POST', body, headers);
            return result;
        } catch (e) {
            throw new Error('Error creating pull request: ' + (e.message || e))
        }
    }

    async getFileContent(filePath, branchName = this.targetBranch) {
        try {
            const endpoint = `src/${branchName}/${filePath}`;
            const result = await this.apiRequest(endpoint);
            return result;
        } catch (e) {
            throw new Error('Error reading file: ' + (e.message || e))
        }
    }
}