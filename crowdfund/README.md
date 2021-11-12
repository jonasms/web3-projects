== Spec ==
Create a Project
    1. Someone can create a new project.
    2. The smart contract is reusable; multiple projects can be registered and accept ETH concurrently.
        - Use the factory pattern.
    3. The goal is an amount of ETH that is set at project creation and can't be changed.

Project Management
    1. If the goal is not met w/in 30 days then the project fails.
        - Can no longer take contributions.
        - Supporters can withdraw their money.
        - Contributor badges are still valid and tradable.
    2. Once the goal is met
        - Can no longer take contributions.
        - The owner can withdraw any of the availalable funds.

Contribute to a Project + Receive NFT
    1. People can send any amount of ETH greater than or equal to 0.01ETH to the project.
    2. Contributors will receive 1 "Contributor Badge" NFT per ETH contributed.
    3. "Contributor Badges" are tradable (meet ERC721 standards).
    4. Once the amount of contributions meet or exceed the goal, the project closes to further contributions.
    5. The last transaction can exceed the goal.
    6. Contributors can withdraw their contributions if the project fails or gets canceled

Owner Withdraws Funds
    1. Owner can only withdraw funds once goal is met.
    2. Owner can withdraw a fraction or all of the funds available.

----------------------------------------------------------------------
Known Relevant Hacks
1. Re-entrancy

----------------------------------------------------------------------
Architecture

    CampaignFactory:
        @notice Manages creating campaigns

        struct Campaign {
            string name; // set by user, must be unique
            uint goal; // set by user
            uint createdAt; // set to `now` by the contract
            uint value;
            bool canceled;
            bool goalMet;
            mapping (address => uint) contributors
        }

        Campaign[] campaigns;

        // Campaign names are unique in order to serve as UUIDs
        mapping (string => address) public campaignToOwner // TODO public vs private here?

        function createCampaign(string _name, uint _goal)
            - require that name is unique
            - create campaign
            - associate campaign to owner via campaignToOwner
            - emit event

    CampaignManager:
        @notice Methods for managing existing campaigns

        function cancelCampaign(string _campaignName) public
            - require msg.sender to be campaign owner
            - require campaign to not be canceled
            - set campaign to canceled (`canceled` set to `true`)

        function withdraw(string _campaignName, uint _amount) external
            == Vulnerability: Re-entrency attack ==
            - require msg.sender to be campaign owner
            - require campaign to not be canceled and goal to be met
            - require _amount <= funds
            - reduce _amount from funds
            - transfer _amount to msg.sender


    CampaignContributor
        @notice Methods for contributors to interact with campaigns

        function contribute(string _campaignName) external payable
            - require campaign.value < campaign.goal
            - require campaign.createdAt w/in past 30 days
            - require msg.value > 0.01ETH

            - add msg.value to campaign.value
            - for each ETH, transfer an NFT token to msg.sender

        function refund(string _campaignName) external
            // TODO how to get contribution history for given msg.sender?
            - require campaign to be canceled OR
                ( over 30 days old AND goal not met )
            - require msg.sender to have contributed to campaign

            - refund amount contributed to campaign to msg.sender

    ContributorBadge (is ERC721)
        @notice Creates an ERC721 Token for contributors using @openzeppelin/contracts/token/ERC721/ERC721.sol

        // TODO
        //  * how are tokens transferred to addresses?

        function award(address _contributor) private

        ownerOf
        transfer
        balanceOf

----------------------------------------------------------------------

Design Exercise
    Contribution Tiers
        In order to support contribution tiers I would implement the ERC721Metadata extension
        that enabled associating metadata to an NFT.

        More specifically, I would use the `attributes` metadata property.

        Something like
        ```
        ...
        {
            "attributes": [
                {
                    "trait_type": "ContributionTier",
                    "value": "Gold"
                }
            ]
        }
        ```
