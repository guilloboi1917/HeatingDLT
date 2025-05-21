# Blockchain Heating App

## Guide

- Set up IPFS
  - Install Kubo (IPFS Node) (<https://dist.ipfs.tech/#kubo>)
  - Add installed location as ``$PATH``
  - test installation with ``ipfs --version`` in cmd
  - do ``ipfs init`` and open newly created folder in ``C:\Users\<your-user-here>\.ipfs``
  - Configure ``~/.ipfs/config`` and add the following lines in the first "API" property:
  
    ```json
    "HTTPHeaders": {
          "Access-Control-Allow-Credentials": [
            "true"
          ],
          "Access-Control-Allow-Headers": [
            "Authorization"
          ],
          "Access-Control-Allow-Methods": [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
          ],
          "Access-Control-Allow-Origin": [
            "http://localhost:3500",
            "http://127.0.0.1:3500",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ],
          "Access-Control-Expose-Headers": [
            "Location",
            "Content-Type"
          ]
        }
    ```
  
  - Start the ipfs node with ``ipfs daemon``

- Install MetaMask browser extension
- Create new Wallet
- Add testing network
  - Add network name: HeatingDLT
  - Add RPC-URL: <http://127.0.0.1:8545>
  - Add Chain-ID: 31337
  - Add Symbol: TNCY
  - Save
- Switch to created testing network
- Start back-end in terminal and run script
  - ``npm install``
  - ``npx hardhat node``
  - ``npx hardhat run ./scripts/TencyManager.js --network localhost``
- Start front-end
  - ``npm install``
  - ``npm run dev``
- open <http://localhost:3500> in browser
- Add account (first account is admin/landlord)
  - Select private key
  - Paste a private key from executed script
    - example: ``0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80``
- optional:
  - rename account to match function
  - get account order from ``LocalDevAccounts.txt`` in the back-end folder
