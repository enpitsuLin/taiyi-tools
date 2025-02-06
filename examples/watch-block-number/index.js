import { Client, BlockchainMode } from '@taiyinet/ctaiyi'

const client = Client.testnet() 

const stream = client.blockchain.getBlockNumberStream({ mode: BlockchainMode.Latest })

console.log(`Tracking block number`)

stream.getReader().read().then(({ done, value }) => {
  if (done) {
    console.log('Stream closed')
  } else {
    console.log('Block number:', value)
  }
})

