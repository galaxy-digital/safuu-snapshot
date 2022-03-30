import * as fs from 'fs'
import * as ethers from 'ethers'
import * as abi from './abi.json'

(async () => {
	const rpcKey = 'https://bsc-dataseed.binance.org/'
	const contractAddress = "0xe5ba47fd94cb645ba4119222e34fb33f59c7cd90"
	// const url = "https://api.bscscan.com/api?module=account&action=txlist&address=" + contractAddress + "&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=" + apiKey
	// console.log(url)
	let start = 15372122
	let last = 16502296
	const provider = new ethers.providers.JsonRpcProvider(rpcKey)
	const contract = new ethers.Contract(contractAddress, abi, provider)
	const decimals = await contract.decimals()
	const eventFilter = contract.filters.Transfer()

	const holders = {} as {[key:string]:string}

	const limit = 5000
	for (let k = start; k <= last; k+=limit) {
		
		let events = await contract.queryFilter(eventFilter, k, k + limit)
		console.log(`#${k}-${k+limit} ${events.length} events`)
		for (let i of events) {
			if (!i.removed && i.args && i.args.length===3 && !!i.args[2].hex) {
				const address = i.args[1]
				const value = i.args[2].hex
				if (holders[address]!==undefined) {
					holders[address] = ethers.BigNumber.from(value).add(ethers.BigNumber.from(holders[address])).toHexString()
				} else {
					holders[address] = ethers.BigNumber.from(value).toHexString()
				}
			}
		}
	}
	// fs.appendFileSync(__dirname + '/../response.json', JSON.stringify(events, null, '\t'))
	fs.writeFileSync( __dirname + '/../april.csv', Object.keys(holders).map(k=>{
		const v = ethers.utils.formatUnits( ethers.BigNumber.from(holders[k]),  decimals)
		return (k + ',' + v )
	}).join('\r\n') )
})()