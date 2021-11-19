// import fs from 'fs';
// import path from 'path';
// import solc from 'solc';

/*
Uncaught RangeError: WebAssembly.Compile is disallowed on the main thread,
if the buffer size is larger than 4KB. Use WebAssembly.compile, or compile
on a worker thread
*/

// const readJSON = async (jsonFile) => {
//   return new Promise((res, rej) => {
//     const reader = new FileReader();

//     reader.onload = () => {
//       try {
//         const jsonContent = JSON.parse(reader.result);

//         res(jsonContent);
//       } catch (err) {
//         rej('JSON file seems malformed.');
//       }
//     };

//     reader.onerror = (error) => {
//       rej("File couldn't be read");
//     };

//     reader.readAsText(jsonFile);
//   });
// };

// export const compileContract = async (params) => {
//   const { name = 'Factory' } = params;
//   const fileName = `${name}.sol`;

//   const factoryBefore = await readJSON('../contracts/build/Factory.json');
//   console.log('factory before: ', factoryBefore);

//   const contract = fs.readFileSync(path.resolve(`../contracts/${fileName}`));

//   const input = {
//     language: 'Solidity',
//     sources: {
//       [fileName]: {
//         content: contract.toString(),
//       },
//     },
//     settings: {
//       outputSelection: {
//         '*': {
//           '*': ['*'],
//         },
//       },
//     },
//   };

//   const output = JSON.parse(solc.compile(JSON.stringify(input)));
//   const result = {
//     abi: output.contracts[fileName][name].abi,
//     bytecode: output.contracts[fileName][name].evm.bytecode.object,
//   };

//   fs.writeFileSync(
//     path.resolve(`../contracts/build/${name}.json`),
//     JSON.stringify(result)
//   );

//   const factoryAfter = await readJSON('../contracts/build/Factory.json');
//   console.log('factory after: ', factoryAfter);

//   // `output` here contains the JSON output as specified in the documentation
//   // for (var contractName in output.contracts['Factory.sol']) {
//   //   console.log(
//   //     contractName +
//   //     ': ' +
//   //     output.contracts['Farm.sol'][contractName].evm.bytecode.object
//   //   );
//   // }
// };
