// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentIdentityRegistry
 * @notice On-chain identity registry for autonomous AI agents
 * @dev Krypt
 */
 
contract AgentIdentityRegistry {
    /// @notice Storage for registered agents
    struct Agent {
        address owner;
        string name;
        string description;
        uint256 registeredAt;
        uint256 reputation;
        string metadata; // URI to on-chain metadata
        bool verified;
    }
    
    address public immutable i_owner;
    
    // USDC on testnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    uint256 public agentCount;
    address[] public agentAddresses; // Track addresses for enumeration
    
    mapping(address => Agent) public agents;
    mapping(address => bool) public isRegistered;
    
    // Mapping: Sender -> Agent -> Boolean (Has sender voted for agent?)
    mapping(address => mapping(address => bool)) public hasVotedMap;
    
    // Optional: Keep track of who an agent has voted for (if needed for UI)
    mapping(address => address[]) public votesCastByAgent;
    
    mapping(address => string[]) public agentSkills; // What agent can do
    
    event AgentRegistered(address indexed agentAddr, string name, string metadata);
    event AgentVerified(address indexed agentAddr, bool verified);
    event ReputationUpdated(address indexed agentAddr, uint256 newRep, uint256 oldRep);
    event AgentSkillAdded(address indexed agentAddr, string skill);
    
    modifier onlyOwner() {
        require(msg.sender == i_owner, "Only owner");
        _;
    }
    
    constructor() {
        i_owner = msg.sender;
        agentCount = 0;
    }
    
    /**
     * @notice Register as an AI agent
     * @param name Agent name
     * @param metadata URI to metadata (e.g., "ipfs://..." or "https://...")
     * @param description What this agent does
     */
    function registerAgent(
        string calldata name,
        string calldata metadata,
        string calldata description
    ) external {
        require(!isRegistered[msg.sender], "Already registered");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Name too long");
        
        agents[msg.sender] = Agent({
            owner: msg.sender,
            name: name,
            description: description,
            registeredAt: block.timestamp,
            reputation: 0,
            metadata: metadata,
            verified: false
        });
        
        isRegistered[msg.sender] = true;
        agentAddresses.push(msg.sender);
        agentCount++;
        
        emit AgentRegistered(msg.sender, name, metadata);
    }
    
    /**
     * @notice Agent self-verifies their capabilities
     * @param skill What the agent claims to do (proven by transaction, etc.)
     */
    function selfAddSkill(string calldata skill) external {
        require(isRegistered[msg.sender], "Not registered");
        // In production, this would require proof of execution
        // For hackathon demo, we trust self-reporting
        agentSkills[msg.sender].push(skill);
        emit AgentSkillAdded(msg.sender, skill);
    }
    
    /**
     * @notice Vote for another agent's reputation
     * @param agentAddr Address of agent to vote for
     */
    function voteForAgent(address agentAddr) external {
        require(isRegistered[agentAddr], "Agent not registered");
        require(isRegistered[msg.sender], "Must be registered to vote");
        require(agentAddr != msg.sender, "Cannot vote for self");
        require(!hasVotedMap[msg.sender][agentAddr], "Already voted");
        
        hasVotedMap[msg.sender][agentAddr] = true;
        votesCastByAgent[msg.sender].push(agentAddr);
        
        uint256 oldRep = agents[agentAddr].reputation;
        agents[agentAddr].reputation += 1;
        
        emit ReputationUpdated(agentAddr, agents[agentAddr].reputation, oldRep);
    }
    
    /**
     * @notice Check if sender has voted for agent
     */
    function hasVoted(address sender, address agentAddr) public view returns (bool) {
        return hasVotedMap[sender][agentAddr];
    }
    
    /**
     * @notice Get agent info by address
     */
    function getAgent(address agentAddr) external view returns (
        address owner,
        string memory name,
        string memory description,
        uint256 registeredAt,
        uint256 reputation,
        string[] memory skills,
        bool verified
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
            agent.verified
        );
    }
    
    /**
     * @notice Get all registered agents (paginated)
     * @dev Simple implementation for hackathon. Returns basic struct data, not skills to save gas.
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
     * @notice Owner can verify agents (production feature)
     */
    function verifyAgent(address agentAddr, bool verified) external onlyOwner {
        require(isRegistered[agentAddr], "Agent not registered");
        agents[agentAddr].verified = verified;
        emit AgentVerified(agentAddr, verified);
    }
}
