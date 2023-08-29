// TODO - separate some business logic to separate services
import {InvalidArgumentError} from "commander";
import npmRegistryFetch from "npm-registry-fetch";

const deleteSpecialCharacters = (value) => value.replace(/[^a-zA-Z0-9.]/g, '');

export const prepareCommitMessage = (dependencyName, dependencyVersion) => `update ${dependencyName} to ${dependencyVersion}`;

export const preparePullRequestDescription = (dependencyName, dependencyVersion) => `This is an automated pull request to update ${dependencyName} to ${dependencyVersion}`;

export const prepareBranchName = (dependencyName, dependencyVersion) => `auto/update-${deleteSpecialCharacters(dependencyName)}-to-${deleteSpecialCharacters(dependencyVersion)}`;

// TODO - separate this method to an abstraction and implement it for other types of files(if needed)
export const updateDependencies = (file, dependencyName, dependencyVersion) => {
    let changed = false;
    const fieldsToUpdate = ['dependencies', 'devDependencies'];
    fieldsToUpdate.forEach((field) => {
        if (file[field]?.[dependencyName] && file[field][dependencyName] !== dependencyVersion) {
            file[field][dependencyName] = dependencyVersion;
            changed = true;
        }
    })
    return changed;
}

export const validateVersion = (value) => {
    if (!value.match(/^(?:\^|\~)?(?:\d+\.)?(?:\d+\.)?(?:\*|\d+)$/)) {
        throw new InvalidArgumentError('Version must be in format x.x.x');
    }
    return value;
}

export const validateString = (value) => {
    if (value.includes(' ')) {
        throw new InvalidArgumentError('Package name must have valid name');
    }
    return value;
}

export async function checkPackageAndVersionExist(packageName, version) {
    try {
        const packageInfo = await npmRegistryFetch.json(packageName);

        return version && packageInfo.versions && packageInfo.versions[deleteSpecialCharacters(version)];
    } catch (error) {
        return false;
    }
}