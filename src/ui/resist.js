import { ngBoardgameIO } from './boardgameio/ng.js'
import { resistGame } from '../common/game.js'
import * as Consts from '../common/consts.js';

class DashboardComponent {
  constructor(resist, gameContext, gameState) {
    this._resist = resist
    this._gameContext = gameContext
    this._gameState = gameState
  }
  get ready() {
    return this._gameState.ready
  }
  get playerIds() {
    return this._gameContext.playOrder
  }
  get currentStage() {
    return this._gameContext.currentStage
  }
  get faction() {
    return this._resist.myFaction
  }
}

class PlayerComponent {
  constructor(gameContext, resist) {
    this._gameContext = gameContext
    this._resist = resist
  }
  get isThinking() {
    return this._gameContext.isActive(this.playerId)
  }
  get isLeader() {
    return this._gameContext.isCurrentPlayer(this.playerId)
  }
  get faction() {
    return this._resist.getPlayerFaction(this.playerId)
  }
}

class TeamPickComponent {
  constructor(resist) {
    this._resist = resist
    this.teamSize = resist.currentMissionTeamSize
    this.players = resist.players
    this.team = new Set()
  }
  pick(playerID) {
    if (this.team.has(playerID)) {
      this.team.delete(playerID)
    } else if (this.team.size < this.teamSize) {
      this.team.add(playerID)
    }
  }
  submit() {
    this._resist.proposeTeam(Array.from(this.team))
  }
}

class VoteTeamComponent {
  constructor(resist) {
    this._resist = resist
  }
  voteYay() {
    this._resist.vote(Consts.YES)
  }
  voteNay() {
    this._resist.vote(Consts.NO)
  }
}

class VoteMissionComponent {
  constructor(resist) {
    this._resist = resist
  }
  get canVoteNay() {
    return this._resist.myFaction == Consts.SPY
  }
  voteYay() {
    this._resist.perform(Consts.PASS)
  }
  voteNay() {
    this._resist.perform(Consts.FAIL)
  }
}

class Resist {
  constructor(gameState, gameContext, gameService) {
    this._gameState = gameState
    this._gameContext = gameContext
    this._gameService = gameService
  }
  get myFaction() {
    return this.getPlayerFaction(this._gameService.playerID)
  }
  get currentMissionTeamSize() {
    return this._gameState.G.missionProgression[this._gameState.G.missionResults.length].size
  }
  get players() {
    return this._gameContext.playOrder
  }
  getPlayerFaction(playerID) {
    return this._gameState.G.roles[playerID].faction
  }
  proposeTeam(team) {
    this._gameService.moves.proposeTeam(team)
  }
  vote(decision) {
    this._gameService.moves.voteOnTeam(decision)
  }
  perform(performance) {
    this._gameService.moves.voteOnMission(performance)
  }
}

class DotsAndNumberComponent {
  constructor(gameState) {
    this._gameState = gameState
  }
  get missionResults() {
    const results = this._gameState.G.missionResults.map(r => r == Consts.PASS ? '✅' : '💣')
    const notYetRun = Array(5 - results.length).fill('-')
    return [...results, ...notYetRun]
  }
  get teamProposals() {
    const failedVotes = Array(this._gameState.G.voteNumber).fill('⚫')
    const notYetVoted = Array(4 - failedVotes.length).fill('-')
    return [...failedVotes, '🗳️', ...notYetVoted]
  }
}

class TeamComponent {
  constructor(gameState) {
    this._gameState = gameState
  }
  get teamMembers() {
    return this._gameState.G.team
  }
}

class TeamVotesComponent {
  constructor(gameState, numPlayers) {
    this._gameState = gameState
    this._numPlayers = numPlayers
  }
  get votes() {
    const votes = this._gameState.G.teamVotes
    if (!votes || Object.keys(votes).length != this._numPlayers) {
      return []
    }
    return votes
  }
}

class ReviewTeamComponent {
  constructor(gameService) {
    this._gameService = gameService
  }
  accept() {
    this._gameService.moves.endTeamReview()
  }
}

class ReviewMissionComponent {
  constructor(gameService) {
    this._gameService = gameService
  }
  accept() {
    this._gameService.moves.endMissionReview()
  }
}

angular.module('resist', [
  ngBoardgameIO.moduleName,
  ngBoardgameIO.debugModuleName,
])
  .constant('gameID', 'default')
  .constant('playerID', '1')
  .constant('numPlayers', 5)
  .constant('multiplayer', BoardgameIO.Local())
  .constant('game', resistGame())
  .service('resist', Resist)
  .component('reDash', {
    'controller': DashboardComponent,
    'templateUrl': 'tpl/dashboard.ng.html',
  })
  .component('rePlayer', {
    'controller': PlayerComponent,
    'templateUrl': 'tpl/player.ng.html',
    'bindings': {
      'playerId': '<',
    },
  })
  .component('reTeamPick', {
    'controller': TeamPickComponent,
    'templateUrl': 'tpl/team-pick.ng.html',
  })
  .component('reTeamVotes', {
    'controller': TeamVotesComponent,
    'templateUrl': 'tpl/team-votes.ng.html',
  })
  .component('reReviewTeam', {
    'controller': ReviewTeamComponent,
    'templateUrl': 'tpl/review-team.ng.html',
  })
  .component('reReviewMission', {
    'controller': ReviewMissionComponent,
    'templateUrl': 'tpl/review-mission.ng.html',
  })
  .component('reVoteTeam', {
    'controller': VoteTeamComponent,
    'templateUrl': 'tpl/vote-team.ng.html',
  })
  .component('reVoteMission', {
    'controller': VoteMissionComponent,
    'templateUrl': 'tpl/vote-mission.ng.html',
  })
  .component('reDotsAndNumber', {
    'controller': DotsAndNumberComponent,
    'templateUrl': 'tpl/dots-and-number.ng.html',
  })
  .component('reTeam', {
    'controller': TeamComponent,
    'templateUrl': 'tpl/team.ng.html',
  })
angular.bootstrap(document.body, ['resist'])
