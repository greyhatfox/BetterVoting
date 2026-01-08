let web3;
let contract;
let account;

const contractAddress = "0x8A6126b33DA6109F84f102cF01DdF515e61F220A";

const abi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [{"internalType":"string","name":"_name","type":"string"}],
        "name":"addCandidate",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
    },
    {
        "inputs":[{"internalType":"uint256","name":"_candidateId","type":"uint256"}],
        "name":"vote",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
    },
    {
        "inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],
        "name":"getCandidate",
        "outputs":[
            {"internalType":"string","name":"","type":"string"},
            {"internalType":"uint256","name":"","type":"uint256"}
        ],
        "stateMutability":"view",
        "type":"function"
    },
    {
        "inputs":[{"internalType":"uint256","name":"","type":"uint256"}],
        "name":"candidates",
        "outputs":[
            {"internalType":"uint256","name":"id","type":"uint256"},
            {"internalType":"string","name":"name","type":"string"},
            {"internalType":"uint256","name":"voteCount","type":"uint256"}
        ],
        "stateMutability":"view",
        "type":"function"
    },
    {
        "inputs":[{"internalType":"address","name":"","type":"address"}],
        "name":"hasVoted",
        "outputs":[{"internalType":"bool","name":"","type":"bool"}],
        "stateMutability":"view",
        "type":"function"
    },
    {
        "inputs":[],
        "name":"candidatesCount",
        "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
        "stateMutability":"view",
        "type":"function"
    }
];

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask not found");
        return;
    }

    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];

    document.getElementById("account").innerText = account;
    document.getElementById("userInfo").classList.remove("hidden");

    contract = new web3.eth.Contract(abi, contractAddress);
    loadCandidates();
}

async function loadCandidates() {
    const count = await contract.methods.candidatesCount().call();
    const list = document.getElementById("candidateList");
    list.innerHTML = "";

    if (count == 0) {
        list.innerHTML = `<li class="empty-state">No candidates available</li>`;
        return;
    }

    for (let i = 1; i <= count; i++) {
        const candidate = await contract.methods.candidates(i).call();

        const li = document.createElement("li");
        li.className = "candidate-item";

        li.innerHTML = `
            <div>
                <div class="candidate-name">${candidate.name}</div>
                <div class="vote-count">${candidate.voteCount} votes</div>
            </div>
            <button class="vote-btn" onclick="vote(${candidate.id})">
                Vote
            </button>
        `;

        list.appendChild(li);
    }
}

async function vote(id) {
    try {
        await contract.methods.vote(id).send({ from: account });
        loadCandidates();
    } catch (err) {
        alert(err.message);
    }
}
