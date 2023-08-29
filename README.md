# Environment vars
This project uses the following environment variables:

| Name                          | Description                                              | Default Value |
| ----------------------------- |----------------------------------------------------------|---------------|
|BITBUCKET_AUTH_TOKEN           | Bitbucket auth token                                     | ""            |



# Pre-requisites
- Install [Node.js](https://nodejs.org/en/) version 18.16.1 or higher

# Setup
- Clone the repository
- Install dependencies
```npm i```
- Create .env file
```cp .env.example .env```
and update the values accordingly

# Run
```npm start -- <options>```  
Example ```npm start -- -p async -v ~3.2.4 -r nas156/test-bitbucket -b master -s```  
Run ```npm start -- --help``` to see the available options
