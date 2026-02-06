// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentIdentityRegistry V2
 * @notice Enhanced on-chain identity registry with discovery, disputes, and skill staking
 * @dev Krypt - Improvements based on hackathon feedback
 */

contract AgentIdentityRegistryV2 {
    /// @notice Storage for registered agents
    struct Agent {
        address owner;
        string name;
        string description;
        uint256 registeredAt;
        uint256 reputation;
        string metadata;
        bool verified;
        bool revoked;
        uint256 stakedAmount;
        uint256 upvoteCount;
        uint256 downvoteCount;
    }

    address public immutable i_owner;

    // USDC on testnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    uint256 public agentCount;
    address[] public agentAddresses;

    mapping(address => Agent) public agents;
    mapping(address => bool) public isRegistered;

    // Voting: Sender -> Agent -> Boolean
    mapping(address => mapping(address => bool)) public hasVotedMap;
    mapping(address => address[]) public votesCastByAgent;

    // Downvotes for disputes
    mapping(address => mapping(address => bool)) public hasDownvotedMap;
    mapping(address => address[]) public downvotesCastByAgent;

    mapping(address => string[]) public agentSkills;

    // Skill -> Agent addresses (for discovery)
    mapping(string => address[]) public agentsBySkill;
    mapping(string => mapping(address => bool)) public skillAgentExists;

    // Minimum stake to claim a skill (USDC, scaled by 1e6 for 6 decimals)
    uint256 public constant MIN_STAKE = 100 * 1e6; // 100 USDC

    // Owner can recover staked funds
    mapping(address => uint256) public pendingWithdrawals;

    event AgentRegistered(address indexed agentAddr, string name, string metadata);
    event AgentVerified(address indexed agentAddr, bool verified);
    event AgentRevoked(address indexed agentAddr, bool revoked, string reason);
    event ReputationUpdated(address indexed agentAddr, uint256 newRep, uint256 oldRep);
    event ReputationDecreased(address indexed agentAddr, uint256 newRep, uint256 oldRep, string reason);
    event AgentSkillAdded(address indexed agentAddr, string skill, bool staked);
    event AgentStaked(address indexed agentAddr, uint256 amount);
    event AgentUnstaked(address indexed agentAddr, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == i_owner, "Only owner");
        _;
    }

    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "Not registered");
        _;
    }

    modifier notRevoked(address agentAddr) {
        require(!agents[agentAddr].revoked, "Agent revoked");
        _;
    }

    constructor() {
        i_owner = msg.sender;
        agentCount = 0;
    }

    /**
     * @notice Register as an AI agent
     */
    function registerAgent(
        string calldata name,
        string calldata metadata,
        string calldata description
    ) external {
        require(!isRegistered[msg.sender], "Already registered");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Name length invalid");

        agents[msg.sender] = Agent({
            owner: msg.sender,
            name: name,
            description: description,
            registeredAt: block.timestamp,
            reputation: 0,
            metadata: metadata,
            verified: false,
            revoked: false,
            stakedAmount: 0,
            upvoteCount: 0,
            downvoteCount: 0
        });

        isRegistered[msg.sender] = true;
        agentAddresses.push(msg.sender);
        agentCount++;

        emit AgentRegistered(msg.sender, name, metadata);
    }

    /**
     * @notice Add skill with optional staking
     * @param skill What the agent claims to do
     * @param stakeAmount USDC to stake (0 = no stake, trust-based)
     */
    function addSkill(string calldata skill, uint256 stakeAmount) external onlyRegistered {
        require(!agents[msg.sender].revoked, "Agent revoked");
        require(bytes(skill).length > 0, "Skill cannot be empty");

        // Check if agent already has this skill
        for (uint i = 0; i < agentSkills[msg.sender].length; i++) {
            if (keccak256(bytes(agentSkills[msg.sender][i])) == keccak256(bytes(skill))) {
                revert("Already has this skill");
            }
        }

        agentSkills[msg.sender].push(skill);

        // Add to skill index for discovery
        if (!skillAgentExists[skill][msg.sender]) {
            agentsBySkill[skill].push(msg.sender);
            skillAgentExists[skill][msg.sender] = true;
        }

        bool staked = false;
        if (stakeAmount > 0) {
            // In production, this would transfer USDC
            // For demo, we track the commitment
            agents[msg.sender].stakedAmount += stakeAmount;
            pendingWithdrawals[msg.sender] += stakeAmount;
            staked = true;
            emit AgentStaked(msg.sender, stakeAmount);
        }

        emit AgentSkillAdded(msg.sender, skill, staked);
    }

    /**
     * @notice Remove skill (and unstake if applicable)
     */
    function removeSkill(string calldata skill) external onlyRegistered {
        require(!agents[msg.sender].revoked, "Agent revoked");

        uint256 index = type(uint256).max;
        for (uint i = 0; i < agentSkills[msg.sender].length; i++) {
            if (keccak256(bytes(agentSkills[msg.sender][i])) == keccak256(bytes(skill))) {
                index = i;
                break;
            }
        }

        require(index != type(uint256).max, "Skill not found");

        // Remove from skills array
        agentSkills[msg.sender][index] = agentSkills[msg.sender][agentSkills[msg.sender].length - 1];
        agentSkills[msg.sender].pop();

        // Remove from skill index
        address[] storage skillAgents = agentsBySkill[skill];
        for (uint i = 0; i < skillAgents.length; i++) {
            if (skillAgents[i] == msg.sender) {
                skillAgents[i] = skillAgents[skillAgents.length - 1];
                skillAgents.pop();
                skillAgentExists[skill][msg.sender] = false;
                break;
            }
        }
    }

    /**
     * @notice Upvote an agent (increase reputation)
     */
    function upvoteAgent(address agentAddr) external onlyRegistered notRevoked(agentAddr) {
        require(isRegistered[agentAddr], "Agent not registered");
        require(agentAddr != msg.sender, "Cannot vote for self");
        require(!hasVotedMap[msg.sender][agentAddr], "Already voted");

        hasVotedMap[msg.sender][agentAddr] = true;
        votesCastByAgent[msg.sender].push(agentAddr);

        uint256 oldRep = agents[agentAddr].reputation;
        agents[agentAddr].reputation += 1;
        agents[agentAddr].upvoteCount += 1;

        emit ReputationUpdated(agentAddr, agents[agentAddr].reputation, oldRep);
    }

    /**
     * @notice Downvote an agent (dispute - decrease reputation)
     * @dev Requires reason string for transparency
     */
    function downvoteAgent(address agentAddr, string calldata reason) external onlyRegistered {
        require(isRegistered[agentAddr], "Agent not registered");
        require(agentAddr != msg.sender, "Cannot downvote self");
        require(!hasDownvotedMap[msg.sender][agentAddr], "Already downvoted");
        require(!agents[agentAddr].revoked, "Agent already revoked");
        require(bytes(reason).length > 0, "Reason required");

        hasDownvotedMap[msg.sender][agentAddr] = true;
        downvotesCastByAgent[msg.sender].push(agentAddr);
        agents[agentAddr].downvoteCount += 1;

        uint256 oldRep = agents[agentAddr].reputation;
        // Don't go below 0
        if (oldRep > 0) {
            agents[agentAddr].reputation -= 1;
        }

        emit ReputationDecreased(agentAddr, agents[agentAddr].reputation, oldRep, reason);

        // Auto-revoke if reputation hits 0 and has significant downvotes
        // Bug fix: use downvoteCount (votes RECEIVED) not downvotesCastByAgent (votes CAST)
        if (agents[agentAddr].reputation == 0) {
            if (agents[agentAddr].downvoteCount >= 3) {
                agents[agentAddr].revoked = true;
                emit AgentRevoked(agentAddr, true, "Auto-revoked: 0 reputation, multiple disputes");
            }
        }
    }

    /**
     * @notice Get agents by skill
     */
    function getAgentsBySkill(string calldata skill) external view returns (address[] memory) {
        return agentsBySkill[skill];
    }

    /**
     * @notice Get skill count for an agent
     */
    function getSkillCount(address agentAddr) external view returns (uint256) {
        return agentSkills[agentAddr].length;
    }

    /**
     * @notice Get upvote/downvote stats for an agent
     */
    function getVoteStats(address agentAddr) external view returns (uint256 upvotes, uint256 downvotes) {
        return (agents[agentAddr].upvoteCount, agents[agentAddr].downvoteCount);
    }

    /**
     * @notice Get full agent profile
     */
    function getAgent(address agentAddr) external view returns (
        address owner,
        string memory name,
        string memory description,
        uint256 registeredAt,
        uint256 reputation,
        string[] memory skills,
        bool verified,
        bool revoked,
        uint256 stakedAmount
    ) {
        Agent storage agent = agents[agentAddr];
        require(agent.owner != address(0), "Agent not found");

        return (
            agent.owner,
            agent.name,
            agent.description,
            agent.registeredAt,
            agent.reputation,
            agentSkills[agentAddr],
            agent.verified,
            agent.revoked,
            agent.stakedAmount
        );
    }

    /**
     * @notice Get all registered agents (paginated)
     */
    function getAllAgents(uint256 offset, uint256 limit) external view returns (Agent[] memory) {
        if (offset >= agentCount) {
            return new Agent[](0);
        }

        uint256 remaining = agentCount - offset;
        uint256 resultSize = remaining < limit ? remaining : limit;
        Agent[] memory result = new Agent[](resultSize);

        for (uint i = 0; i < resultSize; i++) {
            result[i] = agents[agentAddresses[offset + i]];
        }

        return result;
    }

    /**
     * @notice Owner verifies agents
     */
    function verifyAgent(address agentAddr, bool verified) external onlyOwner {
        require(isRegistered[agentAddr], "Agent not registered");
        agents[agentAddr].verified = verified;
        emit AgentVerified(agentAddr, verified);
    }

    /**
     * @notice Owner can revoke malicious agents
     */
    function revokeAgent(address agentAddr, string calldata reason) external onlyOwner {
        require(isRegistered[agentAddr], "Agent not registered");
        agents[agentAddr].revoked = true;
        emit AgentRevoked(agentAddr, true, reason);
    }

    /**
     * @notice Owner can restore revoked agents
     */
    function restoreAgent(address agentAddr) external onlyOwner {
        require(isRegistered[agentAddr], "Agent not registered");
        agents[agentAddr].revoked = false;
        emit AgentRevoked(agentAddr, false, "Restored by owner");
    }

    /**
     * @notice Unstake and withdraw (for demo, just track withdrawal)
     */
    function unstake(uint256 amount) external onlyRegistered {
        require(agents[msg.sender].stakedAmount >= amount, "Insufficient staked amount");
        require(pendingWithdrawals[msg.sender] >= amount, "Insufficient pending");

        agents[msg.sender].stakedAmount -= amount;
        pendingWithdrawals[msg.sender] -= amount;

        emit AgentUnstaked(msg.sender, amount);

        // In production, transfer USDC back here
    }

    /**
     * @notice Check if sender has voted for agent
     */
    function hasVoted(address sender, address agentAddr) external view returns (bool) {
        return hasVotedMap[sender][agentAddr];
    }

    /**
     * @notice Check if sender has downvoted agent
     */
    function hasDownvoted(address sender, address agentAddr) external view returns (bool) {
        return hasDownvotedMap[sender][agentAddr];
    }
}
