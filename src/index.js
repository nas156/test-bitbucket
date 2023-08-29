import {BitbucketClient} from "./bitbucket-client.js";
import {
    BITBUCKET_AUTH_TOKEN,
    FILE_TO_CHANGE
} from "./config.js";
import {
    checkPackageAndVersionExist,
    prepareBranchName,
    prepareCommitMessage,
    preparePullRequestDescription,
    updateDependencies,
    validateString,
    validateVersion
} from "./helpers.js";
import {Command} from "commander";

const program = new Command();

const options = program
    .usage('npm start -- <options>')
    .requiredOption('-p, --package <name>', 'package name', validateString)
    .requiredOption('-v, --version <version>', 'package version', validateVersion)
    .requiredOption('-r, --repo <repo>', 'repository name in format {workspace}/{repoSlug}', validateString, 'master')
    .option('-s, --npmSkip', 'skip npm package verification')
    .option('-b, --branch <branch>', 'target branch', validateString)
    .parse(process.argv)
    .opts();


const bitbucketClient = new BitbucketClient(
    BITBUCKET_AUTH_TOKEN,
    options.repo,
    options.branch,
);

const updatePackageJson = async (gitClient, dependencyName, dependencyVersion, skipNpmVerification) => {
    // TODO enhance error handling, to not wrap the whole script with try catch
    try {
        if (!skipNpmVerification) {
            console.log('Checking package for existence...')
            const packageExists = await checkPackageAndVersionExist(dependencyName, dependencyVersion);
            if (!packageExists) {
                throw new Error(`Error: package ${dependencyName} with version ${dependencyVersion} does not exist`);
            }
        }
        console.log(`Downloading ${FILE_TO_CHANGE}...`)
        const file = await gitClient.getFileContent(FILE_TO_CHANGE, 'master');
        console.log('Updating dependencies...')
        const changed = updateDependencies(file, dependencyName, dependencyVersion);
        if (!changed) {
            console.log(`No changes to ${dependencyName} in package.json`);
            return;
        }
        const branchName = prepareBranchName(dependencyName, dependencyVersion);
        const commitMessage = prepareCommitMessage(dependencyName, dependencyVersion);
        console.log('Creating commit and branch...')
        await gitClient.commitFile(FILE_TO_CHANGE, JSON.stringify(file, null, 2), commitMessage, branchName);
        const pullRequestDescription = preparePullRequestDescription(dependencyName, dependencyVersion);
        console.log('Creating a pull request...')
        const pullRequestResult = await gitClient.createPullRequest(branchName, commitMessage, pullRequestDescription);
        console.log(`Pull request created updating ${dependencyName} to ${dependencyVersion}: ${pullRequestResult.links.html.href}`);
    } catch (e) {
        console.error(e.message || e);
    }
}

(async () => {
    await updatePackageJson(bitbucketClient, options.package, options.version, options.npmSkip)
})()