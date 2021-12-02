The following is a micro audit of https://github.com/Hacker-DAO/student.JonasMS/tree/2e6dce46683dbb588291c9f33d112adcf7d68b96/dao by Alex

## Design Exercise

It would be good to have a bit more detail here, especially on how your proposals would work. For part 2 one issue that arises with transitive delegation is the possibility of the existence of loops (Alice delegated to Bob, Bob delegated to Charlie, Charlie delegated to Alice).


## General Comments

This is a good solution. I think it would work! More extensive tests would be the next thing I'd like to see.


## issue-1

**[Medium]** Incorrect handling of quorum

- CollectorDAO:47 in the state function a proposal is defeated if the for votes are less than the quorum. Votes against and abstentions should also be counted in deciding whether the quorum was reached.


## issue-2

**[Medium]** Non EOA accounts cannot vote

The only way to vote is by signature. However, only EOAs can create signatures, and the contract does not prevent non-EOA accounts from becoming members. This situation increases quorum with members that cannot vote.


## issue-3

**[Low]** castVotesBulk is brittle

If any one vote/signature passed to `castVotesBulk` is invalid, the entire transaction will fail. But more importantly, you won't know which one.

Consider letting invalid votes/signatures silently fail, and having off-chain applications listen for `VoteCast` events.


## issue-4

**[Code Quality]** Unnecessarily complicated calculation

- CollectorDAO:33 in the `_quorum` method multiplying by 100 then dividing by 400 will always produce the same result as just dividing by 4.
    


## Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 5 |
| Unanswered design exercise | - |

Total: 5
Good job!
