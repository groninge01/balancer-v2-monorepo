import requests
import json

ftmscanApiKey = ""
etherscanApiKey = ""

balancerContracts = {
    "vault": "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    "protocolFeesCollector": "0xce88686553686DA562CE7Cea497CE749DA109f9F",
    "authorizer": "0xA331D84eC860Bf466b4CdCcFb4aC09a1B43F3aE6",
    "weightedPoolFactory": "0x8E9aa87E45e92bad84D5F8DD1bff34Fb92637dE9",
    "weightedPool2TokensFactory": "0xA5bf2ddF098bb0Ef6d120C98217dD6B141c74EE0",
    "stablePoolFactory": "0xc66Ba2B6595D3613CCab350C886aCE23866EDe24",
    "liquidityBootstrappingPoolFactory": "0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE",
    "metaStablePoolFactory": "0x67d27634E44793fE63c467035E31ea8635117cd4",
}

beethovenxContracts = {
    "vault": "0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce",
    "protocolFeesCollector": "0xC6920d3a369E7c8BD1A22DbE385e11d1F7aF948F",
    "authorizer": "0x974D3FF709D84Ba44cde3257C0B5B0b14C081Ce9",
    "weightedPoolFactory": "0x60467cb225092cE0c989361934311175f437Cf53",
    "weightedPool2TokensFactory": "0x92b377187bcCC6556FceD2f1e6DAd65850C20630",
    "stablePoolFactory": "0x55df810876354Fc3e249f701Dd78DeDE57991F8D",
    "liquidityBootstrappingPoolFactory": "0x458368B3724B5a1c1057A00b28eB03FEb5b64968",
    "metaStablePoolFactory": "0x70b55Af71B29c5Ca7e67bD1995250364C4bE5554",
}

for contract in balancerContracts:
    print(f"COMPARING '{contract}' CONTRACT\n")
    etherscanUrl = f"https://api.etherscan.io/api?module=contract&action=getsourcecode&address={balancerContracts[contract]}&apikey={etherscanApiKey}"
    ftmscanUrl = f"https://api.ftmscan.com/api?module=contract&action=getsourcecode&address={beethovenxContracts[contract]}&apikey={ftmscanApiKey}"

    etherscanResponse = requests.request("GET", etherscanUrl).json()
    ftmscanResponse = requests.request("GET", ftmscanUrl).json()

    balancerSourceCode = json.loads(etherscanResponse['result'][0]['SourceCode'].replace("}}", "}").replace("{{", "{"))
    beethovenxSourceCode = json.loads(ftmscanResponse['result'][0]['SourceCode'].replace("}}", "}").replace("{{", "{"))

    balancerSources = balancerSourceCode['sources']
    beethovenxSources = beethovenxSourceCode['sources']

    numberOfDifferences = 0
    for source in balancerSources:
        if balancerSources[source] != beethovenxSources[source]:
            print(f"{source} \274c  ")
            numberOfDifferences = numberOfDifferences + 1
        else:
            print(f"{source} \u2705  ")

    if numberOfDifferences > 0:
        print(f"{contract} not equal, writing source to files")
        balancerContractFile = open(f'{contract}.bal.txt', 'x')
        beethovenxContractFile = open(f"{contract}.beethovenx.txt", 'x')
        balancerContractFile.write(json.dumps(balancerSourceCode))
        beethovenxContractFile.write(json.dumps(beethovenxSourceCode))

    else:
        print("\nALL SOURCES EQUAL\n")
        print("-------------------------------------------\n")



