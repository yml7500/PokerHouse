# PokerHouse: Poker Strategy Trainer

5-player (4 bots + 1 user) Texas Hold'Em simulator that coaches decisions in real time with expected value, pot odds, and Kelly Criterion analysis.
Try it at: https://poker-house-alpha.vercel.app/
## Inner Workings
To best simulate playing against humans, each bot first calculates a baseline optimal decision (bots run 2K random runouts of the board to examine chance of winning, and therefore equity in the hand). Based on deviation margins of its profile, though, the bot may make a technically irrational decision that is -EV (jitter function gives random variance of +/-5% to call/raise decisions).
The margins are based on playstyle:
| | Rock | Calling Station | Aggressor | Shark | 
| :---| :--- | :--- | :--- | :--- |
| BASE_FOLD_MARGIN (margin of error allowed to make "bad" calls) | 0.00 | 0.14 | 0.08 | 0.04 |
| minEdge (minimum equity surplus over pot odds to bet/raise) | 0.18 | 0.13 | 0.09 | 0.10 |
| bluffFrequency (chance of bluff) | 0.03 | 0.03 | 0.09 | 0.08 | 
| potFraction (default % of pot to bet) | 0.33 | 0.33 | 0.50 | 0.45 |
| chance (% chance of bot raising/betting if bot has the req'd edge) | 0.25 | 0.24 | 0.40 | 0.32 |

## Gamemodes

The 5 gamemodes of PokerHouse are separated into guided learning tutorials and unsupervised practice. The beginner (learning how to play), proficient (Pot Odds), and advanced (Kelly Criterion) modes make up the guided learning track, and aim to progressively elevate a novice player's knowledge from nil to knowledgeable of the probability and statistics behind Hold'Em with a coach aiding in decision-making with prompts along the way. Unsupervised modes consist of free play against 4 bots and qualitative characterization of opponent playstyles. 

## Coach
The user's coach, before each decision, aids the player with their decision-making under the paradigm of the principle the game mode teaches. The coach estimates user hand strength through Monte Carlo simulations, comparing the decision a player makes under uncertainty (also comparing the player's estimation of their own hand strength, in tandem) to the objective decision of the game mode. A mini-tutorial also appears on the first hand of guided learning modes, teaching the player the formulas of the respective principle being taught (pot odds/Kelly), or the sequence of the game (beginner). 


## Tech Stack

React, TypeScript, Vite

## Development Notes

Built with AI-assisted development (Claude Code). I designed the game theory, coaching logic, game modes, and bot behavior models, as well as the.
