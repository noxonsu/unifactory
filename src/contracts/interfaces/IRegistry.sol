// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRegistry {
    struct Domain {
        address admin;
        address storageAddress;
    }

    function addDomainData(string memory _domain, Domain memory _project) external;
    function removeDomain(string memory _domain) external;
    function domain(string memory _domain) external view returns(Domain memory);
}