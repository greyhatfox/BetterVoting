let web3;
let contract;
let account;

const contractAddress = "0xCed83B412eeBa490439AcdBa3AA12b1a3CdA7EF5";

const abi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }],
        "name": "addCandidate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_candidateId", "type": "uint256" }],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
        "name": "getCandidate",
        "outputs": [
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "candidates",
        "outputs": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "hasVoted",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "candidatesCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
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

    // Check if user has already voted
    const votedFor = await contract.methods.hasVoted(account).call();
    loadCandidates(votedFor);
    loadLeaderboard(votedFor);
}

async function loadLeaderboard(votedFor = null) {
    const count = await contract.methods.candidatesCount().call();
    const leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "";

    if (count == 0) {
        leaderboard.innerHTML = `<div class="empty-state">No candidates available</div>`;
        return;
    }

    // If votedFor is null, check again
    if (votedFor === null && account) {
        votedFor = await contract.methods.hasVoted(account).call();
    }

    const hasVoted = votedFor && votedFor != "0";

    // Fetch all candidates
    const candidates = [];
    let totalVotes = 0;

    for (let i = 1; i <= count; i++) {
        const candidate = await contract.methods.candidates(i).call();
        candidates.push(candidate);
        totalVotes += parseInt(candidate.voteCount);
    }

    // Sort by vote count (descending)
    candidates.sort((a, b) => parseInt(b.voteCount) - parseInt(a.voteCount));

    // Display leaderboard
    candidates.forEach((candidate, index) => {
        const rank = index + 1;
        const voteCount = parseInt(candidate.voteCount);
        const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;

        let rankClass = "rank-other";
        if (rank === 1) rankClass = "rank-1";
        else if (rank === 2) rankClass = "rank-2";
        else if (rank === 3) rankClass = "rank-3";

        const item = document.createElement("div");
        item.className = "leaderboard-item";
        item.style.setProperty('--progress', `${percentage}%`);

        // Show vote count only if user has voted
        const voteDisplay = hasVoted
            ? `<span>${voteCount} votes</span><span class="vote-percentage">(${percentage}%)</span>`
            : `<span>Vote to reveal</span>`;

        item.innerHTML = `
            <div class="rank-badge ${rankClass}">${rank}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${candidate.name}</div>
                <div class="leaderboard-votes">
                    ${voteDisplay}
                </div>
            </div>
        `;

        leaderboard.appendChild(item);
    });
}

async function loadCandidates(votedFor = null) {
    const count = await contract.methods.candidatesCount().call();
    const list = document.getElementById("candidateList");
    list.innerHTML = "";

    if (count == 0) {
        list.innerHTML = `<li class="empty-state">No candidates available</li>`;
        return;
    }

    // If votedFor is null, check again
    if (votedFor === null && account) {
        votedFor = await contract.methods.hasVoted(account).call();
    }

    const hasVoted = votedFor && votedFor != "0";

    for (let i = 1; i <= count; i++) {
        const candidate = await contract.methods.candidates(i).call();

        const li = document.createElement("li");
        li.className = "candidate-item";

        // Determine if this is the candidate the user voted for
        const isVotedFor = hasVoted && candidate.id == votedFor;
        const isDisabled = hasVoted && !isVotedFor;

        // Show vote count only if user has voted
        const voteCountHtml = hasVoted
            ? `<div class="vote-count">${candidate.voteCount} votes</div>`
            : `<div class="vote-count">Vote to reveal results</div>`;

        // Button text and class
        let buttonClass = "vote-btn";
        let buttonText = "Vote";

        if (isVotedFor) {
            buttonClass += " voted";
            buttonText = "Voted";
        } else if (isDisabled) {
            buttonClass += " disabled";
        }

        li.innerHTML = `
            <div>
                <div class="candidate-name">${candidate.name}</div>
                ${voteCountHtml}
            </div>
            <button class="${buttonClass}" onclick="vote(${candidate.id})" ${isDisabled ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;

        list.appendChild(li);
    }
}

async function vote(id) {
    try {
        await contract.methods.vote(id).send({ from: account });
        // Reload candidates with the voted candidate ID
        loadCandidates(id);
        loadLeaderboard(id);
    } catch (err) {
        alert(err.message);
    }
}
