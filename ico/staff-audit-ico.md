https://github.com/Hacker-DAO/student.JonasMS

The following is a micro audit of git commit 33237d063ca6489897852f78bf28c40fab45d49c by Diana


## Design Exercise

Your approach is good. Very nice that you kept in mind to never push funds to a user and to allow them to pull instead. The automated server calls should be in charge of updating the needed values on your contract but never to send funds to an address (unless you take the necessary precautions to deal with calling an untrusted account).


## issue-1

[Medium] Tax is not applied on all transfers

transfer override does not apply to transferFrom calls.


## issue-2

[Low] advancePhase() on line 115 should take an argument. The function could accidentally get called twice and it would skip over a phase irreversibly and nothing would prevent this.


## issue-3

[Code Quality] The `PhaseDetails` pattern you're using requires a lot of gas for both reading to and writing from storage. Constants will perform better here.


##  Nitpicks

- Line 29 Default value is the first element listed in definition of the type, in this case 
"Closed", so this line is unnecessary.

## Extra features

- purchase() refunds ether. When writing smart contracts, do as little as possible; don't write extra convenience logic unless absolutely necessary.

## Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | 2 |
| Vulnerability              | 3 |
| Unanswered design exercise | - |

Total: 5
Good job!
