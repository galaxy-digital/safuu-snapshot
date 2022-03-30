import * as fs from 'fs'
import * as ethers from 'ethers'
import * as abi from './abi.json'

(async () => {
	const rpcKey = 'https://bsc-dataseed.binance.org/'
	const contractAddress = "0xe5ba47fd94cb645ba4119222e34fb33f59c7cd90"
	// const nullAddress = "0x0000000000000000000000000000000000000000"
	// const url = "https://api.bscscan.com/api?module=account&action=txlist&address=" + contractAddress + "&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=" + apiKey
	// console.log(url)
	let start = 15372122
	let last = 16502296
	let count = last - start
	const provider = new ethers.providers.JsonRpcProvider(rpcKey)
	const contract = new ethers.Contract(contractAddress, abi, provider)
	const decimals = await contract.decimals()
	const eventFilter = contract.filters.Transfer()

	const holders = {} as {[key:string]:string}

	const limit = 5000
	for (let k = start; k < last; k+=limit) {
		
		let events = await contract.queryFilter(eventFilter, k, k + limit)
		console.log(`#${k} - ${(k + 5000 - start)}/${count} - ${ Math.round((k + 5000 - start) * 10000 / count )/100 }% ${events.length} events`)
		for (let i of events) {
			if (!i.removed && i.args && i.args.length===3 && !!i.args[2]._hex) {
				const from = i.args[0]
				const to = i.args[1]
				const value = ethers.BigNumber.from(i.args[2]._hex)
				
				if (holders[from]!==undefined) {
					const fromValue = ethers.BigNumber.from(holders[from])
					holders[from] = fromValue.sub(value).toHexString()	
				}
				if (holders[to]===undefined) {
					holders[to] = value.toHexString()
				} else {
					const toValue =  ethers.BigNumber.from(holders[to])
					holders[to] = toValue.add(value).toHexString()
				}
			}
		}
	}
	const lists = [] as string[]
	for (let k in holders) {
		const v = Number(ethers.utils.formatUnits( ethers.BigNumber.from(holders[k]),  decimals))
		if (v!==0) lists.push(k + ',' + v)
	}
	// fs.appendFileSync(__dirname + '/../response.json', JSON.stringify(events, null, '\t'))
	fs.writeFileSync( __dirname + '/../april.csv', lists.join('\r\n') )
	console.log(`Completed!!!`)
})()