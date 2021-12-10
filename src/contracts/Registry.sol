// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IRegistry.sol';

contract Registry is IRegistry {
    // domain => data
    mapping(string => Domain) public domainData;

    modifier notEmpty(string memory _value) {
        bytes memory byteValue = bytes(_value);
        require(byteValue.length != 0, 'NO_VALUE');
        _;
    }

    function addDomainData(string memory _domain, Domain memory _data) external override notEmpty(_domain) {
        if (domainData[_domain].admin != address(0)) {
            require(msg.sender == domainData[_domain].admin, 'Admin: FORBIDDEN');
            domainData[_domain] = _data;
        } else {
            domainData[_domain] = _data;
        }
    }

    function removeDomain(string memory _domain) external override notEmpty(_domain) {
        delete domainData[_domain];
    }

    function domain(string memory _domain) external view override returns(Domain memory) {
        return domainData[_domain];
    }
}